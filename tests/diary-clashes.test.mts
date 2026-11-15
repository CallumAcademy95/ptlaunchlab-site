// WHAT THIS PROTECTS: when a set-time item lands on placed tasks, the CRM
// finds exactly the overlapped tasks and proposes new slots that avoid the new
// item, each other, and everything else; unmovable ones carry a reason.
import { test } from "node:test";
import assert from "node:assert/strict";
import { findClashes, planMoves, type PlacedTask } from "../app/lib/diary/clashes.ts";
import type { PlacementCtx } from "../app/lib/diary/placement.ts";

const U = (s: string) => Date.parse(s);
const iso = (ms: number) => new Date(ms).toISOString();
const ctx: PlacementCtx = {
  template: [{ day: 2, start: "10:30", end: "12:00", category: "Content", title: "Content batch" }],
  bufferMin: 30, busy: [], taken: [], nowMs: U("2026-11-16T08:00:00Z"), fromDate: "2026-11-16",
};
const a: PlacedTask = { id: "a", title: "[Content] A", category: "Content", estimate_min: 30, deadline: "2026-11-20", start: U("2026-11-17T10:30:00Z"), end: U("2026-11-17T11:00:00Z") };
const b: PlacedTask = { id: "b", title: "[Content] B", category: "Content", estimate_min: 30, deadline: "2026-11-20", start: U("2026-11-17T11:00:00Z"), end: U("2026-11-17T11:30:00Z") };
const far: PlacedTask = { ...a, id: "far", start: U("2026-11-17T11:30:00Z"), end: U("2026-11-17T12:00:00Z") };

test("finds only overlapping tasks", () => {
  const ev = { start: U("2026-11-17T10:45:00Z"), end: U("2026-11-17T11:15:00Z") };
  assert.deepEqual(findClashes(ev, [a, b, far]).map((t) => t.id), ["a", "b"]);
});
test("moves avoid the new event and each other", () => {
  const ev = { start: U("2026-11-17T10:30:00Z"), end: U("2026-11-17T11:30:00Z") };
  const plans = planMoves([a, b], { ...ctx, taken: [far] }, ev);
  // only 10:30-12:00 Content exists that week; 10:30-11:30 is the new event, 11:30-12:00 is `far`
  assert.equal(plans.length, 2);
  assert.ok(plans.every((p) => p.to === null && p.reason));
});
test("a movable clash gets a slot that is not the new event", () => {
  const ev = { start: U("2026-11-17T10:30:00Z"), end: U("2026-11-17T11:00:00Z") };
  const [p] = planMoves([a], ctx, ev);
  assert.equal(p.to && iso(p.to.start), "2026-11-17T11:00:00.000Z");
  assert.equal(p.reason, null);
});
