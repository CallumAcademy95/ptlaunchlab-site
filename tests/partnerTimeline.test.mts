// tests/partnerTimeline.test.mts
//
// WHAT THIS PROTECTS
//
// A CRM that tells you something untrue about a partner is worse than no CRM,
// because it launders the problem into a label you then stop questioning.
//
// Three specific ways that could happen here, all pinned below:
//
//   1. Calling a gym "producing" when it has never logged in and sent nobody.
//      Four of the nine have produced nothing; the screen has to say so.
//   2. Putting an unpaid payout on a history. A payout row that has not been
//      paid is a plan, not an event.
//   3. Counting a voided sale as an enrolment.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildPartnerTimeline,
  daysSinceLastActivity,
  partnerHealth,
  daysSinceTheirActivity,
} from "../app/lib/partner-timeline.ts";

const DAY = 86_400_000;
const NOW = Date.parse("2026-09-30T12:00:00Z");
const ago = (d: number) => new Date(NOW - d * DAY).toISOString();

const partner = {
  gym_name: "Ebor Fitness",
  created_at: ago(200),
  agreement_signed_at: ago(180),
  agreement_version: "3.0",
};

test("the timeline is newest first", () => {
  const t = buildPartnerTimeline({
    partner,
    users: [{ email: "a@b.com", full_name: "Nat", created_at: ago(150), last_login_at: ago(5) }],
    sales: [{ learner_name: "Sam", learner_email: null, plan_type: "pif", amount_paid_pence: 139900, commission_pence: 50000, status: "confirmed", enrolled_at: ago(40), created_at: ago(40) }],
    payouts: [{ period_label: "Sept", total_pence: 50000, status: "paid", invoice_number: "INV-1", paid_at: ago(20), created_at: ago(25) }],
  });
  const times = t.map((e) => Date.parse(e.at));
  assert.deepEqual(times, [...times].sort((a, b) => b - a), "events are not newest-first");
  assert.equal(t[0].kind, "first_login");
});

test("a voided sale is not an enrolment", () => {
  const t = buildPartnerTimeline({
    partner,
    users: [],
    sales: [{ learner_name: "Void", learner_email: null, plan_type: null, amount_paid_pence: 0, commission_pence: 0, status: "voided", enrolled_at: ago(10), created_at: ago(10) }],
    payouts: [],
  });
  assert.equal(t.filter((e) => e.kind === "sale").length, 0);
});

test("an UNPAID payout never reaches the history", () => {
  const t = buildPartnerTimeline({
    partner,
    users: [],
    sales: [],
    payouts: [
      { period_label: "Oct", total_pence: 50000, status: "pending", invoice_number: null, paid_at: null, created_at: ago(3) },
      { period_label: "Sept", total_pence: 50000, status: "paid", invoice_number: "INV-1", paid_at: ago(20), created_at: ago(25) },
    ],
  });
  const payouts = t.filter((e) => e.kind === "payout");
  assert.equal(payouts.length, 1, "an unpaid payout was listed as if the money had gone");
  assert.match(payouts[0].detail ?? "", /INV-1/);
});

test("a sale with no learner name still reads as a sentence", () => {
  const t = buildPartnerTimeline({
    partner, users: [], payouts: [],
    sales: [{ learner_name: null, learner_email: null, plan_type: null, amount_paid_pence: null, commission_pence: null, status: "confirmed", enrolled_at: ago(1), created_at: ago(1) }],
  });
  assert.equal(t[0].title, "A learner enrolled");
});

test("an undated or malformed event is dropped, not rendered as Invalid Date", () => {
  const t = buildPartnerTimeline({
    partner: { ...partner, agreement_signed_at: "not-a-date" },
    users: [{ email: "a@b.com", full_name: null, created_at: null, last_login_at: null }],
    sales: [], payouts: [],
  });
  assert.equal(t.length, 0);
});

test("the last login is labelled as a LAST login, not a first", () => {
  // There is no login history table, so calling it "first signed in" would be
  // wrong for anyone who has logged in twice.
  const t = buildPartnerTimeline({
    partner: { ...partner, agreement_signed_at: null },
    users: [{ email: "a@b.com", full_name: null, created_at: null, last_login_at: ago(2) }],
    sales: [], payouts: [],
  });
  assert.match(t[0].title, /Last signed in/);
  assert.doesNotMatch(t[0].title, /first/i);
});

// ── days since activity ───────────────────────────────────────────────────

test("days since last activity counts from the newest event", () => {
  const t = buildPartnerTimeline({
    partner: { ...partner, agreement_signed_at: ago(100) },
    users: [], sales: [], payouts: [],
  });
  assert.equal(daysSinceLastActivity(t, NOW), 100);
});

test("no history at all returns null rather than 0", () => {
  // 0 would read as "active today", which is the opposite of the truth.
  assert.equal(daysSinceLastActivity([], NOW), null);
});

// ── health ────────────────────────────────────────────────────────────────

test("a gym that never logged in and sent nobody is 'never started'", () => {
  const { health } = partnerHealth({ events: [], hasEverLoggedIn: false, learners: 0, now: NOW });
  assert.equal(health, "never started");
});

test("a gym with learners and recent activity is 'producing'", () => {
  const t = buildPartnerTimeline({ partner, users: [], payouts: [],
    sales: [{ learner_name: "Sam", learner_email: null, plan_type: null, amount_paid_pence: null, commission_pence: 50000, status: "confirmed", enrolled_at: ago(10), created_at: ago(10) }] });
  const { health } = partnerHealth({ events: t, hasEverLoggedIn: true, learners: 1, now: NOW });
  assert.equal(health, "producing");
});

test("a gym with learners but silent for months is 'quiet', NOT producing", () => {
  // Ebor's real shape: three learners, last sale in August. The screen must
  // not call that producing just because the learner count is non-zero.
  const t = buildPartnerTimeline({ partner: { ...partner, agreement_signed_at: ago(300) }, users: [], payouts: [],
    sales: [{ learner_name: "Sam", learner_email: null, plan_type: null, amount_paid_pence: null, commission_pence: 50000, status: "confirmed", enrolled_at: ago(200), created_at: ago(200) }] });
  const { health, why } = partnerHealth({ events: t, hasEverLoggedIn: true, learners: 3, now: NOW });
  assert.equal(health, "quiet");
  assert.match(why, /200 days/);
});

test("a gym that has signed in but produced nothing is 'engaged', not 'producing'", () => {
  const t = buildPartnerTimeline({
    partner: { ...partner, agreement_signed_at: null },
    users: [{ email: "a@b.com", full_name: null, created_at: ago(30), last_login_at: ago(4) }],
    sales: [], payouts: [],
  });
  const { health } = partnerHealth({ events: t, hasEverLoggedIn: true, learners: 0, now: NOW });
  assert.equal(health, "engaged");
});

test("health never reports 'producing' with zero learners", () => {
  // The property that matters: no combination of activity can make an empty
  // gym look like a performing one.
  for (const idle of [0, 10, 100, 500]) {
    const t = buildPartnerTimeline({
      partner: { ...partner, agreement_signed_at: ago(idle) },
      users: [{ email: "a@b.com", full_name: null, created_at: ago(idle), last_login_at: ago(idle) }],
      sales: [], payouts: [],
    });
    const { health } = partnerHealth({ events: t, hasEverLoggedIn: true, learners: 0, now: NOW });
    assert.notEqual(health, "producing", `idle=${idle} produced a false 'producing'`);
  }
});

// ── two things the first live walk of the page got wrong ──────────────────
//
// Walking all ten partners on 30 Sep, 6fit's page said "never started · No
// portal login, no learners" in the header and then, four inches lower,
// listed a portal login created on 28 Jul for Miles Halstead. Both cannot be
// true. The header was the one lying.
//
// The same page also said "Last activity 63 days ago" when the only thing in
// the history was US creating that login. Nothing the gym did was 63 days
// ago; nothing the gym did has EVER happened. An idle clock that counts our
// own admin work as partner activity is the number that makes a dead partner
// look merely slow.

test("a login that exists but has never been used is not reported as no login", () => {
  const { health, why } = partnerHealth({
    events: [], hasEverLoggedIn: false, learners: 0, logins: 1, now: NOW,
  });
  assert.equal(health, "never started");
  assert.doesNotMatch(why, /No portal login/, "claimed there is no login when one exists");
  assert.match(why, /never/i);
});

test("a partner with no login at all still says so", () => {
  const { why } = partnerHealth({ events: [], hasEverLoggedIn: false, learners: 0, logins: 0, now: NOW });
  assert.match(why, /No portal login/);
});

test("work WE did is not counted as the partner's activity", () => {
  // 6fit's real shape: we made them a login, they never touched it.
  const t = buildPartnerTimeline({
    partner: { ...partner, agreement_signed_at: null },
    users: [{ email: "m@h.com", full_name: "Miles", created_at: ago(63), last_login_at: null }],
    sales: [], payouts: [],
  });
  assert.equal(daysSinceLastActivity(t, NOW), 63, "the raw clock still counts everything");
  assert.equal(
    daysSinceTheirActivity(t, NOW), null,
    "counted our own admin work as something the gym did",
  );
});

test("a payout we sent does not keep a dead partner looking alive", () => {
  // Paying an old invoice last week must not reset the partner's idle clock.
  const t = buildPartnerTimeline({
    partner: { ...partner, agreement_signed_at: ago(400) },
    users: [{ email: "a@b.com", full_name: null, created_at: ago(400), last_login_at: ago(300) }],
    sales: [{ learner_name: "Sam", learner_email: null, plan_type: null, amount_paid_pence: null, commission_pence: 50000, status: "confirmed", enrolled_at: ago(300), created_at: ago(300) }],
    payouts: [{ period_label: "Sept", total_pence: 50000, status: "paid", invoice_number: "INV-9", paid_at: ago(7), created_at: ago(8) }],
  });
  const { health } = partnerHealth({ events: t, hasEverLoggedIn: true, learners: 1, logins: 1, now: NOW });
  assert.equal(health, "quiet", "a payment we made read as the gym being active");
});
