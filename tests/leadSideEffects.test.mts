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

// ---- fix round 1 ----
import { validateGymCallback, quizLabel } from "../app/lib/leadSideEffects.ts";

test("quiz label mapping in Zapier body and email-server body", async () => {
  assert.equal(quizLabel("online"), "Online Coach Path");
  assert.equal(quizLabel("mystery"), "mystery");
  const seen: { url: string; init?: RequestInit }[] = [];
  const fx = makeSideEffects(req, { env: { QUIZ_ZAPIER_WEBHOOK_URL: "https://h", EMAIL_SERVER_URL: "https://es" }, fetchImpl: fetchOf(200, seen) });
  await fx.zapier("quiz", lead("quiz", { quiz_result: "online" }));
  await fx.mailerlite("quiz", lead("quiz", { quiz_result: "online" }));
  assert.equal(JSON.parse(seen[0].init!.body as string).quiz_result, "Online Coach Path");
  assert.equal(JSON.parse(seen[1].init!.body as string).quizResult, "Online Coach Path");
});

async function capiCall(intent: CleanLead["intent"], extra: Record<string, unknown>, out: unknown, env: Record<string, string> = {}, r: Request = req) {
  const calls: Record<string, unknown>[] = [];
  const fx = makeSideEffects(r, { env, capiSend: async (i) => { calls.push(i); return out; } });
  const status = await fx.capi(intent, { ...lead(intent, extra), name: "Jane Anne Smith" }, "ev-9");
  return { status, call: calls[0] };
}

test("capi customData per intent, event id, userData", async () => {
  const q = await capiCall("quiz", { quiz_result: "online", avatar: "a1" }, {});
  assert.equal(q.call.eventName, "Lead");
  assert.equal(q.call.eventId, "ev-9");
  assert.deepEqual(q.call.customData, { currency: "GBP", value: 0, contentName: "online", contentCategory: "a1" });
  const ud = q.call.userData as Record<string, unknown>;
  assert.equal(ud.lastName, "Anne Smith");
  assert.equal(ud.country, "gb");
  assert.equal(ud.firstName, "Jane");
  assert.deepEqual((await capiCall("live", {}, {})).call.customData, { currency: "GBP", value: 0, contentName: "live_webinar_registration", contentCategory: "live-sessions" });
  assert.deepEqual((await capiCall("prospectus", { avatar: "a2" }, {})).call.customData, { currency: "GBP", value: 0, contentName: "prospectus_download", contentCategory: "a2" });
  assert.deepEqual((await capiCall("gym_partnership", {}, {})).call.customData, { currency: "GBP", value: 0, contentName: "gym_partnership", contentCategory: "b2b_partner" });
  assert.deepEqual((await capiCall("call", {}, {})).call.customData, { contentName: "call" });
  assert.deepEqual((await capiCall("gym_callback", {}, {})).call.customData, { contentName: "gym_callback" });
});

test("capi eventSourceUrl: referer else pagePath", async () => {
  assert.equal((await capiCall("call", {}, {})).call.eventSourceUrl, "https://ptlaunchlab.co.uk/x");
  const withRef = new Request("https://ptlaunchlab.co.uk/api/lead", { headers: { referer: "https://ptlaunchlab.co.uk/quiz" } });
  assert.equal((await capiCall("call", {}, {}, {}, withRef)).call.eventSourceUrl, "https://ptlaunchlab.co.uk/quiz");
});

test("capi status is truthful", async () => {
  assert.equal((await capiCall("call", {}, { events_received: 1 })).status, "ok");
  assert.equal((await capiCall("call", {}, null, { META_CAPI_ACCESS_TOKEN: "t" })).status, "failed: capi");
  assert.equal((await capiCall("call", {}, null, {})).status, "skipped");
});

test("gym_callback zapier uses server-side gym name and consent, not client extra", async () => {
  const seen: { url: string; init?: RequestInit }[] = [];
  const fx = makeSideEffects(req, {
    env: { ZAPIER_PHONE_CALLBACK_HOOK: "https://h" }, fetchImpl: fetchOf(200, seen),
    gymLookup: (slug) => (slug === "real-gym" ? { gymName: "Real Gym", canonicalPath: "/real" } : undefined), consentText: "SERVER CONSENT",
  });
  const l = { ...lead("gym_callback", { gymName: "EVIL", consentText: "EVIL" }), gymSlug: "real-gym" };
  assert.equal(await fx.zapier("gym_callback", l), "ok");
  const b = seen[0].init!.body as URLSearchParams;
  assert.equal(b.get("gym_name"), "Real Gym");
  assert.equal(b.get("consent"), "Privacy notice shown: SERVER CONSENT");
  assert.equal(b.get("topics"), "Ring-me request from the Real Gym PT Academy page");
});

test("validateGymCallback rejects unknown slugs", () => {
  const look = (s: string) => (s === "real-gym" ? {} : undefined);
  assert.deepEqual(validateGymCallback("nope", look), { ok: false, field: "gymSlug", message: "Unknown gym." });
  assert.deepEqual(validateGymCallback(undefined, look), { ok: false, field: "gymSlug", message: "Unknown gym." });
  assert.deepEqual(validateGymCallback("GYM-SLUG-HERE", () => ({})), { ok: false, field: "gymSlug", message: "Unknown gym." });
  assert.equal(validateGymCallback("real-gym", look), null);
});

test("salary: nested inputs/results payload and email-server nurture", async () => {
  const seen: { url: string; init?: RequestInit }[] = [];
  const fx = makeSideEffects(req, { env: { SALARY_CALC_ZAPIER_WEBHOOK_URL: "https://h", EMAIL_SERVER_URL: "https://es" }, fetchImpl: fetchOf(200, seen) });
  const l = lead("salary", { inputs: { employment: "emp", region: "north", experience: "2", hoursPerWeek: 30 }, results: { year1: 1, year2_3: 2, year4plus: 3 } });
  assert.equal(await fx.zapier("salary", l), "ok");
  assert.equal(await fx.mailerlite("salary", l), "ok");
  const z = JSON.parse(seen[0].init!.body as string);
  assert.equal(z.region, "north");
  assert.equal(z.hours_per_week, 30);
  assert.equal(z.projected_year2_3, 2);
  assert.equal(seen[1].url, "https://es/leads/new");
  assert.deepEqual(JSON.parse(seen[1].init!.body as string), { name: "Jane Smith", email: "jane@example.com", phone: "07700900123", source: "salary_calculator" });
  const bad = makeSideEffects(req, { env: { EMAIL_SERVER_URL: "https://es" }, fetchImpl: fetchOf(500) });
  assert.equal(await bad.mailerlite("salary", l), "failed: 500");
});

test("retry once for quiz/live/gym_partnership, not for others", async () => {
  const mk = (statuses: number[], calls: { n: number }) => (async () => { const st = statuses[Math.min(calls.n++, statuses.length - 1)]; return new Response("", { status: st }); }) as unknown as typeof fetch;
  for (const [intent, envKey] of [["quiz", "QUIZ_ZAPIER_WEBHOOK_URL"], ["live", "LIVE_ZAPIER_WEBHOOK_URL"], ["gym_partnership", "GYM_PARTNERSHIP_ZAPIER_WEBHOOK_URL"]] as const) {
    const c = { n: 0 };
    assert.equal(await makeSideEffects(req, { env: { [envKey]: "https://h" }, fetchImpl: mk([500, 200], c) }).zapier(intent, lead(intent)), "ok", intent);
    assert.equal(c.n, 2);
    const c2 = { n: 0 };
    assert.equal(await makeSideEffects(req, { env: { [envKey]: "https://h" }, fetchImpl: mk([500, 503], c2) }).zapier(intent, lead(intent)), "failed: 503", intent);
    assert.equal(c2.n, 2);
  }
  const c3 = { n: 0 };
  assert.equal(await makeSideEffects(req, { env: { CONTACT_ZAPIER_WEBHOOK_URL: "https://h" }, fetchImpl: mk([500, 200], c3) }).zapier("contact", lead("contact")), "failed: 500");
  assert.equal(c3.n, 1);
  let n = 0;
  const thrower = (async () => { if (n++ === 0) throw new Error("boom"); return new Response("", { status: 200 }); }) as unknown as typeof fetch;
  assert.equal(await makeSideEffects(req, { env: { QUIZ_ZAPIER_WEBHOOK_URL: "https://h" }, fetchImpl: thrower }).zapier("quiz", lead("quiz")), "ok");
});

test("liveExtras returns the stream link for live only, and only when configured", async () => {
  const { liveExtras } = await import("../app/lib/leadSideEffects.ts");
  const env = { LIVE_STREAM_URL: "https://stream.example/x" };
  assert.deepEqual(liveExtras("live", env), { streamUrl: "https://stream.example/x" });
  for (const i of ["contact", "prospectus", "quiz", "call", "gym_callback", "salary"]) assert.deepEqual(liveExtras(i, env), {});
  assert.deepEqual(liveExtras("live", {}), {});
});
