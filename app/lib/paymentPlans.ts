// Instalment-plan arithmetic, shared by the Stripe webhook and the partner
// ledger. Pure: no Stripe calls, no Supabase, no env — every decision that
// moves money or releases commission is here so it can be unit-tested.
//
// TWO FAMILIES OF PLAN LIVE SIDE BY SIDE
//
//   monthly  — from the October 2026 change-over. 10 × £99.99 on a Stripe
//              subscription with NO trial: the first £99.99 is taken at
//              checkout and IS payment 1. Subscription metadata
//              ptll_plan = "monthly_10".
//   legacy   — the deposit plans still being paid off: £599 (or £99) taken at
//              checkout, then 5 × £200 (or 5 × £300 on the October price) on a
//              subscription whose recurring line sits in a 30-day trial.
//              Subscription metadata ptll_plan = "deposit_instalments". The
//              deposit is NOT an instalment; only the monthly lines count.
//
// A plan is told apart by its metadata, or failing that by the recurring PRICE
// on the subscription — never by an amount. £99.99 and £99 are a penny apart
// and an amount test is how this repo has mislabelled sales twice already.

import { MONTHLY_PAYMENTS, MONTHLY_PRICE_PENCE, PARTNER_FEE_RELEASE_PAYMENT } from "./pricing.ts";

/** Subscription metadata `ptll_plan` for the 10 × £99.99 plan. */
export const MONTHLY_PLAN_META = "monthly_10";
/** Subscription metadata `ptll_plan` for every pre-October deposit plan. */
export const LEGACY_PLAN_META = "deposit_instalments";

export type SubscriptionPlanKind = "monthly" | "legacy";

/**
 * Which plan a subscription is, or null if it is not ours (e.g. an Ultimate
 * Shred membership on the same Stripe account).
 *
 * Metadata first. The price fallback exists for the raw Payment Link path: if a
 * link is ever created without its subscription metadata, a 10 × £99.99
 * subscription would otherwise never be recognised, never be counted and never
 * be stopped — it would bill forever. The recurring price id cannot be wrong
 * in that way, so it is the safety net.
 */
export function subscriptionPlanKind(
  metadata: Record<string, string> | undefined | null,
  itemPriceIds: readonly string[],
  monthlyPriceId: string,
): SubscriptionPlanKind | null {
  const tag = metadata?.ptll_plan;
  if (tag === MONTHLY_PLAN_META) return "monthly";
  if (tag === LEGACY_PLAN_META) return "legacy";
  if (itemPriceIds.includes(monthlyPriceId)) return "monthly";
  return null;
}

export type InvoiceLine = {
  amount?: number;
  price?: { id?: string } | null;
  // Later API versions moved the price pointer under `pricing`.
  pricing?: { price_details?: { price?: string } | null } | null;
};
export type InvoiceListEntry = { status?: string; lines?: { data?: InvoiceLine[] } };

export function linePriceId(line: InvoiceLine): string | undefined {
  return line.price?.id || line.pricing?.price_details?.price || undefined;
}

/**
 * How many paid invoices carry a non-zero line on one of `priceIds`.
 *
 * The £0 guard matters for the legacy plans: their first invoice carries the
 * deposit plus the recurring line at £0 (it is in its trial), and that invoice
 * is not an instalment. The monthly plan has no trial, so its first invoice
 * carries £99.99 on the monthly price and counts — the checkout payment IS
 * payment 1.
 */
export function countPaidInvoices(
  invoices: readonly InvoiceListEntry[],
  priceIds: ReadonlySet<string>,
): number {
  return invoices.filter(
    (inv) =>
      inv.status === "paid" &&
      (inv.lines?.data ?? []).some((line) => {
        const id = linePriceId(line);
        return !!id && priceIds.has(id) && (line.amount ?? 0) > 0;
      }),
  ).length;
}

/** The plan is complete — stop it before another month comes round. */
export function planIsComplete(paid: number, target: number): boolean {
  return Number.isFinite(paid) && Number.isFinite(target) && target > 0 && paid >= target;
}

/** The monthly plan always stops at exactly ten. Metadata cannot raise it. */
export function monthlyTarget(): number {
  return MONTHLY_PAYMENTS;
}

/** Entry payment on a legacy plan, in pence. Pre-stamp plans were all £599. */
export function legacyEntryPence(metadata: Record<string, string> | undefined | null): number {
  const pounds = Number(metadata?.entry_amount);
  return Number.isFinite(pounds) && pounds > 0 ? Math.round(pounds * 100) : 59_900;
}

/**
 * One legacy instalment, in pence: (contract − entry) ÷ target.
 *
 *   £599 + 5 × £200 = £1,599  → 20,000
 *   £99  + 5 × £200 = £1,099  → 20,000   (September)
 *   £99  + 5 × £300 = £1,599  → 30,000   (October price)
 *
 * Falls back to £200, which every plan predating the contract_value stamp is.
 */
export function legacyInstalmentPence(metadata: Record<string, string> | undefined | null): number {
  const contract = Number(metadata?.contract_value);
  const target = Number(metadata?.instalments_target ?? "5");
  if (Number.isFinite(contract) && contract > 0 && Number.isFinite(target) && target > 0) {
    const each = Math.round((contract * 100 - legacyEntryPence(metadata)) / target);
    if (each > 0) return each;
  }
  return 20_000;
}

/**
 * What a plan has collected so far, in pence, given the settled count.
 *
 * Recomputed from the count rather than added to, so a redelivered webhook can
 * never inflate it. Replaces the hardcoded 59_900 + n × 20_000, which was wrong
 * for every £99 entry and every £300 instalment.
 */
export function collectedPence(
  kind: SubscriptionPlanKind,
  paid: number,
  metadata?: Record<string, string> | null,
): number {
  if (kind === "monthly") return paid * MONTHLY_PRICE_PENCE;
  return legacyEntryPence(metadata) + paid * legacyInstalmentPence(metadata);
}

/** The full contract on a plan, in pence. */
export function contractPence(kind: SubscriptionPlanKind, metadata?: Record<string, string> | null): number {
  if (kind === "monthly") return MONTHLY_PAYMENTS * MONTHLY_PRICE_PENCE;
  const target = Number(metadata?.instalments_target ?? "5");
  return legacyEntryPence(metadata) + (Number.isFinite(target) ? target : 5) * legacyInstalmentPence(metadata);
}

// ─── Gym partner commission ─────────────────────────────────────────────────
//
//   on_enrolment  — grandfathered: 30 days after enrolment, whatever the plan.
//                   The release date is set at sale time; instalments never
//                   move it.
//   instalment_2  — 2026-07-27 terms: pay-in-full 30 days after enrolment; a
//                   deposit plan once the 2nd monthly instalment clears.
//   payment_5     — v4.0 terms (October 2026): pay-in-full 30 days after
//                   enrolment; a payment plan once the learner's 5th payment
//                   clears, the checkout payment counting as payment 1.
//
// The rule is evaluated against the partner's CURRENT terms when each invoice
// lands.

export type CommissionTerms = "on_enrolment" | "instalment_2" | "payment_5";

/**
 * How many of the learner's payments have cleared, counting the checkout
 * payment as payment 1.
 *
 *   monthly: every paid invoice is a payment, the first included → `settled`.
 *   legacy:  `settled` counts instalments only, so add the deposit → settled + 1.
 */
export function learnerPaymentsCleared(kind: SubscriptionPlanKind, settled: number): number {
  return kind === "monthly" ? settled : settled + 1;
}

/**
 * Has this instalment released a commission that was being held?
 *
 * For `instalment_2` on a LEGACY plan this is exactly the old rule
 * (settled instalments ≥ 2). On the monthly plan "the 2nd instalment" is read
 * as the same position in the plan — the checkout payment stands where the
 * deposit stood — so it releases at payment 3.
 */
export function commissionReleasedByPayment(
  terms: string,
  kind: SubscriptionPlanKind,
  settled: number,
): boolean {
  if (terms === "instalment_2") {
    return kind === "legacy" ? settled >= 2 : settled >= 3;
  }
  if (terms === "payment_5") {
    // v4.0 clause 5.4: a learner who enrolled before 12 October 2026 on a
    // deposit plan keeps the 2nd-instalment rule, even after their gym moves to
    // v4.0. Only the monthly plan waits for the 5th payment.
    if (kind === "legacy") return settled >= 2;
    return learnerPaymentsCleared(kind, settled) >= PARTNER_FEE_RELEASE_PAYMENT;
  }
  // on_enrolment, or anything unrecognised: the sale was dated at enrolment and
  // instalments do not move it. Unrecognised terms never release early.
  return false;
}

/** Whether a payment-plan sale starts with its commission held (no release date). */
export function commissionHeldAtSale(terms: string, isPaymentPlan: boolean): boolean {
  return isPaymentPlan && (terms === "instalment_2" || terms === "payment_5");
}

/** Partner-facing wording for a held commission on a payment plan. */
export function heldCommissionLabel(terms: string | null | undefined): string {
  if (terms === "payment_5") return `Releases after ${ordinal(PARTNER_FEE_RELEASE_PAYMENT)} payment`;
  return "Releases after 2nd instalment";
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

/** Short admin-facing label for a partner's commission terms. */
export function commissionTermsLabel(terms: string | null | undefined): string {
  if (terms === "on_enrolment") return "30d after enrolment (grandfathered)";
  if (terms === "payment_5") return "v4.0: PIF 30d · monthly at payment 5";
  return "Held to instalment 2";
}
