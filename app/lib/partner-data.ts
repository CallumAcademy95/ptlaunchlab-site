// Partner-facing data reads.
//
// ⚠️ Every select here MUST use an explicit column list. `pp_sales` holds
// `learner_email`, which partners are never shown — the decision is that they
// get the learner's NAME and DATE only (PARTNER-PLATFORM-PLAN.md §6.2). Keeping
// that rule at the query layer means a future UI change cannot leak it by
// accident, which `select("*")` would allow.

import { getSupabaseAdmin } from "./supabase-admin";

/** Columns a partner is allowed to see from pp_sales. Note: no learner_email. */
export const PARTNER_SALE_COLUMNS =
  "id, learner_name, plan_type, amount_paid_pence, amount_due_pence, promo_code, status, commission_pence, commission_status, commission_release_at, enrolled_at";

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
    .select("commission_pence, commission_status, enrolled_at")
    .eq("partner_id", partnerId)
    .eq("status", "confirmed");

  if (error) {
    console.error("[partner-data] pp_sales summary failed:", error);
    return EMPTY_SUMMARY;
  }

  const rows = (data ?? []) as {
    commission_pence: number;
    commission_status: "accruing" | "due" | "paid" | "voided";
    enrolled_at: string;
  }[];

  const summary = { ...EMPTY_SUMMARY };
  const monthStartMs = startOfMonth.getTime();

  for (const row of rows) {
    summary.enrolmentsAllTime++;
    if (new Date(row.enrolled_at).getTime() >= monthStartMs) summary.enrolmentsThisMonth++;

    if (row.commission_status === "voided") continue;
    summary.commissionAccruedPence += row.commission_pence;
    if (row.commission_status === "due") summary.commissionDuePence += row.commission_pence;
    if (row.commission_status === "paid") summary.commissionPaidPence += row.commission_pence;
    if (row.commission_status === "accruing") summary.commissionHeldPence += row.commission_pence;
  }

  return summary;
}

export function formatPence(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pence / 100);
}
