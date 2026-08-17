// Run: npm run test:unit
//
// WHAT THIS PROTECTS
//
// Whether a course sale is a DEPOSIT or a PAY-IN-FULL. Getting it wrong is not
// cosmetic: "deposit" is what arms the 🚨 missing-mandate alarm, tells the
// learner what they bought, and sets plan_type in the ops Sheet.
//
// It has been got wrong twice by the same mistake — testing the AMOUNT. A gym
// partner pay-in-full is £1,099 (£500 off) or £1,299 (£300 off), both under the
// £1,300 line that used to be used, so a learner who owes nothing gets called a
// deposit. It mislabelled 8 of 9 gym rows in the Sheet tracker (fixed
// 2026-07-28) and on 2026-08-17 emailed admin "£1,000 uncollected" about a
// settled £1,099 sale, and told that buyer she was on a deposit plan.
//
// So: every case below fixes the SHAPE of the sale as the thing that decides,
// and the £1,099 cases are the regression guards.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  planTypeForSale,
  isDepositSale,
  outstandingBalancePence,
  planLabel,
} from "../app/lib/coursePlan.ts";

// ── The bug: a discounted partner pay-in-full ───────────────────────────────

test("£1,099 partner pay-in-full is a PIF, not a deposit", () => {
  const sale = { mode: "payment", amountTotalPence: 109_900, metadataPlan: "PIF" };
  assert.equal(planTypeForSale(sale), "PIF");
  assert.equal(isDepositSale(sale), false);
});

test("a settled £1,099 pay-in-full has nothing left to collect", () => {
  // The alarm used to announce a hardcoded "£1,000 uncollected" here.
  assert.equal(
    outstandingBalancePence({ mode: "payment", amountTotalPence: 109_900, metadataPlan: "PIF" }),
    0,
  );
});

test("the learner is told pay-in-full, not deposit", () => {
  assert.equal(
    planLabel({ mode: "payment", amountTotalPence: 109_900, metadataPlan: "PIF" }),
    "Pay in Full — £1,099",
  );
});

test("£1,099 on a raw Payment Link, with no metadata, is still a PIF", () => {
  // Sales made before metadata.plan shipped, and any that fall back to the raw
  // link, carry nothing to trust — the £700 deposit ceiling has to hold.
  assert.equal(planTypeForSale({ mode: "payment", amountTotalPence: 109_900 }), "PIF");
});

test("£1,299 and £1,399 partner pay-in-fulls are PIFs", () => {
  assert.equal(planTypeForSale({ mode: "payment", amountTotalPence: 129_900 }), "PIF");
  assert.equal(planTypeForSale({ mode: "payment", amountTotalPence: 139_900 }), "PIF");
});

// ── What must keep working: real deposits ────────────────────────────────────

test("a £599 one-off with no mandate is still a deposit — the alarm must survive", () => {
  // This is the case the missing-mandate alarm exists for: checkout fell back to
  // the raw link, so no £200/month was set up and £1,000 really is uncollectable.
  const sale = { mode: "payment", amountTotalPence: 59_900, metadataPlan: "deposit" };
  assert.equal(planTypeForSale(sale), "deposit");
  assert.equal(outstandingBalancePence(sale), 100_000);
});

test("a £599 subscription is a deposit plan with the mandate attached", () => {
  const sale = { mode: "subscription", amountTotalPence: 59_900, metadataPlan: "deposit" };
  assert.equal(planTypeForSale(sale), "deposit");
  assert.equal(outstandingBalancePence(sale), 100_000);
});

test("mode=subscription outranks a stale metadata.plan", () => {
  // A mandate on the session means a deposit plan whatever the metadata claims.
  assert.equal(
    planTypeForSale({ mode: "subscription", amountTotalPence: 59_900, metadataPlan: "PIF" }),
    "deposit",
  );
});

test("a £599 deposit is labelled as one", () => {
  assert.equal(
    planLabel({ mode: "payment", amountTotalPence: 59_900, metadataPlan: "deposit" }),
    "Deposit — £599",
  );
});
