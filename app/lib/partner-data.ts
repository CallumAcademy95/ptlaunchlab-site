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
    .select("commission_pence, commission_status, commission_release_at, enrolled_at")
    .eq("partner_id", partnerId)
    .eq("status", "confirmed");

  if (error) {
    console.error("[partner-data] pp_sales summary failed:", error);
    return EMPTY_SUMMARY;
  }

  const rows = (data ?? []) as {
    commission_pence: number;
    commission_status: "accruing" | "due" | "paid" | "voided";
    commission_release_at: string | null;
    enrolled_at: string;
  }[];

  const summary = { ...EMPTY_SUMMARY };
  const monthStartMs = startOfMonth.getTime();
  const now = Date.now();

  for (const row of rows) {
    summary.enrolmentsAllTime++;
    if (new Date(row.enrolled_at).getTime() >= monthStartMs) summary.enrolmentsThisMonth++;

    if (row.commission_status === "voided") continue;
    summary.commissionAccruedPence += row.commission_pence;

    if (row.commission_status === "paid") {
      summary.commissionPaidPence += row.commission_pence;
      continue;
    }

    // Whether commission is payable is derived from the release date, not from
    // commission_status. Nothing flips 'accruing' → 'due' on a schedule, so a
    // stored status would sit stale until a payout run touched it and a partner
    // would see money as held for days after it became payable. The status
    // column stays authoritative for 'paid' and 'voided', which are real events.
    const released =
      row.commission_status === "due" ||
      (row.commission_release_at !== null && new Date(row.commission_release_at).getTime() <= now);

    if (released) summary.commissionDuePence += row.commission_pence;
    else summary.commissionHeldPence += row.commission_pence;
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
export function commissionState(sale: PartnerSale): CommissionState {
  if (sale.commission_status === "voided" || sale.status === "refunded") {
    return { key: "voided", label: "Not payable" };
  }
  if (sale.commission_status === "paid") return { key: "paid", label: "Paid" };

  if (!sale.commission_release_at) {
    return { key: "held", label: "Releases after 2nd instalment" };
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

export function formatPence(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pence / 100);
}
