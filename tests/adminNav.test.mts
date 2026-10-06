// tests/adminNav.test.mts
//
// WHAT THIS PROTECTS
//
// Two ways a sidebar quietly stops being useful:
//
//   1. It highlights the wrong thing. Prefix matching is what makes
//      /admin/partners/ebor light up "Gym partners" — and the naive version
//      of it would light "Gym partners" up on a future /admin/partnerships
//      too, so the match is bounded at a path segment.
//   2. It points at a page that no longer exists. Every href here is checked
//      against the routes actually on disk, because a dead nav entry is worse
//      than no nav entry: it looks like the feature is broken.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { ADMIN_NAV, ADMIN_NAV_ITEMS, isActiveNav } from "../app/admin/(shell)/nav.ts";

test("every nav entry points at a page that exists on disk", () => {
  for (const item of ADMIN_NAV_ITEMS) {
    const route = item.href.replace(/^\/admin\//, "");
    // The shell route group does not change the URL, so a page may live at
    // either spelling.
    const candidates = [
      `app/admin/${route}/page.tsx`,
      `app/admin/(shell)/${route}/page.tsx`,
    ];
    assert.ok(
      candidates.some((p) => existsSync(p)),
      `${item.href} has no page — the sidebar would link to a 404`,
    );
  }
});

test("a detail page keeps its section highlighted", () => {
  assert.equal(isActiveNav("/admin/partners", "/admin/partners"), true);
  assert.equal(isActiveNav("/admin/partners", "/admin/partners/ebor"), true);
});

test("a sibling route with a longer name does not steal the highlight", () => {
  // `pathname.startsWith(href)` alone would return true here.
  assert.equal(isActiveNav("/admin/partners", "/admin/partnerships"), false);
  assert.equal(isActiveNav("/admin/ads", "/admin/adspend"), false);
});

test("an unrelated page highlights nothing", () => {
  const lit = ADMIN_NAV_ITEMS.filter((i) => isActiveNav(i.href, "/admin/login"));
  assert.deepEqual(lit, []);
});

test("exactly one entry is highlighted on any admin page", () => {
  // Two highlighted entries means the nav is lying about where you are.
  for (const pathname of [
    "/admin/partners",
    "/admin/partners/muscle-bound",
    "/admin/outreach",
    "/admin/outreach/template",
    "/admin/referrals",
    "/admin/leads",
    "/admin/leads/abc-123",
    "/admin/ads",
    "/admin/ads/create",
    "/admin/whatsapp",
    "/admin/live-questions",
  ]) {
    const lit = ADMIN_NAV_ITEMS.filter((i) => isActiveNav(i.href, pathname));
    assert.equal(lit.length, 1, `${pathname} highlighted ${lit.length} entries`);
  }
});

test("no two entries share an href", () => {
  const seen = new Set<string>();
  for (const i of ADMIN_NAV_ITEMS) {
    assert.ok(!seen.has(i.href), `${i.href} appears twice in the nav`);
    seen.add(i.href);
  }
});

test("every group has a label and at least one item", () => {
  for (const g of ADMIN_NAV) {
    assert.ok(g.label.trim().length > 0);
    assert.ok(g.items.length > 0, `group "${g.label}" is empty`);
  }
});
