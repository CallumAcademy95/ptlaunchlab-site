// tests/adGuards.test.mts
//
// WHAT THIS PROTECTS
//
// Four things that have each already gone wrong in real partner material.
//
// 1. CLAIM GATE. Superflex's live handout says "at least one guaranteed
//    interview with a partner gym"; gym-n-go/xcelerate's poster says
//    "GUARANTEED GYM INTERVIEW ON QUALIFICATION". The word *interview* appears
//    nowhere in the v3.0 agreement, whose Clause 2.2 makes the gym "solely as a
//    distribution and referral partner". Job-offer language also risks Meta
//    classing the ad as Employment, whose Special Ad Category forces a 15km
//    minimum radius and bans interest targeting — which would destroy the local
//    targeting the whole pack exists for.
// 2. WHITE-LABEL. It is the GYM'S academy. Member-facing material never names us.
// 3. CONTRAST. Ebor's primaryColor is #1A1A1A on a near-black ad — invisible.
// 4. SAFE ZONES. Meta's story UI covers the top 250px and bottom 340px.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findBannedClaims,
  findBrandLeaks,
  contrastRatio,
  accentFor,
  contentBox,
  logoTreatmentFor,
  assertDimensions,
  SAFE_ZONE,
} from "../scripts/lib/ad-guards.mjs";

// ── Claim gate ──────────────────────────────────────────────────────────────

test("the exact claim live in Superflex's handout is caught", () => {
  const found = findBannedClaims("at least one guaranteed interview with a partner gym");
  assert.deepEqual(found.sort(), ["guaranteed", "interview"]);
});

test("the exact claim on the gym-n-go poster is caught, whatever the case", () => {
  assert.deepEqual(findBannedClaims("GUARANTEED GYM INTERVIEW ON QUALIFICATION").sort(), [
    "guaranteed",
    "interview",
  ]);
});

test("education language passes clean", () => {
  assert.deepEqual(
    findBannedClaims("Nationally recognised Level 3 Personal Training qualification at Ebor Fitness"),
    [],
  );
});

test("a banned word inside a longer word is not a hit", () => {
  // "Jobson" is a surname; "hired" is not, and must still be caught.
  assert.deepEqual(findBannedClaims("Coach Jobson"), []);
  assert.deepEqual(findBannedClaims("we hire coaches"), ["hire"]);
});

// ── White-label ─────────────────────────────────────────────────────────────

test("our own name in member-facing copy is a leak", () => {
  assert.deepEqual(findBrandLeaks("Delivered by PT Launch Lab"), ["PT Launch Lab"]);
  assert.deepEqual(findBrandLeaks("Delivered by Ebor Fitness"), []);
});

// ── Contrast ────────────────────────────────────────────────────────────────

test("white on black is the maximum ratio", () => {
  assert.ok(Math.abs(contrastRatio("#FFFFFF", "#000000") - 21) < 0.05);
});

test("Ebor's primary colour is invisible on its own background", () => {
  assert.ok(contrastRatio("#1A1A1A", "#000000") < 1.5);
});

test("accentFor rejects an accent that cannot be seen and falls back to white", () => {
  // Ebor: primary #1A1A1A is unusable, darkAccent #FFFFFF is the reason
  // darkAccent exists on the config at all.
  assert.equal(accentFor({ primaryColor: "#1A1A1A", darkAccent: "#FFFFFF", heroBg: "#000000" }), "#FFFFFF");
  // Iron Wolf's orange clears 3:1 on black and is used as-is.
  assert.equal(accentFor({ primaryColor: "#f15927", darkAccent: null, heroBg: "#000000" }), "#f15927");
  // A gym whose only colour is unusable still gets something legible.
  assert.equal(accentFor({ primaryColor: "#111111", darkAccent: null, heroBg: "#000000" }), "#FFFFFF");
});

// ── Safe zones ──────────────────────────────────────────────────────────────

test("the vertical content box clears Meta's story UI at both ends", () => {
  const box = contentBox(1080, 1920);
  assert.ok(box.top >= SAFE_ZONE.top, `top ${box.top} intrudes on the ${SAFE_ZONE.top}px band`);
  assert.ok(box.bottom <= 1920 - SAFE_ZONE.bottom, `bottom ${box.bottom} intrudes on the bottom band`);
});

test("the square has no story UI to avoid and uses a plain margin", () => {
  const box = contentBox(1080, 1080);
  assert.ok(box.top < SAFE_ZONE.top);
  assert.ok(box.bottom > 1080 - SAFE_ZONE.bottom);
});

// ── Logo treatment ──────────────────────────────────────────────────────────

test("a logo with no alpha gets a plate so it does not read as a white box", () => {
  assert.equal(logoTreatmentFor({ logoHasAlpha: false }), "plate");
  assert.equal(logoTreatmentFor({ logoHasAlpha: true }), "bare");
});

// ── Dimensions ──────────────────────────────────────────────────────────────

test("a render that came out the wrong size is a hard failure", () => {
  assert.throws(
    () => assertDimensions({ width: 1080, height: 1919 }, { width: 1080, height: 1920 }),
    /1080x1919/,
  );
  assertDimensions({ width: 1080, height: 1080 }, { width: 1080, height: 1080 });
});
