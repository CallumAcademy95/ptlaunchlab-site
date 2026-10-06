// tests/careerPlannerEmail.test.mts
// WHAT THIS PROTECTS: the email must not promise £200 (the promo is a browser
// cookie and may not apply on another device) and must not forecast income.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCareerPlanEmail } from "../app/lib/careerPlannerEmail.ts";
import { computeCareerPlanV2 } from "../app/lib/careerPlannerV2.ts";

const plan = computeCareerPlanV2({ why: "outgrown_job", job: "desk", goal: "part_time", timeframe: "30_days",
  blocker: "clients", blockerNote: null, hours: "5_10", training: "regular", region: "Leeds" as never, town: "Leeds", payment: "monthly" },
  new Date("2026-10-06T12:00:00Z"));

test("subject and greeting use the first name", () => {
  const e = buildCareerPlanEmail("Sarah", plan);
  assert.equal(e.subject, "Sarah, here's your PT Career Plan");
  assert.match(e.text, /^Hi Sarah,/);
});

test("no £200, no income, no mentor name", () => {
  const e = buildCareerPlanEmail("Sarah", plan);
  for (const body of [e.html, e.text]) {
    assert.ok(!/£200|income|Josh|Axis|guarantee/i.test(body));
  }
});

test("contains the plan and both links", () => {
  const e = buildCareerPlanEmail("Sarah", plan);
  assert.ok(e.text.includes(plan.goal) && e.text.includes(plan.route) && e.text.includes(plan.timeline.qualify));
  assert.ok(e.html.includes("https://ptlaunchlab.co.uk/book-call") && e.html.includes("https://ptlaunchlab.co.uk/courses"));
});

test("escapes HTML in the name", () => {
  assert.ok(!buildCareerPlanEmail("<b>x</b>", plan).html.includes("<b>x</b>"));
});
