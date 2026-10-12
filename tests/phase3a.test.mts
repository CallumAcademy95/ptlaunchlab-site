import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("pop-up provider is site-wide, once", () => {
  assert.match(src("app/layout.tsx"), /<CallModalProvider/);
  assert.doesNotMatch(src("app/page.tsx"), /<CallModalProvider/);
});

test("old sticky bar renders the new two-button bar", () => {
  const s = src("app/components/StickyMobileCTA.tsx");
  assert.match(s, /StickyCtaBar/);
  assert.match(s, /source="sticky"/);
  assert.doesNotMatch(s, /Discover Your Pathway|Start Today/);
});

test("sticky bar falls back to a scroll trigger when there is no hero to watch", () => {
  const s = src("app/components/cta/StickyCtaBar.tsx");
  assert.match(s, /scrollY\s*>\s*400/);
  assert.match(s, /source\s*=\s*"home-sticky"|source = "home-sticky"/);
});

test("sticky bar hides from md on home, from lg on the site-wide pages", () => {
  assert.match(src("app/components/StickyMobileCTA.tsx"), /hideFrom="lg"/);
  const s = src("app/components/cta/StickyCtaBar.tsx");
  assert.match(s, /"lg:hidden"/);
  assert.match(s, /"md:hidden"/);
});

test("ConversionSection is the pay-in-full-first price block", () => {
  const c = src("app/components/ConversionSection.tsx");
  assert.match(c, /<PriceBlock[^>]*source="conversion"/);
  assert.match(c, /legacy="conversion"/);
  for (const banned of [/klarna/i, /interest-free/i, /pay in 3/i]) assert.doesNotMatch(c, banned);
});

test("home page still renders PriceBlock with default props", () => {
  assert.match(src("app/page.tsx"), /<PriceBlock reserveWasPrice=\{RESERVE_WAS_PRICE\} \/>/);
});

test("FinalCTA always uses the two new buttons", () => {
  const f = src("app/components/FinalCTA.tsx");
  assert.match(f, /<TwoWayCTA/);
  assert.match(f, /"final"/);
  assert.doesNotMatch(f, /Discover Your Pathway|Start Today/);
});

test("LocationHero: two new buttons and the pay-in-full price line", () => {
  const l = src("app/components/LocationHero.tsx");
  assert.match(l, /<TwoWayCTA[^>]*source="location-hero"/);
  assert.match(l, /COURSE_PRICE_LABEL/);
  assert.match(l, /Flexible ways to pay at checkout/);
  assert.doesNotMatch(l, /MONTHLY_PRICE_LABEL/);
});

import { NO_POPUP_PATHS, popupAllowedOnPath, shouldOpenCallModalAt } from "../app/lib/homeCta.ts";

const plainClick = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false };

test("no pop-up on /book-call and /enrol/success", () => {
  assert.deepEqual(NO_POPUP_PATHS, ["/book-call", "/enrol/success"]);
  for (const p of NO_POPUP_PATHS) {
    assert.equal(popupAllowedOnPath(p), false);
    assert.equal(popupAllowedOnPath(p + "/"), false);
    assert.equal(shouldOpenCallModalAt(plainClick, p), false);
  }
  for (const p of ["/", "/enrol", "/best-personal-trainer-course-uk", null, undefined]) {
    assert.equal(popupAllowedOnPath(p), true);
    assert.equal(shouldOpenCallModalAt(plainClick, p), true);
  }
  assert.equal(shouldOpenCallModalAt({ ...plainClick, ctrlKey: true }, "/"), false);
});

test("CallLink and the provider both use the path rule", () => {
  assert.match(src("app/components/cta/CallLink.tsx"), /shouldOpenCallModalAt\(e, pathname\)/);
  assert.match(src("app/components/cta/CallModal.tsx"), /popupAllowedOnPath\(pathname\)/);
});

test("ConversionSection keeps the base band colour; home keeps surface", () => {
  assert.match(src("app/components/ConversionSection.tsx"), /bg="base"/);
  const p = src("app/components/home/PriceBlock.tsx");
  assert.match(p, /bg = "surface"/);
  assert.match(p, /"bg-base"/);
  assert.match(p, /"bg-surface"/);
});

test("guide pages use the two new hero buttons", () => {
  for (const d of ["best-personal-trainer-course-uk", "personal-trainer-course-near-me", "personal-trainer-course-with-business-support", "personal-trainer-mentorship-uk", "self-employed-personal-trainer-uk"]) {
    const s = src(`app/${d}/page.tsx`);
    assert.match(s, /<TwoWayCTA source="guide-hero" \/>/, d);
    assert.doesNotMatch(s, /Discover Your Pathway|Start Today/, d);
  }
});
