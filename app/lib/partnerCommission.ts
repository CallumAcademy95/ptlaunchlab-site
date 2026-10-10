// Partner commission on the sales ladder (agreement v4.1, October 2026).
//
// ONE place for every figure a gym earns on a sale, and every rule that picks
// it. Pure: no Stripe, no Supabase, no env reads (env is passed in), and the
// only import is ./pricing, which itself imports nothing. Pages, API routes,
// the webhook, scripts and tests all read this.
//
// TWO LADDERS LIVE HERE
//
//   The nine gyms ('ladder' commission terms, from signing v4.1)
//     pay in full £999.99  → £400, less any member saving the gym chose to give
//     monthly 10 × £99.99  → £250
//     volume rate: 4+ learners enrolled in a calendar quarter tops EVERY ladder
//     sale that quarter up by +£100 (pay in full) / +£50 (monthly). Paid with
//     the payout run after the quarter ends.
//
//   ATP Fitness Felixstowe only (a 60-day test, from 10 October 2026)
//     6-month plan £599 + 5 × £200 (£1,599)   → £500
//     pay in full £1,599                       → £500
//     pay in full £1,399 (code ATPPT)          → £500
//     pay in full £1,099 (code ATP500)         → £500 for the next 3, then £400
//     pay in full £999.99                      → £300
//     monthly 10 × £99.99                      → £250
//     Not on the volume rate — the rungs replace it.
//
// Money is in PENCE throughout.

import { COURSE_PRICE_PENCE } from "./pricing.ts";

// ─── Rungs ──────────────────────────────────────────────────────────────────
// What was sold, stamped on the Checkout Session (metadata.rung) and on the
// sale (pp_sales.rung). A rung names the SHAPE of the sale — never an amount.

export type Rung =
  | "pif"          // £999.99 in full (any gym)
  | "monthly"      // 10 × £99.99 (any gym)
  | "six_month"    // ATP: £599 today + 5 × £200 (legacy deposit_instalments shape)
  | "pif_1599"     // ATP: £1,599 in full, no member code
  | "pif_1399"     // ATP: £1,599 less code ATPPT
  | "pif_1099";    // ATP: £1,599 less code ATP500

export const RUNGS: readonly Rung[] = ["pif", "monthly", "six_month", "pif_1599", "pif_1399", "pif_1099"];

export function isRung(value: unknown): value is Rung {
  return typeof value === "string" && (RUNGS as readonly string[]).includes(value);
}

// ─── The nine gyms ──────────────────────────────────────────────────────────

/** Commission terms value for the v4.1 sales ladder. */
export const LADDER_TERMS = "ladder";

export const LADDER_PIF_COMMISSION_PENCE = 40_000;      // £400
export const LADDER_MONTHLY_COMMISSION_PENCE = 25_000;  // £250

/** Learners in one calendar quarter that move every sale that quarter to the volume rate. */
export const VOLUME_THRESHOLD = 4;
export const VOLUME_BONUS_PIF_PENCE = 10_000;     // +£100 → £500
export const VOLUME_BONUS_MONTHLY_PENCE = 5_000;  // +£50  → £300

/** A gym may give its members up to £100 off pay-in-full, in £25 steps. */
export const MEMBER_SAVING_STEPS_PENCE: readonly number[] = [2_500, 5_000, 7_500, 10_000];
export const MAX_MEMBER_SAVING_PENCE = 10_000;

/** Env var holding the Stripe coupon id for a member saving of `pence`. */
export function memberSavingCouponEnvName(pence: number): string {
  return `STRIPE_MEMBER_SAVING_COUPON_${pence}`;
}

/**
 * The member saving that will ACTUALLY be given on a gym's pay-in-full, and the
 * coupon that gives it — or none.
 *
 * Zero unless the gym configured an allowed step AND the coupon for that exact
 * amount is configured. A missing coupon shows no saving rather than failing:
 * a page promising £50 off that checkout then refuses to give is worse than a
 * page that promises nothing.
 */
export function resolveMemberSaving(
  configuredPence: number | undefined | null,
  env: Record<string, string | undefined>,
): { savingPence: number; coupon: string | null } {
  const pence = Number(configuredPence ?? 0);
  if (!Number.isInteger(pence) || pence <= 0 || pence > MAX_MEMBER_SAVING_PENCE) return { savingPence: 0, coupon: null };
  if (!MEMBER_SAVING_STEPS_PENCE.includes(pence)) return { savingPence: 0, coupon: null };
  const coupon = env[memberSavingCouponEnvName(pence)]?.trim();
  if (!coupon) return { savingPence: 0, coupon: null };
  return { savingPence: pence, coupon };
}

/** Member price on the pay-in-full option, in pence. */
export function memberPricePence(savingPence: number): number {
  return COURSE_PRICE_PENCE - Math.max(0, Math.min(MAX_MEMBER_SAVING_PENCE, savingPence));
}

/**
 * Base commission on a nine-gym ladder sale.
 *
 * Pay in full: £400 less the member saving given (the gym funds its own
 * members' saving). Monthly: £250 — a saving never applies to it.
 */
export function ladderCommissionPence(rung: Rung, memberSavingPence = 0): number {
  if (rung === "monthly") return LADDER_MONTHLY_COMMISSION_PENCE;
  const saving = Math.max(0, Math.min(MAX_MEMBER_SAVING_PENCE, Math.round(memberSavingPence) || 0));
  return LADDER_PIF_COMMISSION_PENCE - saving;
}

/** The volume top-up for one sale, by what it was. */
export function volumeBonusPence(rung: string | null | undefined, planType?: string | null): number {
  if (rung === "monthly") return VOLUME_BONUS_MONTHLY_PENCE;
  if (rung === "pif") return VOLUME_BONUS_PIF_PENCE;
  if (rung) return 0; // an ATP rung, or anything else: not on the volume rate
  // No rung stamped: fall back to the binary plan type.
  if (planType === "PIF") return VOLUME_BONUS_PIF_PENCE;
  if (planType === "deposit") return VOLUME_BONUS_MONTHLY_PENCE;
  return 0;
}

// ─── Calendar quarters ──────────────────────────────────────────────────────

export interface Quarter {
  year: number;
  /** 1–4 */
  q: number;
  /** Inclusive start, UTC. */
  start: Date;
  /** Exclusive end, UTC. */
  end: Date;
  label: string; // "2026-Q4"
}

export function quarterOf(date: Date): Quarter {
  const year = date.getUTCFullYear();
  const q = Math.floor(date.getUTCMonth() / 3) + 1;
  return quarter(year, q);
}

export function quarter(year: number, q: number): Quarter {
  const start = new Date(Date.UTC(year, (q - 1) * 3, 1));
  const end = new Date(Date.UTC(year, q * 3, 1));
  return { year, q, start, end, label: `${year}-Q${q}` };
}

/** "2026-Q4" → Quarter, or null. */
export function parseQuarter(label: string): Quarter | null {
  const m = /^(\d{4})-Q([1-4])$/i.exec(label.trim());
  return m ? quarter(Number(m[1]), Number(m[2])) : null;
}

export function previousQuarter(now: Date): Quarter {
  const cur = quarterOf(now);
  return cur.q === 1 ? quarter(cur.year - 1, 4) : quarter(cur.year, cur.q - 1);
}

// ─── Volume rate ────────────────────────────────────────────────────────────

export interface QuarterSale {
  id: string;
  enrolled_at: string;
  status: string;
  commission_status: string;
  rung: string | null;
  plan_type: string | null;
  volume_bonus_pence: number | null;
}

/** A sale that counts towards the volume threshold: confirmed and not voided. */
export function countsForVolume(s: Pick<QuarterSale, "status" | "commission_status">): boolean {
  return s.status === "confirmed" && s.commission_status !== "voided";
}

/** A sale that is topped up when the threshold is met: a nine-gym ladder sale. */
export function eligibleForVolumeBonus(s: Pick<QuarterSale, "rung">): boolean {
  return s.rung === "pif" || s.rung === "monthly";
}

export interface QuarterTopUp {
  quarter: string;
  learners: number;
  qualifies: boolean;
  /** Every sale whose bonus should change, with the value it should hold. */
  changes: { id: string; from: number; to: number }[];
  totalBonusPence: number;
}

/**
 * The volume top-up for one gym's sales in one quarter.
 *
 * Counts confirmed, non-voided sales enrolled inside the quarter; at
 * VOLUME_THRESHOLD or more, every eligible sale gets its bonus. Below it,
 * nothing is changed — a bonus already written is NEVER taken back here (no
 * clawback once paid; a refund is handled by voiding the sale).
 */
export function quarterTopUp(sales: readonly QuarterSale[], q: Quarter): QuarterTopUp {
  const inQuarter = sales.filter((s) => {
    const t = Date.parse(s.enrolled_at);
    return t >= q.start.getTime() && t < q.end.getTime();
  });
  const counted = inQuarter.filter(countsForVolume);
  const qualifies = counted.length >= VOLUME_THRESHOLD;
  const changes: QuarterTopUp["changes"] = [];
  let totalBonusPence = 0;
  if (qualifies) {
    for (const s of counted) {
      if (!eligibleForVolumeBonus(s)) continue;
      const to = volumeBonusPence(s.rung, s.plan_type);
      totalBonusPence += to;
      const from = s.volume_bonus_pence ?? 0;
      if (from !== to) changes.push({ id: s.id, from, to });
    }
  }
  return { quarter: q.label, learners: counted.length, qualifies, changes, totalBonusPence };
}

/** Partner-facing progress line for the current quarter. */
export function volumeProgressMessage(learners: number): string {
  if (learners >= VOLUME_THRESHOLD) {
    return `${learners} learners this quarter — every learner this quarter is on the volume rate.`;
  }
  const more = VOLUME_THRESHOLD - learners;
  const word = more === 1 ? "one more" : `${more} more`;
  return `${learners} of ${VOLUME_THRESHOLD} learners this quarter — ${word} and every learner this quarter moves to the volume rate.`;
}

// ─── ATP Fitness Felixstowe ─────────────────────────────────────────────────

export const ATP_GYM_SLUG = "atp-felixstowe";

/**
 * ATP's own ladder. Prices are the LIVE Stripe prices (env-overridable for
 * test mode). Codes are checked server-side against this map only, and apply
 * as `discounts: [{ coupon }]` — never as Stripe promotion codes.
 */
export const ATP_LADDER = {
  slug: ATP_GYM_SLUG,
  /** When the test began — the ATP500 "next three" are counted from here. */
  startsAt: "2026-10-10T00:00:00.000Z",
  sixMonth: {
    depositPence: 59_900,
    instalmentPence: 20_000,
    instalments: 5,
    contractPence: 159_900,
    trialDays: 30,
  },
  pif1599Pence: 159_900,
  codes: {
    ATPPT: { coupon: "buPzSnaF", offPence: 20_000, rung: "pif_1399" as Rung },
    ATP500: { coupon: "vgLNHktz", offPence: 50_000, rung: "pif_1099" as Rung },
  } as Record<string, { coupon: string; offPence: number; rung: Rung }>,
  commission: {
    six_month: 50_000,
    pif_1599: 50_000,
    pif_1399: 50_000,
    pif_1099: 50_000,
    pif: 30_000,
    monthly: 25_000,
  } as Record<Rung, number>,
  /** pif_1099 earns £500 for this many sales from startsAt, then this lower figure. */
  pif1099FullRateCount: 3,
  pif1099AfterPence: 40_000,
} as const;

export function isAtp(gymSlug: string | null | undefined): boolean {
  return gymSlug === ATP_GYM_SLUG;
}

/** Normalise what a buyer typed: trimmed, upper-case, inner spaces removed. */
export function normaliseCode(raw: unknown): string {
  return typeof raw === "string" ? raw.replace(/\s+/g, "").toUpperCase().slice(0, 40) : "";
}

export type CodeResult =
  | { kind: "none" }
  | { kind: "valid"; code: string; coupon: string; offPence: number; rung: Rung }
  | { kind: "invalid" };

/**
 * Check a member code. ATP's £1,599 pay-in-full only: any other gym, or no gym,
 * gets "none" whatever was typed — a code cannot be smuggled onto another page.
 */
export function resolveMemberCode(gymSlug: string | null | undefined, raw: unknown): CodeResult {
  if (!isAtp(gymSlug)) return { kind: "none" };
  const code = normaliseCode(raw);
  if (!code) return { kind: "none" };
  const hit = Object.prototype.hasOwnProperty.call(ATP_LADDER.codes, code) ? ATP_LADDER.codes[code] : undefined;
  return hit ? { kind: "valid", code, coupon: hit.coupon, offPence: hit.offPence, rung: hit.rung } : { kind: "invalid" };
}

/**
 * ATP's commission on one sale.
 *
 * `priorPif1099Count` is how many pif_1099 sales ATP already has from
 * ATP_LADDER.startsAt, NOT counting this one.
 */
export function atpCommissionPence(rung: Rung, priorPif1099Count = 0): number {
  if (rung === "pif_1099") {
    return priorPif1099Count < ATP_LADDER.pif1099FullRateCount
      ? ATP_LADDER.commission.pif_1099
      : ATP_LADDER.pif1099AfterPence;
  }
  return ATP_LADDER.commission[rung];
}

// ─── The one decision recordPartnerSale makes ───────────────────────────────

export interface CommissionInput {
  partnerSlug: string;
  /** pp_partners.commission_terms */
  terms: string | null | undefined;
  /** pp_partners.fee_per_learner_pence — what every pre-ladder sale is stamped with. */
  feePerLearnerPence: number;
  /** metadata.rung off the session, if any. */
  rung: string | null | undefined;
  /** metadata.member_saving_pence off the session, if any. */
  memberSavingPence?: number | null;
  /** For ATP pif_1099 only: prior pif_1099 sales since the test began. */
  priorPif1099Count?: number;
}

/**
 * What to stamp in pp_sales.commission_pence for a new sale.
 *
 *   ATP + an ATP-ladder rung      → the rung's figure (whatever ATP's terms)
 *   'ladder' terms + pif/monthly  → £400 − saving / £250
 *   anything else                 → the partner's flat fee, exactly as before
 */
export function commissionForSale(input: CommissionInput): number {
  const rung = isRung(input.rung) ? input.rung : null;
  if (isAtp(input.partnerSlug) && rung) {
    return atpCommissionPence(rung, input.priorPif1099Count ?? 0);
  }
  if (input.terms === LADDER_TERMS && (rung === "pif" || rung === "monthly")) {
    return ladderCommissionPence(rung, input.memberSavingPence ?? 0);
  }
  return input.feePerLearnerPence;
}

// ─── Paying it out ──────────────────────────────────────────────────────────
//
// A sale carries two amounts: commission_pence (stamped at sale time) and
// volume_bonus_pence (written after the quarter ends). The bonus can land on a
// sale whose commission was already paid, so it is settled separately: it is
// payable once the sale's commission has released and volume_bonus_payout_id
// is still empty.

export interface PayableSale {
  status: string;
  commission_pence: number;
  commission_status: string;
  commission_release_at: string | null;
  volume_bonus_pence?: number | null;
  volume_bonus_payout_id?: string | null;
}

export interface SaleMoney {
  /** Everything earned on the sale (commission + bonus), unless voided. */
  earned: number;
  paid: number;
  payable: number;
  held: number;
  /** Base commission payable now. */
  payableCommission: number;
  /** Volume bonus payable now. */
  payableBonus: number;
}

export function isReleased(s: Pick<PayableSale, "commission_status" | "commission_release_at">, nowMs: number): boolean {
  return (
    s.commission_status === "due" ||
    s.commission_status === "paid" ||
    (s.commission_release_at !== null && Date.parse(s.commission_release_at) <= nowMs)
  );
}

/** How a sale's commission and bonus split into paid / payable / held. */
export function saleMoney(s: PayableSale, nowMs: number): SaleMoney {
  const zero = { earned: 0, paid: 0, payable: 0, held: 0, payableCommission: 0, payableBonus: 0 };
  if (s.commission_status === "voided" || s.status === "refunded" || s.status === "voided") return zero;
  const out = { ...zero };
  const released = isReleased(s, nowMs);
  const base = s.commission_pence ?? 0;
  const bonus = s.volume_bonus_pence ?? 0;

  out.earned = base + bonus;
  if (s.commission_status === "paid") out.paid += base;
  else if (released) out.payableCommission = base;
  else out.held += base;

  if (bonus > 0) {
    if (s.volume_bonus_payout_id) out.paid += bonus;
    else if (released) out.payableBonus = bonus;
    else out.held += bonus;
  }
  out.payable = out.payableCommission + out.payableBonus;
  return out;
}
