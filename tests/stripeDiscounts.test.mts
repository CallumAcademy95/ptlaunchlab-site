// tests/stripeDiscounts.test.mts
//
// WHAT THIS PROTECTS
//
// The two money rules that cannot be allowed to drift.
//
// 1. A DEPOSIT IS NEVER DISCOUNTED. The webhook has said so since 2026-07-26
//    ("deposit plans take the full £1,599 over 5 instalments; the promo
//    discount applies to pay-in-full only"), but the front end contradicted it
//    and promised £1,399 while Stripe billed £1,599. Enforcing it here rather
//    than in the UI means a future page cannot reintroduce that.
// 2. A SESSION NEVER CARRIES BOTH `discounts` AND `allow_promotion_codes`.
//    Stripe rejects such a session outright, so getting this wrong does not
//    mis-price anything — it takes checkout down completely.

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSessionParams, PAYMENT_LINK_PRICES } from "../app/lib/stripeCheckout.ts";

const PIF = PAYMENT_LINK_PRICES["https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f"];
const DEPOSIT = PAYMENT_LINK_PRICES["https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05"];

const base = { paymentLink: "x", email: "a@b.com", name: "A B", gymSlug: "hitio-orpington" };
const opts = { withInstalments: false, target: 5, cancelPath: "/enrol" };

test("a pay-in-full session with a promo id carries the discount", () => {
  const p = buildSessionParams({ ...base, promoCodeId: "promo_500" }, PIF, opts);
  assert.deepEqual(p.discounts, [{ promotion_code: "promo_500" }]);
});

test("a discounted session must not also offer Stripe's own code box", () => {
  // Stripe rejects a session carrying both. This is also what makes the
  // double-entry confusion structurally impossible rather than just reworded.
  const p = buildSessionParams({ ...base, promoCodeId: "promo_500" }, PIF, opts);
  assert.equal(p.allow_promotion_codes, false);
});

test("a pay-in-full session with no promo keeps Stripe's code box", () => {
  const p = buildSessionParams({ ...base }, PIF, opts);
  assert.equal(p.discounts, undefined);
  assert.equal(p.allow_promotion_codes, true);
});

test("A DEPOSIT IS NEVER DISCOUNTED, even when a promo id is passed", () => {
  const p = buildSessionParams(
    { ...base, promoCodeId: "promo_500" },
    DEPOSIT,
    { ...opts, withInstalments: true },
  );
  assert.equal(p.discounts, undefined, "a deposit must never carry a discount");
  assert.equal(p.allow_promotion_codes, false);
});

test("a deposit with no promo is unchanged", () => {
  const p = buildSessionParams({ ...base }, DEPOSIT, { ...opts, withInstalments: true });
  assert.equal(p.discounts, undefined);
  assert.equal(p.allow_promotion_codes, false);
});

test("the promo code string still reaches metadata for the webhook", () => {
  // The webhook reads metadata.promo_code in six places — ops sheet, admin
  // email, partner attribution. Applying the discount must not replace it.
  const p = buildSessionParams(
    { ...base, promoCodeId: "promo_500", promoCode: "HITIO500" },
    PIF,
    opts,
  );
  assert.equal((p.metadata as Record<string, unknown>).promo_code, "HITIO500");
});
