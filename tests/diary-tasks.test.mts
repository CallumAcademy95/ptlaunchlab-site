// WHAT THIS PROTECTS: the skills' task API validates every field against the
// table's rules before touching the DB, needs id or ref to update, and never
// reports ok without a row.
import { test } from "node:test";
import assert from "node:assert/strict";
import { handleTaskAction, type TaskDeps } from "../app/lib/diary/tasks-core.ts";

const row = { id: "00000000-0000-0000-0000-000000000001", ref: "T001", title: "x" } as never;
const deps = (over: Partial<TaskDeps> = {}): TaskDeps => ({
  async list() { return [row]; }, async insert() { return row; }, async update() { return row; }, ...over,
});
test("tasks lists with a status filter", async () => {
  let seen: unknown;
  const r = await handleTaskAction({ action: "tasks", status: ["inbox", "placed"] }, deps({ async list(f) { seen = f; return [row]; } }));
  assert.equal(r.status, 200); assert.deepEqual(seen, { status: ["inbox", "placed"] });
});
test("task-save inserts a valid new task", async () => {
  const r = await handleTaskAction({ action: "task-save", title: "Fix page", category: "SEO", estimate_min: 60, deadline: "2026-11-20" }, deps());
  assert.deepEqual(r.body, { ok: true, task: row });
});
test("task-save rejects bad values", async () => {
  for (const bad of [{ category: "Nope" }, { estimate_min: 2 }, { deadline: "20/11" }, { status: "later" }, { owner: "Bob" }]) {
    const r = await handleTaskAction({ action: "task-save", title: "x", category: "SEO", estimate_min: 30, ...bad }, deps());
    assert.equal(r.status, 400, JSON.stringify(bad));
  }
});
test("a new task needs title and category", async () => {
  assert.equal((await handleTaskAction({ action: "task-save", estimate_min: 30 }, deps())).status, 400);
});
test("update by ref; missing row is 404", async () => {
  const ok = await handleTaskAction({ action: "task-save", ref: "T001", status: "done" }, deps());
  assert.equal(ok.status, 200);
  const miss = await handleTaskAction({ action: "task-save", ref: "T999", status: "done" }, deps({ async update() { return null; } }));
  assert.equal(miss.status, 404);
});
test("DB failure is 502, never ok", async () => {
  const r = await handleTaskAction({ action: "tasks" }, deps({ async list() { throw new Error("db down"); } }));
  assert.equal(r.status, 502); assert.equal(r.body.ok, false);
});
const A = "2026-11-20T09:00:00Z", B = "2026-11-20T10:00:00Z";
test("insert needs estimate_min unless kind is fixed", async () => {
  const base = { action: "task-save", title: "x", category: "SEO" };
  assert.equal((await handleTaskAction(base, deps())).status, 400);
  assert.equal((await handleTaskAction({ ...base, estimate_min: null }, deps())).status, 400);
  assert.equal((await handleTaskAction({ ...base, kind: "fixed", start_at: A, end_at: B }, deps())).status, 200);
});
test("start_at and end_at are set together", async () => {
  const base = { action: "task-save", ref: "T001" };
  assert.equal((await handleTaskAction({ ...base, start_at: A }, deps())).status, 400);
  assert.equal((await handleTaskAction({ ...base, end_at: null }, deps())).status, 400);
  assert.equal((await handleTaskAction({ ...base, start_at: null, end_at: null }, deps())).status, 200);
});
test("end_at must be after start_at", async () => {
  const base = { action: "task-save", ref: "T001" };
  assert.equal((await handleTaskAction({ ...base, start_at: A, end_at: A }, deps())).status, 400);
  assert.equal((await handleTaskAction({ ...base, start_at: B, end_at: A }, deps())).status, 400);
  assert.equal((await handleTaskAction({ ...base, start_at: A, end_at: B }, deps())).status, 200);
});
test("an impossible deadline is a 400, not a Postgres error", async () => {
  const r = await handleTaskAction({ action: "task-save", title: "Fix page", category: "SEO", estimate_min: 60, deadline: "2026-02-31" }, deps());
  assert.equal(r.status, 400);
});
