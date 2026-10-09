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
  planKindForSale,
  isMonthlyPlanSale,
  contractTotalPence,
  formatGbp,
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

// ── October 2026: £999.99 in full, or 10 × £99.99 a month ────────────────────

test("£999.99 pay-in-full is a PIF, by metadata and by shape alone", () => {
  const sale = { mode: "payment", amountTotalPence: 99_999, metadataPlan: "PIF" };
  assert.equal(planKindForSale(sale), "PIF");
  assert.equal(outstandingBalancePence(sale), 0);
  assert.equal(planLabel(sale), "Pay in Full — £999.99", "never rounded to £1,000");
  // A raw-link £999.99 with no metadata is still above the deposit ceiling.
  assert.equal(planTypeForSale({ mode: "payment", amountTotalPence: 99_999 }), "PIF");
});

test("the monthly plan is classified by metadata, never by its £99.99 amount", () => {
  const sale = { mode: "subscription", amountTotalPence: 9_999, metadataPlan: "monthly" };
  assert.equal(isMonthlyPlanSale(sale), true);
  assert.equal(planKindForSale(sale), "monthly");
  // Binary sinks (pp_sales.plan_type, the Praxel invite) see a payment plan.
  assert.equal(planTypeForSale(sale), "deposit");
  assert.equal(planLabel(sale), "Pay Monthly — 10 × £99.99");
});

test("a £99.99 sale WITHOUT monthly metadata is not called monthly", () => {
  // The amount alone decides nothing: a £99 legacy entry and a £99.99 monthly
  // payment are a penny apart.
  assert.equal(isMonthlyPlanSale({ mode: "subscription", amountTotalPence: 9_999 }), false);
  assert.equal(planKindForSale({ mode: "subscription", amountTotalPence: 9_900, metadataPlan: "deposit" }), "deposit");
});

test("monthly outstanding balance is 9 × £99.99 after the first payment", () => {
  const sale = { mode: "subscription", amountTotalPence: 9_999, metadataPlan: "monthly", contractValuePence: 99_990 };
  assert.equal(contractTotalPence(sale), 99_990);
  assert.equal(outstandingBalancePence(sale), 89_991);
  // Unstamped monthly falls back to the monthly contract, not £1,599.
  assert.equal(contractTotalPence({ ...sale, contractValuePence: null }), 99_990);
});

test("formatGbp keeps pence: £999.99 and £99.99, and legacy whole pounds unchanged", () => {
  assert.equal(formatGbp(99_999), "£999.99");
  assert.equal(formatGbp(9_999), "£99.99");
  assert.equal(formatGbp(89_991), "£899.91");
  assert.equal(formatGbp(159_900), "£1,599");
  assert.equal(formatGbp(100_000), "£1,000");
});
