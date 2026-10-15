// tests/booking-slots.test.mts
//
// WHAT THIS PROTECTS
// Which 30-min times a lead is offered: weekly hours (London wall time),
// days off, minimum notice, horizon, buffer around both CRM bookings and
// Google busy time, max calls per day, and the 25 Oct 2026 clock change.
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeSlots, isSlotFree, type Rules } from "../app/lib/booking/slots.ts";

const iso = (xs: number[]) => xs.map((x) => new Date(x).toISOString().slice(11, 16));
const base: Rules = { weeklyHours: { "1": [{ start: "09:00", end: "11:00" }] }, daysOff: [], minNoticeMinutes: 0, horizonDays: 1, bufferMinutes: 0, maxPerDay: null };
const MON_0700_BST = Date.parse("2026-10-19T06:00:00Z");
const iv = (a: string, b: string) => ({ start: Date.parse(a), end: Date.parse(b) });

test("Monday 09:00-11:00 London (BST) gives four 30-min starts in UTC", () => {
  assert.deepEqual(iso(computeSlots(base, [], [], MON_0700_BST)), ["08:00", "08:30", "09:00", "09:30"]);
});
test("minimum notice drops starts that are too soon", () => {
  assert.deepEqual(iso(computeSlots({ ...base, minNoticeMinutes: 150 }, [], [], MON_0700_BST)), ["08:30", "09:00", "09:30"]);
});
test("buffer keeps 15 min clear either side of a CRM booking", () => {
  const booked = [iv("2026-10-19T08:30:00Z", "2026-10-19T09:00:00Z")];
  assert.deepEqual(iso(computeSlots({ ...base, bufferMinutes: 15 }, [], booked, MON_0700_BST)), ["09:30"]);
});
test("Google busy time blocks the same way", () => {
  const busy = [iv("2026-10-19T08:10:00Z", "2026-10-19T08:20:00Z")];
  assert.deepEqual(iso(computeSlots(base, busy, [], MON_0700_BST)), ["08:30", "09:00", "09:30"]);
});
test("a day off removes the day", () => {
  assert.deepEqual(computeSlots({ ...base, daysOff: [{ from: "2026-10-19", to: "2026-10-19" }] }, [], [], MON_0700_BST), []);
});
test("max calls per day: a full day offers nothing", () => {
  const booked = [iv("2026-10-19T15:00:00Z", "2026-10-19T15:30:00Z")];
  assert.deepEqual(computeSlots({ ...base, maxPerDay: 1 }, [], booked, MON_0700_BST), []);
});
test("horizon: 1 day is today only, 8 days reaches next Monday", () => {
  assert.equal(computeSlots(base, [], [], MON_0700_BST).length, 4);
  assert.equal(computeSlots({ ...base, horizonDays: 8 }, [], [], MON_0700_BST).length, 8);
});
test("after the clocks go back, 09:00 London is 09:00 UTC", () => {
  const now = Date.parse("2026-10-25T00:00:00Z");
  assert.deepEqual(iso(computeSlots({ ...base, horizonDays: 2 }, [], [], now)), ["09:00", "09:30", "10:00", "10:30"]);
});
test("past times today are never offered", () => {
  const now = Date.parse("2026-10-19T09:10:00Z");
  assert.deepEqual(iso(computeSlots(base, [], [], now)), ["09:30"]);
});
test("isSlotFree agrees with computeSlots", () => {
  assert.equal(isSlotFree(base, [], [], MON_0700_BST, Date.parse("2026-10-19T08:30:00Z")), true);
  assert.equal(isSlotFree(base, [], [], MON_0700_BST, Date.parse("2026-10-19T08:15:00Z")), false);
});
