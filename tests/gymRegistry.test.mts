// tests/gymRegistry.test.mts
//
// WHAT THIS PROTECTS
//
// Partner embeds. /embed/[gym] renders from the GYMS registry, so a partner
// page that exists on disk but never made it into the registry produces a 404
// on the snippet we told that gym to paste into their website — and nobody
// finds out until the gym emails to say their site is broken.
//
// Three traps are encoded here rather than remembered:
//
// 1. The ROUTE slug is not the GYM slug. Route "ebor-fitness" is gymSlug
//    "ebor"; route "hitio-orpington-academy" is gymSlug "hitio-orpington".
//    Commission joins on the gym slug. Keying an embed on the wrong one
//    silently attributes a sale to nobody.
// 2. canonicalPath must match the folder, because the embed CTA is built from
//    canonicalPath. A mismatch sends every click from that gym's website to a
//    404 while the card itself looks perfectly fine.
// 3. _gym-template holds placeholder data ("GYM NAME HERE"). It must never
//    reach the registry and therefore never render a card.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { GYMS, GYM_SLUGS, getGym } from "../app/lib/gyms/index.ts";

const APP_DIR = new URL("../app/", import.meta.url);

/** Every app/<dir> whose page.tsx renders a partner academy page. */
function partnerFoldersOnDisk(): string[] {
  return readdirSync(APP_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => {
      const page = new URL(`../app/${name}/page.tsx`, import.meta.url);
      if (!existsSync(page)) return false;
      return readFileSync(page, "utf8").includes("GymAcademyPage");
    });
}

test("every partner page on disk has a registry entry", () => {
  const missing = partnerFoldersOnDisk()
    .filter((f) => f !== "_gym-template")
    .filter((f) => !GYM_SLUGS.includes(f));

  assert.deepEqual(
    missing,
    [],
    `partner page(s) with no registry entry — their /embed/<slug> would 404: ${missing.join(", ")}`,
  );
});

test("every registry entry has a partner page on disk", () => {
  const orphaned = GYM_SLUGS.filter(
    (slug) => !existsSync(new URL(`../app/${slug}/page.tsx`, import.meta.url)),
  );
  assert.deepEqual(orphaned, [], `registry slug(s) with no page: ${orphaned.join(", ")}`);
});

test("canonicalPath matches the folder — the embed CTA is built from it", () => {
  for (const [slug, config] of Object.entries(GYMS)) {
    assert.equal(
      config.canonicalPath,
      `/${slug}`,
      `${slug}: canonicalPath is "${config.canonicalPath}" — every embed CTA for this gym would land there, not on /${slug}`,
    );
  }
});

test("the placeholder template is not a partner", () => {
  assert.equal(getGym("_gym-template"), undefined);
  for (const config of Object.values(GYMS)) {
    assert.notEqual(config.gymName, "GYM NAME HERE");
    assert.ok(!config.logoUrl.includes("example.com"), `${config.gymName} still has the template logo`);
  }
});

test("an unknown slug resolves to nothing rather than a blank card", () => {
  for (const slug of ["", "not-a-gym", "../admin", "6FIT-ACADEMY"]) {
    assert.equal(getGym(slug), undefined, `getGym(${JSON.stringify(slug)}) should be undefined`);
  }
});

test("every card has the fields it renders", () => {
  for (const [slug, c] of Object.entries(GYMS)) {
    assert.ok(c.gymName?.trim(), `${slug}: gymName`);
    assert.ok(c.logoUrl?.trim(), `${slug}: logoUrl`);
    assert.match(c.primaryColor, /^#[0-9a-fA-F]{3,8}$/, `${slug}: primaryColor must be a hex colour`);
    if (c.heroBg) assert.match(c.heroBg, /^#[0-9a-fA-F]{3,8}$/, `${slug}: heroBg`);
    if (c.darkAccent) assert.match(c.darkAccent, /^#[0-9a-fA-F]{3,8}$/, `${slug}: darkAccent`);
  }
});

test("slugs are url-safe — they are pasted into a partner's html", () => {
  for (const slug of GYM_SLUGS) {
    assert.match(slug, /^[a-z0-9-]+$/, `${slug} is not url-safe`);
    assert.equal(encodeURIComponent(slug), slug, `${slug} would be escaped in the embed URL`);
  }
});

// Route slug -> gym slug. Only two differ, both documented in
// app/lib/gyms/index.ts. Commission joins on the gym slug, never the route.
const GYM_SLUG_BY_ROUTE: Record<string, string> = {
  "6fit-academy": "6fit",
  "atp-felixstowe-academy": "atp-felixstowe",
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

// October 2026 change-over: every gym sells the same two plans at the same
// prices (app/lib/pricing.ts) — no member discount, no code, no per-gym Stripe
// link. A price or code left in a gym's config is how a page ends up quoting
// £1,399 while Stripe charges something else, which has happened before.
const RETIRED_PRICE_FIELDS = [
  "promoCode", "discountAmount", "fullPrice", "depositPrice",
  "showDiscount", "stripeFullLink", "stripeDepositLink",
];

test("no gym config carries a price, a promo code or a Stripe link", () => {
  for (const [routeSlug, config] of Object.entries(GYMS)) {
    for (const field of RETIRED_PRICE_FIELDS) {
      assert.equal(field in config, false, `${routeSlug} still carries ${field}`);
    }
  }
});

test("no gym enrol page hardcodes a price or a Stripe link", () => {
  for (const routeSlug of Object.keys(GYMS)) {
    const page = new URL(`../app/${routeSlug}/enrol/page.tsx`, import.meta.url);
    if (!existsSync(page)) continue;
    const src = readFileSync(page, "utf8");
    assert.doesNotMatch(src, /buy\.stripe\.com/, `${routeSlug}/enrol hardcodes a Stripe link`);
    assert.doesNotMatch(src, /fullPrice|£200|1,?399|1,?599/, `${routeSlug}/enrol still states an old price`);
  }
});

// gym-brands.json is a SECOND source of per-gym data, and the one the in-gym
// screens and decks read (scripts/gym-tv-slides.mjs, gym-gamma-decks.mjs). It
// must carry no price or code either — the generators take prices from
// app/lib/pricing.ts.
test("gym-brands.json carries no price and no promo code", () => {
  const brands = JSON.parse(
    readFileSync(new URL("../scripts/gym-brands.json", import.meta.url), "utf8"),
  ) as Record<string, Record<string, unknown>>;

  // A silently-renamed or moved file would make every assertion below vacuous.
  assert.ok(Object.keys(brands).length >= 9, `expected at least 9 gyms in gym-brands.json, found ${Object.keys(brands).length}`);

  for (const [gymSlug, brand] of Object.entries(brands)) {
    for (const field of ["discountAmount", "fullPrice", "depositPrice"]) {
      assert.equal(field in brand, false, `gym-brands.json: ${gymSlug} still carries ${field}`);
    }
    assert.equal(brand.promoCode, null, `gym-brands.json: ${gymSlug} still carries promo code ${brand.promoCode}`);
  }
});

test("the route-to-gym-slug map matches the real source in each enrol/page.tsx", () => {
  for (const routeSlug of Object.keys(GYMS)) {
    const gymSlug = GYM_SLUG_BY_ROUTE[routeSlug];
    if (gymSlug === "demo") continue;

    const enrolPagePath = new URL(`../app/${routeSlug}/enrol/page.tsx`, import.meta.url);
    assert.ok(existsSync(enrolPagePath), `${routeSlug}/enrol/page.tsx does not exist`);

    const content = readFileSync(enrolPagePath, "utf8");
    const match = content.match(/gymSlug:\s*["']([^"']+)["']/);
    assert.ok(match?.[1], `${routeSlug}/enrol/page.tsx has no gymSlug literal`);

    const realGymSlug = match[1];

    assert.equal(
      realGymSlug,
      gymSlug,
      `${routeSlug}/enrol/page.tsx has gymSlug: "${realGymSlug}" but the map says "${gymSlug}" — the map must match the real source`,
    );
  }
});


// ─── v4.1 ladder: each config's gymSlug is the slug its enrol page sends ──────
import { getGymByPartnerSlug, memberSavingForGym } from "../app/lib/gyms/index.ts";

test("every registry gymSlug matches the gymSlug on that gym's /enrol page", () => {
  for (const [route, cfg] of Object.entries(GYMS)) {
    const enrol = new URL(`../app/${route}/enrol/page.tsx`, import.meta.url);
    if (!existsSync(enrol)) continue; // the demo has no enrol page
    const src = readFileSync(enrol, "utf8");
    const m = /gymSlug:\s*"([^"]+)"/.exec(src);
    assert.ok(m, `${route}: enrol page has no gymSlug`);
    assert.equal(cfg.gymSlug, m![1], `${route}: config gymSlug must equal the enrol page's`);
    assert.equal(getGymByPartnerSlug(cfg.gymSlug), cfg);
  }
});

test("every member saving is 0 for now, and a missing coupon means no saving", () => {
  for (const cfg of Object.values(GYMS)) {
    assert.equal(cfg.memberSavingPence ?? 0, 0, cfg.gymSlug);
    assert.deepEqual(memberSavingForGym(cfg.gymSlug, {}), { savingPence: 0, coupon: null });
  }
  assert.deepEqual(memberSavingForGym("nope", { STRIPE_MEMBER_SAVING_COUPON_5000: "c" }), { savingPence: 0, coupon: null });
});
