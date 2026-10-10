// tests/paymentPlans.test.mts
//
// WHAT THIS PROTECTS
//
// The instalment arithmetic that moves money and releases partner commission,
// for BOTH families of plan that are now live side by side:
//
//   monthly — 10 × £99.99, first taken at checkout (payment 1). Must stop after
//             exactly 10 paid payments.
//   legacy  — £599 (or £99) + 5 × £200 (or 5 × £300), still being paid by
//             learners who enrolled before October. Must behave exactly as
//             before: the deposit is not an instalment, 5 instalments end it.
//
// And partner commission release: 'payment_5' at the learner's 5th payment;
// 'instalment_2' and 'on_enrolment' unchanged for existing partners.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  countPaidInvoices,
  subscriptionPlanKind,
  planIsComplete,
  monthlyTarget,
  collectedPence,
  contractPence,
  legacyInstalmentPence,
  learnerPaymentsCleared,
  commissionReleasedByPayment,
  commissionHeldAtSale,
  heldCommissionLabel,
  type InvoiceListEntry,
} from "../app/lib/paymentPlans.ts";

const MONTHLY = "price_monthly_9999";
const LEGACY_200 = "price_legacy_200";
const LEGACY_300 = "price_october_300";
const DEPOSIT_599 = "price_deposit_599";
const LEGACY_SET = new Set([LEGACY_200, LEGACY_300]);
const MONTHLY_SET = new Set([MONTHLY]);

const inv = (status: string, lines: Array<[string, number]>): InvoiceListEntry => ({
  status,
  lines: { data: lines.map(([id, amount]) => ({ price: { id }, amount })) },
});

// ── Plan classification ──────────────────────────────────────────────────────

test("a subscription is classified by metadata first", () => {
  assert.equal(subscriptionPlanKind({ ptll_plan: "monthly_10" }, [], MONTHLY), "monthly");
  assert.equal(subscriptionPlanKind({ ptll_plan: "deposit_instalments" }, [LEGACY_200], MONTHLY), "legacy");
});

test("a monthly subscription missing its metadata is still caught by its price", () => {
  // The raw-Payment-Link safety net: an unrecognised 10 × £99.99 sub would bill forever.
  assert.equal(subscriptionPlanKind({}, [MONTHLY], MONTHLY), "monthly");
  assert.equal(subscriptionPlanKind(undefined, [MONTHLY], MONTHLY), "monthly");
});

test("a subscription that is not ours is left alone", () => {
  assert.equal(subscriptionPlanKind({}, ["price_gym_membership"], MONTHLY), null);
});

// ── Monthly plan: counting to 10 and stopping ────────────────────────────────

test("the monthly checkout invoice IS payment 1", () => {
  const invoices = [inv("paid", [[MONTHLY, 9_999]])];
  assert.equal(countPaidInvoices(invoices, MONTHLY_SET), 1);
});

test("monthly payments count up to 10 and the plan ends at exactly 10", () => {
  const invoices: InvoiceListEntry[] = [];
  for (let n = 1; n <= 10; n++) {
    invoices.push(inv("paid", [[MONTHLY, 9_999]]));
    const paid = countPaidInvoices(invoices, MONTHLY_SET);
    assert.equal(paid, n);
    assert.equal(planIsComplete(paid, monthlyTarget()), n === 10, `after payment ${n}`);
  }
  assert.equal(monthlyTarget(), 10);
  assert.equal(collectedPence("monthly", 10), 99_990);
  assert.equal(contractPence("monthly"), 99_990);
});

test("open, failed and void invoices do not count towards the 10", () => {
  const invoices = [
    inv("paid", [[MONTHLY, 9_999]]),
    inv("open", [[MONTHLY, 9_999]]),
    inv("void", [[MONTHLY, 9_999]]),
    inv("uncollectible", [[MONTHLY, 9_999]]),
  ];
  assert.equal(countPaidInvoices(invoices, MONTHLY_SET), 1);
});

test("a monthly count past 10 still ends the plan (stop on the way past, never miss it)", () => {
  assert.equal(planIsComplete(11, 10), true);
  assert.equal(planIsComplete(9, 10), false);
  assert.equal(planIsComplete(Number.NaN, 10), false, "an unknown count never ends a plan");
});

test("monthly prices never count as legacy instalments, and vice versa", () => {
  const invoices = [inv("paid", [[MONTHLY, 9_999]]), inv("paid", [[LEGACY_200, 20_000]])];
  assert.equal(countPaidInvoices(invoices, MONTHLY_SET), 1);
  assert.equal(countPaidInvoices(invoices, LEGACY_SET), 1);
});

// ── Legacy plans: unchanged ──────────────────────────────────────────────────

test("legacy: the deposit invoice (recurring line at £0 in trial) is not an instalment", () => {
  const invoices = [inv("paid", [[DEPOSIT_599, 59_900], [LEGACY_200, 0]])];
  assert.equal(countPaidInvoices(invoices, LEGACY_SET), 0);
});

test("legacy: 5 × £200 still counts to 5 and ends the plan", () => {
  const invoices = [inv("paid", [[DEPOSIT_599, 59_900], [LEGACY_200, 0]])];
  for (let n = 1; n <= 5; n++) invoices.push(inv("paid", [[LEGACY_200, 20_000]]));
  const paid = countPaidInvoices(invoices, LEGACY_SET);
  assert.equal(paid, 5);
  assert.equal(planIsComplete(paid, 5), true);
});

test("legacy: the October £300 instalment price is counted too", () => {
  const invoices = [inv("paid", [[DEPOSIT_599, 9_900], [LEGACY_300, 0]]), inv("paid", [[LEGACY_300, 30_000]])];
  assert.equal(countPaidInvoices(invoices, LEGACY_SET), 1);
});

test("legacy: newer API shape (pricing.price_details.price) is read", () => {
  const invoices: InvoiceListEntry[] = [
    { status: "paid", lines: { data: [{ amount: 20_000, pricing: { price_details: { price: LEGACY_200 } } }] } },
  ];
  assert.equal(countPaidInvoices(invoices, LEGACY_SET), 1);
});

test("legacy collected totals: £599 + n × £200, as the old hardcoded maths said", () => {
  const unstamped = {};
  assert.equal(collectedPence("legacy", 0, unstamped), 59_900);
  assert.equal(collectedPence("legacy", 2, unstamped), 99_900);
  assert.equal(collectedPence("legacy", 5, unstamped), 159_900);
  const standard = { entry_amount: "599", contract_value: "1599", instalments_target: "5" };
  assert.equal(collectedPence("legacy", 5, standard), 159_900);
  assert.equal(contractPence("legacy", standard), 159_900);
});

test("legacy collected totals: £99 entries and the £300 price are no longer wrong", () => {
  const sept = { entry_amount: "99", contract_value: "1099", instalments_target: "5" };
  assert.equal(legacyInstalmentPence(sept), 20_000);
  assert.equal(collectedPence("legacy", 2, sept), 49_900);
  const oct = { entry_amount: "99", contract_value: "1599", instalments_target: "5" };
  assert.equal(legacyInstalmentPence(oct), 30_000);
  assert.equal(collectedPence("legacy", 5, oct), 159_900);
});

// ── Partner commission release ───────────────────────────────────────────────

test("payment_5: monthly releases at the learner's 5th payment, checkout counted as 1", () => {
  for (let n = 1; n <= 10; n++) {
    assert.equal(commissionReleasedByPayment("payment_5", "monthly", n), n >= 5, `payment ${n}`);
  }
});

test("payment_5 on a legacy plan keeps the 2nd-instalment rule (v4.0 clause 5.4)", () => {
  // A gym moving to v4.0 must not delay commission on learners who enrolled
  // before 12 October 2026 on a deposit plan.
  assert.equal(learnerPaymentsCleared("legacy", 4), 5);
  assert.equal(commissionReleasedByPayment("payment_5", "legacy", 1), false);
  assert.equal(commissionReleasedByPayment("payment_5", "legacy", 2), true);
  assert.equal(commissionReleasedByPayment("payment_5", "legacy", 4), true);
});

test("instalment_2 on a legacy plan is unchanged: releases at the 2nd instalment", () => {
  assert.equal(commissionReleasedByPayment("instalment_2", "legacy", 1), false);
  assert.equal(commissionReleasedByPayment("instalment_2", "legacy", 2), true);
  assert.equal(commissionReleasedByPayment("instalment_2", "legacy", 5), true);
});

test("on_enrolment never releases by instalment — its date was set at enrolment", () => {
  for (let n = 0; n <= 10; n++) {
    assert.equal(commissionReleasedByPayment("on_enrolment", "legacy", n), false);
    assert.equal(commissionReleasedByPayment("on_enrolment", "monthly", n), false);
  }
});

test("unknown terms never release early", () => {
  assert.equal(commissionReleasedByPayment("something_new", "monthly", 10), false);
});

test("which sales start held: payment plans on instalment_2 / payment_5 only", () => {
  assert.equal(commissionHeldAtSale("payment_5", true), true);
  assert.equal(commissionHeldAtSale("instalment_2", true), true);
  assert.equal(commissionHeldAtSale("on_enrolment", true), false);
  assert.equal(commissionHeldAtSale("payment_5", false), false, "pay-in-full is dated (30 days) at sale");
  assert.equal(commissionHeldAtSale("instalment_2", false), false);
});

test("partner-facing held label names the right trigger", () => {
  assert.equal(heldCommissionLabel("payment_5"), "Releases after 5th payment");
  assert.equal(heldCommissionLabel("instalment_2"), "Releases after 2nd instalment");
  assert.equal(heldCommissionLabel(undefined), "Releases after 2nd instalment");
});
