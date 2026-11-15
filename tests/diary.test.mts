// tests/diary.test.mts
//
// WHAT THIS PROTECTS
// The PA diary route (app/api/admin/diary) may only ever touch events it made
// itself, must keep work blocks "show as free" so the public booking pages keep
// their call slots, must make personal appointments busy, must fail closed on
// auth, and must never report ok:true without an effect.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkDiaryAuth, isoWeek, diaryEventBody, isDiaryEvent, handleDiary, DIARY_TAG,
  type DiaryDeps, type GEvent, type DiaryEventBody,
} from "../app/lib/diary/diary-core.ts";

const SECRET = "x".repeat(40);

test("auth: unset or short secret is unconfigured (fail closed)", () => {
  assert.equal(checkDiaryAuth(`Bearer ${SECRET}`, undefined), "unconfigured");
  assert.equal(checkDiaryAuth("Bearer short", "short"), "unconfigured");
});
test("auth: wrong, missing or malformed header is unauthorised", () => {
  assert.equal(checkDiaryAuth(null, SECRET), "unauthorised");
  assert.equal(checkDiaryAuth(SECRET, SECRET), "unauthorised");
  assert.equal(checkDiaryAuth(`Bearer ${"y".repeat(40)}`, SECRET), "unauthorised");
});
test("auth: exact bearer is ok", () => {
  assert.equal(checkDiaryAuth(`Bearer ${SECRET}`, SECRET), "ok");
});

test("isoWeek matches ISO 8601", () => {
  assert.equal(isoWeek(new Date("2026-11-16T09:00:00Z")), "2026-W47");
  assert.equal(isoWeek(new Date("2026-11-22T12:00:00Z")), "2026-W47");
  assert.equal(isoWeek(new Date("2026-11-23T09:00:00Z")), "2026-W48");
  assert.equal(isoWeek(new Date("2021-01-03T12:00:00Z")), "2020-W53");
});

test("block and task are transparent, fixed is opaque, all tagged", () => {
  const base = { summary: "[Content] Batch", start: "2026-11-17T10:30:00Z", end: "2026-11-17T12:00:00Z" };
  for (const kind of ["block", "task"] as const) assert.equal(diaryEventBody({ ...base, kind }).transparency, "transparent");
  const fixed = diaryEventBody({ ...base, kind: "fixed" });
  assert.equal(fixed.transparency, "opaque");
  assert.deepEqual(fixed.extendedProperties.private, { [DIARY_TAG]: "1", ptllKind: "fixed", ptllWeek: "2026-W47" });
  assert.equal(fixed.start.timeZone, "Europe/London");
});

test("isDiaryEvent only for tagged events", () => {
  assert.equal(isDiaryEvent({ id: "a", extendedProperties: { private: { [DIARY_TAG]: "1" } } }), true);
  assert.equal(isDiaryEvent({ id: "b" }), false);
  assert.equal(isDiaryEvent(null), false);
});

// ---- handler with fake deps ----
function fakeDeps(events: GEvent[] = [], pushSent = 1) {
  const calls: string[] = [];
  const deps: DiaryDeps = {
    async busy() { calls.push("busy"); return [{ start: "2026-11-17T11:00:00.000Z", end: "2026-11-17T11:30:00.000Z" }]; },
    async listTagged(_f, _t, week) { calls.push(`list:${week ?? ""}`); return events; },
    async get(id) { calls.push(`get:${id}`); return events.find((e) => e.id === id) ?? null; },
    async insert(_b: DiaryEventBody) { calls.push("insert"); return "new-id"; },
    async patch(id) { calls.push(`patch:${id}`); },
    async remove(id) { calls.push(`remove:${id}`); },
    async push() { calls.push("push"); return { sent: pushSent }; },
  };
  return { deps, calls };
}
const mine: GEvent = { id: "mine", summary: "[SEO] fix", start: { dateTime: "2026-11-20T10:00:00Z" }, end: { dateTime: "2026-11-20T11:00:00Z" }, extendedProperties: { private: { [DIARY_TAG]: "1", ptllKind: "task", ptllWeek: "2026-W47" } } };
const theirs: GEvent = { id: "theirs", summary: "PTLL call: Lead", extendedProperties: { private: {} } };

test("bad body is 400 and touches nothing", async () => {
  const { deps, calls } = fakeDeps();
  const r = await handleDiary({ action: "create", summary: "", start: "nope", end: "nope", kind: "task" }, deps);
  assert.equal(r.status, 400); assert.equal(r.body.ok, false); assert.deepEqual(calls, []);
});
test("times without an offset are rejected", async () => {
  const { deps } = fakeDeps();
  const r = await handleDiary({ action: "busy", from: "2026-11-16T09:00:00", to: "2026-11-16T17:00:00" }, deps);
  assert.equal(r.status, 400);
});
test("end before start is 400", async () => {
  const { deps } = fakeDeps();
  const r = await handleDiary({ action: "create", summary: "x", start: "2026-11-17T12:00:00Z", end: "2026-11-17T11:00:00Z", kind: "task" }, deps);
  assert.equal(r.status, 400);
});
test("create returns the new id", async () => {
  const { deps, calls } = fakeDeps();
  const r = await handleDiary({ action: "create", summary: "[Admin] Stripe", start: "2026-11-20T09:30:00Z", end: "2026-11-20T10:00:00Z", kind: "task" }, deps);
  assert.equal(r.status, 200); assert.deepEqual(r.body, { ok: true, id: "new-id" }); assert.deepEqual(calls, ["insert"]);
});
test("move and delete refuse an event the diary did not create", async () => {
  const { deps, calls } = fakeDeps([mine, theirs]);
  const m = await handleDiary({ action: "move", id: "theirs", start: "2026-11-20T10:00:00Z", end: "2026-11-20T11:00:00Z" }, deps);
  const d = await handleDiary({ action: "delete", id: "theirs" }, deps);
  assert.equal(m.status, 403); assert.equal(d.status, 403);
  assert.ok(!calls.some((c) => c.startsWith("patch") || c.startsWith("remove")));
});
test("move re-tags the week of the new time", async () => {
  let patched: unknown;
  const { deps } = fakeDeps([mine]);
  deps.patch = async (_id, body) => { patched = body; };
  const r = await handleDiary({ action: "move", id: "mine", start: "2026-11-24T10:00:00Z", end: "2026-11-24T11:00:00Z" }, deps);
  assert.equal(r.status, 200);
  assert.equal((patched as DiaryEventBody).extendedProperties.private.ptllWeek, "2026-W48");
});
test("missing event is 404", async () => {
  const { deps } = fakeDeps([]);
  assert.equal((await handleDiary({ action: "delete", id: "gone" }, deps)).status, 404);
});
test("delete-week removes only tagged events of that week", async () => {
  const otherWeek: GEvent = { ...mine, id: "w48", extendedProperties: { private: { [DIARY_TAG]: "1", ptllWeek: "2026-W48" } } };
  const { deps, calls } = fakeDeps([mine, theirs, otherWeek]);
  const r = await handleDiary({ action: "delete-week", week: "2026-W47" }, deps);
  assert.deepEqual(r.body, { ok: true, deleted: ["mine"] });
  assert.deepEqual(calls.filter((c) => c.startsWith("remove")), ["remove:mine"]);
});
test("list returns only tagged events, summarised", async () => {
  const { deps } = fakeDeps([mine, theirs]);
  const r = await handleDiary({ action: "list", from: "2026-11-16T00:00:00Z", to: "2026-11-23T00:00:00Z" }, deps);
  assert.deepEqual(r.body, { ok: true, events: [{ id: "mine", summary: "[SEO] fix", start: "2026-11-20T10:00:00Z", end: "2026-11-20T11:00:00Z", kind: "task", week: "2026-W47" }] });
});
test("range over 31 days is 400", async () => {
  const { deps } = fakeDeps();
  assert.equal((await handleDiary({ action: "busy", from: "2026-11-01T00:00:00Z", to: "2026-12-15T00:00:00Z" }, deps)).status, 400);
});
test("notify with zero devices is not ok", async () => {
  const { deps } = fakeDeps([], 0);
  const r = await handleDiary({ action: "notify", title: "Brief", body: "Top 3" }, deps);
  assert.equal(r.status, 502); assert.equal(r.body.ok, false);
});
test("a Google failure is 502, never ok", async () => {
  const { deps } = fakeDeps();
  deps.insert = async () => { throw new Error("Google event insert timed out"); };
  const r = await handleDiary({ action: "create", summary: "x", start: "2026-11-20T09:30:00Z", end: "2026-11-20T10:00:00Z", kind: "block" }, deps);
  assert.equal(r.status, 502); assert.match(String(r.body.error), /timed out/);
});
