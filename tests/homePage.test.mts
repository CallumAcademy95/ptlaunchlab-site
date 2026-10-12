import { test } from "node:test";
import assert from "node:assert/strict";
import { HOME_CTA_SOURCES, ENROL_HREF, enrolLabel, CALL_QUESTION, callSuccessMessage } from "../app/lib/homeCta.ts";

test("CTA sources are the agreed set, unique", () => {
  assert.deepEqual([...HOME_CTA_SOURCES], ["home-hero", "home-proof", "home-pain", "home-how", "home-pricing", "home-founders", "home-reviews", "home-partners", "home-final", "home-sticky"]);
  assert.equal(new Set(HOME_CTA_SOURCES).size, HOME_CTA_SOURCES.length);
});

test("enrol goes to /enrol and labels use the live price", () => {
  assert.equal(ENROL_HREF, "/enrol");
  assert.equal(enrolLabel(false), "Enrol now");
  assert.equal(enrolLabel(true), "Enrol £999.99");
});

test("call form question and success copy", () => {
  assert.deepEqual(CALL_QUESTION, { label: "Best time to call? (optional)", options: ["Morning", "Afternoon", "Evening"] });
  assert.equal(callSuccessMessage("Jane"), "Thanks Jane, we'll call you today.");
});
