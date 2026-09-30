// tests/payoutRules.test.mts
//
// WHAT THIS PROTECTS
//
// The demo tenant (Northgate Strength) carries invented sales so a
// walkthrough looks like a going concern: £4,000 of commission "earned",
// £2,000 "paid", £1,500 sitting payable. The admin page excluded it from
// every total — and then rendered a live "Mark £1,500 paid" button on its
// row, wired to an action that never checked.
//
// One click would have written a real pp_payouts row and flipped real
// pp_sales rows to paid against money nobody earned, putting fake payments
// into the payout history the real ones are read from.
import { test } from "node:test";
import assert from "node:assert/strict";
import { canBePaid, payoutRefusalReason } from "../app/lib/security/payoutRules.ts";

test("the demo tenant can never be marked paid", () => {
  assert.equal(canBePaid({ is_demo: true }), false);
  assert.match(payoutRefusalReason({ is_demo: true }) ?? "", /demo/i);
});

test("a real partner can be paid", () => {
  assert.equal(canBePaid({ is_demo: false, status: "active" }), true);
  assert.equal(payoutRefusalReason({ is_demo: false }), null);
});

test("a partner row with no is_demo column value is treated as real", () => {
  // The column is optional on some reads. Defaulting to "blocked" would stop
  // real payouts; defaulting to "real" is correct, and the demo tenant always
  // has the flag set.
  assert.equal(canBePaid({}), true);
  assert.equal(canBePaid({ is_demo: null }), true);
});

test("the refusal gives a reason, not just a no", () => {
  // The page and the action must say the same thing, so the reason lives with
  // the rule rather than being written twice.
  const reason = payoutRefusalReason({ is_demo: true });
  assert.ok(reason && reason.length > 20, "refusal must explain itself");
  assert.doesNotMatch(reason, /error|failed/i, "this is a rule, not a failure");
});
