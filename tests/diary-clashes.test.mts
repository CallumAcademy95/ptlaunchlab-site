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

const ov = (x: { start: number; end: number }, y: { start: number; end: number }) => x.start < y.end && y.start < x.end;
const DAY = "2026-11-17";
const at = (hhmm: string) => U(`${DAY}T${hhmm}:00Z`);

test("a clashed task's own old slot is free to it once its interval is removed from taken", () => {
  // The only Content window is the task's own 10:30-11:00 slot; it is listed in taken.
  const own: PlacedTask = { ...a, start: at("10:30"), end: at("11:00") };
  const win: PlacementCtx = { ...ctx, template: [{ day: 2, start: "10:30", end: "11:00", category: "Content", title: "Content batch" }], taken: [own] };
  const [p] = planMoves([own], win, { start: at("12:00"), end: at("13:00") });
  assert.equal(p.reason, null);
  assert.equal(p.to && iso(p.to.start), `${DAY}T10:30:00.000Z`);
});
test("a move avoids a real busy call that sits on the task's old slot", () => {
  const hit: PlacedTask = { ...a, start: at("10:30"), end: at("11:00") };
  const call = { start: at("10:30"), end: at("11:00") };
  const [p] = planMoves([hit], { ...ctx, busy: [call], taken: [hit] }, { start: 0, end: 0 });
  assert.equal(p.reason, null);
  assert.ok(p.to && !ov(p.to, call));
  assert.equal(p.to && iso(p.to.start), `${DAY}T11:00:00.000Z`);
});
test("two movable clashes land in different, non-overlapping slots", () => {
  const plans = planMoves([a, b], ctx, { start: at("13:00"), end: at("14:00") });
  assert.ok(plans.every((p) => p.to && p.reason === null));
  const [x, y] = plans.map((p) => p.to!);
  assert.equal(ov(x, y), false);
});
test("a Sales clash is processed before an earlier-starting Admin clash", () => {
  const sales: PlacedTask = { id: "s", title: "[Sales] S", category: "Sales", estimate_min: 30, deadline: "2026-11-20", start: at("10:30"), end: at("11:00") };
  const adm: PlacedTask = { id: "adm", title: "[Admin] X", category: "Admin", estimate_min: 30, deadline: "2026-11-20", start: at("10:00"), end: at("10:30") };
  const win: PlacementCtx = { ...ctx, template: [
    { day: 2, start: "10:30", end: "11:00", category: "Sales", title: "Sales block" },
    { day: 2, start: "11:00", end: "11:30", category: "Admin", title: "Admin block" },
  ] };
  const plans = planMoves([adm, sales], win, { start: at("12:00"), end: at("13:00") });
  assert.deepEqual(plans.map((p) => p.id), ["s", "adm"]);
  assert.equal(plans[0].to && iso(plans[0].to.start), `${DAY}T10:30:00.000Z`);
});
test("an Admin clash beats an earlier-starting Review clash for the one shared slot", () => {
  const rev: PlacedTask = { id: "r", title: "[Review] R", category: "Review", estimate_min: 30, deadline: "2026-11-20", start: at("10:00"), end: at("10:30") };
  const adm: PlacedTask = { id: "ad", title: "[Admin] A", category: "Admin", estimate_min: 30, deadline: "2026-11-20", start: at("10:30"), end: at("11:00") };
  const win: PlacementCtx = { ...ctx, template: [{ day: 2, start: "10:30", end: "11:00", category: "Admin", title: "Admin block" }] };
  const plans = planMoves([rev, adm], win, { start: at("12:00"), end: at("13:00") });
  assert.deepEqual(plans.map((p) => p.id), ["ad", "r"]);
  assert.equal(plans[0].to && iso(plans[0].to.start), `${DAY}T10:30:00.000Z`);
  assert.equal(plans[1].to, null);
});
test("touching boundaries are not clashes", () => {
  const before = { start: at("10:00"), end: a.start };
  const after = { start: a.end, end: at("11:30") };
  assert.deepEqual(findClashes(before, [a]), []);
  assert.deepEqual(findClashes(after, [a]), []);
});
test("an unmovable clash keeps its old slot: a later clash is not offered it", () => {
  // A has no estimate, so it cannot move and stays at 10:30-11:00. B (15 min) overlaps
  // the new event and its only candidate in the window, 10:30-10:45, sits inside A's slot.
  const A: PlacedTask = { id: "A", title: "[Content] A", category: "Content", estimate_min: 0, deadline: "2026-11-20", start: at("10:30"), end: at("11:00") };
  const B: PlacedTask = { id: "B", title: "[Content] B", category: "Content", estimate_min: 15, deadline: "2026-11-20", start: at("11:15"), end: at("11:30") };
  const win: PlacementCtx = { ...ctx, template: [{ day: 2, start: "10:30", end: "11:00", category: "Content", title: "Content batch" }] };
  const plans = planMoves([A, B], win, { start: at("10:50"), end: at("11:30") });
  assert.equal(plans[0].id, "A");
  assert.equal(plans[0].to, null);
  assert.equal(plans[1].id, "B");
  assert.equal(plans[1].to, null, "B must not be proposed into A's still-occupied slot");
});
