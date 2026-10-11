// tests/phase0.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { hasAdvertisingConsent } from "../app/lib/metaPixelConsent.ts";

const config = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");

test("CSP lets GA4 and Clarity through", () => {
  assert.match(config, /"\*\.google-analytics\.com"/);
  assert.match(config, /"\*\.analytics\.google\.com"/);
  assert.match(config, /"scripts\.clarity\.ms"/);
});

test("CSP still blocks the unknown event hosts", () => {
  assert.doesNotMatch(config, /on\.aws|run\.app/);
});

test("advertising consent: only an explicit yes counts", () => {
  assert.equal(hasAdvertisingConsent({ categories: { advertisement: true } }), true);
  assert.equal(hasAdvertisingConsent({ categories: { advertisement: false } }), false);
  assert.equal(hasAdvertisingConsent({ accepted: ["necessary", "advertisement"] }), true);
  assert.equal(hasAdvertisingConsent({ accepted: ["necessary"] }), false);
  assert.equal(hasAdvertisingConsent(null), false);
  assert.equal(hasAdvertisingConsent("yes"), false);
});

test("layout only loads fbevents.js through the consent gate", () => {
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /cookieyes_consent_update/);
  assert.match(layout, /__ptllLoadPixel/);
  // The loader snippet must only exist inside the gate function.
  const loads = layout.match(/fbevents\.js/g) ?? [];
  assert.equal(loads.length, 1);
  assert.ok(layout.indexOf("fbevents.js") > layout.indexOf("__ptllLoadPixel=function"));
});

// funnel, refer and admin/login are "use client" pages, which cannot export
// metadata, so their robots tag lives in a sibling layout.tsx.
const NOINDEX = [
  "app/funnel/layout.tsx",
  "app/refer/layout.tsx",
  "app/live/page.tsx",
  "app/admin/login/layout.tsx",
];
test("utility pages are noindex", () => {
  for (const f of NOINDEX) {
    const src = readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
    assert.match(src, /robots:\s*\{\s*index:\s*false/, f);
  }
});

test("every partner academy page is noindex", () => {
  const appDir = new URL("../app/", import.meta.url);
  const academies = readdirSync(appDir).filter((d) => d.endsWith("-academy") && existsSync(new URL(`${d}/page.tsx`, appDir)));
  assert.ok(academies.length >= 5, "found the academy pages");
  for (const d of academies) {
    const src = readFileSync(new URL(`${d}/page.tsx`, appDir), "utf8");
    assert.match(src, /index:\s*false/, d);
  }
});
