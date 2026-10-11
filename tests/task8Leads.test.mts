import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateLead, leadRowFrom, notSavedPush, newLeadPush, pushStatus, withTimeout, SETTER_INTENTS, type CleanLead, type LeadRow } from "../app/lib/leads.ts";
import { plannerLead, plannerPushNeeded, checkoutStartLead, insertDirect } from "../app/lib/directLeads.ts";
import { quizSubmissionPlan } from "../app/lib/quizSubmissionPlan.ts";
import { whatsAppMessage, whatsAppUrl } from "../app/lib/whatsappMessage.ts";

const clean = (): CleanLead => {
  const v = validateLead({ name: "Jane Smith", phone: "07700 900123", email: "Jane@Example.com", intent: "call", source: "home", pagePath: "/" });
  assert.ok(v.ok);
  return v.lead;
};

test("leadRowFrom maps every column processLead writes", () => {
  const row = leadRowFrom(clean(), "ev-9");
  assert.deepEqual(row, {
    name: "Jane Smith", phone: "07700900123", email: "jane@example.com", question: null, intent: "call", source: "home",
    page_path: "/", gym_slug: null, extra: {}, utm: {}, referrer: null, event_id: "ev-9", is_test: false, is_spam: false,
  });
});

test("push payloads keep the processLead format", () => {
  const l = clean();
  assert.deepEqual(notSavedPush(l, "ev-1"), { title: "NOT SAVED — lead: Jane Smith", body: "07700900123 · jane@example.com · Book a call · /", url: "/admin/site-leads", tag: "lead-unsaved-ev-1" });
  assert.deepEqual(newLeadPush(l, "id-1"), { title: "New lead: Jane Smith", body: "07700900123 · Book a call · /", url: "/admin/site-leads/id-1", tag: "lead-id-1" });
  assert.equal(pushStatus({ sent: 1 }), "ok");
  assert.equal(pushStatus({ sent: 0 }), "failed: no device");
  assert.equal(pushStatus({ sent: 0, error: "x" }), "failed: x");
});

test("withTimeout resolves the value, a rejection, or a timeout error", async () => {
  assert.deepEqual(await withTimeout(Promise.resolve({ id: "a" }), 50), { id: "a" });
  assert.deepEqual(await withTimeout(Promise.reject(new Error("boom")), 50), { error: "boom" });
  const t0 = Date.now();
  const r = await withTimeout(new Promise(() => {}), 30);
  assert.deepEqual(r, { error: "timeout after 30 ms" });
  assert.ok(Date.now() - t0 < 500);
});

test("plannerLead: career_planner row with answers in extra and a normalised phone", () => {
  const l = plannerLead({ name: "Sam Jones", email: "Sam@X.com", phone: "+447700900123", band: "strong", consentAt: "2026-10-11T10:00:00Z", answers: { goal: "career" }, utm: { source: "fb" }, referrer: "https://ptlaunchlab.co.uk/career-planner" });
  const row = leadRowFrom(l, "cp-1");
  assert.equal(row.intent, "career_planner");
  assert.equal(row.source, "career-planner");
  assert.equal(row.phone, "07700900123");
  assert.equal(row.email, "sam@x.com");
  assert.deepEqual(row.extra, { answers: { goal: "career" }, band: "strong", consentAt: "2026-10-11T10:00:00Z" });
  assert.deepEqual(row.utm, { source: "fb" });
  assert.equal(row.event_id, "cp-1");
  assert.deepEqual(plannerLead({ name: "A B", email: "a@b.co", phone: "07700900123", band: "nurture", consentAt: "", answers: {}, utm: null }).utm, {});
});

test("plannerPushNeeded: no site push for Prime unless the PT-app intake failed; never for TEST", () => {
  const l = plannerLead({ name: "Sam Jones", email: "s@x.com", phone: "07700900123", band: "prime", consentAt: "", answers: {}, utm: null });
  assert.equal(plannerPushNeeded(l, "prime", true), false);
  assert.equal(plannerPushNeeded(l, "prime", false), true);
  assert.equal(plannerPushNeeded(l, "strong", true), true);
  assert.equal(plannerPushNeeded(l, "nurture", true), true);
  const t = plannerLead({ name: "TEST Sam", email: "s@x.com", phone: "07700900123", band: "strong", consentAt: "", answers: {}, utm: null });
  assert.equal(plannerPushNeeded(t, "strong", false), false);
});

test("checkoutStartLead: no phone, extra {plan, rung}; rung only from the fixed list", () => {
  const row = leadRowFrom(checkoutStartLead({ name: " Sam Jones ", email: "S@X.com", plan: "monthly", rung: "six_month", gymReferral: "atp" }), "c-1");
  assert.equal(row.intent, "checkout_start");
  assert.equal(row.phone, null);
  assert.equal(row.name, "Sam Jones");
  assert.equal(row.email, "s@x.com");
  assert.deepEqual(row.extra, { plan: "monthly", rung: "six_month", gymReferral: "atp" });
  assert.equal(checkoutStartLead({ name: "A", email: "a@b.co", plan: "full", rung: "<script>" }).extra.rung, null);
});

test("insertDirect: saves; on error, throw or timeout logs and pushes NOT SAVED (when given a push); never throws", async () => {
  const rows: LeadRow[] = [];
  const pushes: { title: string }[] = [];
  const logs: string[] = [];
  const log = (m: string) => { logs.push(m); };
  const lead = checkoutStartLead({ name: "Sam", email: "s@x.com", plan: "full" });

  const ok = await insertDirect(lead, "e1", { insert: async (r) => { rows.push(r); return { id: "1" }; }, push: async (p) => { pushes.push(p); }, log }, 100);
  assert.deepEqual(ok, { id: "1" });
  assert.equal(rows[0].event_id, "e1");
  assert.equal(pushes.length, 0);

  const bad = await insertDirect(lead, "e2", { insert: async () => ({ error: "denied" }), push: async (p) => { pushes.push(p); }, log }, 100);
  assert.deepEqual(bad, { error: "denied" });
  assert.equal(pushes[0].title, "NOT SAVED — lead: Sam");

  const threw = await insertDirect(lead, "e3", { insert: async () => { throw new Error("net"); }, log }, 100);
  assert.deepEqual(threw, { error: "net" });

  const slow = await insertDirect(lead, "e4", { insert: () => new Promise(() => {}), log }, 20);
  assert.deepEqual(slow, { error: "timeout after 20 ms" });
  assert.equal(pushes.length, 1, "no push without a push dep (checkout_start)");
  assert.equal(logs.filter((m) => m.includes("insert failed")).length, 3);
});

test("quiz-submission plan: leadSaved skips Zapier, email-server, setter and CAPI; legacy callers unchanged", () => {
  assert.deepEqual(quizSubmissionPlan({ leadSaved: true, skipCapiLead: true }), { zapier: false, emailServer: false, setter: false, capi: false });
  assert.deepEqual(quizSubmissionPlan({ leadSaved: true }), { zapier: false, emailServer: false, setter: false, capi: false });
  assert.deepEqual(quizSubmissionPlan({ skipCapiLead: true }), { zapier: true, emailServer: true, setter: true, capi: false });
  assert.deepEqual(quizSubmissionPlan({}), { zapier: true, emailServer: true, setter: true, capi: true });
  assert.deepEqual(quizSubmissionPlan({ leadSaved: "true" }), { zapier: true, emailServer: true, setter: true, capi: true }, "only literal true counts");
  assert.deepEqual(quizSubmissionPlan(null), { zapier: true, emailServer: true, setter: true, capi: true });
});

test("quiz: exactly one setter call per lead across /api/lead and /api/quiz-submission", () => {
  // /api/lead calls the setter for intent quiz; the client then posts leadSaved:true.
  const fromLead = SETTER_INTENTS.has("quiz") ? 1 : 0;
  const fromQuizRoute = quizSubmissionPlan({ leadSaved: true, skipCapiLead: true }).setter ? 1 : 0;
  assert.equal(fromLead + fromQuizRoute, 1);
  // The client really sends both flags and the shared event id, and only after a save.
  const src = readFileSync(new URL("../app/quiz/QuizApp.tsx", import.meta.url), "utf8");
  assert.match(src, /leadSaved: true/);
  assert.match(src, /skipCapiLead: true/);
  assert.match(src, /event_id: saved\.eventId/);
  assert.ok(src.indexOf("if (!saved.ok)") < src.indexOf("fetch('/api/quiz-submission'"), "quiz-submission runs only after the save");
  assert.doesNotMatch(src, /fbq\(/, "no client Lead fire: submitLead fires it");
  // And the route gates notifySetter on the plan.
  const route = readFileSync(new URL("../app/api/quiz-submission/route.ts", import.meta.url), "utf8");
  assert.match(route, /if \(plan\.setter\) await notifySetter\(\{ name, email, source: 'quiz' \}\)/);
  assert.match(route, /if \(plan\.capi\) after\(/);
});

test("WhatsApp: one number everywhere; prefilled text as before", () => {
  const cd = readFileSync(new URL("../app/lib/contactDetails.ts", import.meta.url), "utf8");
  assert.match(cd, /WHATSAPP_DISPLAY = "\+44 7418 609039"/);
  assert.match(cd, /WHATSAPP_LINK = "https:\/\/wa\.me\/447418609039"/);
  const msg = whatsAppMessage({ name: "Sam", email: "s@x.com", phone: "07700900123", interest: "Already in fitness" });
  assert.equal(msg, "*New PT Launch Lab enquiry*\n\nName: Sam\nEmail: s@x.com\nPhone: 07700900123\nInterested in: Already in fitness");
  assert.match(whatsAppMessage({ name: "a", email: "b", phone: "c", interest: "" }), /Interested in: Not sure yet$/);
  assert.equal(whatsAppUrl("https://wa.me/447418609039", "a b\n"), "https://wa.me/447418609039?text=a%20b%0A");
});
