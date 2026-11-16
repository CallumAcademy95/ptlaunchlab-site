// WHAT THIS PROTECTS: "Lay out this week" turns the template into (open)
// blocks at London times and never duplicates a block that already exists.
import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutWeek } from "../app/lib/diary/template.ts";

const T = [
  { day: 1 as const, start: "09:00", end: "10:30", category: "Praxel" as const, title: "Praxel marking" },
  { day: 5 as const, start: "10:30", end: "12:00", category: "SEO" as const, title: "SEO" },
];
test("blocks at London wall-clock times with (open) summaries", () => {
  const out = layoutWeek(T, "2026-11-16", []);
  assert.deepEqual(out.map((e) => [e.summary, new Date(e.start).toISOString()]), [
    ["[Praxel] Praxel marking (open)", "2026-11-16T09:00:00.000Z"],
    ["[SEO] SEO (open)", "2026-11-20T10:30:00.000Z"],
  ]);
});
test("skips a block that already exists at that time", () => {
  const existing = [{ start: Date.parse("2026-11-16T09:00:00Z"), end: Date.parse("2026-11-16T10:30:00Z"), summary: "[Praxel] Praxel marking (open)" }];
  assert.equal(layoutWeek(T, "2026-11-16", existing).length, 1);
});
test("rejects a monday that is not a Monday", () => {
  assert.throws(() => layoutWeek(T, "2026-11-17", []), /Monday/);
});
test("BST: a 09:00 London block is 08:00Z", () => {
  const out = layoutWeek([{ day: 1, start: "09:00", end: "10:30", category: "Praxel", title: "Praxel marking" }], "2026-06-15", []);
  assert.equal(new Date(out[0].start).toISOString(), "2026-06-15T08:00:00.000Z");
});
