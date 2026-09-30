// tests/referral.test.mts
//
// WHAT THIS PROTECTS
//
// Money, and trust. A referral is a promise: £200 to the referrer once the
// person they named enrols. Two ways that goes wrong, and both are here:
//
//   1. We accept a referral we can't act on — a name with no contact details.
//      The referrer waits for £200 that can never arrive, because we were
//      never able to speak to the person they named.
//
//   2. We pay someone for referring themselves. `Learner@Example.com` and
//      `learner@example.com ` are one inbox, so the comparison has to survive
//      case and whitespace or the check is decorative.
//
// These live in referralRules.ts rather than validate.ts because validate.ts
// imports the disposable-email-domains JSON list, which the test runner can't
// load without an import attribute. Changing production imports to suit a test
// would have been the wrong trade.
import { test } from "node:test";
import assert from "node:assert/strict";
import { hasReachableContact, isSelfReferral } from "../app/lib/security/referralRules.ts";

// ── Can we reach them? ────────────────────────────────────────────────────

test("an email alone is enough to act on", () => {
  assert.equal(hasReachableContact("alex@example.com", ""), true);
});

test("a phone number alone is enough — plenty of people know a number, not an email", () => {
  assert.equal(hasReachableContact("", "07700 900123"), true);
});

test("a name with NO contact details is refused", () => {
  assert.equal(hasReachableContact("", ""), false);
});

test("whitespace is not contact details", () => {
  assert.equal(hasReachableContact("   ", "  "), false);
});

test("null and undefined are handled, not thrown on", () => {
  assert.equal(hasReachableContact(null, undefined), false);
  assert.equal(hasReachableContact(undefined, "07700 900123"), true);
});

// ── Are they referring themselves? ────────────────────────────────────────

test("catches an exact self-referral", () => {
  assert.equal(isSelfReferral("learner@example.com", "learner@example.com"), true);
});

test("catches a self-referral in different case", () => {
  assert.equal(isSelfReferral("learner@example.com", "LEARNER@Example.COM"), true);
});

test("catches a self-referral padded with whitespace", () => {
  assert.equal(isSelfReferral(" learner@example.com ", "learner@example.com"), true);
});

test("two different people are not a self-referral", () => {
  assert.equal(isSelfReferral("learner@example.com", "alex@example.com"), false);
});

test("a phone-only referral is NOT treated as a self-referral", () => {
  // The legitimate case: no referred email at all. Returning true here would
  // silently reject every phone-only referral.
  assert.equal(isSelfReferral("learner@example.com", ""), false);
  assert.equal(isSelfReferral("learner@example.com", null), false);
});

test("a missing referrer email is not a self-referral either", () => {
  // It's invalid for other reasons — validateReferral rejects it because there
  // would be nobody to pay — but it is not THIS failure.
  assert.equal(isSelfReferral("", "alex@example.com"), false);
});
