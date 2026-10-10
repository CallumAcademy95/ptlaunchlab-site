// Partner-facing data reads.
//
// ⚠️ Every select here MUST use an explicit column list. `pp_sales` holds
// `learner_email`, which partners are never shown — the decision is that they
// get the learner's NAME and DATE only (PARTNER-PLATFORM-PLAN.md §6.2). Keeping
// that rule at the query layer means a future UI change cannot leak it by
// accident, which `select("*")` would allow.

import { getSupabaseAdmin } from "./supabase-admin";
import { heldCommissionLabel } from "./paymentPlans";
import { formatPence as formatPricePence } from "./pricing";
import { countsForVolume, quarterOf, saleMoney } from "./partnerCommission";

/** Columns a partner is allowed to see from pp_sales. Note: no learner_email. */
export const PARTNER_SALE_COLUMNS =
  "id, learner_name, plan_type, amount_paid_pence, amount_due_pence, promo_code, status, commission_pence, commission_status, commission_release_at, enrolled_at, rung, volume_bonus_pence, volume_bonus_payout_id";

export interface PartnerSummary {
  enrolmentsThisMonth: number;
  enrolmentsAllTime: number;
  /** Everything not voided — what they have earned, whether or not it is payable yet. */
  commissionAccruedPence: number;
  /** Released and waiting on a payout run. */
  commissionDuePence: number;
  /** Earned but held pending the release rule for their terms. */
  commissionHeldPence: number;
  commissionPaidPence: number;
}

const EMPTY_SUMMARY: PartnerSummary = {
  enrolmentsThisMonth: 0,
  enrolmentsAllTime: 0,
  commissionAccruedPence: 0,
  commissionDuePence: 0,
  commissionHeldPence: 0,
  commissionPaidPence: 0,
};

/**
 * Headline numbers for the My Academy page.
 *
 * Returns zeros rather than throwing when the read fails — a partner landing on
 * a portal that 500s because a counter query broke is worse than one showing an
 * honest zero next to their academy link. Failures are logged.
 */
export async function getPartnerSummary(partnerId: string): Promise<PartnerSummary> {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const { data, error } = await getSupabaseAdmin()
    .from("pp_sales")
    .select("status, commission_pence, commission_status, commission_release_at, enrolled_at, volume_bonus_pence, volume_bonus_payout_id")
    .eq("partner_id", partnerId)
    .eq("status", "confirmed");

  if (error) {
    console.error("[partner-data] pp_sales summary failed:", error);
    return EMPTY_SUMMARY;
  }

  const rows = (data ?? []) as unknown as {
    status: string;
    commission_pence: number;
    commission_status: "accruing" | "due" | "paid" | "voided";
    commission_release_at: string | null;
    enrolled_at: string;
    volume_bonus_pence: number | null;
    volume_bonus_payout_id: string | null;
  }[];

  const summary = { ...EMPTY_SUMMARY };
  const monthStartMs = startOfMonth.getTime();
  const now = Date.now();

  for (const row of rows) {
    summary.enrolmentsAllTime++;
    if (new Date(row.enrolled_at).getTime() >= monthStartMs) summary.enrolmentsThisMonth++;

    if (row.commission_status === "voided") continue;

    // Whether commission is payable is derived from the release date, not from
    // commission_status. Nothing flips 'accruing' → 'due' on a schedule, so a
    // stored status would sit stale until a payout run touched it and a partner
    // would see money as held for days after it became payable. The status
    // column stays authoritative for 'paid' and 'voided', which are real events.
    // saleMoney() applies that, and counts any quarterly volume bonus with it.
    const m = saleMoney(row, now);
    summary.commissionAccruedPence += m.earned;
    summary.commissionPaidPence += m.paid;
    summary.commissionDuePence += m.payable;
    summary.commissionHeldPence += m.held;
  }

  return summary;
}

export interface PartnerSale {
  id: string;
  learner_name: string | null;
  plan_type: "PIF" | "deposit";
  amount_paid_pence: number;
  amount_due_pence: number;
  promo_code: string | null;
  status: "confirmed" | "cancelled" | "refunded";
  commission_pence: number;
  commission_status: "accruing" | "due" | "paid" | "voided";
  commission_release_at: string | null;
  enrolled_at: string;
  /** What was sold (v4.1 ladder). Null on older sales. */
  rung?: string | null;
  /** Quarterly volume top-up. */
  volume_bonus_pence?: number | null;
  volume_bonus_payout_id?: string | null;
}

/** Commission plus any volume bonus on one sale. */
export function saleEarnedPence(sale: PartnerSale): number {
  return (sale.commission_pence ?? 0) + (sale.volume_bonus_pence ?? 0);
}

/** How many learners count towards this calendar quarter's volume rate. */
export async function getQuarterLearnerCount(partnerId: string, now = new Date()): Promise<number> {
  const q = quarterOf(now);
  const { data, error } = await getSupabaseAdmin()
    .from("pp_sales")
    .select("status, commission_status")
    .eq("partner_id", partnerId)
    .gte("enrolled_at", q.start.toISOString())
    .lt("enrolled_at", q.end.toISOString());
  if (error) {
    console.error("[partner-data] quarter count failed:", error);
    return 0;
  }
  return ((data ?? []) as { status: string; commission_status: string }[]).filter(countsForVolume).length;
}

/**
 * Every enrolment attributed to this partner, newest first.
 *
 * Selects PARTNER_SALE_COLUMNS, which omits learner_email — see the note at the
 * top of this file. Returns an empty list rather than throwing.
 */
export async function getPartnerSales(partnerId: string): Promise<PartnerSale[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("pp_sales")
    .select(PARTNER_SALE_COLUMNS)
    .eq("partner_id", partnerId)
    .order("enrolled_at", { ascending: false });

  if (error) {
    console.error("[partner-data] pp_sales list failed:", error);
    return [];
  }
  return (data ?? []) as unknown as PartnerSale[];
}

export interface PartnerPayout {
  id: string;
  period_label: string;
  total_pence: number;
  status: "draft" | "approved" | "paid";
  reference: string | null;
  paid_at: string | null;
  created_at: string;
  /** The enrolments this payment covered. Names only — never emails. */
  pp_sales: { learner_name: string | null; enrolled_at: string }[];
}

/**
 * A partner's payment history, most recent first.
 *
 * The enrolments each payment covered are embedded so a partner can answer
 * "what was this £1,500 for" without asking — which is most of what a payments
 * page is for.
 */
export async function getPartnerPayouts(partnerId: string): Promise<PartnerPayout[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("pp_payouts")
    .select(
      "id, period_label, total_pence, status, reference, paid_at, created_at, pp_sales(learner_name, enrolled_at)"
    )
    .eq("partner_id", partnerId)
    .eq("status", "paid")
    .order("paid_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[partner-data] pp_payouts list failed:", error);
    return [];
  }
  return (data ?? []) as unknown as PartnerPayout[];
}

export type CommissionState =
  | { key: "paid"; label: string }
  | { key: "payable"; label: string }
  | { key: "held"; label: string }
  | { key: "voided"; label: string };

/**
 * How a partner should read the commission on one sale.
 *
 * "Payable" is derived from the release date rather than commission_status,
 * because nothing flips accruing → due on a schedule. A held sale always states
 * WHEN it releases, or what it is waiting for — a bare pending balance with no
 * explanation is the thing that generates emails.
 */
export function commissionState(sale: PartnerSale, terms?: string | null): CommissionState {
  if (sale.commission_status === "voided" || sale.status === "refunded") {
    return { key: "voided", label: "Not payable" };
  }
  if (sale.commission_status === "paid") return { key: "paid", label: "Paid" };

  if (!sale.commission_release_at) {
    // What it is waiting for depends on the partner's terms: the 2nd instalment
    // (instalment_2) or the learner's 5th payment (payment_5, v4.0).
    return { key: "held", label: heldCommissionLabel(terms, sale.rung) };
  }

  const release = new Date(sale.commission_release_at);
  if (sale.commission_status === "due" || release.getTime() <= Date.now()) {
    return { key: "payable", label: "Ready to pay" };
  }
  return {
    key: "held",
    label: `Releases ${release.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
  };
}

/**
 * "£250", "£1,500", "£499.95" — pence kept whenever they are non-zero. Used to
 * round to whole pounds, which is right for every fee but not for an amount
 * collected on the 10 × £99.99 plan.
 */
export function formatPence(pence: number): string {
  return formatPricePence(pence);
}

/**
 * When a partner's commission is released, in plain words, for their terms.
 * One wording for the portal's home, sales and payments pages so they cannot
 * disagree with each other.
 */
export function commissionReleaseRule(terms: string | null | undefined): string {
  if (terms === "payment_5" || terms === "ladder") {
    return (
      "If the learner pays in full, your fee is released 30 days after they enrol. " +
      "If they pay monthly, it's released when their 5th monthly payment clears (their first payment counts as 1). " +
      "Once paid, it is not clawed back."
    );
  }
  if (terms === "instalment_2") {
    return (
      "If the learner pays in full, your fee is released 30 days after they enrol. " +
      "If they're on an instalment plan, it's released once their second instalment clears, then paid 30 days after that."
    );
  }
  return "Your fee is released 30 days after the learner enrols, whichever way they choose to pay.";
}
