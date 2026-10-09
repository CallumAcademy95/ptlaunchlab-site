// tests/checkoutPlans.test.mts
//
// WHAT THIS PROTECTS
//
// The October 2026 change-over: two ways to pay, one price for everyone.
//   - £999.99 in full: a one-off payment on the new pay-in-full price.
//   - 10 × £99.99: a subscription on the new monthly price, NO trial (the first
//     payment is taken at checkout), stamped so the webhook can stop it at 10.
// And no discount path at all — no `discounts`, no Stripe code box — whatever
// the request carries.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildSessionParams,
  COURSE_PLANS,
  PIF_999_PRICE_ID,
  MONTHLY_999_PRICE_ID,
  planFromChoice,
} from "../app/lib/stripeCheckout.ts";

type Meta = Record<string, string | undefined>;
const opts = { cancelPath: "/enrol" };
const base = { email: "A@B.com ", name: " A B ", gymSlug: "hitio-orpington", gymReferral: "HITIO" };

test("the live price ids are the new £999.99 / £99.99 prices", () => {
  // Env can override for e2e, but the unit run has no overrides set.
  assert.equal(PIF_999_PRICE_ID, "price_1UOg6999z9lThumnjHTU1rAt");
  assert.equal(MONTHLY_999_PRICE_ID, "price_1UOg6n99z9lThumnrwXTZ4w7");
  assert.equal(COURSE_PLANS.pif.checkoutPence, 99_999);
  assert.equal(COURSE_PLANS.monthly.checkoutPence, 9_999);
  assert.equal(COURSE_PLANS.monthly.contractPence, 99_990);
});

test("pay-in-full is a one-off payment of the £999.99 price", () => {
  const p = buildSessionParams({ ...base, plan: "pif" }, COURSE_PLANS.pif, opts);
  assert.equal(p.mode, "payment");
  assert.deepEqual(p.line_items, [{ price: PIF_999_PRICE_ID, quantity: 1 }]);
  assert.equal(p.subscription_data, undefined);
  assert.deepEqual(p.invoice_creation, { enabled: true });
  const m = p.metadata as Meta;
  assert.equal(m.plan, "PIF");
  assert.equal(m.contract_value, "999.99", "pence kept — never rounded to 1000");
  assert.equal(m.contract_value_pence, "99999");
  assert.equal(m.source, "api-checkout-session");
  assert.equal(m.ptll_product, "course");
  assert.equal(m.gym_slug, "hitio-orpington");
});

test("monthly is a subscription on the £99.99 price with no trial", () => {
  const p = buildSessionParams({ ...base, plan: "monthly" }, COURSE_PLANS.monthly, opts);
  assert.equal(p.mode, "subscription");
  assert.deepEqual(p.line_items, [{ price: MONTHLY_999_PRICE_ID, quantity: 1 }]);
  const sub = p.subscription_data as { metadata: Meta; trial_period_days?: number };
  assert.equal(sub.trial_period_days, undefined, "the first £99.99 is taken at checkout");
  assert.equal(sub.metadata.ptll_plan, "monthly_10");
  assert.equal(sub.metadata.payments_target, "10");
  assert.equal(sub.metadata.gym_slug, "hitio-orpington", "partner attribution survives on the subscription");
  assert.equal(sub.metadata.buyer_email, "a@b.com");
  assert.equal(p.invoice_creation, undefined, "Stripe rejects invoice_creation on a subscription");
  const m = p.metadata as Meta;
  assert.equal(m.plan, "monthly");
  assert.equal(m.contract_value_pence, "99990");
  assert.equal(m.payments, "10");
});

test("no session ever carries a discount or a code box", () => {
  for (const plan of ["pif", "monthly"] as const) {
    // A tampered request smuggling promo fields must change nothing.
    const input = { ...base, plan, promoCode: "BF600", promoCodeId: "promo_x" } as never;
    const p = buildSessionParams(input, COURSE_PLANS[plan], opts);
    assert.equal(p.discounts, undefined, `${plan}: no discounts`);
    assert.equal(p.allow_promotion_codes, false, `${plan}: no code box`);
    assert.equal((p.metadata as Meta).promo_code, undefined, `${plan}: no promo metadata`);
  }
});

test("only 'pif' and 'monthly' are plans", () => {
  assert.equal(planFromChoice("pif"), "pif");
  assert.equal(planFromChoice("monthly"), "monthly");
  for (const bad of ["deposit", "full", "sept99", "oct99", "bf2026", "", null, undefined, 1, "__proto__"]) {
    assert.equal(planFromChoice(bad), null, String(bad));
  }
});
