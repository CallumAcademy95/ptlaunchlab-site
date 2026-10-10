// tests/partnerCommission.test.mts
//
// WHAT THIS PROTECTS
//
// Every figure a gym earns on the v4.1 sales ladder, and ATP's own 60-day
// ladder. A wrong number here is money paid to, or withheld from, a partner.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  commissionForSale,
  ladderCommissionPence,
  volumeBonusPence,
  quarterTopUp,
  quarterOf,
  quarter,
  parseQuarter,
  previousQuarter,
  volumeProgressMessage,
  resolveMemberSaving,
  memberPricePence,
  resolveMemberCode,
  atpCommissionPence,
  saleMoney,
  ATP_LADDER,
  type QuarterSale,
} from "../app/lib/partnerCommission.ts";
import {
  commissionReleasedByPayment,
  commissionHeldAtSale,
  heldCommissionLabel,
} from "../app/lib/paymentPlans.ts";

// ─── Nine gyms ──────────────────────────────────────────────────────────────

const nine = (rung: string | null, extra: Partial<Parameters<typeof commissionForSale>[0]> = {}) =>
  commissionForSale({ partnerSlug: "ebor", terms: "ladder", feePerLearnerPence: 25_000, rung, ...extra });

test("ladder: pay in full £400, monthly £250", () => {
  assert.equal(nine("pif"), 40_000);
  assert.equal(nine("monthly"), 25_000);
});

test("ladder: a member saving comes off the gym's pay-in-full commission, never monthly", () => {
  assert.equal(nine("pif", { memberSavingPence: 2_500 }), 37_500);
  assert.equal(nine("pif", { memberSavingPence: 10_000 }), 30_000);
  assert.equal(nine("monthly", { memberSavingPence: 10_000 }), 25_000);
  // Never more than the £100 cap, never negative.
  assert.equal(ladderCommissionPence("pif", 50_000), 30_000);
  assert.equal(ladderCommissionPence("pif", -500), 40_000);
});

test("legacy terms are unchanged: the partner's flat fee, whatever the rung", () => {
  for (const terms of ["on_enrolment", "instalment_2", "payment_5", null, "weird"]) {
    assert.equal(nine("pif", { terms }), 25_000, String(terms));
    assert.equal(nine("monthly", { terms }), 25_000, String(terms));
  }
  assert.equal(nine(null), 25_000, "no rung (raw Payment Link sale) keeps the flat fee");
  assert.equal(nine("six_month"), 25_000, "an ATP rung on another gym earns nothing special");
  assert.equal(commissionForSale({ partnerSlug: "x", terms: "on_enrolment", feePerLearnerPence: 50_000, rung: "pif" }), 50_000);
});

// ─── Volume rate ────────────────────────────────────────────────────────────

const sale = (id: string, at: string, rung: string | null, extra: Partial<QuarterSale> = {}): QuarterSale => ({
  id, enrolled_at: at, status: "confirmed", commission_status: "accruing", rung, plan_type: rung === "monthly" ? "deposit" : "PIF", volume_bonus_pence: 0, ...extra,
});
const Q4 = quarter(2026, 4);

test("volume: 3 learners — no top-up", () => {
  const r = quarterTopUp([sale("a", "2026-10-02", "pif"), sale("b", "2026-11-02", "monthly"), sale("c", "2026-12-31T23:59:59Z", "pif")], Q4);
  assert.equal(r.learners, 3);
  assert.equal(r.qualifies, false);
  assert.deepEqual(r.changes, []);
});

test("volume: 4 learners — every sale that quarter tops up (+£100 PIF → £500, +£50 monthly → £300)", () => {
  const r = quarterTopUp(
    [sale("a", "2026-10-02", "pif"), sale("b", "2026-11-02", "monthly"), sale("c", "2026-12-01", "pif"), sale("d", "2026-12-20", "monthly")],
    Q4,
  );
  assert.equal(r.qualifies, true);
  assert.deepEqual(r.changes, [
    { id: "a", from: 0, to: 10_000 },
    { id: "b", from: 0, to: 5_000 },
    { id: "c", from: 0, to: 10_000 },
    { id: "d", from: 0, to: 5_000 },
  ]);
  assert.equal(r.totalBonusPence, 30_000);
  assert.equal(ladderCommissionPence("pif") + volumeBonusPence("pif"), 50_000);
  assert.equal(ladderCommissionPence("monthly") + volumeBonusPence("monthly"), 30_000);
});

test("volume: refunded / voided / out-of-quarter sales do not count", () => {
  const r = quarterTopUp(
    [
      sale("a", "2026-10-02", "pif"),
      sale("b", "2026-10-03", "pif"),
      sale("c", "2026-10-04", "pif"),
      sale("r", "2026-10-05", "pif", { status: "refunded" }),
      sale("v", "2026-10-06", "pif", { commission_status: "voided" }),
      sale("old", "2026-09-30T23:59:59Z", "pif"),
      sale("next", "2027-01-01T00:00:00Z", "pif"),
    ],
    Q4,
  );
  assert.equal(r.learners, 3);
  assert.equal(r.qualifies, false);
});

test("volume: a sale stamped before the gym moved to the ladder counts but is not topped up", () => {
  const r = quarterTopUp(
    [sale("pre", "2026-10-02", null), sale("a", "2026-10-20", "pif"), sale("b", "2026-10-21", "pif"), sale("c", "2026-10-22", "monthly")],
    Q4,
  );
  assert.equal(r.learners, 4);
  assert.deepEqual(r.changes.map((c) => c.id), ["a", "b", "c"]);
});

test("volume: re-running is idempotent — a bonus already written is not changed again", () => {
  const s = [1, 2, 3, 4].map((i) => sale(String(i), `2026-10-0${i}`, "pif", { volume_bonus_pence: 10_000 }));
  assert.deepEqual(quarterTopUp(s, Q4).changes, []);
});

test("quarters are calendar quarters in UTC", () => {
  assert.equal(quarterOf(new Date("2026-10-10T12:00:00Z")).label, "2026-Q4");
  assert.equal(quarterOf(new Date("2026-03-31T23:59:59Z")).label, "2026-Q1");
  assert.equal(parseQuarter("2026-q3")?.start.toISOString(), "2026-07-01T00:00:00.000Z");
  assert.equal(parseQuarter("2026-Q5"), null);
  assert.equal(previousQuarter(new Date("2027-02-01T00:00:00Z")).label, "2026-Q4");
});

test("portal progress wording", () => {
  assert.equal(
    volumeProgressMessage(3),
    "3 of 4 learners this quarter — one more and every learner this quarter moves to the volume rate.",
  );
  assert.match(volumeProgressMessage(0), /^0 of 4 .* 4 more and/);
  assert.match(volumeProgressMessage(5), /every learner this quarter is on the volume rate/);
});

// ─── Member saving ──────────────────────────────────────────────────────────

test("member saving: off by default, needs an allowed step AND its coupon", () => {
  const env = { STRIPE_MEMBER_SAVING_COUPON_5000: "coupon_50" };
  assert.deepEqual(resolveMemberSaving(0, env), { savingPence: 0, coupon: null });
  assert.deepEqual(resolveMemberSaving(undefined, env), { savingPence: 0, coupon: null });
  assert.deepEqual(resolveMemberSaving(5_000, env), { savingPence: 5_000, coupon: "coupon_50" });
  assert.deepEqual(resolveMemberSaving(2_500, env), { savingPence: 0, coupon: null }, "missing coupon → no saving, not a failure");
  assert.deepEqual(resolveMemberSaving(3_000, { STRIPE_MEMBER_SAVING_COUPON_3000: "x" }), { savingPence: 0, coupon: null }, "not a £25 step");
  assert.deepEqual(resolveMemberSaving(15_000, { STRIPE_MEMBER_SAVING_COUPON_15000: "x" }), { savingPence: 0, coupon: null }, "over £100");
  assert.equal(memberPricePence(5_000), 94_999);
});

// ─── ATP ────────────────────────────────────────────────────────────────────

const atp = (rung: string, prior = 0, terms = "payment_5") =>
  commissionForSale({ partnerSlug: "atp-felixstowe", terms, feePerLearnerPence: 50_000, rung, priorPif1099Count: prior });

test("ATP rungs, whatever ATP's terms", () => {
  for (const terms of ["payment_5", "ladder", "instalment_2"]) {
    assert.equal(atp("six_month", 0, terms), 50_000);
    assert.equal(atp("pif_1599", 0, terms), 50_000);
    assert.equal(atp("pif_1399", 0, terms), 50_000);
    assert.equal(atp("pif", 0, terms), 30_000);
    assert.equal(atp("monthly", 0, terms), 25_000);
  }
});

test("ATP500 (£1,099): £500 for the next three, then £400", () => {
  assert.equal(atp("pif_1099", 0), 50_000);
  assert.equal(atp("pif_1099", 1), 50_000);
  assert.equal(atp("pif_1099", 2), 50_000);
  assert.equal(atp("pif_1099", 3), 40_000);
  assert.equal(atpCommissionPence("pif_1099", 10), 40_000);
});

test("ATP is not on the volume rate", () => {
  assert.equal(volumeBonusPence("six_month"), 0);
  assert.equal(volumeBonusPence("pif_1099"), 0);
  const r = quarterTopUp([1, 2, 3, 4, 5].map((i) => sale(String(i), `2026-10-1${i}`, "pif_1399")), Q4);
  assert.equal(r.qualifies, true);
  assert.deepEqual(r.changes, []);
});

test("ATP with no rung (raw link fallback) keeps its fee", () => {
  assert.equal(commissionForSale({ partnerSlug: "atp-felixstowe", terms: "payment_5", feePerLearnerPence: 50_000, rung: null }), 50_000);
});

// ─── Member codes ───────────────────────────────────────────────────────────

test("codes: ATPPT and ATP500 on ATP only", () => {
  assert.deepEqual(resolveMemberCode("atp-felixstowe", "ATPPT"), { kind: "valid", code: "ATPPT", coupon: "buPzSnaF", offPence: 20_000, rung: "pif_1399" });
  assert.deepEqual(resolveMemberCode("atp-felixstowe", " atp 500 "), { kind: "valid", code: "ATP500", coupon: "vgLNHktz", offPence: 50_000, rung: "pif_1099" });
  assert.equal(ATP_LADDER.pif1599Pence - 20_000, 139_900);
  assert.equal(ATP_LADDER.pif1599Pence - 50_000, 109_900);
});

test("codes: anything else is invalid on ATP; nothing at all on any other gym", () => {
  for (const bad of ["ATP", "BF600", "atppt1", "__proto__", "constructor", "toString"]) {
    assert.deepEqual(resolveMemberCode("atp-felixstowe", bad), { kind: "invalid" }, bad);
  }
  assert.deepEqual(resolveMemberCode("atp-felixstowe", ""), { kind: "none" });
  assert.deepEqual(resolveMemberCode("atp-felixstowe", undefined), { kind: "none" });
  for (const gym of ["ebor", "ironwolf", "", null, undefined, "ATP-FELIXSTOWE"]) {
    assert.deepEqual(resolveMemberCode(gym, "ATPPT"), { kind: "none" }, String(gym));
    assert.deepEqual(resolveMemberCode(gym, "ATP500"), { kind: "none" }, String(gym));
  }
});

// ─── Release timing ─────────────────────────────────────────────────────────

test("ladder releases exactly like payment_5; legacy deposit keeps the 2nd-instalment rule", () => {
  for (let n = 0; n <= 10; n++) {
    assert.equal(commissionReleasedByPayment("ladder", "monthly", n), commissionReleasedByPayment("payment_5", "monthly", n), `monthly ${n}`);
    assert.equal(commissionReleasedByPayment("ladder", "legacy", n), commissionReleasedByPayment("payment_5", "legacy", n), `legacy ${n}`);
  }
  assert.equal(commissionReleasedByPayment("ladder", "monthly", 4), false);
  assert.equal(commissionReleasedByPayment("ladder", "monthly", 5), true);
  assert.equal(commissionReleasedByPayment("ladder", "legacy", 2), true);
  assert.equal(commissionHeldAtSale("ladder", true), true);
  assert.equal(commissionHeldAtSale("ladder", false), false);
  assert.equal(heldCommissionLabel("ladder"), "Releases after 5th payment");
  assert.equal(heldCommissionLabel("ladder", "six_month"), "Releases after 2nd instalment");
});

// ─── Paying it out ──────────────────────────────────────────────────────────

const NOW = Date.parse("2027-01-10T00:00:00Z");
const ps = (extra: Record<string, unknown>) => ({
  status: "confirmed", commission_pence: 40_000, commission_status: "accruing",
  commission_release_at: "2026-11-01T00:00:00Z", volume_bonus_pence: 0, volume_bonus_payout_id: null, ...extra,
});

test("payout: released commission + unpaid bonus are both payable", () => {
  const m = saleMoney(ps({ volume_bonus_pence: 10_000 }), NOW);
  assert.equal(m.payable, 50_000);
  assert.equal(m.payableCommission, 40_000);
  assert.equal(m.payableBonus, 10_000);
  assert.equal(m.earned, 50_000);
});

test("payout: a bonus landing on an already-paid sale is still payable, once", () => {
  const m = saleMoney(ps({ commission_status: "paid", volume_bonus_pence: 10_000 }), NOW);
  assert.equal(m.paid, 40_000);
  assert.equal(m.payable, 10_000);
  const settled = saleMoney(ps({ commission_status: "paid", volume_bonus_pence: 10_000, volume_bonus_payout_id: "po_1" }), NOW);
  assert.equal(settled.payable, 0);
  assert.equal(settled.paid, 50_000);
});

test("payout: a held sale holds its bonus too; voided pays nothing", () => {
  const held = saleMoney(ps({ commission_release_at: null, volume_bonus_pence: 5_000, commission_pence: 25_000 }), NOW);
  assert.equal(held.payable, 0);
  assert.equal(held.held, 30_000);
  assert.equal(saleMoney(ps({ commission_status: "voided", volume_bonus_pence: 10_000 }), NOW).earned, 0);
  assert.equal(saleMoney(ps({ status: "refunded" }), NOW).payable, 0);
});
