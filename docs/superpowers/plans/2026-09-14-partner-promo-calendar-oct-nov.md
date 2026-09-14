# Partner Promo Calendar — October & November Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the October and November monthly promo packs — graphics, captions, member email and playbook entry — for all 9 partner gyms, on top of the ad-pack pipeline that currently exists only on an unmerged branch.

**Architecture:** The monthly calendar is copy-as-data (`scripts/lib/promo-calendar.mjs`), gated by `npm run test:unit` before a pixel is painted, rendered by a script that shares its markup with the existing ad-creative renderer, and uploaded into each partner's existing `pp_resources` drive. October and November only — the remaining ten months repeat Tasks 4–8 with more data.

**Tech Stack:** Node 22+ (native `.mts` type stripping, `node --test`), Next.js 15 App Router, Supabase (PostgREST + Storage), Stripe API, headless Chrome via `scripts/render-image.mjs`.

**Spec:** `docs/superpowers/specs/2026-09-14-partner-promo-calendar-design.md`

## Global Constraints

Every task's requirements implicitly include all of these.

- **Member-facing copy NEVER names PT Launch Lab.** It is the gym's academy. Enforced by `findBrandLeaks()`.
- **No job-offer language** in any graphic or fenced copy block. The live gate is `BANNED_STEM = /\b(interview|guarantee|hir|recruit|vacanc)\w*\b|\bjobs?\b/gi` in `scripts/lib/ad-guards.mjs`. `job`/`jobs` are exact alternatives, not stemmed, so the surname "Jobson" does not trip it.
- **Never attach an interview claim to a named partner gym.** v3.0 Clause 2.2 obliges no partner gym to give one. The general guarantee in `app/terms/page.tsx:130` is contracted and may be referenced; "interview at <gym>" may not.
- **No income claims, no session rates, no "it pays for itself".**
- **No scarcity language.** Banned: "LIMITED SLOTS", "HURRY 48 HOURS", emoji-hype. A factual window ("Black Friday only") is allowed; manufactured pressure is not.
- **Discounts apply to pay-in-full ONLY**, never the £599 deposit path. Enforced in `stripeCheckout.ts` off `config.allowPromotionCodes`.
- **Promo codes do not stack.** Stripe accepts one `discounts[0][promotion_code]`; a month code *replaces* the standing £200. November's £600 off £1,599 = **£999**, not £1,399 − £600.
- **Every Node script in `scripts/` runs as `node --use-system-ca <script>`.**
- **A re-render does NOT reach a partner without `--replace`** — the skip fires before the storage PUT.
- **`demo` (Northgate Strength) is excluded** from every render, upload and Stripe code. 9 live partners only.

---

### Task 1: Land the ad-pack pipeline on master

Everything downstream imports from `scripts/lib/`, which does not exist on master. `feat/partner-meta-ad-packs` (PR #3) carries it: 23 commits, **90 commits behind master**. It must be rebased, not merged.

**Files:**
- Rebase: branch `feat/partner-meta-ad-packs` onto `origin/master`
- Adds: `scripts/lib/ad-concepts.mjs`, `scripts/lib/ad-guards.mjs`, `scripts/gym-ad-creatives.mjs`, `scripts/upload-gym-ad-packs.mts`, `scripts/harvest-gym-photos.mjs`, `scripts/fetch-gym-logos.mjs`, `scripts/gym-ad-contact-sheet.mjs`, `partner-playbook/campaign-meta-ads.md`, `public/gym-logos/*.png`
- Modifies: `scripts/gym-brands.json` (adds `adTown`, `logoHasAlpha`, `siteUrl`, `placeId`), `scripts/render-image.mjs`
- Tests: `tests/adConcepts.test.mts`, `tests/adCopy.test.mts`, `tests/adGuards.test.mts`, `tests/gymBrands.test.mts`, `tests/playbookTokens.test.mts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `scripts/lib/ad-concepts.mjs` → `SIZES: {w:number,h:number}[]`, `CONCEPTS: Concept[]`, `conceptText(concept, tokens) → {eyebrow, headline: string[], accentLine, sub, footer}`, `allConceptStrings(concept, tokens) → string[]`
  - `scripts/lib/ad-guards.mjs` → `findBannedClaims(text) → string[]`, `findBrandLeaks(text) → string[]`, `contrastRatio(a,b) → number`, `accentFor(brand) → string`, `contentBox(w,h) → {top,bottom}`, `logoTreatmentFor(brand) → "bare"|"plate"`, `assertDimensions(meta, {width,height})`, `SAFE_ZONE`
  - `app/lib/partner-playbook-tokens.ts` → `PlaybookTokens {gymName, town, promoCode, academyUrl}`, `tokensForGym(brand, origin)`, `applyPlaybookTokens(body, tokens)`
  - `scripts/gym-brands.json` → keyed by slug; each has `gymName, primaryColor, darkAccent, heroBg, logoUrl, promoCode, fullPrice, depositPrice, adTown, canonicalPath, logoHasAlpha`

- [ ] **Step 1: Confirm the branch is behind, not carrying unrelated work**

```bash
git fetch origin
git log --oneline origin/master..origin/feat/partner-meta-ad-packs | wc -l   # expect 23
git log --oneline origin/feat/partner-meta-ad-packs..origin/master | wc -l   # expect ~90
git diff --stat origin/master...origin/feat/partner-meta-ad-packs | tail -5
```

Expected: 33 files, all under `scripts/`, `tests/`, `public/gym-logos/`, `partner-playbook/`. If any file outside those paths appears, STOP and report — the branch has picked up unrelated work and merging it would ship it.

- [ ] **Step 2: Rebase onto master in a worktree**

```bash
git worktree add ../ptll-adpacks feat/partner-meta-ad-packs
cd ../ptll-adpacks
git rebase origin/master
```

If conflicts arise they will be in `scripts/gym-brands.json` and `scripts/render-image.mjs` — the only two files the branch modifies rather than adds. Resolve by keeping **both** sides: master's newer gym entries plus the branch's new `adTown`/`logoHasAlpha`/`siteUrl`/`placeId` fields. Every slug must end up with an `adTown`.

- [ ] **Step 3: Run the test suite**

Run: `npm run test:unit`
Expected: PASS. The branch adds 5 test files to the 7 already on master.

- [ ] **Step 4: Verify the gate actually fires (mutation check)**

A gate that has never rejected anything is not known to work. Temporarily break one concept and confirm the suite goes red:

```bash
node -e "const f='scripts/lib/ad-concepts.mjs';const fs=require('fs');let s=fs.readFileSync(f,'utf8');fs.writeFileSync(f,s.replace('Next intake open','Guaranteed interview on completion'))"
npm run test:unit
```

Expected: **FAIL**, naming the banned claim `guaranteed` and `interview`. Then revert:

```bash
git checkout -- scripts/lib/ad-concepts.mjs
npm run test:unit   # green again
```

- [ ] **Step 5: Typecheck and build**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `npm run build`
Expected: compiles.

- [ ] **Step 6: Merge to master and clean up**

```bash
cd ../ptlaunchlab-site
git checkout master
git merge --ff-only feat/partner-meta-ad-packs
git push origin master
git worktree remove ../ptll-adpacks
```

---

### Task 2: Fix Ebor's page price

Ebor's page advertises £1,599 while `EBORPTDISCOUNT` is ACTIVE in Stripe and `partnerPromo.ts` maps Ebor to it — so checkout charges £1,399. The calendar prices every month off the standing price, and this is the only gym where the page and the checkout disagree.

**Files:**
- Modify: `app/lib/gyms/ebor-fitness.ts:26-27`
- Test: `tests/gymRegistry.test.mts`

**Interfaces:**
- Consumes: `PARTNER_STANDING_CODE` from `app/lib/partnerPromo.ts` (Task 1 independent — already on master).
- Produces: nothing new. `GymConfig` for `ebor` gains `promoCode` and `discountAmount`.

- [ ] **Step 1: Write the failing test**

Append to `tests/gymRegistry.test.mts`:

`GYMS` is keyed by **route** slug (`ebor-fitness`) and `GymConfig` carries **no** `gymSlug` field — the gym slug is set on each partner's `/enrol` page, and `app/lib/gyms/index.ts` warns in a header comment that the two must never be confused. So the test declares the mapping and asserts it stays complete.

```ts
import { PARTNER_STANDING_CODE } from "../app/lib/partnerPromo.ts";

// Route slug -> gym slug. Only two differ, both documented in
// app/lib/gyms/index.ts. Commission joins on the gym slug, never the route.
const GYM_SLUG_BY_ROUTE: Record<string, string> = {
  "6fit-academy": "6fit",
  "ebor-fitness": "ebor",
  "gym-n-go-academy": "gym-n-go",
  "hitio-orpington-academy": "hitio-orpington",
  "ironwolf-gym": "ironwolf",
  "mof-gym": "mof",
  "muscle-bound-academy": "muscle-bound",
  "superflex-academy": "superflex",
  "xcelerate-academy": "xcelerate",
  "demo-academy": "demo",
};

test("the route-to-gym-slug map covers every registered gym", () => {
  for (const routeSlug of Object.keys(GYMS)) {
    assert.ok(GYM_SLUG_BY_ROUTE[routeSlug], `${routeSlug} is missing from GYM_SLUG_BY_ROUTE`);
  }
});

test("every gym with an active standing code advertises the discounted price", () => {
  for (const [routeSlug, config] of Object.entries(GYMS)) {
    const gymSlug = GYM_SLUG_BY_ROUTE[routeSlug];
    if (gymSlug === "demo") continue;
    if (!PARTNER_STANDING_CODE[gymSlug]) continue;
    assert.equal(
      config.fullPrice,
      1399,
      `${gymSlug} has standing code ${PARTNER_STANDING_CODE[gymSlug]} but advertises £${config.fullPrice}`,
    );
  }
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run test:unit -- --test-name-pattern="advertises the discounted price"`
Expected: FAIL — `ebor has standing code EBORPTDISCOUNT but advertises £1599`.

- [ ] **Step 3: Fix the config**

In `app/lib/gyms/ebor-fitness.ts`, change:

```ts
  fullPrice: 1599,
  depositPrice: 599,
```

to:

```ts
  promoCode: "EBORPTDISCOUNT",
  discountAmount: 200,
  fullPrice: 1399,
  depositPrice: 599,
```

- [ ] **Step 4: Run the test and typecheck**

Run: `npm run test:unit`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add app/lib/gyms/ebor-fitness.ts tests/gymRegistry.test.mts
git commit -m "Ebor's page advertised £1,599 while checkout charged £1,399

EBORPTDISCOUNT has been active in Stripe and mapped in partnerPromo.ts, but
the page config carried neither promoCode nor the discounted price, so the
only gym whose page disagreed with its own checkout was the one whose partner
was never told they had a discount to promote.

The test now asserts the rule rather than the instance: any gym with an active
standing code must advertise £1,399."
```

---

### Task 3: Extract the ad markup so two renderers can share it

`markup()` is a module-private function inside `scripts/gym-ad-creatives.mjs`. The monthly renderer needs identical layout with different copy. Extract rather than duplicate.

**Files:**
- Create: `scripts/lib/ad-markup.mjs`
- Modify: `scripts/gym-ad-creatives.mjs` (delete local `markup`/`FONTS`, import instead)
- Test: `tests/adMarkup.test.mts`

**Interfaces:**
- Consumes: `accentFor`, `contentBox`, `logoTreatmentFor` from `scripts/lib/ad-guards.mjs` (Task 1).
- Produces: `scripts/lib/ad-markup.mjs` → `adMarkup(brand, text, {w, h, photo, logoUrl}) → string` where `text` is the `{eyebrow, headline: string[], accentLine, sub, footer}` shape `conceptText()` returns, and `logoUrl` is an absolute `file:///` URL.

- [ ] **Step 1: Write the failing test**

Create `tests/adMarkup.test.mts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { adMarkup } from "../scripts/lib/ad-markup.mjs";

const BRAND = { gymName: "Test Gym", primaryColor: "#FF0000", darkAccent: null, heroBg: "#000000", logoHasAlpha: true };
const TEXT = { eyebrow: "TEST ACADEMY", headline: ["LINE ONE", "LINE TWO"], accentLine: "ACCENT.", sub: "Subtitle.", footer: "Footer." };

test("renders every line of copy into the markup", () => {
  const html = adMarkup(BRAND, TEXT, { w: 1080, h: 1080, photo: null, logoUrl: "file:///logo.png" });
  for (const line of ["TEST ACADEMY", "LINE ONE", "LINE TWO", "ACCENT.", "Subtitle.", "Footer."]) {
    assert.ok(html.includes(line), `missing: ${line}`);
  }
});

test("sets the canvas to the size it was asked for", () => {
  const html = adMarkup(BRAND, TEXT, { w: 1080, h: 1920, photo: null, logoUrl: "file:///logo.png" });
  assert.ok(html.includes("width:1080px"), "width not set");
  assert.ok(html.includes("height:1920px"), "height not set");
});

test("omits the photo layer when there is no photo", () => {
  const html = adMarkup(BRAND, TEXT, { w: 1080, h: 1080, photo: null, logoUrl: "file:///logo.png" });
  assert.ok(!html.includes('class="photo"'), "photo layer rendered with no photo");
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run test:unit -- --test-name-pattern="renders every line of copy"`
Expected: FAIL — cannot find module `../scripts/lib/ad-markup.mjs`.

- [ ] **Step 3: Move the markup into its own module**

Create `scripts/lib/ad-markup.mjs` containing the `FONTS` constant and the `markup` function currently in `scripts/gym-ad-creatives.mjs`, renamed and exported as `adMarkup`, with two changes: it takes `logoUrl` as a parameter instead of calling `localUrl(brand.logoUrl)` itself (keeping the module free of filesystem access, so it is testable without real files), and it imports its guards from `./ad-guards.mjs`:

```js
// scripts/lib/ad-markup.mjs
/**
 * The shared layout for every partner graphic.
 *
 * Lifted out of gym-ad-creatives.mjs so the monthly promo renderer paints
 * identical pixels rather than a second, drifting copy of the same CSS. Takes
 * an already-resolved logo URL rather than reading the disk, so it is a pure
 * function of its arguments and can be tested without any real assets.
 */
import { accentFor, contentBox, logoTreatmentFor } from "./ad-guards.mjs";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Poppins:wght@400;500;600;700&display=swap');`;

export function adMarkup(brand, text, { w, h, photo, logoUrl }) {
  // …body copied verbatim from the existing markup(), with `logo` replaced by
  // the `logoUrl` parameter and the `brand`/`text`/size handling unchanged.
}
```

Copy the existing function body exactly — the 108px headline sizing carries a comment explaining a real wrapping bug and must not be re-derived.

- [ ] **Step 4: Point the existing renderer at it**

In `scripts/gym-ad-creatives.mjs`, delete the local `FONTS` and `markup`, add `import { adMarkup } from "./lib/ad-markup.mjs";` and change the call site from:

```js
const html = markup(brand, text, { w, h, photo });
```

to:

```js
const html = adMarkup(brand, text, { w, h, photo, logoUrl: localUrl(brand.logoUrl) });
```

- [ ] **Step 5: Run the tests**

Run: `npm run test:unit`
Expected: PASS, including the 5 test files from Task 1.

- [ ] **Step 6: Verify the refactor changed no pixels**

```bash
node --use-system-ca scripts/gym-ad-creatives.mjs ebor
```

Expected: 4 files written to `ad-assets/gym-ads/ebor/`, no error. Compare one against the copy already in production `pp_resources` if convenient; at minimum confirm the run completes and `assertDimensions` does not throw.

- [ ] **Step 7: Commit**

```bash
git add scripts/lib/ad-markup.mjs scripts/gym-ad-creatives.mjs tests/adMarkup.test.mts
git commit -m "Extract the shared ad markup so the monthly renderer cannot drift

The monthly promo packs need the same layout as the two evergreen concepts.
Copying 60 lines of CSS into a second script guarantees the two diverge the
first time either is touched, so markup() moves into its own module and takes
a resolved logo URL instead of reading the disk -- which also makes it a pure
function the tests can exercise without any real assets."
```

---

### Task 4: The promo calendar as data

**Files:**
- Create: `scripts/lib/promo-calendar.mjs`
- Modify: `app/lib/partner-playbook-tokens.ts` (add optional `monthCode`)
- Test: `tests/promoCalendar.test.mts`

**Interfaces:**
- Consumes: `conceptText`, `allConceptStrings` from `scripts/lib/ad-concepts.mjs`; `tokensForGym` from `app/lib/partner-playbook-tokens.ts`; `PARTNER_PROMO_PREFIXES` from `app/lib/partnerPromo.ts`; `findBannedClaims`, `findBrandLeaks` from `scripts/lib/ad-guards.mjs`.
- Produces: `scripts/lib/promo-calendar.mjs` →
  - `MONTHS: MonthEntry[]` where `MonthEntry = {key, label, belief, offerType: "money"|"reveal", discountPence: number|null, codeSuffix: string|null, eyebrow, headline: string[], accentLine, sub, footer}`
  - `MONTH_CODE_PREFIX: Record<slug, string>`
  - `monthCodeFor(slug, monthKey) → string | null`
  - `tokensForMonth(brand, origin, slug, monthKey) → PlaybookTokens & {monthCode: string|null}`
  - `allMonthStrings(monthEntry, tokens) → string[]` (re-exported `allConceptStrings`)

- [ ] **Step 1: Write the failing test**

Create `tests/promoCalendar.test.mts`:

```ts
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
  assert.equal(nov.offerType, "money");
  assert.equal(nov.discountPence, 60_000);
  assert.equal(159_900 - nov.discountPence, 99_900);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run test:unit -- --test-name-pattern="October and November are both defined"`
Expected: FAIL — cannot find module `../scripts/lib/promo-calendar.mjs`.

- [ ] **Step 3: Add the optional token**

In `app/lib/partner-playbook-tokens.ts`, add one field to the interface:

```ts
export interface PlaybookTokens {
  gymName: string;
  town: string;
  promoCode: string | null;
  academyUrl: string;
  /** The month's own code, e.g. EBORBF600. Null outside a money month. */
  monthCode?: string | null;
}
```

`tokensForGym` is unchanged — it simply does not set it, and `applyPlaybookTokens` already leaves unknown tokens visible, which the "no `{{` survives" test converts from a silent blank into a loud failure.

- [ ] **Step 4: Write the calendar**

Create `scripts/lib/promo-calendar.mjs`:

```js
// scripts/lib/promo-calendar.mjs
/**
 * The monthly promo calendar, as data.
 *
 * Same split, and the same reason, as ad-concepts.mjs: the copy for 9 gyms is
 * gated by `npm run test:unit` before Chrome ever launches.
 *
 * October reveals something the course already includes. November is the only
 * money month of the two, and the only point in the year the price starts with
 * a 9 -- which is what stops January, April and September cannibalising it.
 *
 * Discounts land on pay-in-full only. Stripe takes ONE promotion code, so a
 * month code REPLACES the standing £200 rather than stacking with it: £600 off
 * the £1,599 list is £999, not £1,399 - £600.
 */
import { conceptText, allConceptStrings } from "./ad-concepts.mjs";
import { tokensForGym } from "../../app/lib/partner-playbook-tokens.ts";

export const MONTHS = [
  {
    key: "oct",
    label: "Success Story Month",
    belief: "B2",
    offerType: "reveal",
    discountPence: null,
    codeSuffix: null,
    eyebrow: "{{gymName}} ACADEMY",
    headline: ["TWO QUALIFICATIONS.", "ONE COURSE."],
    accentLine: "LEVEL 2 AND LEVEL 3.",
    sub: "The NCFE Level 2 Certificate in Gym Instructing and the Level 3 Certificate in Personal Training, studied at {{gymName}}.",
    footer: "Next intake open",
  },
  {
    key: "nov",
    label: "Black Friday",
    belief: "all",
    offerType: "money",
    discountPence: 60_000,
    codeSuffix: "BF600",
    eyebrow: "{{gymName}} ACADEMY",
    headline: ["BLACK FRIDAY", "£600 OFF"],
    accentLine: "£999 PAID IN FULL.",
    sub: "Level 2 and Level 3 Personal Training, £999 paid in full at {{gymName}}. Black Friday only.",
    footer: "Code {{monthCode}}",
  },
];

/**
 * Which of a gym's prefixes its month codes are minted under.
 *
 * Iron Wolf and Muscle Bound each carry TWO prefixes: their standing codes are
 * IWGPTDISCOUNT and MBGPTDISCOUNT, but their launch codes were IRONWOLF500 and
 * MUSCLEBOUND500. Month codes follow the launch convention. A code minted under
 * a prefix the validator does not hold for that gym is refused on the site --
 * which is exactly what happened to HITIO500 and HITIO300.
 */
export const MONTH_CODE_PREFIX = {
  "6fit": "6FIT",
  ebor: "EBOR",
  "gym-n-go": "GYMNGO",
  "hitio-orpington": "HITIO",
  ironwolf: "IRONWOLF",
  mof: "MOF",
  "muscle-bound": "MUSCLEBOUND",
  superflex: "SUPERFLEX",
  xcelerate: "XCELERATE",
};

/** The gym's code for a month, or null if that month is not a money month. */
export function monthCodeFor(slug, monthKey) {
  const month = MONTHS.find((m) => m.key === monthKey);
  if (!month?.codeSuffix) return null;
  const prefix = MONTH_CODE_PREFIX[slug];
  if (!prefix) throw new Error(`no month-code prefix for gym: ${slug}`);
  return `${prefix}${month.codeSuffix}`;
}

/** Gym tokens plus the month's own code. */
export function tokensForMonth(brand, origin, slug, monthKey) {
  return { ...tokensForGym(brand, origin), monthCode: monthCodeFor(slug, monthKey) };
}

export const monthText = conceptText;
export const allMonthStrings = allConceptStrings;
```

- [ ] **Step 5: Run the tests**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 6: Verify the gates fire (mutation check)**

```bash
node -e "const f='scripts/lib/promo-calendar.mjs';const fs=require('fs');fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace('Next intake open','Guaranteed interview'))"
npm run test:unit
```

Expected: **FAIL**, naming `guaranteed` and `interview`.

```bash
node -e "const f='scripts/lib/promo-calendar.mjs';const fs=require('fs');fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace('ironwolf: \"IRONWOLF\"','ironwolf: \"IRONWOLFX\"'))"
npm run test:unit
```

Expected: **FAIL** — `ironwolf: prefix IRONWOLFX is not in PARTNER_PROMO_PREFIXES`.

Then: `git checkout -- scripts/lib/promo-calendar.mjs && npm run test:unit` — green.

- [ ] **Step 7: Commit**

```bash
git add scripts/lib/promo-calendar.mjs app/lib/partner-playbook-tokens.ts tests/promoCalendar.test.mts
git commit -m "October and November as gated data

Copy for 9 gyms is checked before Chrome launches -- job-offer language, the
white-label rule, and now unresolved {{tokens}}, which previously would have
painted a literal placeholder onto a partner's graphic.

The prefix test is the one that matters most. HITIO500 and HITIO300 sat
refused on the site for weeks because they were minted under a prefix the
validator did not hold. Month codes now fail the build rather than the member."
```

---

### Task 5: Render the monthly packs

**Files:**
- Create: `scripts/gym-promo-creatives.mjs`

**Interfaces:**
- Consumes: `MONTHS`, `monthText`, `allMonthStrings`, `tokensForMonth` from `scripts/lib/promo-calendar.mjs`; `adMarkup` from `scripts/lib/ad-markup.mjs`; `findBannedClaims`, `findBrandLeaks`, `assertDimensions` from `scripts/lib/ad-guards.mjs`; `SIZES` from `scripts/lib/ad-concepts.mjs`; `renderHtml` from `scripts/render-image.mjs`.
- Produces: PNG + HTML at `ad-assets/gym-promos/<slug>/<monthKey>-<w>x<h>.png`.

- [ ] **Step 1: Write the renderer**

Create `scripts/gym-promo-creatives.mjs`. It mirrors `gym-ad-creatives.mjs` — same photo rule (a gym's own photographs or none, never `_shared`), same gate-before-paint order, same `demo` exclusion:

```js
// scripts/gym-promo-creatives.mjs
/**
 * Monthly promo graphics for partner gyms.
 *
 *   node --use-system-ca scripts/gym-promo-creatives.mjs             # every gym, every month
 *   node --use-system-ca scripts/gym-promo-creatives.mjs ebor        # one gym
 *   node --use-system-ca scripts/gym-promo-creatives.mjs --month=nov # one month
 *
 * PHOTO-FREE BY DEFAULT, for the same reason as gym-ad-creatives.mjs: generic
 * stock in the gym's own town undercuts the exact claim the graphic makes.
 */
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { renderHtml } from "./render-image.mjs";
import { SIZES } from "./lib/ad-concepts.mjs";
import { MONTHS, monthText, allMonthStrings, tokensForMonth } from "./lib/promo-calendar.mjs";
import { adMarkup } from "./lib/ad-markup.mjs";
import { findBannedClaims, findBrandLeaks, assertDimensions } from "./lib/ad-guards.mjs";

const BRANDS = JSON.parse(readFileSync(new URL("./gym-brands.json", import.meta.url), "utf8"));
const ROOT = process.cwd();
const ORIGIN = "https://ptlaunchlab.co.uk";
const OUT_ROOT = path.join(ROOT, "ad-assets", "gym-promos");

const args = process.argv.slice(2);
const only = args.filter((a) => !a.startsWith("--"));
const monthArg = args.find((a) => a.startsWith("--month="))?.split("=")[1];
const months = monthArg ? MONTHS.filter((m) => m.key === monthArg) : MONTHS;
if (!months.length) throw new Error(`no such month: ${monthArg}`);

function localUrl(publicPath) {
  const abs = path.join(ROOT, "public", publicPath.replace(/^\//, ""));
  if (!existsSync(abs)) throw new Error(`missing asset: ${abs}`);
  return "file:///" + abs.replace(/\\/g, "/");
}

function photoFor(slug) {
  const dir = path.join(ROOT, "partner-photos", slug);
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return files.length ? "file:///" + path.join(dir, files[0]).replace(/\\/g, "/") : null;
}

const slugs = Object.keys(BRANDS).filter((s) => s !== "demo" && (!only.length || only.includes(s)));
if (!slugs.length) throw new Error(`no such gym: ${only.join(", ")}`);

for (const slug of slugs) {
  const brand = BRANDS[slug];
  const outDir = path.join(OUT_ROOT, slug);
  mkdirSync(outDir, { recursive: true });
  const photo = photoFor(slug);

  for (const month of months) {
    const tokens = tokensForMonth(brand, ORIGIN, slug, month.key);

    // Gate the copy before a single pixel is painted.
    for (const line of allMonthStrings(month, tokens)) {
      const banned = findBannedClaims(line);
      if (banned.length) throw new Error(`${slug}/${month.key}: banned claim ${banned.join(", ")} in "${line}"`);
      if (findBrandLeaks(line).length) throw new Error(`${slug}/${month.key}: white-label leak in "${line}"`);
      if (line.includes("{{")) throw new Error(`${slug}/${month.key}: unresolved token in "${line}"`);
    }

    const text = monthText(month, tokens);
    for (const { w, h } of SIZES) {
      const html = adMarkup(brand, text, { w, h, photo, logoUrl: localUrl(brand.logoUrl) });
      const base = `${month.key}-${w}x${h}`;
      writeFileSync(path.join(outDir, `${base}.html`), html, "utf8");
      const meta = await renderHtml(html, {
        width: w,
        height: h,
        out: path.join(outDir, `${base}.png`),
        name: `promo-${slug}-${base}`,
        format: "png",
      });
      assertDimensions(meta, { width: w, height: h });
      console.log(`${slug.padEnd(16)} ${base.padEnd(20)} ${photo ? "photo" : "flat"}`);
    }
  }
}

console.log(`\n${slugs.length} gyms × ${months.length} months × ${SIZES.length} sizes = ${slugs.length * months.length * SIZES.length} graphics`);
console.log(`Output: ${OUT_ROOT}`);
```

- [ ] **Step 2: Render one gym and look at it**

```bash
node --use-system-ca scripts/gym-promo-creatives.mjs ebor
```

Expected: 4 PNGs in `ad-assets/gym-promos/ebor/` — `oct-1080x1080.png`, `oct-1080x1920.png`, `nov-1080x1080.png`, `nov-1080x1920.png`.

**Open the two November files and read them.** Confirm the code reads `EBORBF600` and not `{{monthCode}}`, and that no headline line wraps mid-thought — the existing renderer carries a comment about a 108px sizing fix for exactly that failure, and "BLACK FRIDAY" / "£600 OFF" are shorter than the string that caused it, but confirm rather than assume.

- [ ] **Step 3: Render all nine**

```bash
node --use-system-ca scripts/gym-promo-creatives.mjs
```

Expected: `9 gyms × 2 months × 2 sizes = 36 graphics`, no throw.

- [ ] **Step 4: Commit**

`ad-assets/` is gitignored — commit the script only.

```bash
git add scripts/gym-promo-creatives.mjs
git commit -m "Render the monthly promo packs

Mirrors gym-ad-creatives.mjs deliberately: same photo rule, same
gate-before-paint order, same demo exclusion, and the shared markup module so
the two cannot drift. Adds one gate the evergreen renderer does not have --
an unresolved {{token}} throws rather than painting a literal placeholder."
```

---

### Task 6: Playbook entries for October and November

**Files:**
- Create: `partner-playbook/campaign-october-two-qualifications.md`
- Create: `partner-playbook/campaign-november-black-friday.md`

**Interfaces:**
- Consumes: frontmatter shape from the 48 existing `partner-playbook/*.md` entries — `title`, `type`, `channel`, `when_to_use`, `order`. Tokens `{{gymName}}`, `{{town}}`, `{{academyUrl}}`, `{{monthCode}}`, and the `{{#promoCode}}…{{/promoCode}}` conditional block are substituted by `applyPlaybookTokens`.
- Produces: two entries rendered on the partner portal's Playbook tab, and the `pack` values Task 8 attaches graphics to (`campaign-october-two-qualifications`, `campaign-november-black-friday`).

- [ ] **Step 1: Read an existing campaign entry for the house style**

Run: `cat partner-playbook/campaign-january-new-career.md`

Match its register: short, plain, addressed to the gym owner, a table for the week, and a "what to judge it on" section that names the wrong metric explicitly.

- [ ] **Step 2: Write the October entry**

Create `partner-playbook/campaign-october-two-qualifications.md`:

```markdown
---
title: Two qualifications, one course
type: campaign
channel: October
when_to_use: All of October. No discount — this month you tell them what they already get.
order: 100
---

Most people assume a PT course gets you one qualification. Yours gets them two, and almost nobody at {{gymName}} knows it.

**The line:** *Level 2 and Level 3. One course, one price.*

## The month

| Week | Do this |
|---|---|
| **1** | Post the graphic. Caption leads on the two qualifications, not the price |
| **2** | Story poll: *Did you know a PT course usually only covers Level 3?* Yes / No |
| **3** | Send the member email. Ask for a reply, not a click |
| **4** | Staff pick up everyone who answered the poll or replied |

The poll is the engine, same as January. Everyone who taps **No** has just learned something and is a named person your team can talk to on the floor.

## The member email

Subject: **A question about the PT course**

> Quick one.
>
> Most personal training courses get you the Level 3. Ours covers the Level 2 Certificate in Gym Instructing as well — both, in the same course, for the same price.
>
> There's a tutor from day one, and a £500 business mentorship community included, which is the part people are usually most surprised by.
>
> If you've ever thought about it, reply to this and tell me where you're at. I'll tell you honestly whether it's worth your time.

Reply, not click. People who reply are in a conversation; people who click are on a page.

## WhatsApp / SMS

> Did you know our PT course covers Level 2 AND Level 3? Most only do the 3. Reply if you want the detail.

## When someone replies

Do not pitch. Fill three baskets first — where they are now, what they actually want, and what stopped them last time. Only then say what the course is. The full framework is in **Conversation framework**.

## What to judge it on

Replies and conversations. **Not enrolments.** October conversations become January enrolments, and January is the biggest month of your year.
```

- [ ] **Step 3: Write the November entry**

Create `partner-playbook/campaign-november-black-friday.md`:

```markdown
---
title: Black Friday
type: campaign
channel: November
when_to_use: Black Friday week. Your biggest price moment of the year.
order: 110
---

This is the one week all year the price moves properly, and the one month members expect it to.

**£999 paid in full. Code `{{monthCode}}`.**

That is £600 off. It applies to the pay-in-full price only — it cannot be used on the instalment plan, and it replaces the standing discount rather than stacking on top of it. Say so plainly; a member who finds that out at checkout is a member who does not finish checkout.

## The week

| Day | Do this |
|---|---|
| **Monday** | Tell them it is coming. No price yet |
| **Wednesday** | Post the graphic with the price and the code |
| **Friday** | Post again. Reply to every comment and DM the same day |
| **Sunday** | Last call. Plain, factual: the price goes back on Monday |

Reply speed is the whole campaign. A Black Friday enquiry that waits until Tuesday is a lost sale.

## The member email

Subject: **£999 this week**

> Our PT course is £999 this week — £600 off the full price.
>
> It covers the NCFE Level 2 Certificate in Gym Instructing and the Level 3 Certificate in Personal Training, with a tutor from day one and the £500 business mentorship community included.
>
> Use code **{{monthCode}}** at {{academyUrl}}. It applies to the full payment option only, and the price goes back on Monday.
>
> If you want to talk it through before you decide, just reply.

## WhatsApp / SMS

> PT course is £999 this week, £600 off. Code {{monthCode}} at {{academyUrl}}. Full payment only, back to normal Monday.

## What to judge it on

Enrolments. **This is the one month that is fair to judge on sales** — the offer is unambiguous, the window is short, and the code tells you exactly which ones came from you.
```

- [ ] **Step 4: Verify the tokens resolve**

```bash
node --use-system-ca -e "
import('./app/lib/partner-playbook-tokens.ts').then(async (m) => {
  const { readFileSync } = await import('node:fs');
  const { monthCodeFor } = await import('./scripts/lib/promo-calendar.mjs');
  const brands = JSON.parse(readFileSync('scripts/gym-brands.json','utf8'));
  const body = readFileSync('partner-playbook/campaign-november-black-friday.md','utf8');
  for (const slug of Object.keys(brands).filter(s => s !== 'demo')) {
    const tokens = { ...m.tokensForGym(brands[slug], 'https://ptlaunchlab.co.uk'), monthCode: monthCodeFor(slug,'nov') };
    const out = m.applyPlaybookTokens(body, tokens);
    if (out.includes('{{')) throw new Error(slug + ': unresolved token');
    console.log(slug.padEnd(16), out.match(/Code \`([A-Z0-9]+)\`/)?.[1]);
  }
  console.log('all tokens resolved');
});
"
```

Expected: nine lines, each showing that gym's BF600 code, then `all tokens resolved`.

- [ ] **Step 5: Commit**

```bash
git add partner-playbook/campaign-october-two-qualifications.md partner-playbook/campaign-november-black-friday.md
git commit -m "October and November playbook entries

October reveals the two qualifications and asks for a reply rather than a
click -- roughly 10,000 sends across this business have produced one click, so
a reply is both the better intent signal and the start of the conversation.

November says out loud that the code is pay-in-full only and replaces the
standing discount rather than stacking. A member who discovers that at the
checkout is a member who does not finish it."
```

---

### Task 7: Mint the November Stripe codes

Nine codes, `<PREFIX>BF600`, £600 off, one per gym. October needs none.

**Files:**
- Create: `scripts/mint-month-codes.mts`

**Interfaces:**
- Consumes: `MONTHS`, `MONTH_CODE_PREFIX`, `monthCodeFor` from `scripts/lib/promo-calendar.mjs`; `STRIPE_SECRET_KEY` from `.env.local`.
- Produces: nine active Stripe promotion codes. No code imports from this script.

- [ ] **Step 1: Write the script, dry-run by default**

Create `scripts/mint-month-codes.mts`:

```ts
// scripts/mint-month-codes.mts
/**
 * Mint one promotion code per gym for a money month.
 *
 *   npx tsx scripts/mint-month-codes.mts --month=nov            # dry run
 *   npx tsx scripts/mint-month-codes.mts --month=nov --apply    # create
 *
 * Idempotent: a code that already exists and is active is left alone and
 * reported, never duplicated. Stripe happily holds two promotion codes with
 * the same `code` string if one is archived, so existence is checked on
 * ACTIVE codes only.
 *
 * One coupon per month (amount_off is a property of the coupon, not the
 * promotion code), then one promotion code per gym pointing at it. That is
 * what lets nine gyms share an amount while each carrying its own redeemable
 * string -- which is how an enrolment gets attributed to a gym at all.
 */
import Stripe from "stripe";
import { MONTHS, MONTH_CODE_PREFIX, monthCodeFor } from "./lib/promo-calendar.mjs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const monthKey = process.argv.find((a) => a.startsWith("--month="))?.split("=")[1];
const apply = process.argv.includes("--apply");

const month = MONTHS.find((m) => m.key === monthKey);
if (!month) throw new Error(`no such month: ${monthKey}`);
if (month.offerType !== "money") throw new Error(`${month.key} is not a money month — no codes needed`);

const existing = new Map<string, string>();
for await (const pc of stripe.promotionCodes.list({ limit: 100, active: true })) {
  existing.set(pc.code, pc.id);
}

let coupon: Stripe.Coupon | null = null;
if (apply) {
  coupon = await stripe.coupons.create({
    amount_off: month.discountPence,
    currency: "gbp",
    duration: "once",
    name: `${month.label} ${month.discountPence / 100} off`,
  });
  console.log(`coupon ${coupon.id} — £${month.discountPence / 100} off`);
}

for (const slug of Object.keys(MONTH_CODE_PREFIX)) {
  const code = monthCodeFor(slug, month.key)!;
  if (existing.has(code)) {
    console.log(`${slug.padEnd(16)} ${code.padEnd(20)} already active — skipped`);
    continue;
  }
  if (!apply) {
    console.log(`${slug.padEnd(16)} ${code.padEnd(20)} WOULD CREATE (£${month.discountPence / 100} off)`);
    continue;
  }
  const pc = await stripe.promotionCodes.create({ coupon: coupon!.id, code });
  console.log(`${slug.padEnd(16)} ${code.padEnd(20)} created ${pc.id}`);
}

if (!apply) console.log("\nDRY RUN — nothing was created. Re-run with --apply.");
```

- [ ] **Step 2: Dry run**

```bash
npx tsx scripts/mint-month-codes.mts --month=nov
```

Expected: nine `WOULD CREATE` lines — `6FITBF600`, `EBORBF600`, `GYMNGOBF600`, `HITIOBF600`, `IRONWOLFBF600`, `MOFBF600`, `MUSCLEBOUNDBF600`, `SUPERFLEXBF600`, `XCELERATEBF600` — then `DRY RUN`.

**Read that list against `MONTH_CODE_PREFIX` before going further.** Iron Wolf must be `IRONWOLF`, not `IWG`; Muscle Bound must be `MUSCLEBOUND`, not `MBG`.

- [ ] **Step 3: Apply**

```bash
npx tsx scripts/mint-month-codes.mts --month=nov --apply
```

Expected: one coupon line, then nine `created` lines.

- [ ] **Step 4: Verify one code end to end against the live validator**

```bash
curl -s -X POST https://ptlaunchlab.co.uk/api/promo/validate \
  -H 'content-type: application/json' \
  -d '{"code":"EBORBF600","gymSlug":"ebor"}'
```

The route parses exactly `{code, gymSlug}` (`app/api/promo/validate/route.ts:57-58`) and returns `{valid, reason, message}`.

Expected: `valid: true` with £600 off — **not** a refusal. A refusal means the prefix is wrong and the code would fail for a real member, which is the HITIO failure repeating. Note the endpoint is rate-limited to **5/min per IP**, so do not loop all nine from one machine.

- [ ] **Step 5: Re-run the dry run to prove idempotency**

```bash
npx tsx scripts/mint-month-codes.mts --month=nov
```

Expected: nine `already active — skipped` lines.

- [ ] **Step 6: Commit**

```bash
git add scripts/mint-month-codes.mts
git commit -m "Mint a money month's promo codes, one per gym

Dry run by default, idempotent on active codes, and it refuses a month that
is not a money month rather than silently creating nothing.

One coupon carries the amount, nine promotion codes point at it. That is what
lets every gym share £600 off while each keeps its own redeemable string --
without which an enrolment cannot be attributed to a gym at all."
```

---

### Task 8: Put the packs in the partners' drives

**Files:**
- Create: `scripts/upload-gym-promo-packs.mts`

**Interfaces:**
- Consumes: `MONTHS` from `scripts/lib/promo-calendar.mjs`; `SIZES` from `scripts/lib/ad-concepts.mjs`; the same Supabase env and `pp_resources` conventions as `scripts/upload-gym-ad-packs.mts`.
- Produces: 36 rows in `pp_resources`, category `digital`, objects at `<slug>/promos/<monthKey>-<w>x<h>.png`, `pack` set to the month's playbook slug.

- [ ] **Step 1: Read the script this one is modelled on**

Run: `sed -n '1,120p' scripts/upload-gym-ad-packs.mts`

It carries the rules this task must preserve, and its header comment explains why each exists. Copy its structure; do not invent a new upload convention.

- [ ] **Step 2: Write the uploader**

Create `scripts/upload-gym-promo-packs.mts`, modelled on `upload-gym-ad-packs.mts`, with these differences and **no others**:

- Source directory is `ad-assets/gym-promos/<slug>/` rather than `ad-assets/gym-ads/<slug>/`.
- Storage path is `<slug>/promos/<monthKey>-<w>x<h>.png` rather than `<slug>/meta-ads/...`. The `--replace` guard that checks `storage_path` must be updated to require the `<slug>/promos/` prefix — a title match whose existing row points anywhere else is a genuine collision and must be left untouched and printed as a loud warning, exactly as the original does.
- Title is `Promo — <month label> (<shape>)` where shape is `square` for 1080×1080 and `story` for 1080×1920.
- `pack` is set to the month's playbook slug: `campaign-october-two-qualifications` for `oct`, `campaign-november-black-friday` for `nov`.

Keep unchanged: category `digital`, idempotency on `(partner, title)`, `--apply` / `--replace` semantics, the delete-on-failed-insert behaviour and the deliberate no-delete-on-failed-replace behaviour.

- [ ] **Step 3: Dry run**

```bash
npx tsx scripts/upload-gym-promo-packs.mts
```

Expected: 36 planned uploads, 9 gyms × 2 months × 2 sizes. Nothing written.

- [ ] **Step 4: Apply**

```bash
npx tsx scripts/upload-gym-promo-packs.mts --apply
```

Expected: 36 created. **Confirm the pre-existing 36 Meta ad rows are untouched** — query `pp_resources` for `storage_path like '%/meta-ads/%'` and expect exactly 36 rows still present.

- [ ] **Step 5: Walk the portal as a partner**

Sign in as a real partner (Ebor's login is the one known to work) and open the Resources tab. Confirm: the four new graphics appear, thumbnails render, and a download link resolves to the right image.

This step exists because it has never been done. The Meta ad packs shipped in August and the note in `project_ptll_partner_meta_ad_packs` still records that **nobody has walked the portal UI as a partner** — thumbnails and downloads are unverified in a browser. Do not mark this task complete on a green script alone.

- [ ] **Step 6: Commit**

```bash
git add scripts/upload-gym-promo-packs.mts
git commit -m "Put the monthly promo packs in the partners' drives

Modelled on upload-gym-ad-packs.mts down to the guards: idempotent on
(partner, title), --replace restricted to digital rows whose storage_path is
already under this script's own prefix, and a loud warning rather than a
silent overwrite when a title matches something this script did not create.

Graphics attach to their month's playbook entry via `pack`, so a partner
reads the campaign and finds the assets underneath it rather than in a flat
list of 40 files."
```

---

## After this plan

The remaining ten months repeat Tasks 4, 5, 6 and 8 with more entries in `MONTHS` — the renderer, uploader and code-minter all take them without modification. Do January next, not February: it is the largest month of the year and the one the whole calendar is shaped around.

Two items from the spec are deliberately **not** in this plan:

- **The October partner automation** — out of scope per spec §10, and it needs its own spec. Note the constraint recorded there: five of nine partners have never signed into the portal, so an email whose only CTA is "open your Resource Drive" fails for over half of them.
- **`SUMMER500PTLL` is still ACTIVE and uncapped** (spec §11). At £500 off it lands on £1,099, so November's £999 still beats it — but it is a live £500 code sitting outside the calendar that anyone can find, and it undercuts every reveal month. Archive it in Stripe before January. Not a task here because it is a business decision, not a build step.

**One spec item is deliberately dropped, not missed.** Spec §9.3 called for a claim-gate carve-out in `ad-guards.mjs` so gym-own-truth career lines could pass in captions and email. That was written when the plan was to let each gym state its own hiring record. Callum later ruled the softer route — use the contracted interview guarantee instead — so no carve-out is needed and the gate stays exactly as it is. Reinstate §9.3 only if that ruling changes.

- **Pulling the false interview material** from Superflex's handout and the gym-n-go/xcelerate poster. Those are files in `pp_resources`, not code, so no task here touches them. `2e35561` fixed the partner academy pages; the assets still carry the partner-named claim.
