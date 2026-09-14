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
import { applyPlaybookTokens } from "../app/lib/partner-playbook-tokens.ts";
import { tokensForPortal } from "../scripts/lib/promo-calendar.mjs";
import { findBrandLeaks } from "../scripts/lib/ad-guards.mjs";

const PLAYBOOK_DIR = new URL("../partner-playbook/", import.meta.url);

const FILES = readdirSync(PLAYBOOK_DIR).filter((f) => f.endsWith(".md"));

// Mirrors the (unexported) GymBrand shape tokensForGym/tokensForPortal expect
// — same reason as the identical interface in tests/adCopy.test.mts.
interface GymBrand {
  gymName: string;
  adTown: string;
  promoCode: string | null;
  canonicalPath: string;
}

const BRANDS: Record<string, GymBrand> = JSON.parse(
  readFileSync(new URL("../scripts/gym-brands.json", import.meta.url), "utf8"),
);
const REAL = Object.entries(BRANDS).filter(([slug]) => slug !== "demo");

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
  // 0 blocks would pass this test having verified nothing at all. Not pinned
  // to an exact number here (contrast the 52-file / 8-block checks elsewhere)
  // — new fenced blocks land in these files routinely as the calendar grows,
  // and the whole-body test below is what actually closes the gap a
  // fenced-only scan leaves.
  assert.ok(totalBlocks > 0, "found 0 fenced blocks across partner-playbook — the scan verified nothing");
});

// WIDENING THE SCAN
//
// findBrandLeaks above only ever sees fenced blocks. campaign-october-two-
// qualifications.md:11 ("**The line:** *Level 2 and Level 3...*") and its
// story-poll table cell are member-facing copy — a partner reads them
// straight off the page and repeats them on the gym floor or in a caption —
// but they sit outside a fenced block, so the check above never runs on
// them. findBrandLeaks has no false-positive problem (see the file header),
// so there is no reason to hold it back from the rest of the body the way
// findBannedClaims is deliberately held back in tests/adCopy.test.mts.
test("no partner-playbook entry names PT Launch Lab anywhere in its body, fenced or not", () => {
  for (const file of FILES) {
    const raw = readFileSync(new URL(file, PLAYBOOK_DIR), "utf8");
    const body = stripFrontmatter(raw);

    // Same completeness guard as above, per file this time: a file that
    // parsed to an empty body (a frontmatter-split bug, a truncated read)
    // must not silently pass by having nothing to scan.
    assert.ok(body.trim().length > 0, `${file}: body is empty after stripping frontmatter — nothing was scanned`);

    const leaks = findBrandLeaks(body);
    assert.deepEqual(
      leaks,
      [],
      `${file}: brand leak ${JSON.stringify(leaks)} in member-facing copy outside a fenced block`
    );
  }
});

// THE GUARD THAT WAS MISSING — see FIX 2 in the whole-branch review.
//
// gym-promo-creatives.mjs has exactly this check for the rendered graphics
// (`if (line.includes("{{")) throw ...`); the playbook had nothing
// equivalent, which is how campaign-november-black-friday.md shipped with a
// literal {{monthCode}} in the portal — a token tokensForGym (what the portal
// actually calls) never supplied.
//
// This substitutes tokens with tokensForPortal — the SAME function
// app/partners/(portal)/playbook/page.tsx calls — for every real gym, over
// every playbook entry, and asserts no machine token survives. Anything
// hand-built here (a literal `{ ...tokensForGym(...), monthCode: ... }`, say)
// would test a token object nothing in production constructs, which is
// exactly the gap that let the original defect through review undetected.
//
// Scoped to /\{\{\w+\}\}/ — the exact shape applyPlaybookTokens' own regex
// looks for — rather than a bare "{{" anywhere. email-02-member-sequence.md
// deliberately uses {{First Name}} and {{Gym Name}} (Title Case, a space)
// as hand-fill placeholders for a 1:1 email a gym owner sends themselves —
// the member's first name cannot be known at portal-render time, and the
// space means applyPlaybookTokens' own \w+ regex never matches it either.
// That is a different, legitimate convention, not an unresolved token.
test("every partner-playbook entry, rendered the way the portal renders it, has no unresolved {{token}}", () => {
  assert.ok(REAL.length === 9, `expected 9 real gyms in gym-brands.json, found ${REAL.length}`);

  for (const file of FILES) {
    const raw = readFileSync(new URL(file, PLAYBOOK_DIR), "utf8");
    const body = stripFrontmatter(raw);

    for (const [slug, brand] of REAL) {
      const tokens = tokensForPortal(brand, "https://ptlaunchlab.co.uk", slug);
      const personalised = applyPlaybookTokens(body, tokens);
      assert.doesNotMatch(
        personalised,
        /\{\{\w+\}\}/,
        `${file}, gym ${slug}: unresolved token placeholder survived substitution as the portal would render it:\n---\n${personalised}\n---`
      );
    }
  }
});
