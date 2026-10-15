// tests/booking-validate.test.mts
//
// WHAT THIS PROTECTS
// - The public booking POST only accepts a known call type, an aligned future
//   instant, a real name/email/UK mobile, and the call type's own questions
//   (required ones present; multi-choice answers only from the list).
// - Callum's hours: HH:MM blocks, start before end, no midnight crossing.
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateBookingInput, normaliseUkPhone, validateRules, rulesFromRow } from "../app/lib/booking/validate.ts";

const good = {
  type: "consultation", startIso: "2026-10-21T13:30:00.000Z", name: "Mark Ryan", email: "Mark@Example.com",
  phone: "07700 900123", answers: { why: "Love training people", source: "Instagram" },
};

test("accepts a good consultation booking and normalises email/phone", () => {
  const r = validateBookingInput(good);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.value.email, "mark@example.com");
    assert.equal(r.value.phone, "+447700900123");
    assert.equal(r.value.callType, "consultation");
    assert.equal(r.value.t, null);
  }
});
test("rejects unknown type, missing required answer, bad email, bad phone, unaligned time", () => {
  assert.equal(validateBookingInput({ ...good, type: "webinar" }).ok, false);
  assert.equal(validateBookingInput({ ...good, answers: { why: "x" } }).ok, false);
  assert.equal(validateBookingInput({ ...good, email: "nope" }).ok, false);
  assert.equal(validateBookingInput({ ...good, phone: "123" }).ok, false);
  assert.equal(validateBookingInput({ ...good, startIso: "2026-10-21T13:31:00.000Z" }).ok, false);
});
test("gym multi-choice only allows listed choices", () => {
  const g = { ...good, type: "gym_partner", answers: { gym: "Iron Gym", interests: ["Hosting Learners"] } };
  assert.equal(validateBookingInput(g).ok, true);
  assert.equal(validateBookingInput({ ...g, answers: { gym: "Iron Gym", interests: ["Free money"] } }).ok, false);
});
test("UK phone normalisation", () => {
  assert.equal(normaliseUkPhone("07700 900123"), "+447700900123");
  assert.equal(normaliseUkPhone("+44 7700 900123"), "+447700900123");
  assert.equal(normaliseUkPhone("447700900123"), "+447700900123");
  assert.equal(normaliseUkPhone("12345"), null);
});
test("rules: valid blocks pass, bad ones fail", () => {
  const ok = { weeklyHours: { "1": [{ start: "09:30", end: "12:00" }] }, daysOff: [{ from: "2026-12-24", to: "2026-12-27" }], minNoticeMinutes: 240, horizonDays: 14, bufferMinutes: 15, maxPerDay: null };
  assert.equal(validateRules(ok).ok, true);
  assert.equal(validateRules({ ...ok, weeklyHours: { "1": [{ start: "12:00", end: "09:00" }] } }).ok, false);
  assert.equal(validateRules({ ...ok, weeklyHours: { "1": [{ start: "9:30", end: "12:00" }] } }).ok, false);
  assert.equal(validateRules({ ...ok, weeklyHours: { "7": [] } }).ok, false);
  assert.equal(validateRules({ ...ok, daysOff: [{ from: "2026-12-27", to: "2026-12-24" }] }).ok, false);
});
test("rulesFromRow gives safe defaults", () => {
  const r = rulesFromRow(null);
  assert.deepEqual(r, { weeklyHours: {}, daysOff: [], minNoticeMinutes: 240, horizonDays: 14, bufferMinutes: 15, maxPerDay: null });
});
test("UK phone with (0) trunk prefix after +44 normalises to dialable E.164", () => {
  assert.equal(normaliseUkPhone("+44 (0)7700 900123"), "+447700900123");
});
test("hostile long email is rejected quickly (length checked before regex)", () => {
  const started = performance.now();
  const r = validateBookingInput({ ...good, email: "a@" + ".".repeat(50000) });
  const elapsed = performance.now() - started;
  assert.equal(r.ok, false);
  assert.ok(elapsed < 200, `took ${elapsed.toFixed(1)} ms`);
});
test("phone string longer than 40 characters is rejected", () => {
  assert.equal(validateBookingInput({ ...good, phone: "07700900123" + " ".repeat(31) + "x" }).ok, false);
  assert.equal(validateBookingInput({ ...good, phone: "0".repeat(41) }).ok, false);
});
