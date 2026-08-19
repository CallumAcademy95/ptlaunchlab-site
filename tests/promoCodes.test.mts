// tests/promoCodes.test.mts
//
// WHAT THIS PROTECTS
//
// Money. A partner's discount is now applied automatically at Stripe rather
// than typed in by the learner, so this function decides what someone pays.
//
// Three real properties of the live Stripe account drive these cases:
//
// 1. 18 code strings are DUPLICATED, each with exactly one active version and
//    an archived twin. Resolving to the archived one would apply a coupon that
//    no longer exists, or the wrong amount.
// 2. Launch codes are slot-capped — HITIO500 has 3 places, HITIO300 has 2 —
//    so exhaustion is a normal case, and the learner must be told at the box
//    rather than at the payment screen.
// 3. Codes are guessable from the pattern (GYMNGO500, XCELERATE500), and a cap
//    makes them worth guessing. A learner at one gym must not be able to burn
//    another gym's places.

import { test } from "node:test";
import assert from "node:assert/strict";
import { selectPromoCode, type StripePromotionCode } from "../app/lib/promoCodes.ts";

function code(over: Partial<StripePromotionCode> & { code: string; id: string }): StripePromotionCode {
  return {
    active: true,
    times_redeemed: 0,
    max_redemptions: null,
    coupon: { amount_off: 20000, valid: true },
    ...over,
  };
}

const HITIO_LIST: StripePromotionCode[] = [
  code({ id: "promo_standing", code: "HITIOPT", coupon: { amount_off: 20000, valid: true } }),
  code({ id: "promo_500", code: "HITIO500", max_redemptions: 3, coupon: { amount_off: 50000, valid: true } }),
  code({ id: "promo_300", code: "HITIO300", max_redemptions: 2, coupon: { amount_off: 30000, valid: true } }),
];

test("a live launch code resolves to its id and amount", () => {
  const r = selectPromoCode(HITIO_LIST, "HITIO500", ["HITIO"]);
  assert.deepEqual(r, { ok: true, promoId: "promo_500", code: "HITIO500", amountOffPence: 50000 });
});

test("the code is matched case-insensitively — learners type lowercase", () => {
  const r = selectPromoCode(HITIO_LIST, "hitio500", ["HITIO"]);
  assert.equal(r.ok && r.promoId, "promo_500");
});

test("another gym's code is refused even though it is perfectly valid", () => {
  // The whole point of the prefix check: HITIO500 has 3 places and is
  // guessable from the pattern. A Gym n Go learner must not burn one.
  const r = selectPromoCode(HITIO_LIST, "HITIO500", ["GYMNGO"]);
  assert.deepEqual(r, { ok: false, reason: "wrong-partner" });
});

test("a code nobody has is unknown", () => {
  assert.deepEqual(selectPromoCode(HITIO_LIST, "NOPE500", ["HITIO"]), { ok: false, reason: "unknown" });
});

test("a fully claimed launch code is refused as exhausted, not silently applied", () => {
  const list = [code({ id: "promo_500", code: "HITIO500", max_redemptions: 3, times_redeemed: 3 })];
  assert.deepEqual(selectPromoCode(list, "HITIO500", ["HITIO"]), { ok: false, reason: "exhausted" });
});

test("an uncapped code is never exhausted however often it is used", () => {
  const list = [code({ id: "promo_standing", code: "HITIOPT", max_redemptions: null, times_redeemed: 999 })];
  assert.equal(selectPromoCode(list, "HITIOPT", ["HITIO"]).ok, true);
});

test("the archived twin of a duplicated code is never resolved", () => {
  // 18 code strings in the live account have exactly this shape.
  const list = [
    code({ id: "promo_archived", code: "GYMNGO500", active: false, coupon: { amount_off: 50000, valid: true } }),
    code({ id: "promo_live", code: "GYMNGO500", active: true, max_redemptions: 3, coupon: { amount_off: 50000, valid: true } }),
  ];
  const r = selectPromoCode(list, "GYMNGO500", ["GYMNGO"]);
  assert.equal(r.ok && r.promoId, "promo_live");
});

test("an inactive code with no live twin is refused", () => {
  const list = [code({ id: "promo_dead", code: "HITIOPT", active: false })];
  assert.deepEqual(selectPromoCode(list, "HITIOPT", ["HITIO"]), { ok: false, reason: "inactive" });
});

test("a code whose coupon has gone invalid is refused", () => {
  const list = [code({ id: "promo_x", code: "HITIOPT", coupon: { amount_off: 20000, valid: false } })];
  assert.deepEqual(selectPromoCode(list, "HITIOPT", ["HITIO"]), { ok: false, reason: "inactive" });
});

test("a percentage coupon is refused — every coupon in the account is amount_off", () => {
  // Not supported on purpose. A percent coupon would make the displayed price
  // depend on maths we would have to duplicate from Stripe, and the button
  // label must equal what Stripe charges.
  const list = [code({ id: "promo_pct", code: "HITIOPT", coupon: { amount_off: null, valid: true } })];
  assert.deepEqual(selectPromoCode(list, "HITIOPT", ["HITIO"]), { ok: false, reason: "inactive" });
});

test("a gym with two prefixes accepts codes under both", () => {
  // Iron Wolf's standing code is IWGPTDISCOUNT but its launch codes are
  // IRONWOLF500/300 — verified live. A single prefix would refuse the gym its
  // own launch discount, which is precisely the bug this change exists to fix.
  const list = [
    code({ id: "promo_iwg", code: "IWGPTDISCOUNT" }),
    code({ id: "promo_iw500", code: "IRONWOLF500", max_redemptions: 3, coupon: { amount_off: 50000, valid: true } }),
    // A real, live code belonging to a DIFFERENT gym. Ownership is only
    // meaningfully tested against a code that actually exists — otherwise the
    // existence check answers first and the prefix check is never exercised.
    code({ id: "promo_hitio", code: "HITIO500", max_redemptions: 3, coupon: { amount_off: 50000, valid: true } }),
  ];
  assert.equal(selectPromoCode(list, "IWGPTDISCOUNT", ["IWG", "IRONWOLF"]).ok, true);
  assert.equal(selectPromoCode(list, "IRONWOLF500", ["IWG", "IRONWOLF"]).ok, true);
  assert.deepEqual(selectPromoCode(list, "HITIO500", ["IWG", "IRONWOLF"]), { ok: false, reason: "wrong-partner" });
});

test("whitespace around a pasted code does not break it", () => {
  assert.equal(selectPromoCode(HITIO_LIST, "  HITIO500 ", ["HITIO"]).ok, true);
});

test("an empty prefix does not match everything — the guard fails closed", () => {
  // Every string startsWith(""), so a blank entry in a partner's prefix config
  // would otherwise let any code in the account be used on their page. This is
  // the single enforcement point for slot-cap ownership, and it must fail closed.
  const list = [code({ id: "promo_x", code: "SOMECODE" })];
  assert.deepEqual(selectPromoCode(list, "SOMECODE", [""]), { ok: false, reason: "wrong-partner" });
  assert.deepEqual(selectPromoCode(list, "SOMECODE", ["  "]), { ok: false, reason: "wrong-partner" });
});

test("an empty prefix list refuses rather than allows", () => {
  const list = [code({ id: "promo_x", code: "SOMECODE" })];
  assert.deepEqual(selectPromoCode(list, "SOMECODE", []), { ok: false, reason: "wrong-partner" });
});
