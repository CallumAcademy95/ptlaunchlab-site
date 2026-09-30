// tests/venueClaims.test.mts
//
// WHAT THIS PROTECTS
//
// Telling a learner they will be taught somewhere they will not.
//
// The academy is locally represented by the gym; the learning is online and
// self-paced with tutor support. Some of it genuinely happens in a gym — the
// observed session in Unit 6, the case-study client in Unit 9 — but "the Level
// 3 Certificate in Personal Training, STUDIED AT Gym n Go" tells someone they
// will be taught at that gym, and they will not be.
//
// This wording reached NINE live October graphics and both evergreen ad
// concepts before anyone looked at a rendered PNG. Every existing gate passed
// it: it is not a banned claim, not a brand leak, and not an unresolved token.
// That is the case for a gate rather than a code-review note.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { findVenueClaims } from "../scripts/lib/ad-guards.mjs";
import { CONCEPTS, conceptText } from "../scripts/lib/ad-concepts.mjs";
import { MONTHS, monthText } from "../scripts/lib/promo-calendar.mjs";

type Brand = { gymName: string; adTown?: string; location?: string; promoCode?: string; canonicalPath?: string };
const BRANDS = JSON.parse(readFileSync(new URL("../scripts/gym-brands.json", import.meta.url), "utf8")) as Record<string, Brand>;
const REAL: [string, Brand][] = Object.entries(BRANDS).filter(([slug]) => slug !== "demo");

const tokensFor = ([, b]: [string, Brand]): Record<string, string> => ({
  gymName: b.gymName,
  town: b.adTown ?? b.location ?? b.gymName,
  promoCode: b.promoCode ?? "",
});

test("the venue gate catches the wording that actually shipped", () => {
  assert.deepEqual(findVenueClaims("Personal Training, studied at Gym n Go."), ["studied at"]);
  assert.deepEqual(findVenueClaims("A Level 3 qualification, delivered at Ebor."), ["delivered at"]);
  assert.ok(findVenueClaims("classes in Leeds").length > 0);
});

test("the venue gate does not fire on accurate wording", () => {
  assert.deepEqual(findVenueClaims("Personal Training, through Gym n Go."), []);
  assert.deepEqual(findVenueClaims("a course you study around work"), []);
  // "studies" is not "studied at" — a stem that swallowed this would be useless.
  assert.deepEqual(findVenueClaims("Coach Jobson studies hard"), []);
});

test("no evergreen ad concept claims study happens at the gym", () => {
  for (const entry of REAL) {
    const t = tokensFor(entry);
    for (const c of CONCEPTS) {
      const text = conceptText(c, t);
      for (const s of [text.eyebrow, ...text.headline, text.accentLine, text.sub, text.footer]) {
        assert.deepEqual(
          findVenueClaims(s),
          [],
          `${entry[0]} / ${c.id}: venue claim in "${s}"`
        );
      }
    }
  }
});

test("no promo-calendar month claims study happens at the gym", () => {
  for (const entry of REAL) {
    const t = tokensFor(entry);
    for (const m of MONTHS) {
      const text = monthText(m, t);
      for (const s of [text.eyebrow, ...text.headline, text.accentLine, text.sub, text.footer]) {
        assert.deepEqual(
          findVenueClaims(s),
          [],
          `${entry[0]} / ${m.key}: venue claim in "${s}"`
        );
      }
    }
  }
});
