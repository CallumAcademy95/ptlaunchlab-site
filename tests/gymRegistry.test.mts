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
import { PARTNER_STANDING_CODE } from "../app/lib/partnerPromo.ts";

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

// scripts/gym-brands.json is a SEPARATE registry from app/lib/gyms/ — used by
// the ad renderer and the partner playbook, keyed on gymSlug rather than the
// route slug. It drifted from PARTNER_STANDING_CODE for Ebor specifically:
// this file said `promoCode: null` (the pre-e2a91b5 "grandfathered, no
// discount" state) while PARTNER_STANDING_CODE and app/lib/gyms/ebor-fitness.ts
// both already said EBORPTDISCOUNT — so any playbook copy gated on
// {{#promoCode}} silently hid Ebor's own live discount from Ebor.
test("gym-brands.json's promoCode agrees with PARTNER_STANDING_CODE for every gym", () => {
  const brands: Record<string, { promoCode: string | null }> = JSON.parse(
    readFileSync(new URL("../scripts/gym-brands.json", import.meta.url), "utf8"),
  );

  for (const [gymSlug, code] of Object.entries(PARTNER_STANDING_CODE)) {
    assert.equal(
      brands[gymSlug]?.promoCode,
      code,
      `${gymSlug}: gym-brands.json says promoCode ${JSON.stringify(brands[gymSlug]?.promoCode)} but ` +
        `PARTNER_STANDING_CODE says ${JSON.stringify(code)}`,
    );
  }
});
