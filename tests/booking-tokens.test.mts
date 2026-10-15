// tests/booking-tokens.test.mts
//
// WHAT THIS PROTECTS
// - The setter's ?t= booking token: the site accepts exactly what the setter
//   signs (shared fixed vector with APP tests/booking-link.test.mts), rejects
//   tampering and expiry, and never carries name/email/phone.
// - Manage tokens are stored hashed.
// - London conversion across the 25 Oct 2026 clock change.
import { test } from "node:test";
import assert from "node:assert/strict";
import { signLinkToken, verifyLinkToken, newManageToken, hashManageToken } from "../app/lib/booking/tokens.ts";
import { londonWallToUtc, londonDate, addDays, weekdayOf, slotLabel, longLabel } from "../app/lib/booking/london.ts";
import { callTypeFromSlug, CALL_TYPES } from "../app/lib/booking/callTypes.ts";
import { icsFor } from "../app/lib/booking/ics.ts";

const SECRET = "test-secret-0123456789abcdef0123456789";
const VECTOR = "eyJsIjoiMTExMTExMTEtMTExMS00MTExLTgxMTEtMTExMTExMTExMTExIiwidCI6ImNvbnN1bHRhdGlvbiIsImUiOjE3OTAwMDAwMDAwMDB9.5YP424CrdzQRuLmYf97daIRXop89gcpWO0WFCvUYw9g";
const LEAD = "11111111-1111-4111-8111-111111111111";

test("signs the shared fixed vector", () => {
  assert.equal(signLinkToken({ leadId: LEAD, callType: "consultation", expMs: 1790000000000 }, SECRET), VECTOR);
});
test("verifies the vector before expiry, rejects after", () => {
  assert.deepEqual(verifyLinkToken(VECTOR, SECRET, 1789999999999), { leadId: LEAD, callType: "consultation" });
  assert.equal(verifyLinkToken(VECTOR, SECRET, 1790000000001), null);
});
test("rejects a wrong secret, a tampered payload and junk", () => {
  assert.equal(verifyLinkToken(VECTOR, SECRET + "x", 0), null);
  const [p, s] = VECTOR.split(".");
  assert.equal(verifyLinkToken(p.slice(0, -2) + "AA." + s, SECRET, 0), null);
  assert.equal(verifyLinkToken("not-a-token", SECRET, 0), null);
  assert.equal(verifyLinkToken("", SECRET, 0), null);
});
test("token payload carries no PII fields", () => {
  const t = signLinkToken({ leadId: LEAD, callType: "gym_partner", expMs: 1 }, SECRET);
  const json = Buffer.from(t.split(".")[0], "base64url").toString();
  assert.deepEqual(Object.keys(JSON.parse(json)).sort(), ["e", "l", "t"]);
});
test("manage tokens: random, hash is sha256 hex of the token", () => {
  const a = newManageToken(), b = newManageToken();
  assert.notEqual(a.token, b.token);
  assert.match(a.hash, /^[0-9a-f]{64}$/);
  assert.equal(hashManageToken(a.token), a.hash);
});
test("London wall time maps to the right UTC instant either side of 25 Oct 2026", () => {
  assert.equal(new Date(londonWallToUtc("2026-10-19", "09:00")).toISOString(), "2026-10-19T08:00:00.000Z"); // BST
  assert.equal(new Date(londonWallToUtc("2026-10-26", "09:00")).toISOString(), "2026-10-26T09:00:00.000Z"); // GMT
  assert.equal(londonDate(Date.parse("2026-10-25T23:30:00Z")), "2026-10-25");
  assert.equal(londonDate(Date.parse("2026-10-18T23:30:00Z")), "2026-10-19");
  assert.equal(new Date(londonWallToUtc("2026-10-25", "09:00")).toISOString(), "2026-10-25T09:00:00.000Z"); // change day, after 01:00 UTC switch
});
test("date helpers", () => {
  assert.equal(addDays("2026-10-31", 1), "2026-11-01");
  assert.equal(weekdayOf("2026-10-19"), 1);
  assert.equal(slotLabel(Date.parse("2026-10-21T13:30:00Z")), "Wed 21 Oct, 2:30pm");
  assert.equal(slotLabel(Date.parse("2026-10-27T14:00:00Z")), "Tue 27 Oct, 2pm");
  assert.equal(longLabel(Date.parse("2026-10-21T13:30:00Z")), "2:30pm, Wednesday 21 October");
});
test("call types: slugs and Calendly questions", () => {
  assert.equal(callTypeFromSlug("consultation"), "consultation");
  assert.equal(callTypeFromSlug("gym-partner"), "gym_partner");
  assert.equal(callTypeFromSlug("gym_partner"), null);
  assert.equal(CALL_TYPES.consultation.minutes, 30);
  assert.equal(CALL_TYPES.gym_partner.questions[1].choices?.length, 3);
});
test("ics: escapes backslash, semicolon, comma and newline in text fields", () => {
  const ics = icsFor({ id: "x", startMs: 0, endMs: 1, title: "t", description: "a\\b;c,d\ne" });
  assert.ok(ics.split("\r\n").includes("DESCRIPTION:a\\\\b\\;c\\,d\\ne"));
});
test("ics: CRLF line endings, trailing CRLF", () => {
  const ics = icsFor({ id: "x", startMs: 0, endMs: 1, title: "t", description: "d" });
  assert.ok(ics.endsWith("\r\n"));
  assert.equal(ics.split("\r\n").length, ics.split("\n").length);
  assert.ok(!ics.replace(/\r\n/g, "").includes("\n"));
});
test("ics: UID and DTSTART in UTC basic format", () => {
  const ics = icsFor({ id: "abc", startMs: Date.parse("2026-10-21T13:30:00Z"), endMs: Date.parse("2026-10-21T14:00:00Z"), title: "t", description: "d" });
  assert.ok(ics.includes("DTSTART:20261021T133000Z"));
  assert.ok(ics.includes("UID:abc@ptlaunchlab.co.uk"));
});
