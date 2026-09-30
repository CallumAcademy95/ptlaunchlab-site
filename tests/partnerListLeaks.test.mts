// tests/partnerListLeaks.test.mts
//
// WHAT THIS PROTECTS
//
// One partner learning who the other partners are.
//
// website-embed.md shipped a lookup table of all nine gyms and their embed
// addresses, shown to every partner. So any owner opening the playbook could
// read the full client list — and two of those gyms are in the same town.
// 6fit is Wibsey, Bradford; Musclebound is "BRADFORD • HUDDERSFIELD". Each
// could see the other running the same academy, which is both a commercial
// disclosure we never agreed to make and a direct contradiction of the whole
// "your academy" positioning.
//
// The existing brandLeaks test could not catch it: it looks for OUR name, not
// for other partners'. Different leak, same class of mistake.
//
// The fix was the {{embedUrl}} token, so each partner sees only their own
// address. This test is what stops a table coming back.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { tokensForGym, applyPlaybookTokens } from "../app/lib/partner-playbook-tokens.ts";

type Brand = { gymName: string; adTown: string; promoCode: string | null; canonicalPath: string };
const BRANDS = JSON.parse(
  readFileSync(new URL("../scripts/gym-brands.json", import.meta.url), "utf8")
) as Record<string, Brand>;
const REAL: [string, Brand][] = Object.entries(BRANDS).filter(([slug]) => slug !== "demo");

const DIR = new URL("../partner-playbook/", import.meta.url);
const FILES = readdirSync(DIR).filter((f) => f.endsWith(".md"));

/** Whole-word so "frameborder" cannot match "Ebor". That false positive is
 *  exactly why this is a regex with boundaries and not an includes(). */
function namesOtherGyms(text: string, mineSlug: string): string[] {
  const hits: string[] = [];
  for (const [slug, b] of REAL) {
    if (slug === mineSlug) continue;
    const name = b.gymName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${name}\\b`, "i").test(text)) hits.push(b.gymName);
    // the slug in a URL is just as identifying as the name
    const path = b.canonicalPath.replace(/^\//, "");
    if (new RegExp(`\\b${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text)) {
      hits.push(path);
    }
  }
  return [...new Set(hits)];
}

test("the playbook has entries to scan", () => {
  assert.ok(FILES.length > 40, `only found ${FILES.length} playbook entries`);
});

test("no playbook entry names another partner gym, for any reader", () => {
  for (const [mineSlug, mine] of REAL) {
    const tokens = tokensForGym(mine, "https://ptlaunchlab.co.uk");
    for (const file of FILES) {
      const raw = readFileSync(new URL(file, DIR), "utf8");
      const rendered = applyPlaybookTokens(raw, tokens);
      const leaks = namesOtherGyms(rendered, mineSlug);
      assert.deepEqual(
        leaks,
        [],
        `${file} read by ${mine.gymName}: names other partners ${JSON.stringify(leaks)}`
      );
    }
  }
});

test("the embed entry gives each gym its own address", () => {
  const raw = readFileSync(new URL("website-embed.md", DIR), "utf8");
  assert.ok(raw.includes("{{embedUrl}}"), "website-embed.md no longer uses the token");
  for (const [, b] of REAL) {
    const rendered = applyPlaybookTokens(raw, tokensForGym(b, "https://ptlaunchlab.co.uk"));
    assert.ok(
      rendered.includes(`https://ptlaunchlab.co.uk/embed${b.canonicalPath}`),
      `${b.gymName}: own embed address missing from the rendered entry`
    );
    assert.ok(!/\{\{\s*\w+\s*\}\}/.test(rendered), `${b.gymName}: unresolved token left in the entry`);
  }
});
