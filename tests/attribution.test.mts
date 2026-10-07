// tests/attribution.test.mts
//
// WHAT THIS PROTECTS
//
// Durable enrolment-source tracking. Attribution used to travel only inside
// the 200-char client_reference_id blob, which truncated, so real sales
// (26 Jul, 29 Sep) are undecodable. It now also rides in Stripe metadata
// (`attr_*`). These tests pin the pure pieces: reading the localStorage
// touches defensively, sanitising what a browser sends us, and shaping Stripe
// metadata within Stripe's limits (<= 50 keys / 500-char values — we cap far
// lower so we can never crowd out the existing money-relevant keys).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  attributionFromTouches,
  sanitizeAttribution,
  attributionMetadata,
} from "../app/lib/attribution.ts";

test("first touch maps to ft* fields, referrer reduced to host", () => {
  const a = attributionFromTouches(
    {
      utm_source: "facebook",
      utm_medium: "paid",
      utm_campaign: "oct",
      utm_content: "vid1",
      landing_path: "/courses",
      referrer: "https://l.facebook.com/l.php?u=secret",
      fbclid: "abc",
    },
    {},
  );
  assert.deepEqual(a, {
    fts: "facebook", ftm: "paid", ftc: "oct", ftco: "vid1",
    ftl: "/courses", ftr: "l.facebook.com", fbclid: "abc",
  });
});

test("last touch only included where it differs from first touch", () => {
  const first = { utm_source: "facebook", utm_medium: "paid", utm_campaign: "oct" };
  const last = { utm_source: "google", utm_medium: "paid", utm_campaign: "oct" };
  const a = attributionFromTouches(first, last);
  assert.equal(a.lts, "google");
  assert.equal(a.ltm, undefined);
  assert.equal(a.ltc, undefined);
});

test("garbage input never throws and yields nothing", () => {
  for (const bad of [null, undefined, 5, "x", [], { utm_source: 7 }, { referrer: {} }]) {
    assert.deepEqual(attributionFromTouches(bad, bad), {});
  }
});

test("an unparseable referrer is dropped, not stored raw", () => {
  const a = attributionFromTouches({ referrer: "not a url" }, {});
  assert.equal(a.ftr, undefined);
});

test("sanitizeAttribution keeps only known string keys and caps lengths", () => {
  const s = sanitizeAttribution({
    fts: "  facebook  ",
    ftm: "x".repeat(500),
    fbclid: "y".repeat(500),
    evil: "drop me",
    lts: 42,
    gclid: "g",
  });
  assert.equal(s.fts, "facebook");
  assert.equal(s.ftm?.length, 120);
  assert.equal(s.fbclid?.length, 200);
  assert.equal(s.gclid, "g");
  assert.equal("evil" in s, false);
  assert.equal("lts" in s, false);
});

test("sanitizeAttribution tolerates non-objects", () => {
  for (const bad of [null, undefined, "x", 3, []]) {
    assert.deepEqual(sanitizeAttribution(bad), {});
  }
});

test("attributionMetadata prefixes keys, omits empties, respects Stripe limits", () => {
  const m = attributionMetadata({ fts: "facebook", ftm: "", ftc: undefined, lts: "google" });
  assert.deepEqual(m, { attr_fts: "facebook", attr_lts: "google" });

  const full = attributionMetadata({
    fts: "a", ftm: "a", ftc: "a", ftco: "a", ftl: "a", ftr: "a",
    lts: "a", ltm: "a", ltc: "a", ltco: "a", ltl: "a",
    fbclid: "a", gclid: "a",
  });
  assert.ok(Object.keys(full).length <= 15);
  for (const v of Object.values(attributionMetadata({ fbclid: "z".repeat(900) }))) {
    assert.ok(v.length <= 500);
  }
});

test("attributionMetadata of nothing is empty", () => {
  assert.deepEqual(attributionMetadata({}), {});
});

test("funnel client_reference_id never exceeds Stripe's 200 chars, even with 120-char UTMs", async () => {
  const { buildFunnelClientRef, sanitizeAttribution } = await import("../app/lib/attribution.ts");
  // Same encoding as funnelPromo.encodeClientRef (base64url of JSON).
  const encode = (d: Record<string, string>) => Buffer.from(JSON.stringify(d), "utf8").toString("base64url");
  const long = "x".repeat(120);
  const a = sanitizeAttribution({ fts: long, ftm: long, ftc: long, lts: long });
  const ref = buildFunnelClientRef(a, "quiz-funnel-promo", encode);
  assert.ok(ref.length <= 200, `ref was ${ref.length}`);
  const decoded = JSON.parse(Buffer.from(ref, "base64url").toString("utf8"));
  assert.equal(decoded.funnel_promo, "quiz-funnel-promo", "funnel marker survives");
});

test("funnel ref falls back to the funnel marker alone when still too long", async () => {
  const { buildFunnelClientRef } = await import("../app/lib/attribution.ts");
  const encode = (d: Record<string, string>) => "z".repeat(JSON.stringify(d).length * 3);
  const ref = buildFunnelClientRef({ fts: "a" }, "p", encode);
  assert.ok(ref.length <= 200);
});

test("funnel ref keeps normal short values and (direct) defaults", async () => {
  const { buildFunnelClientRef } = await import("../app/lib/attribution.ts");
  const encode = (d: Record<string, string>) => JSON.stringify(d);
  assert.equal(buildFunnelClientRef({}, undefined, encode), '{"fts":"(direct)","ftm":"(none)","ftc":"(none)"}');
});
