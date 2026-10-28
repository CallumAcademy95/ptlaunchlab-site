// tests/gymSalesPage.test.mts
//
// WHAT THIS PROTECTS
//
// The optional salesPage block on a gym's config (spec:
// docs/superpowers/specs/2026-10-28-gym-sales-page-design.md in the home repo).
// - Every image it names exists under public/, so the page never ships a broken hero.
// - Member quotes are verbatim from the gym's own reviews page (fixture), never
//   paraphrased: they are someone's words.
// - No copy promises a job, an interview or an earnings figure, and none
//   assumes the reader already trains there.
// - GymAcademyPage only swaps sections when salesPage is set.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { GYMS } from "../app/lib/gyms/index.ts";

const ROOT = new URL("../", import.meta.url);
const pub = (p: string) => new URL(`public${p}`, ROOT);
const src = (p: string) => readFileSync(new URL(p, ROOT), "utf8");

/** gymSlug -> reviews fixture the quotes must appear in verbatim. */
const QUOTE_FIXTURES: Record<string, string> = {
  "atp-felixstowe": "tests/fixtures/atp-reviews.txt",
};

const withSales = Object.values(GYMS).filter((g) => g.salesPage);

test("ATP has a salesPage (the pilot)", () => {
  assert.ok(GYMS["atp-felixstowe-academy"].salesPage, "ATP salesPage missing");
});

test("every salesPage image exists under public/", () => {
  for (const g of withSales) {
    const s = g.salesPage!;
    const imgs = [s.heroImage, s.community.image, ...s.coaching.cards.map((c) => c.image)];
    for (const i of imgs) assert.ok(existsSync(pub(i)), `${g.gymSlug}: ${i} not in public/`);
  }
});

test("salesPage has three coaching cards, 1-3 quotes and 3-5 path steps, all with alt text", () => {
  for (const g of withSales) {
    const s = g.salesPage!;
    assert.equal(s.coaching.cards.length, 3, g.gymSlug);
    assert.ok(s.quotes.length >= 1 && s.quotes.length <= 3, g.gymSlug);
    assert.ok(s.path.steps.length >= 3 && s.path.steps.length <= 5, g.gymSlug);
    for (const alt of [s.heroImageAlt, s.community.imageAlt, ...s.coaching.cards.map((c) => c.imageAlt)])
      assert.ok(alt.trim().length > 5, `${g.gymSlug}: empty alt text`);
  }
});

test("quotes are verbatim from the gym's reviews fixture", () => {
  for (const g of withSales) {
    const f = QUOTE_FIXTURES[g.gymSlug];
    assert.ok(f, `${g.gymSlug}: add its reviews fixture to QUOTE_FIXTURES`);
    const text = readFileSync(new URL(f, ROOT), "utf8");
    for (const q of g.salesPage!.quotes) {
      assert.ok(q.text.trim().length >= 20, `${g.gymSlug}: quote too short`);
      assert.ok(text.includes(q.text),`${g.gymSlug}: not verbatim: ${q.text.slice(0, 50)}`);
    }
  }
});

test("salesPage gyms use a 6-digit hex heroBg (the hero overlay appends alpha to it)", () => {
  for (const g of withSales) {
    const bg = g.heroBg ?? "#000000";
    assert.match(bg, /^#[0-9a-f]{6}$/i, g.gymSlug);
  }
});

test("no salesPage copy promises a job, interview or earnings, or assumes membership", () => {
  const banned = [
    /guarantee/i,
    /\b(job|employment) (offer|guaranteed)\b/i,
    /£\s?\d[\d,]*(k)?\s*(a|per|\/)\s*(year|month|week|hour)/i,
    /earn up to/i,
    /where you already train/i,
    /you already (train|know) (here|at)/i,
  ];
  for (const g of withSales) {
    const all = JSON.stringify(g.salesPage);
    for (const re of banned) assert.doesNotMatch(all, re, `${g.gymSlug}: ${re}`);
  }
});

test("GymAcademyPage swaps the generic HOOK and POSITIONING only when salesPage is set", () => {
  const s = src("app/components/GymAcademyPage.tsx");
  assert.match(s, /const sales = c\.salesPage/);
  assert.match(s, /\{!sales && \(\s*<>\s*\{\/\* ── HOOK ── \*\/\}/);
  assert.match(s, /<CoachingStory /);
  assert.match(s, /<MemberQuotes /);
  assert.match(s, /<CoachPath /);
  assert.match(s, /<CommunityBand /);
});
