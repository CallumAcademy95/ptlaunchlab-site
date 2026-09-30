// tests/octoberCampaign.test.mts
//
// WHAT THIS PROTECTS
//
// Nine gyms are about to paste this copy into their own Meta ad accounts. Two
// failures would be expensive and neither is visible by reading the file:
//
//   1. JOB-OFFER LANGUAGE. Meta treats employment ads as a Special Ad Category
//      and forces a 15 MILE minimum radius — about fourteen times the area of
//      the four miles this campaign is built around. The same £150 would be
//      spread across fourteen times the people. Worse, it would be the GYM's ad
//      account carrying the policy problem, not ours.
//
//   2. A BRAND LEAK. The academy belongs to the gym and this copy is read by
//      its members. The master spec suggested "powered by PT Launch Lab" in the
//      ad's primary text; that is deliberately dropped. This test is what stops
//      it drifting back in.
//
// Both run over the copy with real gym tokens substituted, because substitution
// is the step that could introduce either problem.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { findBannedClaims, findBrandLeaks } from "../scripts/lib/ad-guards.mjs";
import { AD_COPY, ORGANIC_COPY, MEMBER_EMAIL, OUTREACH, CAMPAIGN, allOctoberStrings } from "../scripts/lib/october-campaign.mjs";

const BRANDS = JSON.parse(readFileSync(new URL("../scripts/gym-brands.json", import.meta.url), "utf8"));
type Brand = { gymName: string; adTown?: string; location?: string; promoCode?: string; canonicalPath?: string };
const REAL: [string, Brand][] = Object.entries(BRANDS as Record<string, Brand>).filter(([slug]) => slug !== "demo");

const tokensFor = ([slug, b]: [string, Brand]): Record<string, string> => ({
  gymName: b.gymName,
  town: b.adTown ?? b.location ?? b.gymName,
  promoCode: b.promoCode ?? "",
  academyUrl: `https://ptlaunchlab.co.uk${b.canonicalPath ?? ""}`,
  firstName: "there",
  slug,
});

test("there are nine real gyms to build for", () => {
  assert.ok(REAL.length >= 9, `expected at least 9 real gyms, found ${REAL.length}`);
});

test("no October string carries job-offer language, for any gym", () => {
  let checked = 0;
  for (const entry of REAL) {
    for (const s of allOctoberStrings(tokensFor(entry))) {
      checked++;
      assert.deepEqual(
        findBannedClaims(s),
        [],
        `${entry[0]}: banned claim in October copy:\n---\n${s}\n---`
      );
    }
  }
  assert.ok(checked > 0, "scanned 0 strings — the gate verified nothing");
});

test("no October string names PT Launch Lab, for any gym", () => {
  for (const entry of REAL) {
    for (const s of allOctoberStrings(tokensFor(entry))) {
      assert.deepEqual(
        findBrandLeaks(s),
        [],
        `${entry[0]}: brand leak in member-facing copy:\n---\n${s}\n---`
      );
    }
  }
});

test("every token resolves — no {{placeholder}} reaches a gym", () => {
  for (const entry of REAL) {
    for (const s of allOctoberStrings(tokensFor(entry))) {
      assert.ok(
        !/\{\{\s*\w+\s*\}\}/.test(s),
        `${entry[0]}: unresolved token in:\n---\n${s}\n---`
      );
    }
  }
});

test("the gym's own name actually appears in the ad copy", () => {
  // A white-label rule that removed OUR name but failed to insert THEIRS would
  // pass every gate above and still be useless.
  for (const entry of REAL) {
    const t = tokensFor(entry);
    const strings = allOctoberStrings(t);
    assert.ok(
      strings.some((s) => s.includes(t.gymName)),
      `${entry[0]}: gym name "${t.gymName}" appears nowhere in its own campaign copy`
    );
  }
});

test("the ad does not claim study happens at the gym", () => {
  // The academy is locally represented by the gym; the learning is online. A
  // learner who never sets foot in a classroom must not have been told they
  // would. "through" is fine, "studied at" is not.
  for (const entry of REAL) {
    const t = tokensFor(entry);
    for (const s of allOctoberStrings(t)) {
      assert.ok(
        !new RegExp(`(stud(y|ied|ying)|taught|delivered|classes?)\\s+(at|in)\\s+${t.gymName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(s),
        `${entry[0]}: implies study happens physically at the gym:\n---\n${s}\n---`
      );
    }
  }
});

test("October is a reveal month — no code, no discount, no deadline", () => {
  assert.equal(CAMPAIGN.promoCode, null, "October must not carry a promo code");
  for (const s of allOctoberStrings()) {
    assert.ok(!/%\s*off|discount|save £|\bends?\s+(on|soon|this)\b|last chance|limited time/i.test(s),
      `October copy implies an offer or deadline:\n---\n${s}\n---`);
  }
});

test("the campaign numbers are the approved ones", () => {
  assert.equal(CAMPAIGN.recommendedSpendGbp, 150);
  assert.equal(CAMPAIGN.commissionGbp, 500);
  assert.equal(CAMPAIGN.radiusMiles, 4);
});

test("no forbidden commercial framing anywhere in the copy", () => {
  // "£350 profit", "pays it back", a forecast of one learner, or any ROAS claim
  // are all explicitly out. There is no benchmark for this campaign.
  for (const s of allOctoberStrings()) {
    assert.ok(
      !/£350|profit|pays? (it|for it) back|guarantee|roas|return on ad spend/i.test(s),
      `forbidden commercial framing:\n---\n${s}\n---`
    );
  }
});

test("the outreach prompt asks who people GO TO, not who gives advice", () => {
  const all = OUTREACH.whoToLookFor.join(" ") + " " + OUTREACH.opener + " " + OUTREACH.ownerQuestion;
  assert.ok(/walk over to|go to/i.test(all), "the 'who do people go to' signal is missing");
  assert.ok(
    !/gives? (everyone |people )?advice(?! they didn)/i.test(OUTREACH.ownerQuestion + OUTREACH.opener),
    "the prompt asks who gives advice — unsolicited gym advice is the wrong signal"
  );
});

test("the ad copy has both headline options and they differ", () => {
  assert.ok(AD_COPY.headlineA.length > 0 && AD_COPY.headlineB.length > 0);
  assert.notEqual(AD_COPY.headlineA, AD_COPY.headlineB);
});

test("Meta's own limits are respected", () => {
  // Headlines truncate around 40 characters in most placements and the
  // description around 30. A headline that reads fine in the file and is cut in
  // half on a phone is a silent failure.
  for (const entry of REAL) {
    const t = tokensFor(entry);
    const hA = AD_COPY.headlineA.replace("{{gymName}}", t.gymName);
    assert.ok(hA.length <= 60, `${entry[0]}: headline A is ${hA.length} chars — "${hA}"`);
  }
  assert.ok(AD_COPY.headlineB.length <= 40, `headline B is ${AD_COPY.headlineB.length} chars`);
});

test("the member email and organic post are not empty shells", () => {
  assert.ok(MEMBER_EMAIL.body.split("\n").filter(Boolean).length >= 5);
  assert.ok(ORGANIC_COPY.post.length > 120);
});
