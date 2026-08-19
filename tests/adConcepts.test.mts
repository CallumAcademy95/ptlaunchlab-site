// tests/adConcepts.test.mts
//
// WHAT THIS PROTECTS
//
// That the copy we are about to paint onto 36 graphics for 9 partner gyms is
// clean BEFORE anything renders. The claim gate and the white-label rule are
// worth nothing if they only run on files nobody re-reads.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CONCEPTS, SIZES, conceptText, allConceptStrings } from "../scripts/lib/ad-concepts.mjs";
import { findBannedClaims, findBrandLeaks } from "../scripts/lib/ad-guards.mjs";
import { tokensForGym } from "../app/lib/partner-playbook-tokens.ts";

const BRANDS = JSON.parse(readFileSync(new URL("../scripts/gym-brands.json", import.meta.url), "utf8"));
const REAL = Object.entries(BRANDS).filter(([slug]) => slug !== "demo");

test("there are two concepts at two sizes", () => {
  assert.equal(CONCEPTS.length, 2);
  assert.deepEqual(SIZES, [
    { w: 1080, h: 1080 },
    { w: 1080, h: 1920 },
  ]);
});

test("no concept, for any gym, contains job-offer language", () => {
  for (const [slug, brand] of REAL) {
    const tokens = tokensForGym(brand, "https://ptlaunchlab.co.uk");
    for (const concept of CONCEPTS) {
      for (const line of allConceptStrings(concept, tokens)) {
        assert.deepEqual(findBannedClaims(line), [], `${slug}/${concept.id}: "${line}"`);
      }
    }
  }
});

test("no concept, for any gym, names PT Launch Lab", () => {
  for (const [slug, brand] of REAL) {
    const tokens = tokensForGym(brand, "https://ptlaunchlab.co.uk");
    for (const concept of CONCEPTS) {
      for (const line of allConceptStrings(concept, tokens)) {
        assert.deepEqual(findBrandLeaks(line), [], `${slug}/${concept.id}: "${line}"`);
      }
    }
  }
});

test("every token is resolved for every gym — no {{ }} survives", () => {
  for (const [slug, brand] of REAL) {
    const tokens = tokensForGym(brand, "https://ptlaunchlab.co.uk");
    for (const concept of CONCEPTS) {
      for (const line of allConceptStrings(concept, tokens)) {
        assert.doesNotMatch(line, /\{\{|\}\}/, `${slug}/${concept.id} left a placeholder: "${line}"`);
      }
    }
  }
});

test("the local concept names the gym's own town", () => {
  const brand = BRANDS["6fit"];
  const text = conceptText(
    CONCEPTS.find((c) => c.id === "local"),
    tokensForGym(brand, "https://ptlaunchlab.co.uk"),
  );
  // 6fit and muscle-bound are both Bradford; 6fit advertises into Wibsey.
  assert.match(text.accentLine, /WIBSEY/i);
});

// Barlow Condensed 800 headline lines render in a 904px-wide stage (1080px
// canvas minus 88px margins either side) at 108px on the tall (1080x1920)
// creative. "YOU'RE ALREADY HERE" — the string that produced the orphaned
// "HERE" on every gym's already-here-1080x1920.png before the layout fix —
// measures ~854px there, an average of ~45px per character (854 / 19 chars).
// 904px of stage / ~45px per char ≈ 20 characters before a line is at real
// risk of wrapping. The old limit of 34 was 70% looser than that and let the
// actual regression straight through. 20 is a character-count heuristic, not
// a pixel measurement, so it stays intentionally tight rather than exact.
const MAX_HEADLINE_CHARS = 20;

test("headline lines stay short enough to set large on one line", () => {
  // Only `headline` — each array element is designed to render as exactly one
  // line. `accentLine` is checked separately below: it is allowed to wrap
  // onto a second line ("WITHOUT LEAVING" / "<TOWN>.") by design, since the
  // town name is dynamic per gym and that break reads as an intentional
  // punchline rather than an orphaned fragment.
  for (const [slug, brand] of REAL) {
    const tokens = tokensForGym(brand, "https://ptlaunchlab.co.uk");
    for (const concept of CONCEPTS) {
      const text = conceptText(concept, tokens);
      for (const line of text.headline) {
        assert.ok(
          line.length <= MAX_HEADLINE_CHARS,
          `${slug}/${concept.id} headline line too long (${line.length}): "${line}"`,
        );
      }
    }
  }
});

test("the accent line stays within a sane length even though it may wrap to a second line", () => {
  for (const [slug, brand] of REAL) {
    const tokens = tokensForGym(brand, "https://ptlaunchlab.co.uk");
    for (const concept of CONCEPTS) {
      const text = conceptText(concept, tokens);
      assert.ok(
        text.accentLine.length <= 34,
        `${slug}/${concept.id} accent line too long (${text.accentLine.length}): "${text.accentLine}"`,
      );
    }
  }
});
