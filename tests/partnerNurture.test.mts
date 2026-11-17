// tests/partnerNurture.test.mts
//
// WHAT THIS PROTECTS
//
// Partner-page enquiries and their follow-up emails (app/lib/partnerNurture.ts):
//   - the "what's due" rule: one email at a time, on its day, never for spam,
//     TEST, stopped or finished leads;
//   - the copy keeps to the PT Mentor Hub agreement's marketing rules (pay in
//     full only, no finance wording, Commitment always "Terms apply" and never a
//     refund, results flagged as individual);
//   - every email links to the partner's page and carries an unsubscribe link;
//   - the new lead intent is wired everywhere it must be: the DB constraint, the
//     /api/lead gate, the cron, and unsubscribe.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PARTNER_SEQUENCES, dueStep, renderEmail, firstName, type NurtureLead } from "../app/lib/partnerNurture.ts";
import { LEAD_INTENTS, validateLead } from "../app/lib/leads.ts";

const seq = PARTNER_SEQUENCES["pt-mentor-hub"];
const T0 = "2026-11-17T10:00:00.000Z";
const at = (days: number, hours = 0) => new Date(Date.parse(T0) + days * 86_400_000 + hours * 3_600_000);
const lead = (over: Partial<NurtureLead> = {}): NurtureLead => ({
  created_at: T0, nurture_step: 0, nurture_stopped: null, is_spam: false, is_test: false, gym_slug: "pt-mentor-hub", ...over,
});

test("the sequence starts straight away and runs in day order", () => {
  assert.equal(seq.emails[0].day, 0);
  for (let i = 1; i < seq.emails.length; i++) assert.ok(seq.emails[i].day > seq.emails[i - 1].day, `email ${i + 1} after email ${i}`);
  assert.deepEqual(seq.emails.map((e) => e.day), [0, 2, 4, 7, 10]);
});

test("email 1 is due at once; later emails only on their day", () => {
  assert.equal(dueStep(lead(), at(0)), 0);
  assert.equal(dueStep(lead({ nurture_step: 1 }), at(1, 23)), null);
  assert.equal(dueStep(lead({ nurture_step: 1 }), at(2)), 1);
  assert.equal(dueStep(lead({ nurture_step: 4 }), at(9)), null);
  assert.equal(dueStep(lead({ nurture_step: 4 }), at(10)), 4);
});

test("a lead that fell behind gets one email per run, not a burst", () => {
  // 30 days late, still at step 1: the next one only.
  assert.equal(dueStep(lead({ nurture_step: 1 }), at(30)), 1);
});

test("nothing is due for spam, TEST, stopped, finished or unknown-partner leads", () => {
  assert.equal(dueStep(lead({ is_spam: true }), at(0)), null);
  assert.equal(dueStep(lead({ is_test: true }), at(0)), null);
  assert.equal(dueStep(lead({ nurture_stopped: "unsubscribed" }), at(0)), null);
  assert.equal(dueStep(lead({ nurture_stopped: "enrolled" }), at(5)), null);
  assert.equal(dueStep(lead({ nurture_step: seq.emails.length }), at(60)), null);
  assert.equal(dueStep(lead({ gym_slug: "mclub" }), at(0)), null);
  assert.equal(dueStep(lead({ created_at: "not a date" }), at(0)), null);
});

const allCopy = seq.emails.map((e) => `${e.subject}\n${e.body}`).join("\n");

test("the copy never offers finance or a monthly plan", () => {
  assert.doesNotMatch(allCopy, /monthly (plan|payment|instal)|instal?ments?|pay later|pay in 3|interest[- ]free|finance|klarna|payl8r|£99(?!\d)/i);
});

test("the Commitment carries Terms apply and its terms link, and is never a refund or a guarantee", () => {
  const commitment = seq.emails.find((e) => /commitment/i.test(e.subject));
  assert.ok(commitment, "there is a Commitment email");
  assert.match(commitment.body, /Terms apply/);
  assert.match(commitment.body, /\/pt-mentor-hub-academy\/commitment-terms/);
  assert.doesNotMatch(allCopy, /money[- ]back|refund|guarantee/i);
});

test("client results are flagged as individual", () => {
  const results = seq.emails.find((e) => /£990/.test(e.body));
  assert.ok(results);
  assert.match(results.body, /individual results/i);
});

test("every email links to the page; rendering adds the name and an unsubscribe link", () => {
  for (const e of seq.emails) assert.ok(e.body.includes(seq.pageUrl), e.subject);
  for (let i = 0; i < seq.emails.length; i++) {
    const m = renderEmail(seq, i, { name: "  jamie o'neil", email: "jamie+x@example.com" });
    assert.doesNotMatch(m.text, /\{\{/);
    assert.match(m.text, /^Hi Jamie,/);
    assert.match(m.text, /unsubscribe\?email=jamie%2Bx%40example\.com/);
    assert.match(m.html, /href="https:\/\/ptlaunchlab\.co\.uk\/unsubscribe\?email=jamie%2Bx%40example\.com"/);
    assert.match(m.html, /Jamie/);
    assert.doesNotMatch(m.html, /<script/i);
  }
  assert.equal(firstName(""), "there");
});

test("a partner enquiry needs no phone, but a phone given must be valid", () => {
  const base = { intent: "partner_enquiry", name: "Sam Smith", email: "sam@example.com", gymSlug: "pt-mentor-hub" };
  assert.equal(validateLead(base).ok, true);
  const bad = validateLead({ ...base, phone: "12" });
  assert.equal(bad.ok, false);
  // Other intents still require one.
  assert.equal(validateLead({ ...base, intent: "contact" }).ok, false);
});

test("the leads intent constraint in the migration allows every LEAD_INTENT", () => {
  const sql = readFileSync("supabase/migrations/20261117_leads_partner_enquiry.sql", "utf8");
  const listed = [...sql.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
  for (const i of LEAD_INTENTS) assert.ok(listed.includes(i), `constraint allows ${i}`);
});

test("wiring: the page posts a partner enquiry, /api/lead gates and sends it, the cron and unsubscribe are in place", () => {
  const page = readFileSync("app/pt-mentor-hub-academy/page.tsx", "utf8");
  assert.match(page, /intent="partner_enquiry"/);
  assert.match(page, /gymSlug="pt-mentor-hub"/);
  const route = readFileSync("app/api/lead/route.ts", "utf8");
  assert.match(route, /b\.intent === "partner_enquiry" && !sequenceFor\(/);
  assert.match(route, /runPartnerNurture\(\{ leadId: id \}\)/);
  const crons = JSON.parse(readFileSync("vercel.json", "utf8")).crons as { path: string }[];
  assert.ok(crons.some((c) => c.path === "/api/partner-nurture"));
  const unsub = readFileSync("app/api/unsubscribe/route.ts", "utf8");
  assert.match(unsub, /await stopPartnerNurtureByEmail\(email\);/);
});
