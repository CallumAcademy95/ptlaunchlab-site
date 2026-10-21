import { test } from "node:test";
import assert from "node:assert/strict";
import {
  startMonthOptions, isValidStartMonth, whatsappMessage, whatsappHref, bookingPrefill,
  validateNextStepBody, mergeNextStep, capiEventFor, showCommitmentCard,
} from "../app/lib/plannerNextStep.ts";

const OCT = new Date("2026-10-21T12:00:00Z");

test("start months: the next three calendar months in London time", () => {
  assert.deepEqual(startMonthOptions(OCT), [
    { value: "2026-10", label: "October" },
    { value: "2026-11", label: "November" },
    { value: "2026-12", label: "December" },
  ]);
});

test("start months roll over the year", () => {
  assert.deepEqual(startMonthOptions(new Date("2026-12-15T12:00:00Z")).map((o) => o.value), ["2026-12", "2027-01", "2027-02"]);
});

test("start months use London, not UTC, at the month boundary", () => {
  // 31 Mar 2027 23:30 UTC is 1 Apr 00:30 BST: London is already in April.
  assert.equal(startMonthOptions(new Date("2027-03-31T23:30:00Z"))[0].value, "2027-04");
});

test("isValidStartMonth accepts the options and not_sure, and tolerates a page left open across midnight", () => {
  assert.ok(isValidStartMonth("2026-11", OCT));
  assert.ok(isValidStartMonth("not_sure", OCT));
  assert.ok(isValidStartMonth("2026-10", new Date("2026-11-01T08:00:00Z")), "previous month still accepted for 2 days");
  assert.ok(!isValidStartMonth("2027-06", OCT));
  assert.ok(!isValidStartMonth("2026-1", OCT));
  assert.ok(!isValidStartMonth(42, OCT));
});

test("WhatsApp message quotes the plan and omits what the lead didn't give", () => {
  assert.equal(
    whatsappMessage({ startMonthLabel: "November", blocker: "cost" }),
    "Hi, I've just done my PT career plan. I'm aiming to start in November. My main worry is the cost. Can we talk it through?",
  );
  assert.equal(whatsappMessage({}), "Hi, I've just done my PT career plan. Can we talk it through?");
  assert.equal(whatsappMessage({ blocker: "other" }), "Hi, I've just done my PT career plan. Can we talk it through?");
  assert.match(whatsappMessage({ blocker: "confidence" }), /whether I'd be good enough/);
});

test("WhatsApp href encodes the message onto the base link", () => {
  assert.equal(whatsappHref("https://wa.me/447418609039", "Hi there?"), "https://wa.me/447418609039?text=Hi%20there%3F");
});

test("booking prefill fills both required consultation answers", () => {
  const p = bookingPrefill({ name: "Jane Smith", email: "j@x.co", phone: "+447700900000", why: "outgrown_job", blocker: "time" });
  assert.equal(p.name, "Jane Smith");
  assert.equal(p.answers.source, "Career Planner");
  assert.equal(p.answers.why, "I've outgrown my job. Biggest worry: finding the time.");
  assert.equal(bookingPrefill({ name: "A", email: "a@b.co", phone: "" }).answers.why, "");
});

test("validateNextStepBody: needs a token and at least one field, and only listed values", () => {
  assert.deepEqual(validateNextStepBody({ token: "t", priceFit: "yes" }, OCT), { ok: true, value: { token: "t", priceFit: "yes" } });
  assert.equal(validateNextStepBody({ token: "t" }, OCT).ok, false);
  assert.equal(validateNextStepBody({ priceFit: "yes" }, OCT).ok, false);
  assert.equal(validateNextStepBody({ token: "t", priceFit: "maybe" }, OCT).ok, false);
  assert.equal(validateNextStepBody({ token: "t", nextStep: "call" }, OCT).ok, false);
  assert.equal(validateNextStepBody({ token: "t", startMonth: "2030-01" }, OCT).ok, false);
  assert.equal(validateNextStepBody({ token: "t", booked: "yes" }, OCT).ok, false);
  assert.equal(validateNextStepBody({ token: "t", nextStep: "book", eventId: "x".repeat(101) }, OCT).ok, false);
  assert.deepEqual(validateNextStepBody({ token: "t", nextStep: "book", booked: true, eventId: "e1" }, OCT),
    { ok: true, value: { token: "t", nextStep: "book", booked: true, eventId: "e1" } });
  assert.equal(validateNextStepBody(null, OCT).ok, false);
});

test("mergeNextStep keeps the existing extra and earlier answers; latest wins", () => {
  const extra = { answers: { why: "freedom" }, band: "prime" };
  const a = mergeNextStep(extra, { token: "t", priceFit: "plan" }, "2026-10-21T12:00:00.000Z");
  assert.deepEqual(a, { answers: { why: "freedom" }, band: "prime", nextStep: { priceFit: "plan", updatedAt: "2026-10-21T12:00:00.000Z" } });
  const b = mergeNextStep(a, { token: "t", nextStep: "book", booked: true }, "2026-10-21T12:05:00.000Z");
  assert.deepEqual(b.nextStep, { priceFit: "plan", step: "book", stepAt: "2026-10-21T12:05:00.000Z", booked: true, bookedAt: "2026-10-21T12:05:00.000Z", updatedAt: "2026-10-21T12:05:00.000Z" });
  assert.deepEqual(mergeNextStep(null, { token: "t", startMonth: "not_sure" }, "z").nextStep, { startMonth: "not_sure", updatedAt: "z" });
});

test("CAPI mapping: booked → Schedule, WhatsApp → Contact, otherwise nothing", () => {
  assert.equal(capiEventFor({ token: "t", nextStep: "book", booked: true }), "Schedule");
  assert.equal(capiEventFor({ token: "t", nextStep: "book" }), null);
  assert.equal(capiEventFor({ token: "t", nextStep: "whatsapp" }), "Contact");
  assert.equal(capiEventFor({ token: "t", nextStep: "start" }), null);
  assert.equal(capiEventFor({ token: "t", priceFit: "yes" }), null);
});

test("commitment card shows for Prime and Strong only", () => {
  assert.equal(showCommitmentCard("prime"), true);
  assert.equal(showCommitmentCard("strong"), true);
  assert.equal(showCommitmentCard("nurture"), false);
});
