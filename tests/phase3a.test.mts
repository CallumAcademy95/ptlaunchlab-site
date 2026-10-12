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
