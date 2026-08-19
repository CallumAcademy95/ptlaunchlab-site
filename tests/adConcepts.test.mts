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

test("headline lines stay short enough to set large", () => {
  for (const [slug, brand] of REAL) {
    const tokens = tokensForGym(brand, "https://ptlaunchlab.co.uk");
    for (const concept of CONCEPTS) {
      const text = conceptText(concept, tokens);
      for (const line of [...text.headline, text.accentLine]) {
        assert.ok(line.length <= 34, `${slug}/${concept.id} line too long (${line.length}): "${line}"`);
      }
    }
  }
});
