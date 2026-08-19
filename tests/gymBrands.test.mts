// tests/gymBrands.test.mts
//
// WHAT THIS PROTECTS
//
// The ad renderer personalises every graphic from gym-brands.json. A null
// `location` silently produced a headline reading "without leaving null", and
// two partners sharing a town made them bid against each other in the same
// Meta auction for an enrolment we pay £500 on either way.
//
// It also guards logo sourcing: five logos used to be remote URLs fetched at
// render time, and Ebor's was a JPEG, which renders as a white box on a dark ad.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const BRANDS = JSON.parse(readFileSync(new URL("../scripts/gym-brands.json", import.meta.url), "utf8"));
const REAL = Object.entries(BRANDS).filter(([slug]) => slug !== "demo");

test("there are 9 real partner gyms", () => {
  assert.equal(REAL.length, 9);
});

test("every real gym has a location and a short adTown", () => {
  for (const [slug, brand] of REAL) {
    assert.ok(brand.location, `${slug} has no location`);
    assert.ok(brand.adTown, `${slug} has no adTown`);
    assert.ok(brand.adTown.length <= 14, `${slug} adTown "${brand.adTown}" is too long for a headline`);
  }
});

test("no two gyms advertise into the same town", () => {
  const towns = REAL.map(([, b]) => b.adTown.toLowerCase());
  assert.equal(new Set(towns).size, towns.length, `duplicate adTown: ${towns.join(", ")}`);
});

test("every real gym has a site to harvest photos from", () => {
  for (const [slug, brand] of REAL) {
    assert.match(brand.siteUrl ?? "", /^https:\/\//, `${slug} has no siteUrl`);
  }
});

test("every logo is local, so a gym redesigning their site cannot break a render", () => {
  for (const [slug, brand] of REAL) {
    assert.match(brand.logoUrl ?? "", /^\/gym-logos\/.+\.png$/, `${slug} logo is not a local PNG`);
    assert.equal(typeof brand.logoHasAlpha, "boolean", `${slug} has no logoHasAlpha`);
  }
});
