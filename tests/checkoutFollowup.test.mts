// tests/checkoutFollowup.test.mts
//
// Who counts as "started checkout and didn't finish". The selection must never
// include someone who paid, never include test addresses, never list anyone
// twice, and report each abandon in exactly one daily window.
import { test } from "node:test";
import assert from "node:assert/strict";
import { selectAbandoned, selectFollowups, isFollowupEligibleEmail } from "../app/lib/checkoutFollowup.ts";

const s = (id: string, status: string, created: number, email: string | null, expiresAt?: number, name?: string) =>
  ({ id, status, created, email, expiresAt, name });

test("an abandoned checkout with no purchase is selected", () => {
  assert.deepEqual(selectFollowups([s("a", "expired", 100, "Jo@Mail.com")], []), ["jo@mail.com"]);
});

test("anyone who completed a purchase is never included, whatever the order", () => {
  const expired = [s("a", "expired", 200, "jo@mail.com"), s("b", "expired", 100, "sam@mail.com")];
  const complete = [s("c", "complete", 300, "JO@mail.com"), s("d", "complete", 50, "sam@mail.com")];
  assert.deepEqual(selectFollowups(expired, complete), []);
});

test("duplicates collapse to one, keeping the latest abandon", () => {
  const expired = [s("a", "expired", 1, "jo@mail.com", 10, "Jo"), s("b", "expired", 2, " JO@mail.com ", 20, "Jo Bloggs")];
  const out = selectAbandoned(expired, []);
  assert.equal(out.length, 1);
  assert.equal(out[0].name, "Jo Bloggs");
  assert.equal(out[0].expiresAt, 20);
});

test("sessions without an email, and test addresses, are skipped", () => {
  const expired = [s("a", "expired", 1, null), s("b", "expired", 1, "x@example.invalid"), s("c", "expired", 1, "y@example.com"), s("d", "expired", 1, "not-an-email")];
  assert.deepEqual(selectFollowups(expired, []), []);
  assert.equal(isFollowupEligibleEmail("real.person@gmail.com"), true);
});

test("the window is half-open, so consecutive daily runs report each abandon once", () => {
  const expired = [s("a", "expired", 0, "a@mail.com", 100), s("b", "expired", 0, "b@mail.com", 200), s("c", "expired", 0, "c@mail.com", 300)];
  const day1 = selectAbandoned(expired, [], 100, 200).map((a) => a.email);
  const day2 = selectAbandoned(expired, [], 200, 300).map((a) => a.email);
  assert.deepEqual(day1, ["a@mail.com"]);
  assert.deepEqual(day2, ["b@mail.com"]);
});
