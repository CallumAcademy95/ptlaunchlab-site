// Server-created Stripe Checkout Sessions.
//
// WHY THIS EXISTS
// ───────────────
// The enrolment flow used to send buyers straight to a Stripe Payment Link.
// The post-payment return URL on a Payment Link lives in the Stripe Dashboard,
// NOT in this repo — so it can silently drift out of sync with the code.
//
// It did. The £599 deposit link and the £1,399 funnel link were both left on
// Stripe's default "stripe.com" landing page, which meant every buyer who used
// them paid and was never returned to /enrol/success — the page that collects
// the NCFE learner record and the signed learner agreement. Eight paying
// customers were lost that way between Nov 2025 and Jul 2026 before it was
// caught.
//
// Creating the session here puts `success_url` in version control, where it
// gets code-reviewed and deployed like everything else. It cannot drift again.
//
// FAIL-SAFE: every caller MUST fall back to the raw Payment Link URL if this
// returns null. This sits on the money path — a Stripe outage, a missing
// permission or a bad price ID must never leave a buyer unable to pay. The
// fallback is exactly the old behaviour (buyer pays, lands on stripe.com,
// admin chases via the /api/stripe-webhook reconciliation email).
//
// REQUIRED STRIPE KEY PERMISSIONS
//   STRIPE_SECRET_KEY needs "Checkout Sessions → write". Without it every
//   request silently falls back to Payment Links. Granted on the live restricted
//   key (rk_live_…GBxkR2) on 2026-07-26; verify with GET /api/checkout, which is
//   a permission health check, or run `npm run test:e2e` (see e2e/README.md).

import { INSTALMENTS_ENABLED, instalmentTarget } from "./instalments.ts";

// The public origin baked into success_url / cancel_url.
//
// Overridable ONLY so the end-to-end regression test in e2e/ can point a real
// Stripe (test-mode) redirect back at its own dev server. Production never sets
// PTLL_E2E_BASE_URL, so the literal below is always what ships — and
// e2e/pay-first-enrolment.spec.ts asserts exactly that, so this cannot become a
// way to quietly repoint live checkout at another origin.
export const PRODUCTION_SITE_URL = "https://ptlaunchlab.co.uk";

/** Kept as a pure function so the production fallback is directly testable. */
export function resolveSiteUrl(env: Record<string, string | undefined> = process.env): string {
  return env.PTLL_E2E_BASE_URL || PRODUCTION_SITE_URL;
}

export const SITE_URL = resolveSiteUrl();

// ─── Deposit instalments ─────────────────────────────────────────────────────
// The deposit plan is £599 up front then 5 × £200/month (£1,599 total). Those
// £200s used to be collected by hand — someone had to remember to send a
// one-off payment link every month, and nothing in Stripe recorded that the
// £1,000 balance was even owed. Charging them on a subscription mandate taken
// at checkout makes the balance self-collecting.
//
// The recurring price already existed in the account, unused by any flow.
// Overridable by env so it can be pointed at a test price without a deploy.
export const INSTALMENT_PRICE_ID =
  process.env.STRIPE_INSTALMENT_PRICE_ID || "price_1RxmdG99z9lThumnilf7YD2e"; // £200/month GBP

// The flag and the instalment counts live in app/lib/instalments.ts so the
// enrol page can read them without pulling this module's Stripe API helpers
// into the browser bundle. Ships dark: with the flag unset the deposit stays a
// one-off £599 charge exactly as before.

// Days before the first £200 is taken. 30 days from the deposit, so each
// learner's dates are their own rather than a shared billing date.
const INSTALMENT_TRIAL_DAYS = 30;

// The buyer lands here after paying and completes the enrolment record.
// {CHECKOUT_SESSION_ID} is substituted by Stripe.
export const ENROL_SUCCESS_URL = `${SITE_URL}/enrol/success?session_id={CHECKOUT_SESSION_ID}`;

// ─── Payment Link → Price mapping ────────────────────────────────────────────
// Keyed by the Payment Link URLs already hard-coded across the enrol pages so
// callers keep choosing the destination exactly as they do today — this module
// only changes HOW the buyer gets there, never WHICH product they buy.
//
// Price IDs were read off live checkout sessions created by each link, so the
// product, price and any product-scoped coupons stay identical.
// `allowPromotionCodes` likewise mirrors each link's current setting: only the
// £1,599 PIF link accepts codes at Stripe checkout (that's how the partner gym
// discounts are applied).
export interface LinkConfig {
  price: string;
  amount: number;                 // GBP charged at checkout. Telemetry only — Stripe charges off the price ID
  label: string;
  allowPromotionCodes: boolean;
  /**
   * Whether this price is an entry payment that takes the £200/month mandate.
   *
   * Explicit, NOT derived from `amount`. A price-range test on this exact
   * decision has already shipped one production bug: `amount >= 1300` classified
   * every discounted £1,099 partner pay-in-full as a deposit and mislabelled 8 of
   * 9 sales in the tracker. Adding a third price to a range test is how that
   * recurs, so each entry states what it is.
   */
  takesInstalments: boolean;
  /**
   * Full contract value in GBP — what the learner owes in total, which is NOT
   * what checkout collects on an instalment plan.
   *
   * The webhook reports this to Meta as the Purchase value. Without it a £99
   * entry teaches Meta the buyer is worth £99 rather than £1,099.
   */
  contractValue: number;
}

// Each price is env-overridable. Test mode is a separate world with none of
// these ids in it, so without overrides a rehearsal can only ever exercise a
// hand-written copy of this code rather than this code — which is exactly the
// kind of gap that lets a bug reach production. Also lets a price be swapped
// without a deploy.
export const PAYMENT_LINK_PRICES: Record<string, LinkConfig> = {
  // £1,599 pay-in-full — the shared PIF link used by /enrol and every gym page
  "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f": {
    price: process.env.STRIPE_PIF_PRICE_ID || "price_1SffDN99z9lThumnkdXLn1LW",
    amount: 1599,
    label: "NCFE Level 3 Diploma in Gym Instructing and Personal Training",
    allowPromotionCodes: true,
    takesInstalments: false,
    contractValue: 1599,
  },
  // £599 deposit (+ 5×£200 on the instalment plan) — the shared deposit link
  "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05": {
    price: process.env.STRIPE_DEPOSIT_PRICE_ID || "price_1Rxmab99z9lThumnJ1f7EEXb",
    amount: 599,
    label: "NCFE Level 3 Diploma in Gym Instructing and Personal Training — Deposit",
    allowPromotionCodes: false,
    takesInstalments: true,
    contractValue: 1599,
  },
  // £1,399 pay-in-full — funnel-promo only, never exposed in the client bundle
  "https://buy.stripe.com/fZuaER6ME7hi0Ma0o2fEk06": {
    price: process.env.STRIPE_FUNNEL_PIF_PRICE_ID || "price_1RxmYD99z9lThumnc9W37CX7",
    amount: 1399,
    label: "NCFE Level 3 Diploma in Gym Instructing and Personal Training",
    allowPromotionCodes: false,
    takesInstalments: false,
    contractValue: 1399,
  },
  // £99 entry (+ 5×£200) = £1,099 — the September weekend offer, email list only.
  // Same Stripe product as the £599 deposit: same qualification, same shape of
  // sale, different entry amount. Never linked from a partner gym page — a gym
  // earns nothing on it, so exposing it there would take a sale off a partner.
  "https://buy.stripe.com/4gMaER2wocBCdyWfiWfEk0r": {
    price: process.env.STRIPE_SEPT99_PRICE_ID || "price_1U8JiI99z9lThumnwQlmTIJW",
    amount: 99,
    label: "NCFE Level 3 Diploma in Gym Instructing and Personal Training — Deposit",
    allowPromotionCodes: false,
    takesInstalments: true,
    contractValue: 1099,
  },
};

// Strip query/hash so a link carrying ?client_reference_id=… still matches.
export function normaliseLink(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`.replace(/\/$/, "");
  } catch {
    return url;
  }
}

export function priceForLink(url: string): LinkConfig | null {
  return PAYMENT_LINK_PRICES[normaliseLink(url)] ?? null;
}

// ─── Stripe form encoding ────────────────────────────────────────────────────
// Stripe's REST API takes application/x-www-form-urlencoded with bracketed
// nested keys (line_items[0][price], metadata[gym_referral], …). The repo
// deliberately has no `stripe` npm dependency — /api/stripe-webhook already
// hand-rolls signature verification — so encode it here rather than adding one.
type FormValue = string | number | boolean | null | undefined | FormValue[] | { [k: string]: FormValue };

function encodeForm(obj: Record<string, FormValue>, prefix = ""): string[] {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null || value === "") continue;
    const k = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item && typeof item === "object") {
          parts.push(...encodeForm(item as Record<string, FormValue>, `${k}[${i}]`));
        } else {
          parts.push(`${encodeURIComponent(`${k}[${i}]`)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else if (typeof value === "object") {
      parts.push(...encodeForm(value as Record<string, FormValue>, k));
    } else {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts;
}

// ─── Session creation ────────────────────────────────────────────────────────
export interface CheckoutSessionInput {
  /** The Payment Link URL this buyer would have been sent to — decides the price. */
  paymentLink: string;
  /** Base64url attribution blob; /api/stripe-webhook decodes it for GA4 + Meta CAPI. */
  clientReferenceId?: string;
  email?: string;
  name?: string;
  gymReferral?: string;
  /** Stable partner join key. See PartnerConfig.gymSlug — display names aren't safe to join on. */
  gymSlug?: string;
  promoCode?: string;
  /** Stripe promotion code id, already resolved server-side. See buildSessionParams. */
  promoCodeId?: string;
  funnelPromo?: string;
  /** Where to send a buyer who backs out of Stripe. Must be a ptlaunchlab.co.uk path. */
  cancelPath?: string;
}

export interface CheckoutSessionResult {
  id: string;
  url: string;
}

// ─── Subscription helpers (instalment plan management) ───────────────────────
// Used by /api/stripe-webhook to count collected instalments and stop the plan
// once the balance is settled.

async function stripeRequest<T>(
  path: string,
  init: { method: "GET" | "POST" | "DELETE"; body?: string },
): Promise<T | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("[stripeCheckout] STRIPE_SECRET_KEY not set");
    return null;
  }
  try {
    const res = await fetch(`https://api.stripe.com/v1/${path}`, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      ...(init.body ? { body: init.body } : {}),
    });
    const json = (await res.json()) as T & { error?: { message?: string } };
    if (!res.ok) {
      console.error(`[stripeCheckout] ${init.method} ${path} failed (${res.status}): ${json.error?.message}`);
      return null;
    }
    return json;
  } catch (err) {
    console.error(`[stripeCheckout] ${init.method} ${path} threw:`, err);
    return null;
  }
}

export interface StripeSubscription {
  id: string;
  status?: string;
  metadata?: Record<string, string>;
  customer?: string;
}

export function getSubscription(id: string) {
  return stripeRequest<StripeSubscription>(`subscriptions/${id}`, { method: "GET" });
}

export interface StripeCheckoutSession {
  id: string;
  amount_total?: number;
  mode?: string;
  payment_status?: string;
  client_reference_id?: string | null;
  metadata?: Record<string, string>;
  subscription?: string | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null; name?: string | null };
}

/**
 * Read a completed Checkout Session back.
 *
 * Used by /enrol/success to recover the gym the buyer came through. That was
 * previously read from localStorage, which is empty if they pay on a phone and
 * finish the form on a laptop, or clear their storage — and then the enrolment
 * record loses the partner even though Stripe knew it all along.
 */
export function getCheckoutSession(id: string) {
  return stripeRequest<StripeCheckoutSession>(`checkout/sessions/${id}`, { method: "GET" });
}

export function setSubscriptionMetadata(id: string, metadata: Record<string, string>) {
  const body = encodeForm({ metadata }).join("&");
  return stripeRequest<StripeSubscription>(`subscriptions/${id}`, { method: "POST", body });
}

/** Ends the plan immediately — used once the final instalment clears. */
export function cancelSubscription(id: string) {
  return stripeRequest<StripeSubscription>(`subscriptions/${id}`, { method: "DELETE" });
}

type InvoiceLine = {
  amount?: number;
  price?: { id?: string } | null;
  // Later API versions moved the price pointer under `pricing`.
  pricing?: { price_details?: { price?: string } | null } | null;
};
type InvoiceListEntry = { status?: string; lines?: { data?: InvoiceLine[] } };

function lineIsInstalment(line: InvoiceLine): boolean {
  const priceId = line.price?.id || line.pricing?.price_details?.price;
  // A £0 line is the recurring item sitting in its trial on the very first
  // invoice — that invoice carries the deposit, not an instalment.
  return priceId === INSTALMENT_PRICE_ID && (line.amount ?? 0) > 0;
}

/**
 * How many £200 instalments have actually settled on a plan.
 *
 * Derived by asking Stripe rather than by incrementing a counter, because
 * webhook delivery is at-least-once: a duplicate `invoice.paid` would
 * double-count and cancel the plan an instalment early, and a failed metadata
 * write would stall the count and overcharge. Recomputing from the invoice
 * list makes the handler idempotent — processing the same event ten times
 * yields the same answer.
 *
 * Returns null if the count can't be established, so callers can decline to
 * act rather than guess. Never cancel a plan on a number you aren't sure of.
 */
export async function countSettledInstalments(subscriptionId: string): Promise<number | null> {
  const res = await stripeRequest<{ data?: InvoiceListEntry[] }>(
    `invoices?subscription=${encodeURIComponent(subscriptionId)}&limit=100&expand[]=data.lines`,
    { method: "GET" },
  );
  if (!res?.data) return null;
  return res.data.filter(
    (inv) => inv.status === "paid" && (inv.lines?.data ?? []).some(lineIsInstalment),
  ).length;
}

/**
 * The Checkout Session parameters, as a plain object.
 *
 * Extracted from createCheckoutSession so the two money rules below can be
 * tested without creating real sessions. Everything here was previously inline
 * and is unchanged except where the discount rules are applied.
 */
export function buildSessionParams(
  input: CheckoutSessionInput,
  config: LinkConfig,
  opts: { withInstalments: boolean; target: number; cancelPath: string },
): Record<string, unknown> {
  const { withInstalments, target, cancelPath } = opts;

  // A deposit is never discounted. The rule is Callum's, from 2026-07-26, and
  // the webhook has stated it since — but the enrolment page contradicted it and
  // promised £1,399 while Stripe billed £1,599. Enforcing it here means the UI
  // is no longer the only thing standing between a deposit and a discount.
  const discountable = !withInstalments && config.allowPromotionCodes;
  const discountId = discountable ? input.promoCodeId : undefined;

  return {
    mode: withInstalments ? "subscription" : "payment",
    line_items: withInstalments
      ? [
          { price: config.price, quantity: 1 },            // entry payment, charged now
          { price: INSTALMENT_PRICE_ID, quantity: 1 },     // £200/month, starts after the trial
        ]
      : [{ price: config.price, quantity: 1 }],
    ...(withInstalments && {
      subscription_data: {
        trial_period_days: INSTALMENT_TRIAL_DAYS,
        // The webhook reads these off each invoice's subscription to know when
        // to stop. Counting invoices beats computing an end date: month-end
        // enrolments and Stripe's retry-shifted billing dates both break date
        // arithmetic, and overcharging a learner is the worst failure here.
        metadata: {
          ptll_plan: "deposit_instalments",
          instalments_target: String(target),
          instalments_paid: "0",
          // What was actually collected at checkout, and what the learner owes in
          // total. Both are stamped because the two live plans share everything
          // except these numbers (£599/£1,599 and £99/£1,099) — the instalment
          // emails used to hardcode 599 and would report the wrong running total
          // for every £99 buyer.
          entry_amount: String(config.amount),
          contract_value: String(config.contractValue),
          buyer_name: input.name?.trim().slice(0, 200),
          buyer_email: input.email?.trim().toLowerCase(),
          gym_referral: input.gymReferral,
          gym_slug: input.gymSlug,
          promo_code: input.promoCode,
          funnel_promo: input.funnelPromo,
        },
      },
    }),
    // A proper hosted invoice + PDF for pay-in-full buyers, issued by Stripe so
    // it always states what was actually charged — including a partner discount,
    // which an invoice we generated ourselves would have to be told about.
    //
    // Payment mode only. Deposit plans are subscriptions, which already invoice
    // per instalment, and Stripe rejects a session carrying both.
    ...(!withInstalments && { invoice_creation: { enabled: true } }),
    success_url: ENROL_SUCCESS_URL,
    cancel_url: `${SITE_URL}${cancelPath}`,
    // Prefills the email on Stripe's page, same as the old ?prefilled_email=
    customer_email: input.email?.trim().toLowerCase(),
    client_reference_id: input.clientReferenceId,
    ...(discountId && { discounts: [{ promotion_code: discountId }] }),
    // Stripe rejects a session carrying both `discounts` and
    // `allow_promotion_codes`, so applying a discount necessarily removes the
    // second code box — which is the confusion this whole change exists to end.
    allow_promotion_codes: discountId ? false : config.allowPromotionCodes,
    // Metadata is the durable, structured home for this — the base64
    // client_reference_id blob is capped at 200 chars and drops fields when
    // full. The webhook already prefers metadata over the blob.
    metadata: {
      // Classified by what the sale IS, not by what it costs. `amount >= 1300`
      // called every discounted £1,099 partner pay-in-full a deposit and put 8 of
      // 9 sales in the tracker under the wrong plan.
      plan: config.takesInstalments ? "deposit" : "PIF",
      // The contract value, so the webhook never has to infer it from an amount.
      contract_value: String(config.contractValue),
      buyer_name: input.name?.trim().slice(0, 200),
      gym_referral: input.gymReferral,
      // The partner platform joins on this, NOT on gym_referral. Present from
      // 2026-07-27 onward; anything older needs the legacy display-name match.
      gym_slug: input.gymSlug,
      promo_code: input.promoCode,
      funnel_promo: input.funnelPromo,
      // `source` is how the webhook tells OUR course sales apart from the
      // Ultimate Shred gym memberships sharing this account. It used to key on
      // mode !== 'subscription', which stops working the moment deposits become
      // subscriptions.
      source: "api-checkout-session",
      instalments: withInstalments ? String(target) : undefined,
    },
  };
}

/**
 * Creates a Stripe Checkout Session with the return URL baked in.
 * Returns null on ANY failure — callers must fall back to `paymentLink`.
 */
export async function createCheckoutSession(
  input: CheckoutSessionInput,
): Promise<CheckoutSessionResult | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("[stripeCheckout] STRIPE_SECRET_KEY not set — falling back to Payment Link");
    return null;
  }

  const config = priceForLink(input.paymentLink);
  if (!config) {
    // An enrol page is pointing at a Payment Link we have no price for. The
    // buyer still gets to Stripe via the fallback, but the return URL for that
    // link must be set in the Dashboard until it's added to the map above.
    console.error(
      `[stripeCheckout] no price mapped for ${normaliseLink(input.paymentLink)} — falling back to Payment Link. Add it to PAYMENT_LINK_PRICES.`,
    );
    return null;
  }

  const cancelPath = input.cancelPath && input.cancelPath.startsWith("/") ? input.cancelPath : "/enrol";

  // Instalment buyers get the £200/month mandate taken alongside the entry
  // payment so the balance collects itself. The recurring price sits behind a
  // 30-day trial, so checkout charges the entry amount only and `amount_total`
  // stays at it — which is what /api/stripe-webhook maps to the contract value.
  // PIF buyers are unaffected: nothing recurring, still a plain one-off payment.
  const withInstalments = config.takesInstalments && INSTALMENTS_ENABLED && !!INSTALMENT_PRICE_ID;
  const target = instalmentTarget();

  // buildSessionParams is typed Record<string, unknown> so tests/stripeDiscounts.test.mts
  // can assert on it without importing encodeForm's internal FormValue type. The
  // object it builds is the same shape as before extraction, which IS a FormValue.
  const body = encodeForm(
    buildSessionParams(input, config, { withInstalments, target, cancelPath }) as Record<string, FormValue>,
  ).join("&");

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const json = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
    if (!res.ok || !json.url || !json.id) {
      console.error(
        `[stripeCheckout] create failed (${res.status}): ${json.error?.message ?? "no url returned"} — falling back to Payment Link`,
      );
      return null;
    }
    return { id: json.id, url: json.url };
  } catch (err) {
    console.error("[stripeCheckout] request threw — falling back to Payment Link:", err);
    return null;
  }
}
