// WHAT THIS PROTECTS
//
// The copy for 9 gyms is gated before anything renders, and every month code
// carries a prefix the live validator will actually accept. HITIO500 and
// HITIO300 were refused on the site for weeks because they were minted under a
// prefix the code did not know about.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MONTHS, MONTH_CODE_PREFIX, monthCodeFor, tokensForMonth, allMonthStrings } from "../scripts/lib/promo-calendar.mjs";
import { findBannedClaims, findBrandLeaks } from "../scripts/lib/ad-guards.mjs";

const BRANDS = JSON.parse(readFileSync(new URL("../scripts/gym-brands.json", import.meta.url), "utf8"));
const REAL = Object.entries(BRANDS).filter(([slug]) => slug !== "demo");
const ORIGIN = "https://ptlaunchlab.co.uk";

test("only reveal months remain — the Black Friday money month is retired", () => {
  assert.deepEqual(MONTHS.map((m) => m.key), ["oct"]);
  assert.equal(MONTHS.some((m) => m.offerType === "money"), false, "no promo codes, for anyone");
});

test("no gym gets a month code for any month", () => {
  for (const [slug] of REAL) {
    for (const key of ["oct", "nov"]) assert.equal(monthCodeFor(slug, key), null, `${slug}/${key}`);
  }
});

test("no month, for any gym, contains job-offer language", () => {
  for (const [slug, brand] of REAL) {
    for (const month of MONTHS) {
      const tokens = tokensForMonth(brand, ORIGIN, slug, month.key);
      for (const line of allMonthStrings(month, tokens)) {
        assert.deepEqual(findBannedClaims(line), [], `${slug}/${month.key}: "${line}"`);
      }
    }
  }
});

test("no month, for any gym, names PT Launch Lab", () => {
  for (const [slug, brand] of REAL) {
    for (const month of MONTHS) {
      const tokens = tokensForMonth(brand, ORIGIN, slug, month.key);
      for (const line of allMonthStrings(month, tokens)) {
        assert.deepEqual(findBrandLeaks(line), [], `${slug}/${month.key}: "${line}"`);
      }
    }
  }
});

test("every token resolves — no {{placeholder}} survives to a graphic", () => {
  for (const [slug, brand] of REAL) {
    for (const month of MONTHS) {
      const tokens = tokensForMonth(brand, ORIGIN, slug, month.key);
      for (const line of allMonthStrings(month, tokens)) {
        assert.ok(!line.includes("{{"), `${slug}/${month.key}: unresolved token in "${line}"`);
      }
    }
  }
});

test("money months carry a code, reveal months do not", () => {
  for (const month of MONTHS) {
    for (const [slug] of REAL) {
      const code = monthCodeFor(slug, month.key);
      if (month.offerType === "money") {
        assert.ok(code, `${slug}/${month.key}: money month with no code`);
        assert.ok(code.startsWith(MONTH_CODE_PREFIX[slug]), `${slug}/${month.key}: ${code} has the wrong prefix`);
      } else {
        assert.equal(code, null, `${slug}/${month.key}: reveal month should have no code`);
      }
    }
  }
});

