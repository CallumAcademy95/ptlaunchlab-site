/**
 * The four checks every partner ad graphic has to survive.
 *
 * Pure functions, no I/O, so they are cheap to test and the renderer can call
 * them on every string it is about to paint.
 */

/**
 * Job-offer language.
 *
 * Two reasons, and both are load-bearing. Contractually, the v3.0 agreement
 * makes the gym "solely as a distribution and referral partner" (Clause 2.2) —
 * the word "interview" appears nowhere in it, yet it is live in Superflex's
 * handout and on the gym-n-go/xcelerate poster. Commercially, Meta may class a
 * job-offer ad as Employment, and the Special Ad Category that follows forces a
 * 15km minimum radius, bans location exclusion, restricts interest targeting to
 * a pre-approved list and removes lookalikes — which guts local targeting.
 *
 * Education language ("nationally recognised Level 3 qualification") avoids both.
 */
const BANNED = [
  "interview",
  "interviews",
  "guarantee",
  "guaranteed",
  "guarantees",
  "hiring",
  "hire",
  "hired",
  "job",
  "jobs",
  "vacancy",
  "vacancies",
  "recruit",
  "recruits",
  "recruiting",
  "recruitment",
];

const BRAND = "PT Launch Lab";

/** Whole-word, case-insensitive. "Coach Jobson" must not trip "job". */
export function findBannedClaims(text) {
  const hits = new Set();
  for (const word of BANNED) {
    if (new RegExp(`\\b${word}\\b`, "i").test(text)) hits.add(word);
  }
  return [...hits];
}

/** It is the gym's academy. Member-facing material never names us. */
export function findBrandLeaks(text) {
  return new RegExp(BRAND, "i").test(text) ? [BRAND] : [];
}

function srgbChannel(v) {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  const r = srgbChannel(parseInt(full.slice(0, 2), 16));
  const g = srgbChannel(parseInt(full.slice(2, 4), 16));
  const b = srgbChannel(parseInt(full.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1 (identical) to 21 (black on white). */
export function contrastRatio(hexA, hexB) {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * An accent that is actually visible.
 *
 * gym-tv-slides.mjs preferred darkAccent and fell back to primaryColor with no
 * check at all, which would happily paint Ebor's #1A1A1A onto near-black. Here
 * every candidate must clear 3:1 against the background or it is rejected.
 */
export function accentFor(brand) {
  const bg = brand.heroBg || "#000000";
  for (const candidate of [brand.darkAccent, brand.primaryColor]) {
    if (candidate && contrastRatio(candidate, bg) >= 3) return candidate;
  }
  return "#FFFFFF";
}

/** Meta's story and reel UI chrome, in pixels of a 1080×1920 canvas. */
export const SAFE_ZONE = { top: 250, bottom: 340 };

/**
 * The vertical band text may occupy.
 *
 * The 1080×1920 gets Meta's safe zones plus a little breathing room. The square
 * appears in feed, where there is no overlaid UI, so it just gets a margin.
 */
export function contentBox(width, height) {
  if (height === 1920) return { top: SAFE_ZONE.top + 40, bottom: height - SAFE_ZONE.bottom - 40 };
  return { top: 96, bottom: height - 96 };
}

/**
 * Ebor's logo is a JPEG off Wix, so it has no alpha and carries its own solid
 * background. Painted bare on a dark ad it is a white rectangle. Giving it a
 * deliberate plate makes the same pixels read as a design choice, and needs no
 * hand-retouched artwork.
 */
export function logoTreatmentFor(brand) {
  return brand.logoHasAlpha ? "bare" : "plate";
}

/** A render that came out the wrong size must never reach a partner. */
export function assertDimensions(meta, expected) {
  if (meta.width !== expected.width || meta.height !== expected.height) {
    throw new Error(
      `render is ${meta.width}x${meta.height}, expected ${expected.width}x${expected.height}`,
    );
  }
}
