// tests/careerPlannerV2.test.mts
// WHAT THIS PROTECTS: who gets a human call today (the band), and every sentence a
// stranger reads on their result. No income forecast, no Josh, 8–16 weeks only.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bandFor, computeCareerPlanV2, isUkMobileE164, CONSENT_TEXT, TIMEFRAME_VALUES, GOAL_VALUES,
  BLOCKER_VALUES, HOURS_VALUES, REGIONS, type PlannerAnswers,
} from "../app/lib/careerPlannerV2.ts";

const A: PlannerAnswers = { why: "outgrown_job", job: "desk", goal: "part_time", timeframe: "30_days",
  blocker: "clients", blockerNote: null, hours: "5_10", training: "regular",
  region: "Yorkshire & the Humber", town: "Leeds", payment: "monthly" };
const NOW = new Date("2026-10-06T12:00:00Z");

test("band table — every timeframe × goal", () => {
  for (const timeframe of TIMEFRAME_VALUES) for (const goal of GOAL_VALUES) {
    const b = bandFor({ timeframe, goal });
    const expected =
      timeframe === "now" || timeframe === "30_days" ? (goal === "not_sure" ? "strong" : "prime")
      : timeframe === "1_3_months" ? "strong" : "nurture";
    assert.equal(b, expected, `${timeframe}/${goal}`);
  }
});

test("headline never names the band", () => {
  for (const timeframe of TIMEFRAME_VALUES) {
    const p = computeCareerPlanV2({ ...A, timeframe }, NOW);
    assert.ok(!/prime|strong|nurture/i.test(p.headline));
  }
});

test("goal sentence for an office worker going part-time", () => {
  assert.equal(computeCareerPlanV2(A, NOW).goal, "Move from an office job towards part-time PT work, alongside your current job.");
});

test("route: full-time, standard and lapsed", () => {
  assert.match(computeCareerPlanV2({ ...A, goal: "full_time" }, NOW).route, /build towards full-time\.$/);
  assert.match(computeCareerPlanV2(A, NOW).route, /^Qualify online alongside work/);
  assert.match(computeCareerPlanV2({ ...A, training: "qualified_lapsed" }, NOW).route, /^Refresh your qualification/);
});

test("timeline uses 8–16 weeks only", () => {
  const map: Record<string, string> = { "10_plus": "about 8 weeks", "5_10": "about 10–12 weeks", "3_5": "about 14–16 weeks", lt3: "about 16 weeks, at your own pace" };
  for (const hours of HOURS_VALUES) assert.equal(computeCareerPlanV2({ ...A, hours }, NOW).timeline.qualify, map[hours]);
  assert.equal(computeCareerPlanV2({ ...A, timeframe: "now" }, NOW).timeline.start, "October");
  assert.equal(computeCareerPlanV2({ ...A, timeframe: "30_days" }, NOW).timeline.start, "November");
  assert.equal(computeCareerPlanV2({ ...A, timeframe: "researching" }, NOW).timeline.start, "Whenever you're ready");
});

test("every blocker has a concern answer, and none promises clients or income", () => {
  for (const blocker of BLOCKER_VALUES) {
    const c = computeCareerPlanV2({ ...A, blocker }, NOW).concern;
    assert.ok(c.title && c.answer);
    assert.ok(!/guarantee|£\d/i.test(c.answer), blocker);
  }
});

test("rate range per region, rounded to £5", () => {
  for (const region of REGIONS) {
    const r = computeCareerPlanV2({ ...A, region }, NOW).rateRange;
    assert.ok(r.low % 5 === 0 && r.high % 5 === 0 && r.high > r.low, region);
  }
  assert.deepEqual(computeCareerPlanV2({ ...A, region: "London" }, NOW).rateRange, { region: "London", low: 40, high: 55 });
});

test("button order per band", () => {
  const first = (timeframe: PlannerAnswers["timeframe"]) => computeCareerPlanV2({ ...A, timeframe }, NOW).buttons[0].href;
  assert.equal(first("now"), "/enrol");
  assert.equal(first("1_3_months"), "/book-call");
  assert.equal(first("researching"), "/courses");
});

test("nothing on the plan forecasts income or names the mentor", () => {
  const text = JSON.stringify(computeCareerPlanV2(A, NOW));
  assert.ok(!/year[- ]?1|income|ROI|Josh|Axis|guaranteed/i.test(text));
});

test("UK mobile check", () => {
  assert.equal(isUkMobileE164("+447700900123"), true);
  assert.equal(isUkMobileE164("+441132000000"), false);
  assert.equal(isUkMobileE164("07700900123"), false);
});

test("consent text is exact", () => {
  assert.equal(CONSENT_TEXT, "OK for PT Launch Lab to WhatsApp, text or call me about my plan. I can reply STOP any time.");
});
