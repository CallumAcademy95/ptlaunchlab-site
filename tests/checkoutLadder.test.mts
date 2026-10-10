// tests/checkoutLadder.test.mts
//
// WHAT THIS PROTECTS
//
// The v4.1 ladder at checkout: what each request is allowed to buy, at what
// price, with which discount — decided server-side, never from the request.
//   - ATP's 6-month plan is the legacy deposit_instalments shape, and a deposit
//     is never sent to Stripe without its £200/month mandate.
//   - ATP's member codes work on ATP's £1,599 pay-in-full only.
//   - A gym's member saving applies to its own pay-in-full only, and only when
//     its coupon exists.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildSessionParams,
  resolveCheckout,
  depositHasMandate,
  ATP_PLANS,
  COURSE_PLANS,
  PIF_999_PRICE_ID,
  MONTHLY_999_PRICE_ID,
  DEPOSIT_599_PRICE_ID,
  PIF_1599_PRICE_ID,
  INSTALMENT_PRICE_ID,
  type ResolvedCheckout,
} from "../app/lib/stripeCheckout.ts";

type Meta = Record<string, string | undefined>;
const ATP = { gymSlug: "atp-felixstowe", gymReferral: "ATP Fitness Felixstowe", email: "a@b.com", name: "A B" };
const opts = { cancelPath: "/atp-felixstowe-academy/enrol" };

function ok(r: ResolvedCheckout) {
  assert.equal(r.ok, true, JSON.stringify(r));
  return r as Extract<ResolvedCheckout, { ok: true }>;
}
function params(r: ResolvedCheckout, input = ATP) {
  const o = ok(r);
  return buildSessionParams({ ...input, plan: o.plan }, o.config, { ...opts, rung: o.rung, discount: o.discount });
}

test("the ATP prices are the live £599 / £200 / £1,599 prices", () => {
  assert.equal(DEPOSIT_599_PRICE_ID, "price_1Rxmab99z9lThumnJ1f7EEXb");
  assert.equal(INSTALMENT_PRICE_ID, "price_1RxmdG99z9lThumnilf7YD2e");
  assert.equal(PIF_1599_PRICE_ID, "price_1SffDN99z9lThumnkdXLn1LW");
});

test("ATP 6-month plan: £599 now + £200/month after a 30-day trial, legacy metadata", () => {
  const p = params(resolveCheckout({ plan: "six_month", gymSlug: "atp-felixstowe" }, 0, {}));
  assert.equal(p.mode, "subscription");
  assert.deepEqual(p.line_items, [
    { price: DEPOSIT_599_PRICE_ID, quantity: 1 },
    { price: INSTALMENT_PRICE_ID, quantity: 1 },
  ]);
  const sub = p.subscription_data as { trial_period_days: number; metadata: Meta };
  assert.equal(sub.trial_period_days, 30);
  assert.equal(sub.metadata.ptll_plan, "deposit_instalments");
  assert.equal(sub.metadata.instalments_target, "5");
  assert.equal(sub.metadata.instalments_paid, "0");
  assert.equal(sub.metadata.entry_amount, "599");
  assert.equal(sub.metadata.contract_value, "1599");
  assert.equal(sub.metadata.gym_slug, "atp-felixstowe");
  assert.equal(sub.metadata.rung, "six_month");
  const m = p.metadata as Meta;
  assert.equal(m.plan, "deposit");
  assert.equal(m.rung, "six_month");
  assert.equal(m.contract_value_pence, "159900");
  assert.equal(m.instalments, "5");
  assert.equal(p.discounts, undefined);
  assert.equal(p.allow_promotion_codes, false);
  assert.equal(p.invoice_creation, undefined);
  assert.equal(depositHasMandate(p), true);
});

test("a deposit without its mandate is refused", () => {
  const good = params(resolveCheckout({ plan: "six_month", gymSlug: "atp-felixstowe" }, 0, {}));
  assert.equal(depositHasMandate({ ...good, mode: "payment" }), false);
  assert.equal(depositHasMandate({ ...good, line_items: [{ price: DEPOSIT_599_PRICE_ID, quantity: 1 }] }), false);
  assert.equal(depositHasMandate({ ...good, subscription_data: { metadata: { ptll_plan: "deposit_instalments", instalments_target: "5" } } }), false, "no trial");
  assert.equal(depositHasMandate({ ...good, line_items: [{ price: DEPOSIT_599_PRICE_ID }, { price: "price_other" }] }), false);
  // An empty instalment price (env misconfigured) is caught too.
  const noMandate = buildSessionParams({ ...ATP, plan: "six_month" }, { ...ATP_PLANS.six_month, instalmentPrice: "" }, opts);
  assert.equal(depositHasMandate(noMandate), false);
  // Non-deposits are not affected.
  assert.equal(depositHasMandate(buildSessionParams({ ...ATP, plan: "pif" }, COURSE_PLANS.pif, opts)), true);
});

test("ATP £1,599 in full, no code: £1,599, no discount", () => {
  const p = params(resolveCheckout({ plan: "pif_1599", gymSlug: "atp-felixstowe", memberCode: "" }, 0, {}));
  assert.equal(p.mode, "payment");
  assert.deepEqual(p.line_items, [{ price: PIF_1599_PRICE_ID, quantity: 1 }]);
  assert.equal(p.discounts, undefined);
  const m = p.metadata as Meta;
  assert.equal(m.rung, "pif_1599");
  assert.equal(m.plan, "PIF");
  assert.equal(m.contract_value, "1599.00");
});

test("ATPPT → coupon buPzSnaF, £1,399; ATP500 → coupon vgLNHktz, £1,099", () => {
  const a = params(resolveCheckout({ plan: "pif_1599", gymSlug: "atp-felixstowe", memberCode: "atppt" }, 0, {}));
  assert.deepEqual(a.discounts, [{ coupon: "buPzSnaF" }]);
  assert.equal(a.allow_promotion_codes, false);
  assert.equal((a.metadata as Meta).rung, "pif_1399");
  assert.equal((a.metadata as Meta).promo_code, "ATPPT");
  assert.equal((a.metadata as Meta).contract_value_pence, "139900");

  const b = params(resolveCheckout({ plan: "pif_1599", gymSlug: "atp-felixstowe", memberCode: "ATP500" }, 0, {}));
  assert.deepEqual(b.discounts, [{ coupon: "vgLNHktz" }]);
  assert.equal((b.metadata as Meta).rung, "pif_1099");
  assert.equal((b.metadata as Meta).contract_value_pence, "109900");
});

test("an unknown code on ATP's £1,599 is refused, not sold", () => {
  assert.deepEqual(resolveCheckout({ plan: "pif_1599", gymSlug: "atp-felixstowe", memberCode: "FREE" }, 0, {}), { ok: false, reason: "invalid-code" });
});

test("ATP's rungs and codes do not exist on any other gym or the main enrol page", () => {
  for (const gymSlug of ["ebor", "ironwolf", undefined, null, ""]) {
    for (const plan of ["six_month", "pif_1599"]) {
      assert.deepEqual(resolveCheckout({ plan, gymSlug, memberCode: "ATP500" }, 0, {}), { ok: false, reason: "unknown-plan" }, `${gymSlug} ${plan}`);
    }
    // A code on the standard plans is ignored entirely.
    const r = ok(resolveCheckout({ plan: "pif", gymSlug, memberCode: "ATP500" }, 0, {}));
    assert.equal(r.discount, null);
    const p = buildSessionParams({ plan: "pif", gymSlug: gymSlug ?? undefined }, r.config, { cancelPath: "/enrol", rung: r.rung, discount: r.discount });
    assert.equal(p.discounts, undefined);
    assert.equal((p.metadata as Meta).promo_code, undefined);
    assert.deepEqual(p.line_items, [{ price: PIF_999_PRICE_ID, quantity: 1 }]);
  }
});

test("ATP's standard rungs: £999.99 in full and 10 × £99.99, codes ignored", () => {
  const pif = params(resolveCheckout({ plan: "pif", gymSlug: "atp-felixstowe", memberCode: "ATPPT" }, 0, {}));
  assert.deepEqual(pif.line_items, [{ price: PIF_999_PRICE_ID, quantity: 1 }]);
  assert.equal(pif.discounts, undefined);
  assert.equal((pif.metadata as Meta).rung, "pif");
  const mo = params(resolveCheckout({ plan: "monthly", gymSlug: "atp-felixstowe", memberCode: "ATPPT" }, 0, {}));
  assert.deepEqual(mo.line_items, [{ price: MONTHLY_999_PRICE_ID, quantity: 1 }]);
  assert.equal(mo.discounts, undefined);
  assert.equal((mo.metadata as Meta).rung, "monthly");
});

test("member saving: pay-in-full only, only with its coupon, stamped for commission", () => {
  const env = { STRIPE_MEMBER_SAVING_COUPON_5000: "coupon_fifty" };
  const ebor = { gymSlug: "ebor", gymReferral: "Ebor", email: "x@y.com" };
  const r = ok(resolveCheckout({ plan: "pif", gymSlug: "ebor" }, 5_000, env));
  const p = buildSessionParams({ ...ebor, plan: "pif" }, r.config, { ...opts, rung: r.rung, discount: r.discount });
  assert.deepEqual(p.discounts, [{ coupon: "coupon_fifty" }]);
  assert.equal((p.metadata as Meta).member_saving_pence, "5000");
  assert.equal((p.metadata as Meta).contract_value_pence, "94999");
  assert.equal((p.metadata as Meta).rung, "pif");

  // Monthly never carries it.
  const m = ok(resolveCheckout({ plan: "monthly", gymSlug: "ebor" }, 5_000, env));
  assert.equal(m.discount, null);
  // No coupon configured → no saving, no failure.
  assert.equal(ok(resolveCheckout({ plan: "pif", gymSlug: "ebor" }, 2_500, env)).discount, null);
  // A gym with no saving set gets none.
  assert.equal(ok(resolveCheckout({ plan: "pif", gymSlug: "ebor" }, 0, env)).discount, null);
});

test("a discount passed for a subscription is dropped by the builder", () => {
  const p = buildSessionParams({ ...ATP, plan: "monthly" }, COURSE_PLANS.monthly, {
    ...opts, discount: { coupon: "x", offPence: 5_000 },
  });
  assert.equal(p.discounts, undefined);
  const d = buildSessionParams({ ...ATP, plan: "six_month" }, ATP_PLANS.six_month, {
    ...opts, discount: { coupon: "x", offPence: 5_000 },
  });
  assert.equal(d.discounts, undefined);
});

test("unknown plans are refused", () => {
  for (const plan of ["deposit", "sept99", "", null, "__proto__", "PIF"]) {
    assert.deepEqual(resolveCheckout({ plan, gymSlug: "atp-felixstowe" }, 0, {}), { ok: false, reason: "unknown-plan" }, String(plan));
  }
});
