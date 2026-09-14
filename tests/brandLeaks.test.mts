// tests/brandLeaks.test.mts
//
// WHAT THIS PROTECTS
//
// The v3.0 partner agreement runs the academy under the GYM's name, not ours
// — every partner-playbook entry is copy a gym pastes and sends to its own
// members, so PT Launch Lab is never allowed to appear in it. That is the
// white-label rule: it is contractual, not ad-specific.
//
// This is a DIFFERENT rule, with a DIFFERENT scope, from the banned-claims
// gate in tests/adCopy.test.mts. That gate (findBannedClaims — interview,
// guarantee, hire, recruit, vacancy, job) exists because Meta may classify a
// job-offer-shaped AD as Employment, which forces a 15km minimum radius and
// kills local targeting. It is scoped to campaign-meta-ads.md ON PURPOSE:
// applying it to all 52 entries produces 20 false positives — phrasing like
// "designed to fit around a job", "do you actually enjoy your job?", and
// script-will-i-get-work.md's "No guarantee, no income figure, no 'we'll hire
// you.'" (the script that stops staff over-promising). Widening it would flag
// exactly the sentences that keep staff honest.
//
// findBrandLeaks has no such false-positive problem — nothing legitimate ever
// needs to write "PT Launch Lab" into copy a member will read — so unlike the
// claim gate, it belongs on every entry, not just the one file that ships as
// a Meta ad. Before this test, findBrandLeaks ran over exactly one file
// (campaign-meta-ads.md, inside adCopy.test.mts); the other 51 had no gate at
// all.
//
// Directory is scanned rather than named file-by-file. A hardcoded file list
// is exactly the kind of gap that let 51 entries go unchecked in the first
// place — a new entry must be covered on the day it is added, not on the day
// someone remembers to add it to a list here.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { extractSnippets } from "../app/lib/partner-playbook-snippets.ts";
import { findBrandLeaks } from "../scripts/lib/ad-guards.mjs";

const PLAYBOOK_DIR = new URL("../partner-playbook/", import.meta.url);

const FILES = readdirSync(PLAYBOOK_DIR).filter((f) => f.endsWith(".md"));

// Same frontmatter split as app/lib/partner-playbook.ts's parseFrontmatter —
// the portal never runs extractSnippets over the frontmatter block, so
// neither should this test. A file with no frontmatter (no match) is scanned
// whole, matching parseFrontmatter's own fallback.
function stripFrontmatter(raw: string): string {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  return match ? match[2] : raw;
}

// Checked on the RAW markdown, not the token-substituted output the portal
// actually renders (contrast tests/adCopy.test.mts, which substitutes tokens
// per gym before checking). That is deliberate, not an oversight:
//
// applyPlaybookTokens only ever inserts gym-specific data pulled from
// scripts/gym-brands.json (gymName, town, promoCode, academyUrl) — none of
// which is or contains "PT Launch Lab" (verified: 9 real gyms, 9 distinct
// gym names, none of them us). Substitution cannot introduce a brand leak
// that was not already sitting in the committed markdown, and it cannot
// launder one away either (it touches only {{token}} placeholders, never
// surrounding prose). So checking the raw body finds every leak the
// per-gym-personalised body could ever have, without repeating the same
// check nine times over — that would test the substitution mechanism, not
// the content.
test("partner-playbook scan covers the whole directory", () => {
  // A silently-wrong path here (renamed folder, moved test) would make every
  // check below vacuously pass over zero files. Pin the corpus size the task
  // measured so a scan that finds nothing — or suddenly finds much more or
  // less — fails loudly instead of rubber-stamping an empty run.
  assert.equal(FILES.length, 52, `expected 52 partner-playbook entries, found ${FILES.length}`);
});

test("no fenced copy block in any partner-playbook entry names PT Launch Lab", () => {
  let totalBlocks = 0;

  for (const file of FILES) {
    const raw = readFileSync(new URL(file, PLAYBOOK_DIR), "utf8");
    const body = stripFrontmatter(raw);
    const blocks = extractSnippets(body);
    totalBlocks += blocks.length;

    blocks.forEach((block, i) => {
      const leaks = findBrandLeaks(block);
      assert.deepEqual(
        leaks,
        [],
        `${file}, fenced block #${i + 1}: brand leak ${JSON.stringify(leaks)} in member-facing copy:\n---\n${block}\n---`
      );
    });
  }

  // Same rationale as the file-count check above: a scan that quietly found
  // 0 blocks would pass this test having verified nothing at all.
  assert.equal(totalBlocks, 78, `expected 78 fenced blocks across partner-playbook, found ${totalBlocks}`);
});
