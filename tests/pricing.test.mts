import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COURSE_PRICE_PENCE,
  MONTHLY_PLAN_TOTAL_PENCE,
  formatPence,
  COURSE_PRICE_LABEL,
  MONTHLY_PLAN_LABEL,
} from "../app/lib/pricing.ts";

test("the course is £999.99 or 10 × £99.99", () => {
  assert.equal(COURSE_PRICE_PENCE, 99_999);
  assert.equal(MONTHLY_PLAN_TOTAL_PENCE, 99_990);
  assert.equal(COURSE_PRICE_LABEL, "£999.99");
  assert.equal(MONTHLY_PLAN_LABEL, "10 × £99.99");
});

test("formatPence keeps pence and never rounds £999.99 up to £1,000", () => {
  assert.equal(formatPence(99_999), "£999.99");
  assert.equal(formatPence(25_000), "£250");
  assert.equal(formatPence(150_000), "£1,500");
  assert.equal(formatPence(9_950), "£99.50");
});
