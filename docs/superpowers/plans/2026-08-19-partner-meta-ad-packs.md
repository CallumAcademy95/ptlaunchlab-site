# Partner Meta Ad Packs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a per-gym Meta ad pack — two concepts at 1080×1080 and 1080×1920, plus matching ad copy — for each of the 9 real partner gyms, and ship it into the partner portal after Callum approves a contact sheet.

**Architecture:** Pure, testable logic lives in `scripts/lib/*.mjs` and is exercised by `node --test`. The renderer is a thin script over `scripts/render-image.mjs` (headless Chrome → sharp), exactly as `scripts/gym-tv-slides.mjs` already is. Per-gym personalisation is token substitution over data already in `scripts/gym-brands.json`. Ad copy ships as a playbook markdown entry so the existing copy-to-clipboard panels work.

**Tech Stack:** Node 22 (native TS type-stripping, `node:test`), sharp, headless Chrome, Next.js 15 App Router, Supabase (`pp_resources`, `partner-resources` private bucket), Google Places API, Anthropic SDK (`@anthropic-ai/sdk`, already a dependency).

## Global Constraints

- **9 real gyms.** `scripts/gym-brands.json` has 10 entries; `demo` is skipped everywhere.
- **Output sizes are exactly 1080×1080 and 1080×1920.** No other size.
- **PNG, not JPEG.** Text must stay crisp.
- **Vertical safe zones: top 250px and bottom 340px of the 1080×1920 must contain no text.**
- **White-label rule.** No rendered graphic and no ad copy may contain the string `PT Launch Lab`. It is the gym's academy.
- **Claim gate.** No rendered graphic and no ad copy may contain job-offer language. Banned, case-insensitive, whole-word: `interview`, `guarantee`, `guaranteed`, `hiring`, `hire`, `job`, `jobs`, `vacancy`, `vacancies`, `recruit`, `recruiting`, `recruitment`. Education language only: "nationally recognised Level 3 qualification".
- **No `_shared` photo fallback.** Unlike `gym-tv-slides.mjs`. No photos means the photo-free layout.
- **Nothing is uploaded to `pp_resources` before Callum approves the contact sheet.**
- **`pp_resources.category` stays `digital`.** No new category key — it sits behind a CHECK constraint and live DDL on the partner DB is out of scope.
- **Locked PNGs only.** No editable source files for partners.
- Tests: `npm run test:unit` runs `node --test "tests/*.test.mts"`.
- Commit only files this plan names. The working tree carries ~29 files of unrelated uncommitted work — never `git add -A`, never stash.

---

### Task 1: Brand data and local logos

**Files:**
- Modify: `scripts/gym-brands.json`
- Create: `scripts/fetch-gym-logos.mjs`
- Create: `tests/gymBrands.test.mts`

**Interfaces:**
- Consumes: nothing.
- Produces: every real gym in `gym-brands.json` gains `location` (string), `adTown` (short town name used in ad copy and headlines), `siteUrl` (string), and a `logoUrl` that is a local `/gym-logos/<slug>.png` path. Adds `logoHasAlpha` (boolean) per gym, consumed by Task 2's `logoTreatmentFor`.

- [ ] **Step 1: Write the failing test**

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --test-name-pattern="gym"`
Expected: FAIL — `6fit has no location`, `has no adTown`, `has no siteUrl`, logos are remote URLs.

- [ ] **Step 3: Write the logo fetcher**

```javascript
// scripts/fetch-gym-logos.mjs
/**
 * Pull every partner logo local.
 *
 *   node --use-system-ca scripts/fetch-gym-logos.mjs
 *
 * Five logos were remote URLs fetched by headless Chrome at render time —
 * fragile, unknown resolution, and they break silently when a gym redesigns
 * their site. This downloads each once into public/gym-logos/<slug>.png and
 * records whether it carries an alpha channel.
 *
 * Ebor's source is a JPEG on Wix. JPEG has no alpha, so on a dark ad it renders
 * as a white rectangle. Rather than guess at background removal, we record
 * logoHasAlpha:false and the renderer gives that gym a deliberate white plate
 * behind the logo, so a solid-background logo reads as intentional.
 *
 * `--use-system-ca` is required: plain Node fetch fails TLS on this machine.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const BRANDS_PATH = new URL("./gym-brands.json", import.meta.url);
const brands = JSON.parse(readFileSync(BRANDS_PATH, "utf8"));
const OUT_DIR = path.join(process.cwd(), "public", "gym-logos");
mkdirSync(OUT_DIR, { recursive: true });

for (const [slug, brand] of Object.entries(brands)) {
  if (slug === "demo") continue;

  const src = brand.logoUrl;
  const out = path.join(OUT_DIR, `${slug}.png`);

  let buf;
  if (/^https?:/i.test(src)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`${slug}: logo fetch failed ${res.status} ${src}`);
    buf = Buffer.from(await res.arrayBuffer());
  } else {
    buf = readFileSync(path.join(process.cwd(), "public", src.replace(/^\//, "")));
  }

  // Normalise to PNG at a size that survives a 1080px canvas without upscaling.
  const png = await sharp(buf).resize({ width: 600, withoutEnlargement: true }).png().toBuffer();
  writeFileSync(out, png);

  const meta = await sharp(png).metadata();
  brand.logoUrl = `/gym-logos/${slug}.png`;
  brand.logoHasAlpha = Boolean(meta.hasAlpha);
  console.log(`${slug.padEnd(16)} ${meta.width}x${meta.height} alpha=${brand.logoHasAlpha}`);
}

writeFileSync(BRANDS_PATH, JSON.stringify(brands, null, 2) + "\n", "utf8");
console.log("gym-brands.json updated");
```

- [ ] **Step 4: Add the missing brand data**

Edit `scripts/gym-brands.json` by hand. For each real gym add `location` (where missing), `adTown`, and `siteUrl`:

| slug | location | adTown | siteUrl |
|---|---|---|---|
| `6fit` | `Wibsey, Bradford` | `Wibsey` | `https://6fitgyms.co.uk` |
| `ebor` | `York` | `York` | `https://www.eborfitness.co.uk` |
| `gym-n-go` | `Forest Hill, South London` | `Forest Hill` | `https://www.gymngo.co.uk` |
| `ironwolf` | `Goole` | `Goole` | `https://www.ironwolfgym.co.uk` |
| `mof` | `Bristol` | `Bristol` | `https://www.ministryoffitness.co.uk` |
| `muscle-bound` | `Bradford & Huddersfield` | `Huddersfield` | `https://www.muscleboundgymuk.co.uk` |
| `superflex` | `Upton, West Yorkshire` | `Upton` | `https://www.superflexgym.co.uk` |
| `xcelerate` | `Edgware, North London` | `Edgware` | `https://www.xceleratefitness.co.uk` |
| `hitio-orpington` | `Orpington, South East London` | `Orpington` | `https://www.hitiogym.com` |

`6fit` is Park View Mills, Wibsey Park Avenue, Bradford BD6 3QA. `mof` is Bristol per its own `heroHeadline`.

**`adTown` is deliberately not the same as `location`.** `6fit` and `muscle-bound` are both Bradford; giving them `Wibsey` and `Huddersfield` stops two partners bidding against each other for the same audience.

Any `siteUrl` above that 404s must be corrected against the gym's real site before moving on — the test only checks the shape, not that the host resolves.

- [ ] **Step 5: Run the fetcher**

Run: `node --use-system-ca scripts/fetch-gym-logos.mjs`
Expected: 9 lines of `<slug> <w>x<h> alpha=<bool>`, then `gym-brands.json updated`. `ebor` is expected to report `alpha=false`.

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run test:unit`
Expected: PASS, all 5 tests in `gymBrands.test.mts`.

- [ ] **Step 7: Commit**

```bash
git add scripts/gym-brands.json scripts/fetch-gym-logos.mjs tests/gymBrands.test.mts public/gym-logos
git commit -m "Pull partner logos local and fill the brand data ads need"
```

---

### Task 2: Ad guards

**Files:**
- Create: `scripts/lib/ad-guards.mjs`
- Create: `tests/adGuards.test.mts`

**Interfaces:**
- Consumes: `logoHasAlpha` from Task 1.
- Produces:
  - `findBannedClaims(text: string): string[]` — banned words found, lowercased, deduped.
  - `findBrandLeaks(text: string): string[]` — occurrences of `PT Launch Lab`.
  - `contrastRatio(hexA: string, hexB: string): number` — WCAG ratio, 1–21.
  - `accentFor(brand: object): string` — `darkAccent` if it clears 3:1 on the background, else white.
  - `SAFE_ZONE: { top: 250, bottom: 340 }`
  - `contentBox(width: number, height: number): { top: number, bottom: number }` — the vertical band text may occupy.
  - `logoTreatmentFor(brand: object): "bare" | "plate"`
  - `assertDimensions(meta: {width,height}, expected: {width,height}): void` — throws on mismatch.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/adGuards.test.mts
//
// WHAT THIS PROTECTS
//
// Four things that have each already gone wrong in real partner material.
//
// 1. CLAIM GATE. Superflex's live handout says "at least one guaranteed
//    interview with a partner gym"; gym-n-go/xcelerate's poster says
//    "GUARANTEED GYM INTERVIEW ON QUALIFICATION". The word *interview* appears
//    nowhere in the v3.0 agreement, whose Clause 2.2 makes the gym "solely as a
//    distribution and referral partner". Job-offer language also risks Meta
//    classing the ad as Employment, whose Special Ad Category forces a 15km
//    minimum radius and bans interest targeting — which would destroy the local
//    targeting the whole pack exists for.
// 2. WHITE-LABEL. It is the GYM'S academy. Member-facing material never names us.
// 3. CONTRAST. Ebor's primaryColor is #1A1A1A on a near-black ad — invisible.
// 4. SAFE ZONES. Meta's story UI covers the top 250px and bottom 340px.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findBannedClaims,
  findBrandLeaks,
  contrastRatio,
  accentFor,
  contentBox,
  logoTreatmentFor,
  assertDimensions,
  SAFE_ZONE,
} from "../scripts/lib/ad-guards.mjs";

// ── Claim gate ──────────────────────────────────────────────────────────────

test("the exact claim live in Superflex's handout is caught", () => {
  const found = findBannedClaims("at least one guaranteed interview with a partner gym");
  assert.deepEqual(found.sort(), ["guaranteed", "interview"]);
});

test("the exact claim on the gym-n-go poster is caught, whatever the case", () => {
  assert.deepEqual(findBannedClaims("GUARANTEED GYM INTERVIEW ON QUALIFICATION").sort(), [
    "guaranteed",
    "interview",
  ]);
});

test("education language passes clean", () => {
  assert.deepEqual(
    findBannedClaims("Nationally recognised Level 3 Personal Training qualification at Ebor Fitness"),
    [],
  );
});

test("a banned word inside a longer word is not a hit", () => {
  // "Jobson" is a surname; "hired" is not, and must still be caught.
  assert.deepEqual(findBannedClaims("Coach Jobson"), []);
  assert.deepEqual(findBannedClaims("we hire coaches"), ["hire"]);
});

// ── White-label ─────────────────────────────────────────────────────────────

test("our own name in member-facing copy is a leak", () => {
  assert.deepEqual(findBrandLeaks("Delivered by PT Launch Lab"), ["PT Launch Lab"]);
  assert.deepEqual(findBrandLeaks("Delivered by Ebor Fitness"), []);
});

// ── Contrast ────────────────────────────────────────────────────────────────

test("white on black is the maximum ratio", () => {
  assert.ok(Math.abs(contrastRatio("#FFFFFF", "#000000") - 21) < 0.05);
});

test("Ebor's primary colour is invisible on its own background", () => {
  assert.ok(contrastRatio("#1A1A1A", "#000000") < 1.5);
});

test("accentFor rejects an accent that cannot be seen and falls back to white", () => {
  // Ebor: primary #1A1A1A is unusable, darkAccent #FFFFFF is the reason
  // darkAccent exists on the config at all.
  assert.equal(accentFor({ primaryColor: "#1A1A1A", darkAccent: "#FFFFFF", heroBg: "#000000" }), "#FFFFFF");
  // Iron Wolf's orange clears 3:1 on black and is used as-is.
  assert.equal(accentFor({ primaryColor: "#f15927", darkAccent: null, heroBg: "#000000" }), "#f15927");
  // A gym whose only colour is unusable still gets something legible.
  assert.equal(accentFor({ primaryColor: "#111111", darkAccent: null, heroBg: "#000000" }), "#FFFFFF");
});

// ── Safe zones ──────────────────────────────────────────────────────────────

test("the vertical content box clears Meta's story UI at both ends", () => {
  const box = contentBox(1080, 1920);
  assert.ok(box.top >= SAFE_ZONE.top, `top ${box.top} intrudes on the ${SAFE_ZONE.top}px band`);
  assert.ok(box.bottom <= 1920 - SAFE_ZONE.bottom, `bottom ${box.bottom} intrudes on the bottom band`);
});

test("the square has no story UI to avoid and uses a plain margin", () => {
  const box = contentBox(1080, 1080);
  assert.ok(box.top < SAFE_ZONE.top);
  assert.ok(box.bottom > 1080 - SAFE_ZONE.bottom);
});

// ── Logo treatment ──────────────────────────────────────────────────────────

test("a logo with no alpha gets a plate so it does not read as a white box", () => {
  assert.equal(logoTreatmentFor({ logoHasAlpha: false }), "plate");
  assert.equal(logoTreatmentFor({ logoHasAlpha: true }), "bare");
});

// ── Dimensions ──────────────────────────────────────────────────────────────

test("a render that came out the wrong size is a hard failure", () => {
  assert.throws(
    () => assertDimensions({ width: 1080, height: 1919 }, { width: 1080, height: 1920 }),
    /1080x1919/,
  );
  assertDimensions({ width: 1080, height: 1080 }, { width: 1080, height: 1080 });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — `Cannot find module '../scripts/lib/ad-guards.mjs'`.

- [ ] **Step 3: Write the implementation**

```javascript
// scripts/lib/ad-guards.mjs
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit`
Expected: PASS, 13 tests in `adGuards.test.mts`.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/ad-guards.mjs tests/adGuards.test.mts
git commit -m "Add the four gates every partner ad graphic must survive"
```

---

### Task 3: Token substitution

**Files:**
- Create: `app/lib/partner-playbook-tokens.ts`
- Create: `tests/playbookTokens.test.mts`

**Interfaces:**
- Consumes: `adTown` from Task 1.
- Produces:
  - `PlaybookTokens` — `{ gymName: string; town: string; promoCode: string | null; academyUrl: string }`
  - `applyPlaybookTokens(body: string, tokens: PlaybookTokens): string`
  - `tokensForGym(brand, origin: string): PlaybookTokens`

This lives in `app/lib/` rather than `scripts/lib/` because Task 7 calls it from the Next.js playbook renderer. It is a **separate file from `partner-playbook.ts`**, which imports `supabase-admin` and so cannot be pulled into a `node --test` run — the same reason `partner-playbook-types.ts` already exists.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/playbookTokens.test.mts
//
// WHAT THIS PROTECTS
//
// Ad copy is only worth shipping if it arrives with the gym's own name, town
// and promo code already in it — a gym owner will not do find-and-replace, and
// a placeholder left in a live Meta ad is worse than no ad at all.
//
// This substitution runs over ALL 48 existing playbook entries, so it must be
// inert on any entry that contains no tokens.

import { test } from "node:test";
import assert from "node:assert/strict";
import { applyPlaybookTokens, tokensForGym } from "../app/lib/partner-playbook-tokens.ts";

const EBOR = {
  gymName: "Ebor Fitness",
  adTown: "York",
  promoCode: null,
  canonicalPath: "/ebor-fitness",
};
const HITIO = {
  gymName: "HITIO Gym Orpington",
  adTown: "Orpington",
  promoCode: "HITIOPT",
  canonicalPath: "/hitio-orpington-academy",
};

test("tokens are built from the gym's own brand entry", () => {
  assert.deepEqual(tokensForGym(HITIO, "https://ptlaunchlab.co.uk"), {
    gymName: "HITIO Gym Orpington",
    town: "Orpington",
    promoCode: "HITIOPT",
    academyUrl: "https://ptlaunchlab.co.uk/hitio-orpington-academy",
  });
});

test("every token is replaced, including repeats", () => {
  const out = applyPlaybookTokens(
    "Train at {{gymName}}. {{gymName}} is in {{town}}. Go to {{academyUrl}}.",
    tokensForGym(EBOR, "https://ptlaunchlab.co.uk"),
  );
  assert.equal(
    out,
    "Train at Ebor Fitness. Ebor Fitness is in York. Go to https://ptlaunchlab.co.uk/ebor-fitness.",
  );
});

test("a gym with no promo code drops the sentence rather than printing null", () => {
  // Ebor is grandfathered and has no code. "Use code null" would be shipped copy.
  const out = applyPlaybookTokens(
    "Places are open.{{#promoCode}} Use code {{promoCode}}.{{/promoCode}} See you there.",
    tokensForGym(EBOR, "https://ptlaunchlab.co.uk"),
  );
  assert.equal(out, "Places are open. See you there.");
});

test("a gym with a promo code keeps the sentence", () => {
  const out = applyPlaybookTokens(
    "Places are open.{{#promoCode}} Use code {{promoCode}}.{{/promoCode}} See you there.",
    tokensForGym(HITIO, "https://ptlaunchlab.co.uk"),
  );
  assert.equal(out, "Places are open. Use code HITIOPT. See you there.");
});

test("an entry with no tokens is returned byte-for-byte", () => {
  // 48 existing playbook entries go through this. It must be inert on them.
  const body = "## The week\n\n- Guest passes for members to bring someone\n";
  assert.equal(applyPlaybookTokens(body, tokensForGym(EBOR, "https://ptlaunchlab.co.uk")), body);
});

test("an unknown token is left alone rather than blanked", () => {
  // Better a visible {{whatever}} in review than a silently empty sentence live.
  const body = "Ask {{someoneElse}} about it.";
  assert.equal(applyPlaybookTokens(body, tokensForGym(EBOR, "https://ptlaunchlab.co.uk")), body);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — `Cannot find module '../app/lib/partner-playbook-tokens.ts'`.

- [ ] **Step 3: Write the implementation**

```typescript
// app/lib/partner-playbook-tokens.ts
//
// Personalising playbook markdown for the partner reading it.
//
// Kept apart from partner-playbook.ts on purpose: that file imports
// supabase-admin, which cannot be loaded in a `node --test` run. Same split, and
// the same reason, as partner-playbook-types.ts.

export interface PlaybookTokens {
  gymName: string;
  town: string;
  promoCode: string | null;
  academyUrl: string;
}

interface GymBrand {
  gymName: string;
  adTown: string;
  promoCode: string | null;
  canonicalPath: string;
}

export function tokensForGym(brand: GymBrand, origin: string): PlaybookTokens {
  return {
    gymName: brand.gymName,
    town: brand.adTown,
    promoCode: brand.promoCode,
    academyUrl: `${origin.replace(/\/$/, "")}${brand.canonicalPath}`,
  };
}

/**
 * Substitute {{token}} values into playbook markdown.
 *
 * Also supports one conditional block, {{#promoCode}}…{{/promoCode}}, which is
 * dropped entirely when the gym has no code. The grandfathered partners (Ebor
 * among them) have promoCode: null, and "Use code null" is the kind of thing
 * that gets pasted straight into a live ad.
 *
 * Runs over all 48 existing entries, so it is inert on markdown with no tokens,
 * and leaves unknown tokens visible rather than blanking them — a stray
 * {{whatever}} is caught in review, an empty sentence is not.
 */
export function applyPlaybookTokens(body: string, tokens: PlaybookTokens): string {
  const withConditionals = body.replace(
    /\{\{#promoCode\}\}([\s\S]*?)\{\{\/promoCode\}\}/g,
    (_match, inner: string) => (tokens.promoCode ? inner : ""),
  );

  return withConditionals.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = (tokens as Record<string, string | null>)[key];
    return typeof value === "string" ? value : match;
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit`
Expected: PASS, 6 tests in `playbookTokens.test.mts`.

- [ ] **Step 5: Commit**

```bash
git add app/lib/partner-playbook-tokens.ts tests/playbookTokens.test.mts
git commit -m "Personalise playbook markdown per partner gym"
```

---

### Task 4: PNG output from the shared renderer

**Files:**
- Modify: `scripts/render-image.mjs:38-42`

**Interfaces:**
- Consumes: nothing.
- Produces: `renderHtml(html, { width, height, out, quality, name, format })` where `format` is `"jpeg"` (default, unchanged for every existing caller) or `"png"`.

- [ ] **Step 1: Read the current implementation**

Run: `sed -n '15,45p' scripts/render-image.mjs`
Expected: `renderHtml` ends with `await sharp(tmpPng).jpeg({ quality, mozjpeg: true }).toFile(out)` — JPEG is hardcoded, so an ad's type would be rendered then JPEG-compressed.

- [ ] **Step 2: Add the format option**

Replace the compression line and its surroundings:

```javascript
  // Ad creatives are PNG: they are almost entirely type, and JPEG ringing on
  // hard edges is visible at 1080px. gbp-* and gym-tv-slides are photographic
  // and stay on JPEG, so this defaults to jpeg and no existing caller changes.
  const pipeline = sharp(tmpPng);
  await (format === "png" ? pipeline.png({ compressionLevel: 9 }) : pipeline.jpeg({ quality, mozjpeg: true })).toFile(out);
```

and widen the signature on line 17:

```javascript
export async function renderHtml(html, { width, height, out, quality = 92, name = "render", format = "jpeg" }) {
```

- [ ] **Step 3: Verify no existing caller changed behaviour**

Run: `grep -rn "renderHtml(" scripts/ | grep -v "render-image.mjs"`
Expected: every hit is from `gbp-cover.mjs`, `gbp-partnership.mjs` or `gym-tv-slides.mjs`, and none passes `format` — so all still get JPEG.

- [ ] **Step 4: Smoke-test both formats**

```bash
node --use-system-ca -e "
import('./scripts/render-image.mjs').then(async ({ renderHtml }) => {
  const html = '<html><body style=\"width:1080px;height:1080px;background:#000\"></body></html>';
  const png = await renderHtml(html, { width: 1080, height: 1080, out: 'C:/tmp/fmt.png', name: 'fmt', format: 'png' });
  const jpg = await renderHtml(html, { width: 1080, height: 1080, out: 'C:/tmp/fmt.jpg', name: 'fmt' });
  console.log(png.format, png.width + 'x' + png.height, '|', jpg.format, jpg.width + 'x' + jpg.height);
});
"
```

Expected: `png 1080x1080 | jpeg 1080x1080`

- [ ] **Step 5: Commit**

```bash
git add scripts/render-image.mjs
git commit -m "Let the shared renderer emit PNG for type-heavy creatives"
```

---

### Task 5: The ad renderer

**Files:**
- Create: `scripts/lib/ad-concepts.mjs`
- Create: `scripts/gym-ad-creatives.mjs`
- Create: `tests/adConcepts.test.mts`

**Interfaces:**
- Consumes: `accentFor`, `contentBox`, `logoTreatmentFor`, `findBannedClaims`, `findBrandLeaks`, `assertDimensions` (Task 2); `applyPlaybookTokens`, `tokensForGym` (Task 3); `renderHtml` with `format: "png"` (Task 4).
- Produces:
  - `CONCEPTS` — array of `{ id, eyebrow, headline: string[], accentLine, sub, footer }`, all containing `{{token}}` placeholders.
  - `SIZES` — `[{ w: 1080, h: 1080 }, { w: 1080, h: 1920 }]`
  - `conceptText(concept, tokens): { eyebrow, headline, accentLine, sub, footer }` — fully substituted.
  - `allConceptStrings(concept, tokens): string[]` — every user-visible string, for the gates.
  - Output files: `ad-assets/gym-ads/<slug>/<conceptId>-<w>x<h>.png` and `.html`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/adConcepts.test.mts
//
// WHAT THIS PROTECTS
//
// That the copy we are about to paint onto 36 graphics for 9 partner gyms is
// clean BEFORE anything renders. The claim gate and the white-label rule are
// worth nothing if they only run on files nobody re-reads.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CONCEPTS, SIZES, conceptText, allConceptStrings } from "../scripts/lib/ad-concepts.mjs";
import { findBannedClaims, findBrandLeaks } from "../scripts/lib/ad-guards.mjs";
import { tokensForGym } from "../app/lib/partner-playbook-tokens.ts";

const BRANDS = JSON.parse(readFileSync(new URL("../scripts/gym-brands.json", import.meta.url), "utf8"));
const REAL = Object.entries(BRANDS).filter(([slug]) => slug !== "demo");

test("there are two concepts at two sizes", () => {
  assert.equal(CONCEPTS.length, 2);
  assert.deepEqual(SIZES, [
    { w: 1080, h: 1080 },
    { w: 1080, h: 1920 },
  ]);
});

test("no concept, for any gym, contains job-offer language", () => {
  for (const [slug, brand] of REAL) {
    const tokens = tokensForGym(brand, "https://ptlaunchlab.co.uk");
    for (const concept of CONCEPTS) {
      for (const line of allConceptStrings(concept, tokens)) {
        assert.deepEqual(findBannedClaims(line), [], `${slug}/${concept.id}: "${line}"`);
      }
    }
  }
});

test("no concept, for any gym, names PT Launch Lab", () => {
  for (const [slug, brand] of REAL) {
    const tokens = tokensForGym(brand, "https://ptlaunchlab.co.uk");
    for (const concept of CONCEPTS) {
      for (const line of allConceptStrings(concept, tokens)) {
        assert.deepEqual(findBrandLeaks(line), [], `${slug}/${concept.id}: "${line}"`);
      }
    }
  }
});

test("every token is resolved for every gym — no {{ }} survives", () => {
  for (const [slug, brand] of REAL) {
    const tokens = tokensForGym(brand, "https://ptlaunchlab.co.uk");
    for (const concept of CONCEPTS) {
      for (const line of allConceptStrings(concept, tokens)) {
        assert.doesNotMatch(line, /\{\{|\}\}/, `${slug}/${concept.id} left a placeholder: "${line}"`);
      }
    }
  }
});

test("the local concept names the gym's own town", () => {
  const brand = BRANDS["6fit"];
  const text = conceptText(
    CONCEPTS.find((c) => c.id === "local"),
    tokensForGym(brand, "https://ptlaunchlab.co.uk"),
  );
  // 6fit and muscle-bound are both Bradford; 6fit advertises into Wibsey.
  assert.match(text.accentLine, /WIBSEY/i);
});

test("headline lines stay short enough to set large", () => {
  for (const [slug, brand] of REAL) {
    const tokens = tokensForGym(brand, "https://ptlaunchlab.co.uk");
    for (const concept of CONCEPTS) {
      const text = conceptText(concept, tokens);
      for (const line of [...text.headline, text.accentLine]) {
        assert.ok(line.length <= 34, `${slug}/${concept.id} line too long (${line.length}): "${line}"`);
      }
    }
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — `Cannot find module '../scripts/lib/ad-concepts.mjs'`.

- [ ] **Step 3: Write the concepts module**

```javascript
// scripts/lib/ad-concepts.mjs
/**
 * The two ad concepts, as data.
 *
 * Kept apart from the renderer so the copy can be gated by `npm run test:unit`
 * without launching Chrome — the claim gate and the white-label rule matter
 * most before 36 files exist, not after.
 *
 * Every string is education language. Nothing here offers work, an introduction
 * or an interview: the v3.0 agreement makes the gym "solely as a distribution
 * and referral partner", and job-offer framing risks Meta's Employment Special
 * Ad Category, whose 15km minimum radius would destroy the local targeting.
 */
import { applyPlaybookTokens } from "../../app/lib/partner-playbook-tokens.ts";

export const SIZES = [
  { w: 1080, h: 1080 },
  { w: 1080, h: 1920 },
];

export const CONCEPTS = [
  {
    id: "already-here",
    label: "You're already here",
    eyebrow: "{{gymName}} ACADEMY",
    headline: ["YOU'RE ALREADY HERE", "FIVE DAYS A WEEK."],
    accentLine: "QUALIFY WHILE YOU TRAIN.",
    sub: "A nationally recognised Level 3 Personal Training qualification, studied at {{gymName}}.",
    footer: "Next intake open",
  },
  {
    id: "local",
    label: "Without leaving town",
    eyebrow: "{{gymName}} ACADEMY",
    headline: ["QUALIFY AS A", "PERSONAL TRAINER"],
    accentLine: "WITHOUT LEAVING {{town}}.",
    sub: "A nationally recognised Level 3 qualification, delivered at {{gymName}}.",
    footer: "Next intake open",
  },
];

/** Every field of a concept with the gym's own details substituted in. */
export function conceptText(concept, tokens) {
  const t = (s) => applyPlaybookTokens(s, tokens);
  return {
    eyebrow: t(concept.eyebrow).toUpperCase(),
    headline: concept.headline.map(t),
    accentLine: t(concept.accentLine).toUpperCase(),
    sub: t(concept.sub),
    footer: t(concept.footer),
  };
}

/** Flat list of every user-visible string, for the gates to scan. */
export function allConceptStrings(concept, tokens) {
  const text = conceptText(concept, tokens);
  return [text.eyebrow, ...text.headline, text.accentLine, text.sub, text.footer];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit`
Expected: PASS, 6 tests in `adConcepts.test.mts`.

- [ ] **Step 5: Write the renderer**

```javascript
// scripts/gym-ad-creatives.mjs
/**
 * Meta ad graphics for partner gyms.
 *
 *   node --use-system-ca scripts/gym-ad-creatives.mjs           # every gym
 *   node --use-system-ca scripts/gym-ad-creatives.mjs ebor      # one gym
 *
 * Two concepts × two sizes per gym → ad-assets/gym-ads/<slug>/. The partner runs
 * these from their own Meta account with their own money, so nothing here
 * carries our branding: it is their academy, in their town, under their logo.
 *
 * PHOTO-FREE BY DEFAULT. Unlike gym-tv-slides.mjs there is NO _shared fallback.
 * Generic stock in a paid ad running in the gym's own town undercuts the exact
 * claim the ad makes. Real photographs in partner-photos/<slug>/ are used the
 * moment they exist (see harvest-gym-photos.mjs) and nothing else ever is.
 */
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { renderHtml } from "./render-image.mjs";
import { CONCEPTS, SIZES, conceptText, allConceptStrings } from "./lib/ad-concepts.mjs";
import {
  accentFor,
  contentBox,
  logoTreatmentFor,
  findBannedClaims,
  findBrandLeaks,
  assertDimensions,
} from "./lib/ad-guards.mjs";
import { tokensForGym } from "../app/lib/partner-playbook-tokens.ts";

const BRANDS = JSON.parse(readFileSync(new URL("./gym-brands.json", import.meta.url), "utf8"));
const ROOT = process.cwd();
const ORIGIN = "https://ptlaunchlab.co.uk";
const OUT_ROOT = path.join(ROOT, "ad-assets", "gym-ads");

const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));

function localUrl(publicPath) {
  const abs = path.join(ROOT, "public", publicPath.replace(/^\//, ""));
  if (!existsSync(abs)) throw new Error(`missing asset: ${abs}`);
  return "file:///" + abs.replace(/\\/g, "/");
}

/** A gym's own photographs, or none. Never _shared. */
function photoFor(slug) {
  const dir = path.join(ROOT, "partner-photos", slug);
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return files.length ? "file:///" + path.join(dir, files[0]).replace(/\\/g, "/") : null;
}

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Poppins:wght@400;500;600;700&display=swap');`;

function markup(brand, text, { w, h, photo }) {
  const accent = accentFor(brand);
  const bg = brand.heroBg || "#000000";
  const box = contentBox(w, h);
  const plate = logoTreatmentFor(brand) === "plate";
  const logo = localUrl(brand.logoUrl);
  const tall = h === 1920;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;background:${bg};font-family:Poppins,sans-serif;color:#fff;
  overflow:hidden;position:relative}
.photo{position:absolute;inset:0;background:url('${photo ?? ""}') center/cover no-repeat;
  filter:brightness(.32) saturate(.85)}
.scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.55),rgba(0,0,0,.85))}
.stage{position:absolute;left:88px;right:88px;top:${box.top}px;bottom:${h - box.bottom}px;
  display:flex;flex-direction:column;justify-content:${tall ? "center" : "flex-end"}}
.logo{height:${tall ? 118 : 96}px;object-fit:contain;object-position:left center;align-self:flex-start;
  ${plate ? "background:#fff;padding:14px 20px;border-radius:14px;" : ""}}
.eyebrow{margin-top:${tall ? 40 : 30}px;font-family:Poppins;font-weight:600;letter-spacing:.16em;
  font-size:${tall ? 30 : 26}px;color:${accent}}
h1{margin-top:18px;font-family:'Barlow Condensed',sans-serif;font-weight:800;line-height:.94;
  font-size:${tall ? 116 : 92}px;letter-spacing:-.01em;text-transform:uppercase}
h1 .accent{color:${accent}}
.sub{margin-top:${tall ? 34 : 26}px;font-size:${tall ? 32 : 27}px;line-height:1.42;color:#E8EDF4;
  max-width:${tall ? 880 : 820}px}
.rule{margin-top:${tall ? 40 : 30}px;width:120px;height:7px;background:${accent};border-radius:4px}
.footer{margin-top:${tall ? 30 : 22}px;font-weight:600;font-size:${tall ? 30 : 25}px;color:#fff}
</style></head><body>
${photo ? `<div class="photo"></div><div class="scrim"></div>` : ""}
<div class="stage">
  <img class="logo" src="${logo}">
  <div class="eyebrow">${text.eyebrow}</div>
  <h1>${text.headline.join("<br>")}<br><span class="accent">${text.accentLine}</span></h1>
  <div class="sub">${text.sub}</div>
  <div class="rule"></div>
  <div class="footer">${text.footer}</div>
</div>
</body></html>`;
}

const slugs = Object.keys(BRANDS).filter((s) => s !== "demo" && (!only.length || only.includes(s)));
if (!slugs.length) throw new Error(`no such gym: ${only.join(", ")}`);

for (const slug of slugs) {
  const brand = BRANDS[slug];
  const tokens = tokensForGym(brand, ORIGIN);
  const outDir = path.join(OUT_ROOT, slug);
  mkdirSync(outDir, { recursive: true });
  const photo = photoFor(slug);

  for (const concept of CONCEPTS) {
    // Gate the copy before a single pixel is painted.
    for (const line of allConceptStrings(concept, tokens)) {
      const banned = findBannedClaims(line);
      if (banned.length) throw new Error(`${slug}/${concept.id}: banned claim ${banned.join(", ")} in "${line}"`);
      const leaks = findBrandLeaks(line);
      if (leaks.length) throw new Error(`${slug}/${concept.id}: white-label leak in "${line}"`);
    }

    const text = conceptText(concept, tokens);
    for (const { w, h } of SIZES) {
      const html = markup(brand, text, { w, h, photo });
      const base = `${concept.id}-${w}x${h}`;
      writeFileSync(path.join(outDir, `${base}.html`), html, "utf8");
      const meta = await renderHtml(html, {
        width: w,
        height: h,
        out: path.join(outDir, `${base}.png`),
        name: `ad-${slug}-${base}`,
        format: "png",
      });
      assertDimensions(meta, { width: w, height: h });
      console.log(`${slug.padEnd(16)} ${base.padEnd(24)} ${photo ? "photo" : "flat"}`);
    }
  }
}

console.log(`\n${slugs.length} gyms × ${CONCEPTS.length} concepts × ${SIZES.length} sizes = ${slugs.length * CONCEPTS.length * SIZES.length} graphics`);
console.log(`Output: ${OUT_ROOT}`);
```

- [ ] **Step 6: Render one gym and look at it**

Run: `node --use-system-ca scripts/gym-ad-creatives.mjs ironwolf`
Expected: 4 lines ending `flat`, then the summary. Open `ad-assets/gym-ads/ironwolf/local-1080x1920.png` and confirm the logo is visible, the orange accent reads against black, and no text sits in the top or bottom bands.

- [ ] **Step 7: Render all 9**

Run: `node --use-system-ca scripts/gym-ad-creatives.mjs`
Expected: `9 gyms × 2 concepts × 2 sizes = 36 graphics`. Ebor's logo should sit on a white plate.

- [ ] **Step 8: Commit**

```bash
git add scripts/lib/ad-concepts.mjs scripts/gym-ad-creatives.mjs tests/adConcepts.test.mts .gitignore
git commit -m "Render two Meta ad concepts per partner gym at both Meta sizes"
```

**Before committing, add the output directory to `.gitignore`.** Line 55 already carries `/ad-assets/gym-tv/` but there is nothing for `gym-ads`, so 36 PNGs would otherwise be committed. Add directly below it:

```
/ad-assets/gym-ads/
```

`/partner-photos/*/` at `.gitignore:58` already covers Task 8's harvested imagery — no change needed there.

---

### Task 6: Contact sheet and the approval gate

**Files:**
- Create: `scripts/gym-ad-contact-sheet.mjs`

**Interfaces:**
- Consumes: the PNGs written by Task 5.
- Produces: `ad-assets/gym-ads/_review/contact-sheet.html` — every graphic, grouped by gym, at review size.

There is no unit test here: the deliverable is a page for a human to look at, and its only real assertion is "all 36 are present", which the script checks and reports.

- [ ] **Step 1: Write the contact sheet builder**

```javascript
// scripts/gym-ad-contact-sheet.mjs
/**
 * One page showing every rendered ad, for Callum to approve before upload.
 *
 *   node scripts/gym-ad-contact-sheet.mjs
 *
 * Nothing reaches pp_resources until this has been looked at. Opening 36 PNGs
 * one at a time is how a wrong logo or a clipped headline reaches nine gyms.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { CONCEPTS, SIZES } from "./lib/ad-concepts.mjs";

const BRANDS = JSON.parse(readFileSync(new URL("./gym-brands.json", import.meta.url), "utf8"));
const OUT_ROOT = path.join(process.cwd(), "ad-assets", "gym-ads");
const REVIEW = path.join(OUT_ROOT, "_review");
mkdirSync(REVIEW, { recursive: true });

const slugs = Object.keys(BRANDS).filter((s) => s !== "demo");
const missing = [];
let sections = "";

for (const slug of slugs) {
  const brand = BRANDS[slug];
  let cards = "";
  for (const concept of CONCEPTS) {
    for (const { w, h } of SIZES) {
      const file = `${concept.id}-${w}x${h}.png`;
      const abs = path.join(OUT_ROOT, slug, file);
      if (!existsSync(abs)) {
        missing.push(`${slug}/${file}`);
        continue;
      }
      cards += `<figure><img src="../${slug}/${file}"><figcaption>${concept.label} · ${w}×${h}</figcaption></figure>`;
    }
  }
  sections += `<section><h2>${brand.gymName}</h2><p class="meta">${brand.adTown} · accent ${brand.darkAccent || brand.primaryColor} · logo ${brand.logoHasAlpha ? "transparent" : "plated"}</p><div class="row">${cards}</div></section>`;
}

const expected = slugs.length * CONCEPTS.length * SIZES.length;
writeFileSync(
  path.join(REVIEW, "contact-sheet.html"),
  `<!doctype html><meta charset="utf-8"><title>Partner ad packs — review</title><style>
body{background:#0A0A0A;color:#fff;font:15px/1.5 system-ui,sans-serif;margin:0;padding:32px}
h1{font-size:26px;margin:0 0 4px} .count{color:#9aa;margin-bottom:32px}
section{margin-bottom:44px;border-top:1px solid #222;padding-top:22px}
h2{font-size:20px;margin:0} .meta{color:#8a94a0;font-size:13px;margin:2px 0 16px}
.row{display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start}
figure{margin:0} img{height:420px;width:auto;display:block;background:#111;border:1px solid #222}
figcaption{color:#8a94a0;font-size:12px;margin-top:6px}
.missing{background:#3a1114;border:1px solid #7d2731;padding:14px 18px;border-radius:8px;margin-bottom:24px}
</style>
<h1>Partner Meta ad packs — review</h1>
<p class="count">${expected - missing.length} of ${expected} rendered</p>
${missing.length ? `<div class="missing"><strong>Missing:</strong> ${missing.join(", ")}</div>` : ""}
${sections}`,
  "utf8",
);

console.log(`${expected - missing.length}/${expected} rendered`);
if (missing.length) console.log(`MISSING: ${missing.join(", ")}`);
console.log(path.join(REVIEW, "contact-sheet.html"));
```

- [ ] **Step 2: Build it and check the count**

Run: `node scripts/gym-ad-contact-sheet.mjs`
Expected: `36/36 rendered` and the output path. Anything less prints a `MISSING:` list.

- [ ] **Step 3: Open it**

Run: `start "" "ad-assets/gym-ads/_review/contact-sheet.html"`
Check per gym: logo present and right way round, accent visible against the background, no text clipped, no text in the top/bottom bands of the 1080×1920, and the town on the `local` concept is the gym's own.

- [ ] **Step 4: Commit**

```bash
git add scripts/gym-ad-contact-sheet.mjs
git commit -m "Build a contact sheet so every ad is reviewed before upload"
```

- [ ] **Step 5: STOP — get Callum's approval**

The approval gate binds **Task 9 (upload)** — nothing reaches `pp_resources` until Callum has seen a contact sheet and said yes.

Tasks 7 (playbook copy) and 8 (harvester) are independent of approval and may proceed. Note that Task 8 adds photographs and re-renders, so **the sheet Callum approves is the one built after Task 8**, not this first flat one. This first sheet is for catching layout and branding faults early.

---

### Task 7: Ad copy in the playbook

**Files:**
- Create: `partner-playbook/campaign-meta-ads.md`
- Modify: `app/lib/partner-playbook.ts`
- Modify: `app/partners/(portal)/playbook/page.tsx`
- Modify: `app/lib/partner-resources.ts:18`

**Interfaces:**
- Consumes: `applyPlaybookTokens`, `tokensForGym` (Task 3).
- Produces: `getPlaybookEntries(...)` gains an optional tokens argument; playbook markdown is personalised per signed-in partner.

- [ ] **Step 1: Read how entries are currently loaded and rendered**

Run: `sed -n '60,120p' app/lib/partner-playbook.ts && sed -n '1,40p' 'app/partners/(portal)/playbook/page.tsx'`
Expected: entries are read from `PLAYBOOK_DIR`, frontmatter parsed, body passed to `marked`, snippets extracted by regex. The page calls `requirePartner()`.

- [ ] **Step 2: Write the ad copy entry**

```markdown
<!-- partner-playbook/campaign-meta-ads.md -->
---
title: Meta ads — your ad pack
type: campaign
channel: Facebook & Instagram
when_to_use: You want to put paid budget behind the academy in your own area
order: 15
---

Your ad graphics are in **Resources → Digital & screens**: two concepts, each at
1080×1080 for feed and 1080×1920 for stories and reels. They carry your logo and
your colours, not ours — as far as anyone seeing them is concerned, this is your
academy, which is exactly what it is.

Below is the copy that goes with each one. Paste it straight into Ads Manager.

## Concept 1 — "You're already here"

Best for people who already train, including your own members. Warmest audience,
cheapest clicks, and your name does the work.

Primary text:

```
You're in {{gymName}} four or five times a week already.

Some of the people on that floor are qualified to coach. Most of them started exactly where you are.

{{gymName}} now runs its own Personal Training academy — a nationally recognised Level 3 qualification, studied around your own training, in the gym you already know.

No commute to a college. No stopping work. The next intake is open.{{#promoCode}}

Use code {{promoCode}} when you enrol.{{/promoCode}}
```

Headline:

```
Qualify where you already train
```

Description:

```
Nationally recognised Level 3
```

Website URL:

```
{{academyUrl}}
```

## Concept 2 — "Without leaving {{town}}"

Best for a colder local audience — people who don't train with you yet.

Primary text:

```
You don't have to leave {{town}} to qualify as a Personal Trainer.

{{gymName}} runs its own academy — a nationally recognised Level 3 Personal Training qualification, delivered right here.

You already know the gym. You already know the coaches. Study where you train.

Places on the next intake are open now.{{#promoCode}}

Use code {{promoCode}} when you enrol.{{/promoCode}}
```

Headline:

```
Qualify as a PT in {{town}}
```

Description:

```
Study at {{gymName}}
```

Website URL:

```
{{academyUrl}}
```

## One rule worth keeping

Describe the **qualification**, never a position, an introduction or an interview.
Two reasons. It is what the agreement supports — you are a distribution and
referral partner, and nothing promises anyone work at the end. And Meta treats
job adverts as a special category: an ad it reads that way loses interest
targeting, loses lookalikes, and is forced to a 15km minimum radius, which is the
opposite of what you want when you are advertising to your own town.

Talk about the course. It converts better anyway.
```

- [ ] **Step 3: Thread tokens through the loader**

In `app/lib/partner-playbook.ts`, add the import and apply the substitution to the body before `marked` and before snippet extraction, so the copy panels contain the personalised text:

```typescript
import { applyPlaybookTokens, type PlaybookTokens } from "./partner-playbook-tokens";
```

Change the entry-building function to accept `tokens: PlaybookTokens | null` and, where it currently has the raw `body`, insert:

```typescript
  // Personalise before rendering AND before snippets are pulled out, so the
  // copy-to-clipboard panels hand the partner their own gym name and code
  // rather than a {{token}} they would have to find and replace.
  const personalised = tokens ? applyPlaybookTokens(body, tokens) : body;
```

then use `personalised` in place of `body` for both `extractSnippets(...)` and `marked(...)`. Thread `tokens` down from the exported `getPlaybookEntries` signature.

- [ ] **Step 4: Pass the partner's tokens from the page**

In `app/partners/(portal)/playbook/page.tsx`, the page already resolves the partner. Build tokens from the gym's brand entry and pass them in:

```typescript
import brands from "@/scripts/gym-brands.json";
import { tokensForGym } from "@/app/lib/partner-playbook-tokens";

// inside the page component, after requirePartner()
const brand = (brands as Record<string, any>)[partner.slug];
const tokens = brand ? tokensForGym(brand, "https://ptlaunchlab.co.uk") : null;
const entries = await getPlaybookEntries(partner.id, tokens);
```

A partner with no matching brand entry gets `null` and sees the raw markdown — visible in review, which is the intent from Task 3.

- [ ] **Step 5: Update the resources category blurb**

In `app/lib/partner-resources.ts:18`, change the `digital` blurb so partners can find the ad pack:

```typescript
  { key: "digital", label: "Digital & screens", blurb: "Meta ad graphics, social posts and gym TV adverts" },
```

- [ ] **Step 6: Verify the app compiles and the entry renders**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

Then run `npm run dev`, sign in at `/partners` as the Ebor login, open `/partners/playbook`, and confirm: the new "Meta ads — your ad pack" entry appears under campaigns; every code block shows a copy button; the text reads "Ebor Fitness" and "York" with **no `{{ }}` anywhere**; and because Ebor has `promoCode: null`, **no "Use code" line appears**.

- [ ] **Step 7: Confirm the other 47 entries are unchanged**

Spot-check `/partners/playbook` for two entries that contain no tokens (for example "Bring a friend week"). They must render exactly as before.

- [ ] **Step 8: Commit**

```bash
git add partner-playbook/campaign-meta-ads.md app/lib/partner-playbook.ts "app/partners/(portal)/playbook/page.tsx" app/lib/partner-resources.ts
git commit -m "Ship per-gym Meta ad copy as a personalised playbook entry"
```

---

### Task 8: Photo harvester

**Files:**
- Create: `scripts/harvest-gym-photos.mjs`
- Modify: `.env.local` (not committed)

**Interfaces:**
- Consumes: `siteUrl` from Task 1.
- Produces: image files in `partner-photos/<slug>/` (ranked, `01.jpg` first) and `partner-photos/<slug>/_rejected/` with `_rejected/reasons.json`. Writes `placeId` back into `gym-brands.json`. Task 5's `photoFor()` picks these up with no further change.

- [ ] **Step 1: Add the two API keys**

Neither key is in this project. Copy them across:

```bash
grep "^GOOGLE_PLACES_API_KEY=" /c/Projects/pt-launch-lab-pt-app/.env.local >> .env.local
grep "^ANTHROPIC_API_KEY=" /c/Projects/albaco-lms/.env.local >> .env.local
```

Confirm `.env.local` is gitignored before continuing: `git check-ignore -v .env.local`

- [ ] **Step 2: Write the harvester**

```javascript
// scripts/harvest-gym-photos.mjs
/**
 * Fill partner-photos/<slug>/ with photographs of the gym's actual premises.
 *
 *   node --use-system-ca scripts/harvest-gym-photos.mjs           # every gym
 *   node --use-system-ca scripts/harvest-gym-photos.mjs ebor      # one gym
 *
 * The ads are photo-free until this runs, and that is a safe default — the
 * point of a local ad is "this is OUR gym", and generic stock breaks exactly
 * that claim. Real photographs of their floor are the upgrade.
 *
 * Two sources: the gym's Google Business Profile (usually better lit and better
 * framed than their website) and their own site.
 *
 * Faces are deprioritised deliberately. Consent given for a photo on a website
 * gallery does not obviously extend to a paid advert, and equipment and floor
 * shots make the same point with none of that question attached. sharp has no
 * face detection and filenames tell you nothing, so scoring is a vision call.
 *
 * Nothing is deleted. Rejects land in _rejected/ with the reason, so the
 * ranking can be overruled by hand.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import Anthropic from "@anthropic-ai/sdk";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!PLACES_KEY) throw new Error("GOOGLE_PLACES_API_KEY missing from .env.local");

const anthropic = new Anthropic();
const BRANDS_PATH = new URL("./gym-brands.json", import.meta.url);
const BRANDS = JSON.parse(readFileSync(BRANDS_PATH, "utf8"));
const ROOT = process.cwd();
const MIN_EDGE = 1200;
const KEEP = 8;

const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));

/** Resolve and cache the gym's Google place id from its name and town. */
async function placeIdFor(slug, brand) {
  if (brand.placeId) return brand.placeId;
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": PLACES_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName",
    },
    body: JSON.stringify({ textQuery: `${brand.gymName} ${brand.location}` }),
  });
  const body = await res.json();
  const id = body.places?.[0]?.id;
  if (!id) {
    console.warn(`${slug}: no Google place found for "${brand.gymName} ${brand.location}"`);
    return null;
  }
  console.log(`${slug}: matched "${body.places[0].displayName?.text}"`);
  brand.placeId = id;
  return id;
}

async function placePhotos(placeId) {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=photos`, {
    headers: { "X-Goog-Api-Key": PLACES_KEY },
  });
  const body = await res.json();
  return (body.photos ?? []).slice(0, 12).map(
    (p) => `https://places.googleapis.com/v1/${p.name}/media?maxWidthPx=1600&key=${PLACES_KEY}`,
  );
}

/** Images referenced by the gym's own homepage, both <img> and CSS backgrounds. */
async function sitePhotos(siteUrl) {
  let html;
  try {
    const res = await fetch(siteUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return [];
    html = await res.text();
  } catch {
    return [];
  }
  const urls = new Set();
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) urls.add(m[1]);
  for (const m of html.matchAll(/url\((["']?)([^)"']+\.(?:jpe?g|png|webp))\1\)/gi)) urls.add(m[2]);
  return [...urls]
    .map((u) => (u.startsWith("http") ? u : new URL(u, siteUrl).href))
    .filter((u) => /\.(jpe?g|png|webp)(\?|$)/i.test(u))
    .slice(0, 30);
}

/** Cheap average hash, to drop the same photo arriving from both sources. */
async function aHash(buf) {
  const px = await sharp(buf).greyscale().resize(8, 8, { fit: "fill" }).raw().toBuffer();
  const mean = px.reduce((a, b) => a + b, 0) / px.length;
  return [...px].map((v) => (v > mean ? "1" : "0")).join("");
}

async function score(buf, gymName) {
  const b64 = (await sharp(buf).resize({ width: 800 }).jpeg({ quality: 70 }).toBuffer()).toString("base64");
  const res = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b64 } },
          {
            type: "text",
            text:
              `This may be a photo of ${gymName}, a UK gym. It is a candidate background for a ` +
              `paid advert. Reply with ONLY JSON: {"hasIdentifiableFaces":bool,` +
              `"isGymInterior":bool,"usableAsAdBackground":1-5,"note":"<12 words"}. ` +
              `usableAsAdBackground judges whether dark overlaid text would sit on it legibly. ` +
              `Logos, screenshots, posters and stock collages score 1.`,
          },
        ],
      },
    ],
  });
  const text = res.content.find((c) => c.type === "text")?.text ?? "{}";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return { hasIdentifiableFaces: true, isGymInterior: false, usableAsAdBackground: 1, note: "unparseable" };
  }
}

const slugs = Object.keys(BRANDS).filter((s) => s !== "demo" && (!only.length || only.includes(s)));

for (const slug of slugs) {
  const brand = BRANDS[slug];
  const outDir = path.join(ROOT, "partner-photos", slug);
  const rejectDir = path.join(outDir, "_rejected");
  mkdirSync(rejectDir, { recursive: true });

  const placeId = await placeIdFor(slug, brand);
  const urls = [...(placeId ? await placePhotos(placeId) : []), ...(await sitePhotos(brand.siteUrl))];
  console.log(`${slug}: ${urls.length} candidates`);

  const seen = new Set();
  const scored = [];
  for (const url of urls) {
    let buf;
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!res.ok) continue;
      buf = Buffer.from(await res.arrayBuffer());
    } catch {
      continue;
    }

    const meta = await sharp(buf).metadata().catch(() => null);
    if (!meta) continue;
    if (Math.min(meta.width, meta.height) < MIN_EDGE) continue;

    const hash = await aHash(buf);
    if (seen.has(hash)) continue;
    seen.add(hash);

    scored.push({ buf, meta, verdict: await score(buf, brand.gymName) });
  }

  // Face-free gym interiors first, then by usability. A face is not an outright
  // reject — a gym with nothing else usable is better served by a good photo
  // with a person in it than by no photo at all — but it never outranks one.
  scored.sort((a, b) => {
    const rank = (s) =>
      (s.verdict.hasIdentifiableFaces ? 0 : 100) +
      (s.verdict.isGymInterior ? 20 : 0) +
      s.verdict.usableAsAdBackground;
    return rank(b) - rank(a);
  });

  const reasons = [];
  for (const [i, s] of scored.entries()) {
    const keep = i < KEEP && s.verdict.usableAsAdBackground >= 3;
    const name = `${String(i + 1).padStart(2, "0")}.jpg`;
    const jpg = await sharp(s.buf).jpeg({ quality: 88 }).toBuffer();
    writeFileSync(path.join(keep ? outDir : rejectDir, name), jpg);
    reasons.push({ file: name, kept: keep, ...s.verdict, width: s.meta.width, height: s.meta.height });
  }
  writeFileSync(path.join(rejectDir, "reasons.json"), JSON.stringify(reasons, null, 2), "utf8");
  console.log(`${slug}: kept ${reasons.filter((r) => r.kept).length}, rejected ${reasons.filter((r) => !r.kept).length}`);
}

writeFileSync(BRANDS_PATH, JSON.stringify(BRANDS, null, 2) + "\n", "utf8");
console.log("place ids cached to gym-brands.json");
```

- [ ] **Step 3: Run it on one gym first**

Run: `node --use-system-ca scripts/harvest-gym-photos.mjs ironwolf`
Expected: a matched place name, a candidate count, then `kept N, rejected M`. Open `partner-photos/ironwolf/` and check the kept shots are actually that gym. Read `_rejected/reasons.json` and sanity-check the verdicts.

- [ ] **Step 4: Run all 9**

Run: `node --use-system-ca scripts/harvest-gym-photos.mjs`
Expected: every gym reports a kept count. A gym with 0 kept simply stays photo-free, which is a valid outcome, not a failure.

- [ ] **Step 5: Re-render and review**

Run: `node --use-system-ca scripts/gym-ad-creatives.mjs && node scripts/gym-ad-contact-sheet.mjs`
Expected: gyms with photos now report `photo` instead of `flat`. Open the contact sheet and check text is still legible over each photo — if a photo fights the type, delete it from `partner-photos/<slug>/` and re-render.

- [ ] **Step 6: Commit**

```bash
git add scripts/harvest-gym-photos.mjs scripts/gym-brands.json
git commit -m "Harvest gym photographs from Places and their own sites"
```

Confirm `partner-photos/*/` stays out of the commit — `.gitignore:58` already covers it.

---

### Task 9: Upload to the portal

**Files:**
- Create: `scripts/upload-gym-ad-packs.mts`

**Interfaces:**
- Consumes: approved PNGs from Task 5, `pp_partners.slug`.
- Produces: `pp_resources` rows, `category: "digital"`, `partner_id` set per gym, objects at `<slug>/meta-ads/<conceptId>-<w>x<h>.png` in the private `partner-resources` bucket.

Modelled on `scripts/import-partner-assets.mts` — same env loading, same bucket, same idempotency rule (skip when a row with that partner and title already exists).

- [ ] **Step 1: Confirm approval**

Do not run this task until Callum has approved the Task 6 contact sheet.

- [ ] **Step 2: Write the uploader**

```typescript
// scripts/upload-gym-ad-packs.mts
/**
 * Put each gym's Meta ad pack into their resource drive.
 *
 *   npx tsx scripts/upload-gym-ad-packs.mts            # dry run
 *   npx tsx scripts/upload-gym-ad-packs.mts --apply    # upload
 *
 * Idempotent on (partner, title), the same rule import-partner-assets.mts uses,
 * so re-running after adding one gym does not re-upload thirty files.
 *
 * Category is `digital` deliberately. A new `ads` key would mean altering a
 * CHECK constraint on the live partner database, and a 201 from the Supabase
 * management API is not proof a DDL statement ran.
 *
 * PNGs go up individually rather than as a zip: the portal renders image
 * thumbnails, and a gym owner should see the ad before downloading it.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const APPLY = process.argv.includes("--apply");
const BUCKET = "partner-resources";
const URL_BASE = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const BRANDS = JSON.parse(readFileSync(new URL("./gym-brands.json", import.meta.url), "utf8"));
const { CONCEPTS, SIZES } = await import("./lib/ad-concepts.mjs");
const OUT_ROOT = path.join(process.cwd(), "ad-assets", "gym-ads");

const partnersRes = await fetch(`${URL_BASE}/rest/v1/pp_partners?select=id,slug`, { headers: H });
const partners: { id: string; slug: string }[] = await partnersRes.json();
const bySlug = new Map(partners.map((p) => [p.slug, p.id]));

const existingRes = await fetch(`${URL_BASE}/rest/v1/pp_resources?select=partner_id,title`, { headers: H });
const existing: { partner_id: string | null; title: string }[] = await existingRes.json();
const already = new Set(existing.map((r) => `${r.partner_id}::${r.title}`));

let uploaded = 0;
let skipped = 0;

for (const slug of Object.keys(BRANDS).filter((s) => s !== "demo")) {
  const partnerId = bySlug.get(slug);
  if (!partnerId) {
    console.warn(`${slug}: no pp_partners row — skipped`);
    continue;
  }

  for (const concept of CONCEPTS) {
    for (const { w, h } of SIZES) {
      const file = `${concept.id}-${w}x${h}.png`;
      const abs = path.join(OUT_ROOT, slug, file);
      if (!existsSync(abs)) {
        console.warn(`${slug}: ${file} not rendered — skipped`);
        continue;
      }

      const shape = h === 1920 ? "Story / Reel" : "Feed";
      const title = `Meta ad — ${concept.label} (${shape})`;
      if (already.has(`${partnerId}::${title}`)) {
        skipped++;
        continue;
      }

      const objectPath = `${slug}/meta-ads/${file}`;
      console.log(`${APPLY ? "UPLOAD" : "would upload"}  ${slug.padEnd(16)} ${title}`);
      if (!APPLY) continue;

      const body = readFileSync(abs);
      const put = await fetch(`${URL_BASE}/storage/v1/object/${BUCKET}/${objectPath}`, {
        method: "POST",
        headers: { ...H, "Content-Type": "image/png", "x-upsert": "true" },
        body,
      });
      if (!put.ok) throw new Error(`${slug} ${file}: storage ${put.status} ${await put.text()}`);

      const row = await fetch(`${URL_BASE}/rest/v1/pp_resources`, {
        method: "POST",
        headers: { ...H, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({
          partner_id: partnerId,
          category: "digital",
          title,
          description: `${w}×${h}. Ad copy is in your Playbook under "Meta ads — your ad pack".`,
          storage_path: objectPath,
          mime: "image/png",
          file_size: body.length,
          version: "1.0",
          sort_order: h === 1920 ? 21 : 20,
        }),
      });
      if (!row.ok) throw new Error(`${slug} ${file}: pp_resources ${row.status} ${await row.text()}`);
      uploaded++;
    }
  }
}

console.log(`\n${APPLY ? "uploaded" : "would upload"} ${uploaded}, skipped ${skipped} already present`);
```

- [ ] **Step 3: Dry run**

Run: `npx tsx scripts/upload-gym-ad-packs.mts`
Expected: 36 `would upload` lines, `uploaded 0, skipped 0`. Any `no pp_partners row` warning must be resolved before applying.

- [ ] **Step 4: Apply**

Run: `npx tsx scripts/upload-gym-ad-packs.mts --apply`
Expected: `uploaded 36, skipped 0`.

- [ ] **Step 5: Verify idempotency**

Run: `npx tsx scripts/upload-gym-ad-packs.mts --apply`
Expected: `uploaded 0, skipped 36`. Re-running must not duplicate rows.

- [ ] **Step 6: Verify a partner actually sees them**

Sign in at `/partners` as the Ebor login and open `/partners/resources`. Under **Digital & screens**, confirm four new "Meta ad — …" rows carrying the "Made for Ebor Fitness" chip, that thumbnails render, and that clicking Download returns the PNG through the 60-second signed URL.

- [ ] **Step 7: Commit**

```bash
git add scripts/upload-gym-ad-packs.mts
git commit -m "Upload each gym's Meta ad pack to their resource drive"
```

---

## Self-review

**Spec coverage:** every spec section maps to a task — brand data and the Bradford collision (1), the four gates (2), token substitution (3), PNG output and the renderer with safe zones and no `_shared` fallback (4, 5), the approval gate (6), ad copy in the playbook and the `digital` blurb (7), the harvester with Places, site crawl and vision scoring (8), upload to `pp_resources` (9).

**Two refinements on the spec, both deliberate:**
- The spec listed `placeId` as manual brand data. Task 8 resolves it automatically via Places Text Search and caches it back, so nothing is looked up by hand.
- The spec offered "a transparent PNG **or** a light-background variant" for Ebor. Task 1 detects `logoHasAlpha` and Task 2's `logoTreatmentFor` applies a plate automatically, so this needs no hand-retouched artwork and covers any future partner whose logo has the same problem.

**Known gap carried from the spec, not fixed here:** the "guaranteed interview" claim still live in Superflex's handout and the gym-n-go/xcelerate poster. The gate stops it reaching these 36 new graphics; it does not remove it from material already in partners' hands.
