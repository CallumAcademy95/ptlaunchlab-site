// tests/fitnessAccountantPage.test.mts
//
// WHAT THIS PROTECTS
//
// The Fitness Accountant's academy page (Jay Johnston, Nov 2026), a package
// partner like PT Mentor Hub:
//   - the enrol page's gymSlug is the pay-in-full-only slug, so monthly is
//     never offered, and it matches the onboard script's partner row;
//   - the page stays noindex (a bio-link page, like PT Mentor Hub's);
//   - the copy never offers finance or instalments, never promises tax savings
//     or a guarantee, and never mentions another course provider.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isPayInFullOnly } from "../app/lib/pricing.ts";

const PAGE = readFileSync("app/fitness-accountant-academy/page.tsx", "utf8");
const ENROL = readFileSync("app/fitness-accountant-academy/enrol/page.tsx", "utf8");
const ONBOARD = readFileSync("scripts/onboard-fitness-accountant.mts", "utf8");
const SLUG = "the-fitness-accountant";

test("the enrol page, pricing and the onboard script agree on one slug", () => {
  assert.match(ENROL, new RegExp(`gymSlug: "${SLUG}"`));
  assert.match(ONBOARD, new RegExp(`const SLUG = "${SLUG}"`));
  assert.equal(isPayInFullOnly(SLUG), true);
});

test("the page is not indexed", () => {
  assert.match(PAGE, /robots: \{ index: false/);
  assert.match(ENROL, /robots: \{ index: false/);
});

test("no finance, instalments, guarantees or promised savings", () => {
  const visible = PAGE.replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(visible, /monthly (plan|payment)|instal?ments?|pay later|pay in 3|interest[- ]free|finance option|klarna|£99\.99/i);
  assert.doesNotMatch(visible, /guarantee|money[- ]back|save you £|pay less tax|tax[- ]free/i);
});

test("it's Jay's page only: no other course provider", () => {
  assert.doesNotMatch(PAGE, /uni ?learning/i);
});

// Jay, 18 Nov 2026: he also has non-fitness clients (bars, barbers), so the
// page says he specialises in fitness, never that he works only with it.
test("Jay specialises in fitness; the page never says 'only'", () => {
  assert.doesNotMatch(PAGE, /works? only with|only works with/i);
  assert.match(PAGE, /specialises in the fitness industry/);
});

// Live since 18 Nov 2026: no draft strip or placeholder boxes left on it.
test("no draft leftovers on the live page", () => {
  assert.doesNotMatch(PAGE, /Draft preview|Not public yet|To confirm/i);
});

// Jay, 20 Nov 2026: he's registered in both the UK and Ireland, and Irish
// learners set up with Revenue the way UK learners set up with HMRC.
test("Jay covers the UK and Ireland: HMRC or Revenue", () => {
  assert.match(PAGE, /registered in both the UK and Ireland/);
  assert.match(PAGE, /HMRC or Revenue registration/);
  assert.match(PAGE, /income tax return with Revenue in Ireland/);
});
