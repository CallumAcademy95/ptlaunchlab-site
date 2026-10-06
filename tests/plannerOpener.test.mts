// Run: npm run test:unit
//
// WHAT THIS PROTECTS
//
// An unattended cron that emails strangers in Callum's name. The two failures
// that matter are not "the copy is a bit off":
//
//   1. EMAILING THE SAME PERSON TWICE. Recoverable failures (a send that does
//      not go) cost one cycle. A duplicate cannot be taken back, and it is the
//      fastest way to make a personal-sounding email obviously automated.
//   2. A VISIBLE GAP. "it came back at , with around  months" is a mailmerge
//      confessing. The whole point of this email is that it does not read like
//      one, so a missing field must rebuild the sentence, not print a hole.
//
// There is also a hard rule the funnel depends on: this email contains NO LINKS.
// It asks for a reply. Across ~10,000 sequence sends the automated emails have
// produced one click, which is why the ask here is a question and not a button.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  compose,
  eligibility,
  greetingName,
  isRefreshRoute,
  intakeFromFields,
  ukHour,
  BLOCKED,
  MIN_AGE_MINUTES,
  MAX_AGE_DAYS,
  type PlannerLead,
} from "../lib/planner-opener.ts";

const NOW = new Date("2026-09-14T12:00:00Z");
const minsAgo = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString();
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();

function lead(over: Partial<PlannerLead> = {}): PlannerLead {
  return {
    email: "someone@example.com",
    name: "Jane May",
    score: "60",
    months: "7",
    job: "desk",
    route: "NCFE Level 3 Diploma + PT Launch Lab Mentorship",
    subscribedAt: minsAgo(MIN_AGE_MINUTES + 30),
    openerSent: null,
    status: "active",
    version: null,
    timeframe: null,
    blocker: null,
    phone: null,
    fields: {},
    ...over,
  };
}

// --- never twice -----------------------------------------------------------

test("a lead who already had the opener is never sent another", () => {
  const v = eligibility(lead({ openerSent: "2026-09-14" }), NOW);
  assert.equal(v.ok, false);
  assert.match((v as { reason: string }).reason, /already sent/);
});

test("the do-not-contact list is enforced, case-insensitively", () => {
  for (const blocked of BLOCKED) {
    assert.equal(eligibility(lead({ email: blocked.toUpperCase() }), NOW).ok, false);
  }
});

test("only active subscribers are opened to", () => {
  for (const status of ["unsubscribed", "bounced", "junk", "unconfirmed"]) {
    assert.equal(eligibility(lead({ status }), NOW).ok, false, status);
  }
  assert.equal(eligibility(lead({ status: "active" }), NOW).ok, true);
});

// --- timing ----------------------------------------------------------------

test("a brand-new lead waits, so the opener does not land on top of the plan email", () => {
  const v = eligibility(lead({ subscribedAt: minsAgo(MIN_AGE_MINUTES - 1) }), NOW);
  assert.equal(v.ok, false);
  assert.match((v as { reason: string }).reason, /too new/);
  assert.equal(eligibility(lead({ subscribedAt: minsAgo(MIN_AGE_MINUTES + 1) }), NOW).ok, true);
});

// The backstop. If the sent-marker is ever lost — a cleared field, a rename —
// this is what stops the next run opening to the entire back catalogue.
test("leads older than the window are never opened to, however the marker behaves", () => {
  const v = eligibility(lead({ subscribedAt: daysAgo(MAX_AGE_DAYS + 1), openerSent: null }), NOW);
  assert.equal(v.ok, false);
  assert.match((v as { reason: string }).reason, /too old/);
});

test("a missing or unreadable signup time is refused, not treated as ancient or brand new", () => {
  assert.equal(eligibility(lead({ subscribedAt: null }), NOW).ok, false);
  assert.equal(eligibility(lead({ subscribedAt: "not a date" }), NOW).ok, false);
});

test("MailerLite's space-separated timestamps parse as UTC", () => {
  // The API returns "2026-09-14 09:30:45", not ISO. Read as local time this
  // would drift by an hour in BST and leads would be opened to early.
  assert.equal(eligibility(lead({ subscribedAt: "2026-09-14 09:30:45" }), NOW).ok, true);
});

test("sending hours are read in UK wall-clock time, so BST needs no maths of ours", () => {
  assert.equal(ukHour(new Date("2026-09-14T08:30:00Z")), 9); // BST
  assert.equal(ukHour(new Date("2026-01-14T08:30:00Z")), 8); // GMT
});

// --- the copy --------------------------------------------------------------

test("no link ever appears in the body", () => {
  for (const job of ["desk", "trades", "health", "other"]) {
    for (const route of ["NCFE Level 3 Diploma", "NCFE Level 3 (refresh)"]) {
      const body = compose(lead({ job, route }));
      assert.ok(!/https?:\/\//.test(body), `link in ${job}/${route}`);
    }
  }
});

test("a missing score or month count rebuilds the sentence instead of leaving a gap", () => {
  for (const over of [{ score: null }, { months: null }, { score: null, months: null }, { score: "", months: "" }]) {
    const body = compose(lead(over));
    assert.ok(!/at ,/.test(body), `visible gap: ${body.split("\n")[2]}`);
    assert.ok(!/around\s+months/.test(body), `visible gap: ${body.split("\n")[2]}`);
    assert.ok(!/null|undefined|NaN/.test(body));
  }
});

test("the refresh question appears only for the refresh route", () => {
  assert.match(compose(lead({ route: "NCFE Level 3 (refresh) + Mentorship" })), /current or lapsed/);
  assert.doesNotMatch(compose(lead({ route: "NCFE Level 3 Diploma" })), /current or lapsed/);
  assert.equal(isRefreshRoute(null), false);
});

test("an unknown job adds no line rather than a generic one", () => {
  const body = compose(lead({ job: "other" }));
  assert.ok(!/desk job|trade|health role/.test(body));
  assert.match(body, /career planner and it came back at 60/);
});

// --- the greeting ----------------------------------------------------------

test("a doubtful name becomes a bare Hi rather than a wrong name", () => {
  for (const name of [null, "", "   ", "X", "a-very-long-first-name", "?!", "123", "Dr."]) {
    assert.equal(greetingName(name), null, JSON.stringify(name));
  }
  assert.match(compose(lead({ name: null })), /^Hi,\n/);
});

test("only the first name is used, and it is title-cased", () => {
  assert.equal(greetingName("Jane May"), "Jane");
  assert.equal(greetingName("JANE"), "Jane");
  assert.equal(greetingName("  karen-louise kirk "), "Karen-louise");
  assert.match(compose(lead({ name: "Jane May" })), /^Hi Jane,/);
});

// KNOWN LIMITATION, written down rather than pretended away. The planner's name
// field is free text and has captured a surname alone — "Parkinson", whose
// address was parkysam@, so he is Sam. Nothing here can tell a surname from a
// first name, so that lead would be greeted "Hi Parkinson". It is rare and it is
// mild; a filter aggressive enough to catch it would drop real first names,
// which is the worse trade. Greet that one by hand if it recurs.
test("a surname-only name is still used — documented limitation, not a bug to silently fix", () => {
  assert.equal(greetingName("Parkinson"), "Parkinson");
});

// --- v2 wording and the sweep ----------------------------------------------

const V2: PlannerLead = lead({
  email: "sam@example.com", name: "Sam", score: null, months: null, job: "trades", route: null,
  subscribedAt: "2026-10-06 09:00:00", version: "2", timeframe: "30_days", blocker: "cost",
  phone: "+447700900123",
});

test("v2 opener uses timing and worry, never a score", () => {
  const body = compose(V2);
  assert.match(body, /start in the next month/);
  assert.match(body, /the cost/);
  assert.ok(!/came back at/.test(body));
});

test("v1 leads keep the old wording", () => {
  assert.match(compose({ ...V2, version: null, score: "72", months: "8" }), /came back at 72/);
});

test("sweep rebuilds an intake payload from MailerLite fields", () => {
  const p = intakeFromFields("sam@example.com", { name: "Sam", phone: "+447700900123", plan_version: "2",
    plan_why: "freedom", plan_current_job: "trades", plan_goal: "part_time", plan_timeframe: "30_days",
    plan_blocker: "cost", plan_blocker_note: null, plan_hours: "3_5", plan_training: "regular",
    plan_region: "Wales", plan_town: "Cardiff", plan_payment: "full", plan_consent_at: "2026-10-06T09:00:00Z" }) as any;
  assert.equal(p.planVersion, 2);
  assert.equal(p.band, "prime");
  assert.equal(p.score, 90);
  assert.equal(p.answers.town, "Cardiff");
  assert.equal(intakeFromFields("x@y.z", { plan_version: "2", phone: null }), null);
});

test("sweep refuses without consent evidence and lowercases the email", () => {
  const f = { name: "Sam", phone: "+447700900123", plan_version: "2", plan_consent_at: "2026-10-06T09:00:00Z" };
  assert.equal(intakeFromFields("sam@example.com", { ...f, plan_consent_at: null }), null);
  assert.equal(intakeFromFields("sam@example.com", { ...f, plan_consent_at: "  " }), null);
  assert.equal((intakeFromFields("  Sam@Example.COM ", f) as any).email, "sam@example.com");
});

// --- v2 waits for the WhatsApp window ----------------------------------------

test("v2 lead is held before 10:00 UK, in both GMT and BST", () => {
  const winter = new Date("2026-01-15T09:30:00Z"); // 09:30 London (GMT)
  const summer = new Date("2026-07-15T08:30:00Z"); // 09:30 London (BST)
  for (const now of [winter, summer]) {
    const sub = new Date(now.getTime() - 5 * 3_600_000).toISOString();
    const v = eligibility(lead({ version: "2", subscribedAt: sub }), now);
    assert.equal(v.ok, false);
    if (!v.ok) assert.equal(v.reason, "v2: waiting for WhatsApp window");
  }
});

test("v2 lead is eligible from 10:00 UK, and v1 is unaffected at 09:30", () => {
  const winter = new Date("2026-01-15T10:30:00Z");
  const summer = new Date("2026-07-15T09:30:00Z"); // 10:30 BST
  for (const now of [winter, summer]) {
    const sub = new Date(now.getTime() - 5 * 3_600_000).toISOString();
    assert.equal(eligibility(lead({ version: "2", subscribedAt: sub }), now).ok, true);
  }
  const early = new Date("2026-01-15T09:30:00Z");
  const sub = new Date(early.getTime() - 5 * 3_600_000).toISOString();
  assert.equal(eligibility(lead({ version: null, subscribedAt: sub }), early).ok, true);
});

test("sweep intake defaults a missing blocker and payment", () => {
  const p = intakeFromFields("sam@example.com", { name: "Sam", phone: "+447700900123", plan_version: "2",
    plan_consent_at: "2026-10-06T09:00:00Z" }) as any;
  assert.equal(p.answers.blocker, "other");
  assert.equal(p.answers.payment, "unsure");
});
