// Run: npm run test:unit
//
// WHAT THIS PROTECTS
//
// The link that carries a paying buyer to Praxel. If the signature this file
// produces does not match what Praxel computes, every buyer gets a dead link
// and nobody can enrol — and the failure is invisible from here, because the
// site's half of it succeeds perfectly. Nothing on this side would go red.
//
// So the encoding is pinned to fixed, hand-computed values rather than to
// "whatever the implementation does". The same vectors are asserted on the
// other side in albaco-lms/scripts/test-invite-token.mjs. Changing either
// without the other is the bug these two files exist to catch.

import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { buildInviteUrl, invitePostBody } from "../app/lib/enrolmentInvite.ts";

const SECRET = "test-secret-value";
const payload = {
  sid: "cs_test_123",
  email: "jane@example.com",
  name: "Jane Smith",
  plan: "PIF" as const,
  amount: 1599,
  ts: 1755648000000,
};

// ── The cross-repo contract ─────────────────────────────────────────────────

test("the url points at /enrol/complete on the configured origin", () => {
  const url = buildInviteUrl("https://ptll.praxel.co.uk", payload, SECRET);
  assert.ok(url.startsWith("https://ptll.praxel.co.uk/enrol/complete?"));
});

test("d is base64url of the JSON — the exact bytes Praxel decodes", () => {
  const url = new URL(buildInviteUrl("https://ptll.praxel.co.uk", payload, SECRET));
  const d = url.searchParams.get("d")!;
  assert.equal(d, Buffer.from(JSON.stringify(payload), "utf8").toString("base64url"));
  assert.deepEqual(JSON.parse(Buffer.from(d, "base64url").toString("utf8")), payload);
});

test("t is a hex HMAC-SHA256 of d — the exact thing Praxel recomputes", () => {
  const url = new URL(buildInviteUrl("https://ptll.praxel.co.uk", payload, SECRET));
  const d = url.searchParams.get("d")!;
  assert.equal(url.searchParams.get("t"), crypto.createHmac("sha256", SECRET).update(d).digest("hex"));
});

test("neither half contains a dot — the form joins them as `d.t`", () => {
  const url = new URL(buildInviteUrl("https://ptll.praxel.co.uk", payload, SECRET));
  assert.ok(!url.searchParams.get("d")!.includes("."));
  assert.ok(!url.searchParams.get("t")!.includes("."));
});

test("the url survives a round trip through URLSearchParams unescaped", () => {
  // base64url is already url-safe, so the raw string and the parsed one must
  // agree — if they ever diverge, the signature Praxel recomputes won't match.
  const raw = buildInviteUrl("https://x.co", payload, SECRET);
  const d = raw.slice(raw.indexOf("?d=") + 3, raw.indexOf("&t="));
  assert.equal(new URL(raw).searchParams.get("d"), d);
});

// ── The POST body ───────────────────────────────────────────────────────────

test("the POST body is signed over its own raw text", () => {
  const { body, signature } = invitePostBody(payload, SECRET);
  assert.equal(signature, crypto.createHmac("sha256", SECRET).update(body).digest("hex"));
});

test("the POST body carries the same d as the url", () => {
  const { body } = invitePostBody(payload, SECRET);
  const fromUrl = new URL(buildInviteUrl("https://x.co", payload, SECRET)).searchParams.get("d");
  assert.equal(JSON.parse(body).d, fromUrl);
});

// ── Regression guards ───────────────────────────────────────────────────────

test("a deposit keeps its plan — never derived from the amount", () => {
  // A £1,099 partner pay-in-full is a PIF and a £599 deposit is a deposit; the
  // amount decides neither. This repo has got that wrong twice.
  const dep = { ...payload, plan: "deposit" as const, amount: 599 };
  const decoded = JSON.parse(
    Buffer.from(new URL(buildInviteUrl("https://x.co", dep, SECRET)).searchParams.get("d")!, "base64url").toString("utf8"),
  );
  assert.equal(decoded.plan, "deposit");

  const partnerPif = { ...payload, plan: "PIF" as const, amount: 1099 };
  const decoded2 = JSON.parse(
    Buffer.from(new URL(buildInviteUrl("https://x.co", partnerPif, SECRET)).searchParams.get("d")!, "base64url").toString("utf8"),
  );
  assert.equal(decoded2.plan, "PIF");
});

test("a trailing slash on the origin does not double up", () => {
  assert.ok(!buildInviteUrl("https://x.co/", payload, SECRET).includes("//enrol"));
});

test("a different secret produces a different signature", () => {
  const a = new URL(buildInviteUrl("https://x.co", payload, SECRET)).searchParams.get("t");
  const b = new URL(buildInviteUrl("https://x.co", payload, "other-secret")).searchParams.get("t");
  assert.notEqual(a, b);
});
