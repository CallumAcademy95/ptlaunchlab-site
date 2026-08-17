// Is this course sale a DEPOSIT plan or a PAY-IN-FULL?
//
// ⚠️ NEVER decide this by the amount. The gym-partner pay-in-full is £1,099
// (£500 off) or £1,299 (£300 off) — both below the £1,300 line this code used to
// test — so a learner who has settled in full gets called a deposit. That cost
// us twice: 8 of 9 gym rows in the Sheet tracker were mislabelled (fixed
// 2026-07-28), and on 2026-08-17 a paid-in-full £1,099 sale fired the 🚨
// missing-mandate alarm claiming "£1,000 uncollected" and told the buyer she was
// on a deposit plan. Nothing was owed.
//
// The SHAPE of the sale decides, in this order:
//
//   1. mode === "subscription"  → deposit plan. The £200/month mandate is
//      attached to the session itself; nothing else can override that.
//   2. metadata.plan            → set by createCheckoutSession from the *link's*
//      list price (£1,599 / £599 / £1,399), which no promo code can move. This
//      is the reliable signal, and it is on every sale from 2026-07-26 onward.
//   3. amount ≤ £700            → deposit. Only reached by sales made through a
//      raw Payment Link (the fallback path) or before metadata.plan shipped.
//      Safe because the cheapest pay-in-full is £1,099.
//
// No imports on purpose: this is the one rule, unit-tested in
// tests/coursePlan.test.mts, and it has to be importable without dragging
// Supabase or Stripe in behind it.

export type PlanType = "PIF" | "deposit";

/** £599 deposit; every pay-in-full variant (1,099 / 1,299 / 1,399 / 1,599) sits above this. */
export const DEPOSIT_CEILING_PENCE = 70_000;

/** What a deposit plan collects in total: £599 up front + 5 × £200. */
export const DEPOSIT_PLAN_TOTAL_PENCE = 159_900;

export interface SaleShape {
  /** Stripe checkout mode. "subscription" always means a deposit plan. */
  mode?: string | null;
  amountTotalPence: number;
  /** `metadata.plan` off the Checkout Session — "PIF" | "deposit". Absent on raw-link sales. */
  metadataPlan?: string | null;
}

export function isDepositSale(sale: SaleShape): boolean {
  if (sale.mode === "subscription") return true;
  if (sale.metadataPlan === "PIF") return false;
  if (sale.metadataPlan === "deposit") return true;
  return sale.amountTotalPence <= DEPOSIT_CEILING_PENCE;
}

export function planTypeForSale(sale: SaleShape): PlanType {
  return isDepositSale(sale) ? "deposit" : "PIF";
}

/**
 * What is still to be collected on this sale, in pence.
 *
 * Zero for a pay-in-full at any discount. Derived, never hardcoded — the alarm
 * used to state a flat "£1,000", which is only right for a £599 deposit and was
 * wrong on the very sale that exposed the bug.
 */
export function outstandingBalancePence(sale: SaleShape): number {
  if (!isDepositSale(sale)) return 0;
  return Math.max(0, DEPOSIT_PLAN_TOTAL_PENCE - sale.amountTotalPence);
}

/** "£1,099" — pence in, display pounds out. Whole pounds; every price here is one. */
export function formatGbp(pence: number): string {
  return `£${Math.round(pence / 100).toLocaleString("en-GB")}`;
}

/** Buyer- and admin-facing plan description, e.g. "Pay in Full — £1,099". */
export function planLabel(sale: SaleShape): string {
  const price = formatGbp(sale.amountTotalPence);
  return isDepositSale(sale) ? `Deposit — ${price}` : `Pay in Full — ${price}`;
}
