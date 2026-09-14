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
import { PARTNER_PROMO_PREFIXES } from "../app/lib/partnerPromo.ts";

const BRANDS = JSON.parse(readFileSync(new URL("../scripts/gym-brands.json", import.meta.url), "utf8"));
const REAL = Object.entries(BRANDS).filter(([slug]) => slug !== "demo");
const ORIGIN = "https://ptlaunchlab.co.uk";

test("October and November are both defined", () => {
  assert.deepEqual(MONTHS.map((m) => m.key), ["oct", "nov"]);
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

test("every gym has a month-code prefix the validator accepts", () => {
  for (const [slug] of REAL) {
    const prefix = MONTH_CODE_PREFIX[slug];
    assert.ok(prefix, `${slug} has no month-code prefix`);
    assert.ok(
      PARTNER_PROMO_PREFIXES[slug]?.includes(prefix),
      `${slug}: prefix ${prefix} is not in PARTNER_PROMO_PREFIXES (${PARTNER_PROMO_PREFIXES[slug]?.join(", ")}) — the code would be refused`,
    );
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

test("November is £600 off, landing at £999", () => {
  const nov = MONTHS.find((m) => m.key === "nov");
  assert.ok(nov, "November is missing from MONTHS");
  assert.equal(nov.offerType, "money");
  assert.equal(nov.discountPence, 60_000);
  assert.equal(159_900 - nov.discountPence, 99_900);
});
