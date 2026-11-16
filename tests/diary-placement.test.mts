// tests/diary-placement.test.mts
//
// WHAT THIS PROTECTS
// The CRM places Callum's tasks with the /plan-week rules: only inside a block
// of the task's category (or its alias), on or before the deadline, never over
// busy time or another placed task, never in the end-of-day buffer or the past,
// London wall-clock in both GMT and BST. When nothing fits it says why.
import { test } from "node:test";
import assert from "node:assert/strict";
import { proposeSlot, bufferStart, priorityOf, type PlacementCtx } from "../app/lib/diary/placement.ts";
import type { TemplateRow } from "../app/lib/diary/types.ts";

const T: TemplateRow[] = [
  { day: 2, start: "10:30", end: "12:00", category: "Content", title: "Content batch" },
  { day: 3, start: "10:30", end: "12:00", category: "Podcast", title: "Podcast" },
  { day: 4, start: "12:00", end: "13:00", category: "Sales", title: "Leads + must-do" },
  { day: 5, start: "12:00", end: "15:00", category: "Admin", title: "Admin overflow" },
];
const iso = (ms: number) => new Date(ms).toISOString();
const ctx = (over: Partial<PlacementCtx> = {}): PlacementCtx => ({
  template: T, bufferMin: 30, busy: [], taken: [], nowMs: Date.parse("2026-11-16T08:00:00Z"), fromDate: "2026-11-16", ...over,
});
const U = (s: string) => Date.parse(s);

test("first free slot in a same-category block before the deadline", () => {
  const r = proposeSlot({ category: "Content", estimate_min: 60, deadline: "2026-11-20" }, ctx());
  assert.equal(r.ok, true);
  if (r.ok) { assert.equal(iso(r.start), "2026-11-17T10:30:00.000Z"); assert.equal(iso(r.end), "2026-11-17T11:30:00.000Z"); assert.equal(r.blockTitle, "Content batch"); }
});
test("skips busy time and placed tasks", () => {
  const r = proposeSlot({ category: "Content", estimate_min: 30, deadline: "2026-11-20" }, ctx({
    busy: [{ start: U("2026-11-17T10:30:00Z"), end: U("2026-11-17T11:00:00Z") }],
    taken: [{ start: U("2026-11-17T11:00:00Z"), end: U("2026-11-17T11:30:00Z") }],
  }));
  assert.equal(r.ok && iso(r.start), "2026-11-17T11:30:00.000Z");
});
test("falls through to an alias block (Content -> Podcast) when its own is full", () => {
  const r = proposeSlot({ category: "Content", estimate_min: 60, deadline: "2026-11-20" }, ctx({
    busy: [{ start: U("2026-11-17T10:30:00Z"), end: U("2026-11-17T12:00:00Z") }],
  }));
  assert.equal(r.ok && iso(r.start), "2026-11-18T10:30:00.000Z");
});
test("respects the deadline and explains a no-fit", () => {
  const r = proposeSlot({ category: "Content", estimate_min: 60, deadline: "2026-11-16" }, ctx());
  assert.deepEqual(r, { ok: false, reason: "No free Content time of 60 min on or before 2026-11-16." });
});
test("never uses the end-of-day buffer on a full day", () => {
  assert.equal(iso(bufferStart("2026-11-20", 30)!), "2026-11-20T14:30:00.000Z");
  const r = proposeSlot({ category: "Admin", estimate_min: 60, deadline: "2026-11-20" }, ctx({
    busy: [{ start: U("2026-11-20T12:00:00Z"), end: U("2026-11-20T13:45:00Z") }],
  }));
  assert.deepEqual(r, { ok: false, reason: "No free Admin time of 60 min on or before 2026-11-20." });
});
test("Thursday's one hour has no buffer", () => {
  const r = proposeSlot({ category: "Sales", estimate_min: 60, deadline: "2026-11-19" }, ctx());
  assert.equal(r.ok && iso(r.start), "2026-11-19T12:00:00.000Z");
});
test("never in the past", () => {
  const r = proposeSlot({ category: "Content", estimate_min: 30, deadline: "2026-11-20" }, ctx({
    nowMs: U("2026-11-17T10:40:00Z"), fromDate: "2026-11-17",
  }));
  assert.equal(r.ok && iso(r.start), "2026-11-17T10:45:00.000Z");
});
test("London wall clock in BST", () => {
  const r = proposeSlot({ category: "Content", estimate_min: 30, deadline: "2026-06-05" }, ctx({
    nowMs: U("2026-06-01T07:00:00Z"), fromDate: "2026-06-01",
  }));
  assert.equal(r.ok && iso(r.start), "2026-06-02T09:30:00.000Z");
});
test("missing estimate or deadline, and Fixed, are refused with a reason", () => {
  assert.deepEqual(proposeSlot({ category: "Content", estimate_min: null, deadline: "2026-11-20" }, ctx()), { ok: false, reason: "Needs an estimate." });
  assert.deepEqual(proposeSlot({ category: "Content", estimate_min: 30, deadline: null }, ctx()), { ok: false, reason: "Needs a deadline." });
  assert.equal(proposeSlot({ category: "Fixed", estimate_min: 30, deadline: "2026-11-20" }, ctx()).ok, false);
});
test("priority order is revenue first", () => {
  assert.ok(priorityOf("Sales") < priorityOf("Outreach"));
  assert.ok(priorityOf("Praxel") < priorityOf("Content"));
  assert.ok(priorityOf("SEO") < priorityOf("Admin"));
});
