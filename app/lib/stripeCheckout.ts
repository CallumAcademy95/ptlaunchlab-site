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
import {
  countPaidInvoices,
  MONTHLY_PLAN_META,
  LEGACY_PLAN_META,
  type InvoiceListEntry,
} from "./paymentPlans.ts";
import {
  ATP_LADDER,
  isAtp,
  resolveMemberCode,
  resolveMemberSaving,
  type Rung,
} from "./partnerCommission.ts";

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

// ─── ATP Fitness Felixstowe's ladder (a 60-day test from 10 Oct 2026) ────────
// Sold on ATP's own enrol page ONLY. Both are existing LIVE prices: the old £599
// deposit (followed by 5 × £200 on INSTALMENT_PRICE_ID — the legacy
// deposit_instalments plan shape the webhook already counts and stops) and the
// old £1,599 pay-in-full, which ATP's member codes discount.
export const DEPOSIT_599_PRICE_ID =
  process.env.STRIPE_DEPOSIT_PRICE_ID || "price_1Rxmab99z9lThumnJ1f7EEXb"; // £599 one-off GBP
export const PIF_1599_PRICE_ID =
  process.env.STRIPE_PIF_PRICE_ID || "price_1SffDN99z9lThumnkdXLn1LW"; // £1,599 one-off GBP

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

/** Every plan /api/checkout can sell. The ATP-only two are refused for any other gym. */
export type CheckoutPlan = CoursePlanChoice | "six_month" | "pif_1599";

export interface PlanConfig {
  choice: CheckoutPlan;
  price: string;
  /** Charged at checkout, in pence. Telemetry only — Stripe charges off the price id. */
  checkoutPence: number;
  /** What the learner owes in total, in pence. */
  contractPence: number;
  /** Session metadata.plan — what the webhook classifies on. Never an amount. */
  metadataPlan: "PIF" | "monthly" | "deposit";
  /**
   * Deposit plans only: the recurring price taken alongside the deposit, and
   * how many of it. A deposit is NEVER sold without this mandate.
   */
  instalmentPrice?: string;
  instalments?: number;
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

/** ATP's ladder rungs that are not one of the two standard plans. */
export const ATP_PLANS: Record<"six_month" | "pif_1599", PlanConfig> = {
  six_month: {
    choice: "six_month",
    price: DEPOSIT_599_PRICE_ID,
    checkoutPence: ATP_LADDER.sixMonth.depositPence,
    contractPence: ATP_LADDER.sixMonth.contractPence,
    metadataPlan: "deposit",
    label: `${COURSE_NAME} — 6-month plan`,
    instalmentPrice: INSTALMENT_PRICE_ID,
    instalments: ATP_LADDER.sixMonth.instalments,
  },
  pif_1599: {
    choice: "pif_1599",
    price: PIF_1599_PRICE_ID,
    checkoutPence: ATP_LADDER.pif1599Pence,
    contractPence: ATP_LADDER.pif1599Pence,
    metadataPlan: "PIF",
    label: COURSE_NAME,
  },
};

/** Narrow an untrusted request value to a plan, or null. */
export function planFromChoice(value: unknown): CoursePlanChoice | null {
  return value === "pif" || value === "monthly" ? value : null;
}

/** A discount decided SERVER-SIDE. Never read from the request. */
export interface SessionDiscount {
  coupon: string;
  /** What the coupon takes off, in pence (for the contract value stamped in metadata). */
  offPence: number;
  /** ATP member code, when that is what produced it. */
  code?: string;
  /** Nine-gym member saving, when that is what produced it. */
  memberSavingPence?: number;
}

export type ResolvedCheckout =
  | { ok: true; plan: CheckoutPlan; config: PlanConfig; rung: Rung; discount: SessionDiscount | null }
  | { ok: false; reason: "unknown-plan" | "invalid-code" };

/**
 * Decide what one request buys: the plan, the rung, and any discount.
 *
 * Pure, so every money rule is unit-tested:
 *   - pif / monthly — any page. Pay-in-full carries the gym's member saving
 *     when it set one and its coupon exists (`gymMemberSavingPence` is looked
 *     up by the caller from the gym config for THIS gymSlug). Monthly never does.
 *   - six_month / pif_1599 — ATP's page only; refused for any other gym.
 *   - a member code — ATP's £1,599 pay-in-full only. Ignored everywhere else;
 *     on that rung an unrecognised code is refused so the buyer can fix it,
 *     never silently sold at a price they were not shown.
 */
export function resolveCheckout(
  req: { plan: unknown; gymSlug?: string | null; memberCode?: unknown },
  gymMemberSavingPence: number,
  env: Record<string, string | undefined>,
): ResolvedCheckout {
  const std = planFromChoice(req.plan);
  if (std) {
    const config = COURSE_PLANS[std];
    if (std === "pif") {
      const saving = resolveMemberSaving(gymMemberSavingPence, env);
      if (saving.coupon && saving.savingPence > 0) {
        return {
          ok: true, plan: std, config, rung: "pif",
          discount: { coupon: saving.coupon, offPence: saving.savingPence, memberSavingPence: saving.savingPence },
        };
      }
    }
    return { ok: true, plan: std, config, rung: std, discount: null };
  }

  if ((req.plan === "six_month" || req.plan === "pif_1599") && isAtp(req.gymSlug)) {
    const config = ATP_PLANS[req.plan];
    if (req.plan === "six_month") return { ok: true, plan: "six_month", config, rung: "six_month", discount: null };
    const code = resolveMemberCode(req.gymSlug, req.memberCode);
    if (code.kind === "invalid") return { ok: false, reason: "invalid-code" };
    if (code.kind === "valid") {
      return {
        ok: true, plan: "pif_1599", config, rung: code.rung,
        discount: { coupon: code.coupon, offPence: code.offPence, code: code.code },
      };
    }
    return { ok: true, plan: "pif_1599", config, rung: "pif_1599", discount: null };
  }

  return { ok: false, reason: "unknown-plan" };
}

/**
 * A deposit must never be taken without its monthly mandate.
 *
 * The £599 is a deposit on a £1,599 course: charged as a bare one-off, nothing
 * would ever collect the £1,000 balance. That is what the webhook's
 * missing-mandate alarm exists to catch. Checked on the params actually sent
 * to Stripe, so no change upstream can slip one through.
 */
export function depositHasMandate(params: Record<string, unknown>): boolean {
  const meta = (params.metadata ?? {}) as Record<string, unknown>;
  if (meta.plan !== "deposit") return true; // not a deposit — nothing to guard
  if (params.mode !== "subscription") return false;
  const lines = (params.line_items ?? []) as { price?: string }[];
  const sub = (params.subscription_data ?? {}) as { trial_period_days?: number; metadata?: Record<string, unknown> };
  return (
    lines.length === 2 &&
    !!lines[1]?.price &&
    LEGACY_INSTALMENT_PRICE_IDS.has(String(lines[1].price)) &&
    Number(sub.trial_period_days) > 0 &&
    sub.metadata?.ptll_plan === LEGACY_PLAN_META &&
    Number(sub.metadata?.instalments_target) > 0
  );
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
  /** Which way to pay. Decides the price; nothing else can. */
  plan: CheckoutPlan;
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
 * creating real sessions. `allow_promotion_codes` is always false, so Stripe
 * never shows a code box. The ONLY discount path is `opts.discount`, which
 * resolveCheckout() decides server-side (ATP member code / a gym's member
 * saving) — nothing in `input` can produce one — and it only ever applies to
 * a pay-in-full.
 */
export function buildSessionParams(
  input: CheckoutSessionInput,
  config: PlanConfig,
  opts: { cancelPath: string; rung?: Rung; discount?: SessionDiscount | null },
): Record<string, unknown> {
  const deposit = config.metadataPlan === "deposit";
  const monthly = config.metadataPlan === "monthly";
  // Either plan that is a subscription. Named so the payment-mode-only fields
  // below read the way Stripe's rules do.
  const recurring = monthly || deposit;
  const rung: Rung = opts.rung ?? (config.choice as Rung);
  // A discount only ever reduces a pay-in-full. A deposit plan or the monthly
  // plan is never discounted, whatever a caller passes.
  const discount = config.metadataPlan === "PIF" && opts.discount?.coupon ? opts.discount : null;
  const contractPence = Math.max(0, config.contractPence - (discount?.offPence ?? 0));
  // Flat `attr_*` keys, additive to every existing metadata key.
  const attr = attributionMetadata(input.attribution ?? {});
  const hasAttr = Object.keys(attr).length > 0;

  return {
    mode: recurring ? "subscription" : "payment",
    // Pay in full / monthly: one line. The monthly price is recurring with NO
    // trial, so checkout takes the first £99.99 now and Stripe bills the rest.
    // Deposit (ATP's 6-month plan): the £599 charged now, plus the £200
    // recurring line in a 30-day trial, so the first £200 lands a month later.
    line_items: deposit
      ? [
          { price: config.price, quantity: 1 },
          { price: config.instalmentPrice, quantity: 1 },
        ]
      : [{ price: config.price, quantity: 1 }],
    ...(deposit && {
      subscription_data: {
        trial_period_days: ATP_LADDER.sixMonth.trialDays,
        // Exactly the legacy deposit_instalments shape the webhook already
        // counts and stops (handleInstalmentPaid), unchanged since deposits
        // first shipped.
        metadata: {
          ptll_plan: LEGACY_PLAN_META,
          instalments_target: String(config.instalments ?? 5),
          instalments_paid: "0",
          entry_amount: String(config.checkoutPence / 100),
          contract_value: String(config.contractPence / 100),
          buyer_name: input.name?.trim().slice(0, 200),
          buyer_email: input.email?.trim().toLowerCase(),
          gym_referral: input.gymReferral,
          gym_slug: input.gymSlug,
          rung,
          ...attr,
        },
      },
    }),
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
          rung,
          ...attr,
        },
      },
    }),
    // One-off payments: put attribution on the PaymentIntent too so it survives
    // on the charge. Payment mode ONLY — Stripe rejects payment_intent_data on a
    // subscription-mode session.
    ...(!recurring && hasAttr && { payment_intent_data: { metadata: attr } }),
    // A proper hosted invoice + PDF for pay-in-full buyers. Payment mode only:
    // subscriptions already invoice every payment, and Stripe rejects a
    // subscription session carrying invoice_creation.
    ...(!recurring && { invoice_creation: { enabled: true } }),
    success_url: ENROL_SUCCESS_URL,
    cancel_url: `${SITE_URL}${opts.cancelPath}`,
    // Prefills the email on Stripe's page, same as the old ?prefilled_email=
    customer_email: input.email?.trim().toLowerCase(),
    client_reference_id: input.clientReferenceId,
    // A discount decided server-side (ATP's member code, or a gym's member
    // saving) goes on as a coupon. There is never a Stripe code box — stated
    // explicitly rather than omitted so Stripe's default can never put one back.
    ...(discount && { discounts: [{ coupon: discount.coupon }] }),
    allow_promotion_codes: false,
    // Metadata is the durable, structured home for this — the base64
    // client_reference_id blob is capped at 200 chars and drops fields when
    // full. The webhook already prefers metadata over the blob.
    metadata: {
      // Classified by what the sale IS, never by what it costs.
      plan: config.metadataPlan,
      // What was sold, for partner commission (app/lib/partnerCommission.ts).
      rung,
      // The contract, so the webhook never infers it from an amount. Pounds
      // (two decimals) for the existing readers, and pence as the exact value.
      // Net of any discount: it is what the learner owes.
      contract_value: poundsString(contractPence),
      contract_value_pence: String(contractPence),
      // The ATP member code, or the gym's member saving, when one applied.
      promo_code: discount?.code,
      member_saving_pence: discount?.memberSavingPence ? String(discount.memberSavingPence) : undefined,
      buyer_name: input.name?.trim().slice(0, 200),
      gym_referral: input.gymReferral,
      // The partner platform joins on this, NOT on gym_referral.
      gym_slug: input.gymSlug,
      // `source` is how the webhook tells OUR course sales apart from the
      // Ultimate Shred gym memberships sharing this account.
      source: "api-checkout-session",
      ptll_product: "course",
      payments: monthly ? String(MONTHLY_PAYMENTS) : undefined,
      instalments: deposit ? String(config.instalments ?? 5) : undefined,
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
  resolved?: { config: PlanConfig; rung: Rung; discount: SessionDiscount | null },
): Promise<CheckoutSessionResult | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("[stripeCheckout] STRIPE_SECRET_KEY not set — falling back to Payment Link");
    return null;
  }

  const config = resolved?.config ?? (COURSE_PLANS as Record<string, PlanConfig>)[input.plan];
  if (!config) {
    console.error(`[stripeCheckout] unknown plan ${String(input.plan)}`);
    return null;
  }

  const cancelPath = input.cancelPath && input.cancelPath.startsWith("/") ? input.cancelPath : "/enrol";

  // buildSessionParams is typed Record<string, unknown> so tests can assert on
  // it without importing encodeForm's internal FormValue type. The object it
  // builds IS a FormValue.
  try {
    const params = buildSessionParams(input, config, {
      cancelPath,
      rung: resolved?.rung,
      discount: resolved?.discount ?? null,
    });
    // Never send a deposit without its mandate. A deposit has no Payment Link
    // to fall back to, so refusing here shows the buyer an error and a way to
    // contact us — never a £599 one-off with nothing to collect the £1,000.
    if (!depositHasMandate(params)) {
      console.error(`[stripeCheckout] REFUSED: ${config.choice} deposit without its instalment mandate`);
      return null;
    }
    const body = encodeForm(params as Record<string, FormValue>).join("&");

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
