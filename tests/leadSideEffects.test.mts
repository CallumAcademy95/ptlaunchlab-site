import { test } from "node:test";
import assert from "node:assert/strict";
import { makeSideEffects, zapierHookFor, ZAPIER_ENV } from "../app/lib/leadSideEffects.ts";
import { LEAD_INTENTS, type CleanLead } from "../app/lib/leads.ts";

const lead = (intent: CleanLead["intent"], extra: Record<string, unknown> = {}) => ({
  id: "l1", name: "Jane Smith", phone: "07700900123", email: "jane@example.com", question: "hi", intent, source: intent,
  pagePath: "/x", gymSlug: null, extra, utm: {}, referrer: null, isTest: false, isSpam: false,
});
const req = new Request("https://ptlaunchlab.co.uk/api/lead");
const fetchOf = (status: number, seen: { url: string; init?: RequestInit }[] = []) =>
  (async (url: string, init?: RequestInit) => { seen.push({ url, init }); return new Response("", { status }); }) as unknown as typeof fetch;

test("intent to env var mapping", () => {
  const all = { CONTACT_ZAPIER_WEBHOOK_URL: "c", PROSPECTUS_ZAPIER_WEBHOOK_URL: "p", QUIZ_ZAPIER_WEBHOOK_URL: "q", LIVE_ZAPIER_WEBHOOK_URL: "l",
    ZAPIER_PHONE_CALLBACK_HOOK: "ph", NEXT_PUBLIC_ZAPIER_PHONE_CALLBACK_HOOK: "pub", SALARY_CALC_ZAPIER_WEBHOOK_URL: "s", GYM_PARTNERSHIP_ZAPIER_WEBHOOK_URL: "g" };
  assert.equal(zapierHookFor("contact", all), "c");
  assert.equal(zapierHookFor("prospectus", all), "p");
  assert.equal(zapierHookFor("quiz", all), "q");
  assert.equal(zapierHookFor("call", all), "ph");
  assert.equal(zapierHookFor("gym_callback", all), "ph");
  assert.equal(zapierHookFor("call", { NEXT_PUBLIC_ZAPIER_PHONE_CALLBACK_HOOK: "pub" }), "pub");
  assert.equal(zapierHookFor("live", all), "l");
  assert.equal(zapierHookFor("live", { PROSPECTUS_ZAPIER_WEBHOOK_URL: "p" }), "p");
  assert.equal(zapierHookFor("salary", all), "s");
  assert.equal(zapierHookFor("gym_partnership", all), "g");
  for (const i of ["career_planner", "whatsapp", "checkout_start"] as const) assert.equal(zapierHookFor(i, all), undefined);
  assert.deepEqual(Object.keys(ZAPIER_ENV).sort(), [...LEAD_INTENTS].sort());
});

test("zapier skipped when env var unset, no fetch made", async () => {
  const seen: { url: string }[] = [];
  const fx = makeSideEffects(req, { env: {}, fetchImpl: fetchOf(200, seen) });
  for (const i of ["contact", "prospectus", "quiz", "call", "live", "salary", "gym_partnership", "whatsapp"] as const)
    assert.equal(await fx.zapier(i, lead(i)), "skipped", i);
  assert.equal(seen.length, 0);
});

test("zapier ok / failed: <status>", async () => {
  const env = { CONTACT_ZAPIER_WEBHOOK_URL: "https://hook.test/c" };
  const seen: { url: string; init?: RequestInit }[] = [];
  assert.equal(await makeSideEffects(req, { env, fetchImpl: fetchOf(200, seen) }).zapier("contact", lead("contact")), "ok");
  assert.equal(await makeSideEffects(req, { env, fetchImpl: fetchOf(500) }).zapier("contact", lead("contact")), "failed: 500");
  assert.equal(seen[0].url, "https://hook.test/c");
  assert.equal(JSON.parse(seen[0].init!.body as string).message, "hi");
});

test("call intent posts form-encoded", async () => {
  const seen: { url: string; init?: RequestInit }[] = [];
  const fx = makeSideEffects(req, { env: { ZAPIER_PHONE_CALLBACK_HOOK: "https://hook.test/p" }, fetchImpl: fetchOf(200, seen) });
  assert.equal(await fx.zapier("call", lead("call")), "ok");
  assert.ok(seen[0].init!.body instanceof URLSearchParams);
  assert.equal((seen[0].init!.body as URLSearchParams).get("call_type"), "phone");
});

test("quiz payload joins answer labels", async () => {
  const seen: { url: string; init?: RequestInit }[] = [];
  const fx = makeSideEffects(req, { env: { QUIZ_ZAPIER_WEBHOOK_URL: "https://h" }, fetchImpl: fetchOf(200, seen) });
  await fx.zapier("quiz", lead("quiz", { quiz_result: "online", avatar: "a1", answers: [{ label: "A" }, { label: "B" }] }));
  const p = JSON.parse(seen[0].init!.body as string);
  assert.equal(p.answers, "A | B");
  assert.equal(p.source, "quiz-funnel:a1");
});

test("live prefers MailerLite: zapier skipped when token set", async () => {
  const seen: { url: string }[] = [];
  const fx = makeSideEffects(req, { env: { MAILERLITE_TOKEN: "t", LIVE_ZAPIER_WEBHOOK_URL: "https://h" }, fetchImpl: fetchOf(200, seen) });
  assert.equal(await fx.zapier("live", lead("live")), "skipped");
  assert.equal(seen.length, 0);
});

test("mailerlite skipped for other intents and unset env; email-server failure status", async () => {
  const fx = makeSideEffects(req, { env: {} });
  for (const i of LEAD_INTENTS) assert.equal(await fx.mailerlite(i, lead(i)), "skipped", i);
  const fx2 = makeSideEffects(req, { env: { EMAIL_SERVER_URL: "https://es.test" }, fetchImpl: fetchOf(502) });
  assert.equal(await fx2.mailerlite("quiz", lead("quiz")), "failed: 502");
  assert.equal(await fx2.mailerlite("contact", lead("contact")), "skipped");
});

test("capi skipped for checkout_start", async () => {
  assert.equal(await makeSideEffects(req).capi("checkout_start", lead("checkout_start"), "e1"), "skipped");
});
