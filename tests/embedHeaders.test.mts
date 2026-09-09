// tests/embedHeaders.test.mts
//
// WHAT THIS PROTECTS
//
// The one hole we deliberately opened in the site's clickjacking defence.
//
// Every route ships X-Frame-Options: DENY and CSP frame-ancestors 'none'.
// /embed/* is the single exception — it must be framable by any partner's
// website, or the embed product does not exist. This test pins both halves of
// that: the exception is open, and it is open ONLY there.
//
// Two specific ways this silently breaks:
//
// 1. X-Frame-Options creeping back onto /embed/*. It has no multi-origin form
//    (ALLOW-FROM is dead everywhere), so any value there overrides
//    frame-ancestors in some engines and the embed goes blank on partner
//    sites — while every header still "looks" present and correct.
// 2. The development-only localhost allowance leaking into production. It
//    exists so the browser test frames a real iframe instead of asserting on
//    a string. In production the value must be exactly `https:`.

import { test } from "node:test";
import assert from "node:assert/strict";

type HeaderRule = { source: string; headers: { key: string; value: string }[] };

/** next.config.ts reads NODE_ENV at module scope, so load it under a given env. */
async function rulesFor(env: "production" | "development"): Promise<HeaderRule[]> {
  const env_ = process.env as Record<string, string | undefined>;
  const prev = env_.NODE_ENV;
  env_.NODE_ENV = env;
  try {
    // cache-bust so the module re-evaluates against the new NODE_ENV
    const mod = await import(`../next.config.ts?env=${env}&t=${Date.now()}`);
    return (await mod.default.headers()) as HeaderRule[];
  } finally {
    env_.NODE_ENV = prev;
  }
}

const ruleFor = (rules: HeaderRule[], source: string) => {
  const r = rules.find((x) => x.source === source);
  assert.ok(r, `no header rule with source "${source}" — sources present: ${rules.map((x) => x.source).join(", ")}`);
  return r!;
};

const headerValue = (rule: HeaderRule, key: string) =>
  rule.headers.find((h) => h.key.toLowerCase() === key.toLowerCase())?.value;

const directive = (csp: string | undefined, name: string) =>
  csp?.split(";").map((d) => d.trim()).find((d) => d.startsWith(name));

test("the strict block no longer matches /embed/ — otherwise two rules fight", async () => {
  const rules = await rulesFor("production");
  const strict = ruleFor(rules, "/((?!embed/).*)");
  assert.equal(headerValue(strict, "X-Frame-Options"), "DENY");
  assert.equal(directive(headerValue(strict, "Content-Security-Policy"), "frame-ancestors"), "frame-ancestors 'none'");
});

test("/embed/* carries NO X-Frame-Options — any value there breaks the embed", async () => {
  const rules = await rulesFor("production");
  const embed = ruleFor(rules, "/embed/:path*");
  const keys = embed.headers.map((h) => h.key.toLowerCase());
  assert.ok(
    !keys.includes("x-frame-options"),
    "X-Frame-Options is set on /embed/* — it has no multi-origin form, so it overrides frame-ancestors and the card goes blank on partner sites",
  );
});

test("production frame-ancestors is exactly https: — no localhost leak", async () => {
  const rules = await rulesFor("production");
  const csp = headerValue(ruleFor(rules, "/embed/:path*"), "Content-Security-Policy");
  assert.equal(directive(csp, "frame-ancestors"), "frame-ancestors https:");
  assert.ok(!csp!.includes("localhost"), "localhost reached the production CSP");
  assert.ok(!csp!.includes("127.0.0.1"), "127.0.0.1 reached the production CSP");
});

test("development additionally allows localhost, so the browser test is real", async () => {
  const rules = await rulesFor("development");
  const csp = headerValue(ruleFor(rules, "/embed/:path*"), "Content-Security-Policy");
  const fa = directive(csp, "frame-ancestors")!;
  assert.ok(fa.includes("https:"), fa);
  assert.ok(fa.includes("http://localhost:*"), fa);
});

test("the embed CSP runs no scripts and reaches nowhere", async () => {
  const rules = await rulesFor("production");
  const csp = headerValue(ruleFor(rules, "/embed/:path*"), "Content-Security-Policy")!;
  // The card must stay a static document: no pixel, no GA4, no consent banner.
  assert.equal(directive(csp, "script-src"), "script-src 'none'");
  assert.equal(directive(csp, "connect-src"), "connect-src 'none'");
  assert.equal(directive(csp, "form-action"), "form-action 'none'");
  assert.equal(directive(csp, "object-src"), "object-src 'none'");
  assert.equal(directive(csp, "base-uri"), "base-uri 'none'");
});

test("no OTHER route was made framable", async () => {
  const rules = await rulesFor("production");
  for (const rule of rules) {
    if (rule.source === "/embed/:path*") continue;
    const fa = directive(headerValue(rule, "Content-Security-Policy"), "frame-ancestors");
    if (fa) assert.equal(fa, "frame-ancestors 'none'", `${rule.source} is framable`);
  }
});
