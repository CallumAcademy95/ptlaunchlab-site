// Run: npm run test:unit
//
// WHAT THIS PROTECTS
//
// partner-playbook/campaign-meta-ads.md deliberately NAMES the words it warns
// a gym owner away from — "interview" and "job" both appear in its "One rule
// worth keeping" section, in the sentence telling them NOT to use that
// framing. That prose is meant to trip a naive claim gate, and it should: you
// cannot warn someone off job-offer language without saying the word. So the
// gate does not run over the whole file. It runs over exactly what a partner
// can paste into Meta Ads Manager — the fenced code blocks that become
// copy-to-clipboard panels in the portal (Primary text / Headline /
// Description / Website URL) — because that is the only part of this file
// that ever ships as an advert.
//
// The stakes if a banned word DID reach a fenced block: contractually, the
// v3.0 partner agreement makes the gym "solely as a distribution and referral
// partner" — nothing here promises anyone a job. Commercially, Meta treats a
// job-offer-shaped ad as Employment, a Special Ad Category that forces a 15km
// minimum radius, bans location exclusion and removes lookalikes — which
// guts the local targeting these ads exist for in the first place.
//
// Before this test existed, nothing ran the claim gate over the playbook at
// all. scripts/gym-ad-creatives.mjs gates the 36 rendered graphics; this
// closes the matching gap for the copy blocks that go with them.
//
// extractSnippets is imported from the same module partner-playbook.ts calls
// to build the copy-to-clipboard panels a partner actually sees — not a
// hand-copied regex — so this test gates exactly what the portal renders. If
// the extraction logic and this test ever diverge, one of them is wrong; a
// shared import makes that impossible.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { extractSnippets } from "../app/lib/partner-playbook-snippets.ts";
import { tokensForGym, applyPlaybookTokens } from "../app/lib/partner-playbook-tokens.ts";
import { findBannedClaims, findBrandLeaks } from "../scripts/lib/ad-guards.mjs";

const BRANDS = JSON.parse(readFileSync(new URL("../scripts/gym-brands.json", import.meta.url), "utf8"));
const REAL = Object.entries(BRANDS).filter(([slug]) => slug !== "demo");

const RAW = readFileSync(
  new URL("../partner-playbook/campaign-meta-ads.md", import.meta.url),
  "utf8"
);

// Same frontmatter split partner-playbook.ts's parseFrontmatter uses — the
// portal never runs extractSnippets over the frontmatter block, so neither
// should this test.
const FRONTMATTER_BODY = RAW.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)![2];

// Primary text, Headline, Description and Website URL, twice (one per
// concept) = 8. If a future edit drops a copy block, this must fail loudly
// rather than the portal silently shipping a partner one fewer field to
// paste.
const EXPECTED_BLOCK_COUNT = 8;

test("the source file yields the expected number of fenced blocks", () => {
  const blocks = extractSnippets(FRONTMATTER_BODY);
  assert.equal(
    blocks.length,
    EXPECTED_BLOCK_COUNT,
    `campaign-meta-ads.md has ${blocks.length} fenced blocks, expected ${EXPECTED_BLOCK_COUNT} — a copy block was added or removed`
  );
});

test("every fenced copy block, for every real gym, clears the claim gate", () => {
  assert.ok(REAL.length === 9, `expected 9 real gyms in gym-brands.json, found ${REAL.length}`);

  for (const [slug, brand] of REAL) {
    const tokens = tokensForGym(brand, "https://ptlaunchlab.co.uk");
    const personalised = applyPlaybookTokens(FRONTMATTER_BODY, tokens);
    const blocks = extractSnippets(personalised);

    assert.equal(
      blocks.length,
      EXPECTED_BLOCK_COUNT,
      `${slug}: personalising campaign-meta-ads.md produced ${blocks.length} fenced blocks, expected ${EXPECTED_BLOCK_COUNT}`
    );

    blocks.forEach((block, i) => {
      const claims = findBannedClaims(block);
      assert.deepEqual(
        claims,
        [],
        `${slug}, fenced block #${i + 1}: banned word(s) ${JSON.stringify(claims)} in copy that ships as an advert:\n---\n${block}\n---`
      );

      const leaks = findBrandLeaks(block);
      assert.deepEqual(
        leaks,
        [],
        `${slug}, fenced block #${i + 1}: brand leak ${JSON.stringify(leaks)} in copy that ships as an advert:\n---\n${block}\n---`
      );

      assert.doesNotMatch(
        block,
        /\{\{|\}\}/,
        `${slug}, fenced block #${i + 1}: unresolved token placeholder survived substitution:\n---\n${block}\n---`
      );
    });
  }
});
