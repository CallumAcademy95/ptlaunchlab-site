// Run: npm run test:unit
//
// WHAT THIS PROTECTS
//
// The gate on /admin, which now shows named leads, phone numbers and payment
// amounts. Two ways to get this wrong, and both are silent:
//
//   1. Break the LEGACY cookie format and every admin is signed out the moment
//      the change deploys. Recoverable, but alarming and avoidable.
//   2. Break verification the other way — accept something that should be
//      rejected — and the gate is open with nothing going red.
//
// So the cases below assert both directions explicitly: what must still work,
// and what must still fail. The legacy vectors are computed the way the OLD
// implementation computed them (HMAC over the expiry alone), so this test fails
// if that path is ever quietly dropped.

import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  issueAuthCookieValue,
  readAuthCookieSubject,
  verifyAuthCookieValue,
  getAdminUsers,
  constantTimeEqual,
} from "../app/lib/admin-auth.ts";

const SECRET = "test-admin-auth-secret-at-least-32-chars";
process.env.ADMIN_AUTH_SECRET = SECRET;

/** Reproduces the pre-change v1 cookie exactly: HMAC over the expiry string. */
function legacyCookie(expiryMs: number, secret = SECRET): string {
  const sig = crypto
    .createHmac("sha256", secret)
    .update(String(expiryMs))
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${expiryMs}.${sig}`;
}

const future = () => Date.now() + 60_000;
const past = () => Date.now() - 60_000;

// ── Backward compatibility: the thing that must not break ──────────────────

test("a legacy v1 cookie still authenticates", async () => {
  const ok = await verifyAuthCookieValue(legacyCookie(future()));
  assert.equal(ok, true, "existing admins would be signed out by this change");
});

test("a legacy cookie reports subject 'legacy' rather than a real identity", async () => {
  const sub = await readAuthCookieSubject(legacyCookie(future()));
  assert.equal(sub, "legacy");
});

test("an expired legacy cookie is rejected", async () => {
  assert.equal(await verifyAuthCookieValue(legacyCookie(past())), false);
});

test("a legacy cookie signed with the wrong secret is rejected", async () => {
  assert.equal(await verifyAuthCookieValue(legacyCookie(future(), "some-other-secret-value-32-chars!!")), false);
});

// ── Current v2 format ───────────────────────────────────────────────────────

test("a fresh cookie round-trips and carries its subject", async () => {
  const sub = await readAuthCookieSubject(await issueAuthCookieValue("callum"));
  assert.equal(sub, "callum");
});

test("subject defaults to 'admin' when none is given", async () => {
  assert.equal(await readAuthCookieSubject(await issueAuthCookieValue()), "admin");
});

test("an unsafe subject falls back to 'admin' rather than entering the cookie", async () => {
  // Dots would break parsing; anything exotic could poison a log grep.
  const sub = await readAuthCookieSubject(await issueAuthCookieValue("evil.subject"));
  assert.equal(sub, "admin");
});

test("tampering with the subject invalidates the cookie", async () => {
  const [expiry, , sig] = (await issueAuthCookieValue("callum")).split(".");
  assert.equal(await verifyAuthCookieValue(`${expiry}.attacker.${sig}`), false);
});

test("tampering with the expiry invalidates the cookie", async () => {
  const [, sub, sig] = (await issueAuthCookieValue("callum")).split(".");
  assert.equal(await verifyAuthCookieValue(`${Date.now() + 999_999_999}.${sub}.${sig}`), false);
});

test("garbage and empty values are rejected", async () => {
  for (const v of ["", "nonsense", "1.2.3.4", ".", undefined, null]) {
    assert.equal(await verifyAuthCookieValue(v as string), false, `accepted: ${String(v)}`);
  }
});

// ── User configuration ──────────────────────────────────────────────────────

test("ADMIN_PASSWORD alone still yields a single 'admin' user", () => {
  delete process.env.ADMIN_USERS;
  process.env.ADMIN_PASSWORD = "hunter2";
  const users = getAdminUsers();
  assert.deepEqual(users, [{ id: "admin", password: "hunter2" }]);
});

test("ADMIN_USERS provides named users", () => {
  process.env.ADMIN_USERS = JSON.stringify([
    { id: "callum", password: "aaa" },
    { id: "ops", password: "bbb" },
  ]);
  const ids = getAdminUsers().map((u) => u.id);
  assert.deepEqual(ids, ["callum", "ops"]);
});

test("malformed ADMIN_USERS denies rather than falling back to the shared password", () => {
  // Falling back would look like it worked while silently losing identity —
  // exactly the class of failure this whole change is meant to remove.
  process.env.ADMIN_PASSWORD = "hunter2";
  process.env.ADMIN_USERS = "{not json";
  assert.deepEqual(getAdminUsers(), []);

  process.env.ADMIN_USERS = JSON.stringify([{ id: "", password: "" }]);
  assert.deepEqual(getAdminUsers(), []);
});

test("no configuration at all denies", () => {
  delete process.env.ADMIN_USERS;
  delete process.env.ADMIN_PASSWORD;
  assert.deepEqual(getAdminUsers(), []);
});

// ── Constant-time compare ───────────────────────────────────────────────────

test("constantTimeEqual matches only identical strings", () => {
  assert.equal(constantTimeEqual("abc", "abc"), true);
  assert.equal(constantTimeEqual("abc", "abd"), false);
  assert.equal(constantTimeEqual("abc", "abcd"), false);
  assert.equal(constantTimeEqual("", ""), true);
});
