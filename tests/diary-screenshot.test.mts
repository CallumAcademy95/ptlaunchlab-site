// WHAT THIS PROTECTS: a screenshot never becomes a guessed event. The model's
// JSON is validated; personal titles carry no names/numbers/emails; a missing
// date/time/end becomes a question Callum must answer; junk is rejected.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseExtraction, privacyTitle } from "../app/lib/diary/screenshot.ts";

const base = { type: "fixed", title: "Partner nails, driving", date: "2026-11-21", start: "14:00", end: "15:30",
  estimate_min: null, deadline: null, area: "Personal", category: "Fixed", questions: [] };

test("a complete fixed event parses with a [Personal] title", () => {
  const r = parseExtraction(JSON.stringify(base));
  assert.equal(r.ok, true);
  if (r.ok) { assert.equal(r.value.title, "[Personal] Partner nails, driving"); assert.deepEqual(r.value.questions, []); }
});
test("privacy: digits runs, emails and handles are stripped; max 6 words", () => {
  assert.equal(privacyTitle("Call Sarah 07700 900123 sarah@x.com @sarahfit about the gym booking tomorrow", "task"),
    "Call Sarah about the gym booking");
  assert.equal(privacyTitle("[Personal] Dentist", "fixed"), "[Personal] Dentist");
});
test("missing time or end on a fixed event becomes questions", () => {
  const r = parseExtraction(JSON.stringify({ ...base, start: null, end: null }));
  assert.ok(r.ok && r.value.questions.includes("What time does it start?") && r.value.questions.includes("What time does it finish?"));
});
test("a task missing estimate/deadline becomes questions", () => {
  const r = parseExtraction(JSON.stringify({ ...base, type: "task", title: "Send Imperium contract", date: null, start: null, end: null, category: "Admin", area: "PTLL" }));
  assert.ok(r.ok && r.value.questions.includes("How long will it take?") && r.value.questions.includes("When is it due?"));
});
test("bad dates/times and junk are rejected", () => {
  assert.equal(parseExtraction(JSON.stringify({ ...base, date: "21/11/2026" })).ok, false);
  assert.equal(parseExtraction(JSON.stringify({ ...base, start: "2pm" })).ok, false);
  assert.equal(parseExtraction("not json").ok, false);
  assert.equal(parseExtraction(undefined).ok, false);
});
