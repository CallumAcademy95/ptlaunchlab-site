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
// FAIL-SAFE: if this returns null the enrol page falls back to the raw Payment
// Link for the chosen plan (app/lib/paymentLinks.ts, read from env). If that
// link is not configured the buyer is shown an error and a way to contact us —
// never an older link, because every older link sells a retired price.
//
// REQUIRED STRIPE KEY PERMISSIONS
//   STRIPE_SECRET_KEY needs "Checkout Sessions → write". Without it every
//   request silently falls back to Payment Links. Granted on the live restricted
//   key (rk_live_…GBxkR2) on 2026-07-26; verify with GET /api/checkout, which is
//   a permission health check, or run `npm run test:e2e` (see e2e/README.md).

import { attributionMetadata, type Attribution } from "./attribution.ts";
import {
  COURSE_PRICE_PENCE,
  MONTHLY_PRICE_PENCE,
  MONTHLY_PAYMENTS,
  MONTHLY_PLAN_TOTAL_PENCE,
  type CoursePlanChoice,
} from "./pricing.ts";
import { countPaidInvoices, MONTHLY_PLAN_META, type InvoiceListEntry } from "./paymentPlans.ts";

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

// ─── The two prices (October 2026 change-over) ───────────────────────────────
// £999.99 in full, or 10 × £99.99 a month with the first taken at checkout.
// No promo codes, no discounts, no dated offers. Figures live in ./pricing.ts.
//
// Each price is env-overridable so e2e can point at TEST-mode copies (test mode
// is a separate world with none of these ids in it) and so a price can be
// swapped without a deploy. The literals are the LIVE prices.
export const PIF_999_PRICE_ID =
  process.env.STRIPE_PIF_999_PRICE_ID || "price_1UOg6999z9lThumnjHTU1rAt"; // £999.99 one-off GBP
export const MONTHLY_999_PRICE_ID =
  process.env.STRIPE_MONTHLY_999_PRICE_ID || "price_1UOg6n99z9lThumnrwXTZ4w7"; // £99.99/month GBP

// ─── Legacy instalment prices — still being paid ─────────────────────────────
// Learners who enrolled before October are on £599 (or £99) + 5 × £200, and the
// October offer would have been £99 + 5 × £300. Those subscriptions keep billing
// until their plan completes, so the webhook must keep recognising and counting
// these prices exactly as before. Nothing NEW is ever sold on them.
export const INSTALMENT_PRICE_ID =
  process.env.STRIPE_INSTALMENT_PRICE_ID || "price_1RxmdG99z9lThumnilf7YD2e"; // £200/month GBP
export const OCTOBER_INSTALMENT_PRICE_ID =
  process.env.STRIPE_OCTOBER_INSTALMENT_PRICE_ID || "price_1UM3D899z9lThumnlgeLDjSS"; // £300/month GBP

/** Recurring prices whose paid invoices are LEGACY instalments (deposit excluded). */
export const LEGACY_INSTALMENT_PRICE_IDS: ReadonlySet<string> = new Set([
  INSTALMENT_PRICE_ID,
  OCTOBER_INSTALMENT_PRICE_ID,
]);
/** The recurring price whose paid invoices are monthly-plan payments (first included). */
export const MONTHLY_PAYMENT_PRICE_IDS: ReadonlySet<string> = new Set([MONTHLY_999_PRICE_ID]);

// The buyer lands here after paying and completes the enrolment record.
// {CHECKOUT_SESSION_ID} is substituted by Stripe.
export const ENROL_SUCCESS_URL = `${SITE_URL}/enrol/success?session_id={CHECKOUT_SESSION_ID}`;

export interface PlanConfig {
  choice: CoursePlanChoice;
  price: string;
  /** Charged at checkout, in pence. Telemetry only — Stripe charges off the price id. */
  checkoutPence: number;
  /** What the learner owes in total, in pence. */
  contractPence: number;
  /** Session metadata.plan — what the webhook classifies on. Never an amount. */
  metadataPlan: "PIF" | "monthly";
  label: string;
}

const COURSE_NAME = "NCFE Level 3 Diploma in Gym Instructing and Personal Training";

export const COURSE_PLANS: Record<CoursePlanChoice, PlanConfig> = {
  pif: {
    choice: "pif",
    price: PIF_999_PRICE_ID,
    checkoutPence: COURSE_PRICE_PENCE,
    contractPence: COURSE_PRICE_PENCE,
    metadataPlan: "PIF",
    label: COURSE_NAME,
  },
  monthly: {
    choice: "monthly",
    price: MONTHLY_999_PRICE_ID,
    checkoutPence: MONTHLY_PRICE_PENCE,
    contractPence: MONTHLY_PLAN_TOTAL_PENCE,
    metadataPlan: "monthly",
    label: `${COURSE_NAME} — Monthly`,
  },
};

/** Narrow an untrusted request value to a plan, or null. */
export function planFromChoice(value: unknown): CoursePlanChoice | null {
  return value === "pif" || value === "monthly" ? value : null;
}

/** "999.99" — pence as a pounds string with exactly two decimals, for metadata. */
function poundsString(pence: number): string {
  return (pence / 100).toFixed(2);
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
  /** Which of the two ways to pay. Decides the price; nothing else can. */
  plan: CoursePlanChoice;
  /** Base64url attribution blob; /api/stripe-webhook decodes it for GA4 + Meta CAPI. */
  clientReferenceId?: string;
  email?: string;
  name?: string;
  gymReferral?: string;
  /** Stable partner join key. See PartnerConfig.gymSlug — display names aren't safe to join on. */
  gymSlug?: string;
  /** First/last-touch source, stamped into Stripe metadata as `attr_*`. */
  attribution?: Attribution;
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
  cancel_at_period_end?: boolean;
  items?: { data?: Array<{ price?: { id?: string } | null }> };
}

export function getSubscription(id: string) {
  return stripeRequest<StripeSubscription>(`subscriptions/${id}`, { method: "GET" });
}

/** The recurring price ids on a subscription, for plan classification. */
export function subscriptionPriceIds(sub: StripeSubscription): string[] {
  return (sub.items?.data ?? [])
    .map((item) => item.price?.id)
    .filter((id): id is string => typeof id === "string");
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

/**
 * Ends a LEGACY plan immediately — used once the final instalment clears.
 * Unchanged since the deposit plans shipped; the legacy subscriptions still
 * being paid depend on it behaving exactly as it always has.
 */
export function cancelSubscription(id: string) {
  return stripeRequest<StripeSubscription>(`subscriptions/${id}`, { method: "DELETE" });
}

/**
 * Ends a MONTHLY plan after its 10th payment, with no proration and no
 * closing invoice.
 *
 * ⚠️ Do not replace this with `cancel_at`. Setting cancel_at mid-period makes
 * Stripe prorate the final instalment into a part-charge — a known trap on
 * this account. Cancelling now, with prorate=false and
 * invoice_now=false stated explicitly, ends the subscription the moment the
 * 10th invoice is paid: no credit, no extra invoice, and no 11th month.
 */
export function endSubscriptionWithoutProration(id: string) {
  return stripeRequest<StripeSubscription>(
    `subscriptions/${id}?prorate=false&invoice_now=false`,
    { method: "DELETE" },
  );
}

async function listSubscriptionInvoices(subscriptionId: string): Promise<InvoiceListEntry[] | null> {
  const res = await stripeRequest<{ data?: InvoiceListEntry[] }>(
    `invoices?subscription=${encodeURIComponent(subscriptionId)}&limit=100&expand[]=data.lines`,
    { method: "GET" },
  );
  return res?.data ?? null;
}

/**
 * How many LEGACY instalments (£200, or £300 on the October price) have
 * actually settled on a plan. The deposit is not counted: on the first invoice
 * the recurring line is £0 because it is in its trial.
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
  const invoices = await listSubscriptionInvoices(subscriptionId);
  return invoices ? countPaidInvoices(invoices, LEGACY_INSTALMENT_PRICE_IDS) : null;
}

/**
 * How many of the 10 × £99.99 payments have settled, the checkout payment
 * included (the plan has no trial, so its first invoice is payment 1).
 * Same idempotent, recomputed-from-Stripe approach as above; null if unknown.
 */
export async function countSettledMonthlyPayments(subscriptionId: string): Promise<number | null> {
  const invoices = await listSubscriptionInvoices(subscriptionId);
  return invoices ? countPaidInvoices(invoices, MONTHLY_PAYMENT_PRICE_IDS) : null;
}

/**
 * The Checkout Session parameters, as a plain object.
 *
 * Extracted from createCheckoutSession so the money rules can be tested without
 * creating real sessions. There is no discount path at all: no `discounts`,
 * and `allow_promotion_codes` is always false, so Stripe shows no code box.
 */
export function buildSessionParams(
  input: CheckoutSessionInput,
  config: PlanConfig,
  opts: { cancelPath: string },
): Record<string, unknown> {
  const monthly = config.choice === "monthly";
  // Flat `attr_*` keys, additive to every existing metadata key.
  const attr = attributionMetadata(input.attribution ?? {});
  const hasAttr = Object.keys(attr).length > 0;

  return {
    mode: monthly ? "subscription" : "payment",
    // One line either way. The monthly price is recurring with NO trial, so
    // checkout takes the first £99.99 now and Stripe bills the rest monthly.
    line_items: [{ price: config.price, quantity: 1 }],
    ...(monthly && {
      subscription_data: {
        // The webhook reads these off each invoice's subscription to know when
        // to stop. Counting invoices beats computing an end date: month-end
        // enrolments and Stripe's retry-shifted billing dates both break date
        // arithmetic, and overcharging a learner is the worst failure here.
        metadata: {
          ptll_plan: MONTHLY_PLAN_META,
          payments_target: String(MONTHLY_PAYMENTS),
          payments_paid: "0",
          payment_amount_pence: String(MONTHLY_PRICE_PENCE),
          contract_value_pence: String(MONTHLY_PLAN_TOTAL_PENCE),
          buyer_name: input.name?.trim().slice(0, 200),
          buyer_email: input.email?.trim().toLowerCase(),
          gym_referral: input.gymReferral,
          gym_slug: input.gymSlug,
          ...attr,
        },
      },
    }),
    // One-off payments: put attribution on the PaymentIntent too so it survives
    // on the charge. Payment mode ONLY — Stripe rejects payment_intent_data on a
    // subscription-mode session.
    ...(!monthly && hasAttr && { payment_intent_data: { metadata: attr } }),
    // A proper hosted invoice + PDF for pay-in-full buyers. Payment mode only:
    // subscriptions already invoice every payment, and Stripe rejects a
    // subscription session carrying invoice_creation.
    ...(!monthly && { invoice_creation: { enabled: true } }),
    success_url: ENROL_SUCCESS_URL,
    cancel_url: `${SITE_URL}${opts.cancelPath}`,
    // Prefills the email on Stripe's page, same as the old ?prefilled_email=
    customer_email: input.email?.trim().toLowerCase(),
    client_reference_id: input.clientReferenceId,
    // No codes, for anyone. Stated explicitly rather than omitted so Stripe's
    // default can never put a code box back on the page.
    allow_promotion_codes: false,
    // Metadata is the durable, structured home for this — the base64
    // client_reference_id blob is capped at 200 chars and drops fields when
    // full. The webhook already prefers metadata over the blob.
    metadata: {
      // Classified by what the sale IS, never by what it costs.
      plan: config.metadataPlan,
      // The contract, so the webhook never infers it from an amount. Pounds
      // (two decimals) for the existing readers, and pence as the exact value.
      contract_value: poundsString(config.contractPence),
      contract_value_pence: String(config.contractPence),
      buyer_name: input.name?.trim().slice(0, 200),
      gym_referral: input.gymReferral,
      // The partner platform joins on this, NOT on gym_referral.
      gym_slug: input.gymSlug,
      // `source` is how the webhook tells OUR course sales apart from the
      // Ultimate Shred gym memberships sharing this account.
      source: "api-checkout-session",
      ptll_product: "course",
      payments: monthly ? String(MONTHLY_PAYMENTS) : undefined,
      ...attr,
    },
  };
}

/**
 * Creates a Stripe Checkout Session with the return URL baked in.
 * Returns null on ANY failure — the caller falls back to the raw Payment Link
 * for the plan, or shows an error if none is configured.
 */
export async function createCheckoutSession(
  input: CheckoutSessionInput,
): Promise<CheckoutSessionResult | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("[stripeCheckout] STRIPE_SECRET_KEY not set — falling back to Payment Link");
    return null;
  }

  const config = COURSE_PLANS[input.plan];
  if (!config) {
    console.error(`[stripeCheckout] unknown plan ${String(input.plan)}`);
    return null;
  }

  const cancelPath = input.cancelPath && input.cancelPath.startsWith("/") ? input.cancelPath : "/enrol";

  // buildSessionParams is typed Record<string, unknown> so tests can assert on
  // it without importing encodeForm's internal FormValue type. The object it
  // builds IS a FormValue.
  try {
    const body = encodeForm(
      buildSessionParams(input, config, { cancelPath }) as Record<string, FormValue>,
    ).join("&");

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
