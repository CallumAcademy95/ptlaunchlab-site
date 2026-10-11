import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { submitLead } from "../app/lib/submitLead.ts";

const g = globalThis as unknown as Record<string, unknown>;
const INPUT = { name: "Sam Jones", phone: "07700900123", email: "sam@example.com", intent: "call" as const, source: "test" };

let fbqCalls: unknown[][] = [];
let fetchCalls: { url: string; init: RequestInit }[] = [];

function stubEnv(fetchImpl: (url: string, init: RequestInit) => Promise<unknown>) {
  fbqCalls = [];
  fetchCalls = [];
  g.window = { fbq: (...a: unknown[]) => { fbqCalls.push(a); } };
  g.location = { pathname: "/gyms/test" };
  g.document = { referrer: "https://example.org/" };
  g.localStorage = {
    getItem: (k: string) =>
      k === "ptll_first_touch" ? JSON.stringify({ utm_source: "facebook", utm_campaign: "oct" }) : null,
  };
  g.fetch = (url: string, init: RequestInit) => { fetchCalls.push({ url, init }); return fetchImpl(url, init); };
}
const json = (status: number, body: unknown) => Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => body });

beforeEach(() => stubEnv(() => json(200, { ok: true, id: "x", eventId: "e" })));

test("fires Lead only on ok:true, with the returned eventId", async () => {
  stubEnv(() => json(200, { ok: true, id: "lead-1", eventId: "evt-9" }));
  const r = await submitLead(INPUT);
  assert.deepEqual(r, { ok: true, id: "lead-1", eventId: "evt-9" });
  assert.equal(fbqCalls.length, 1);
  assert.deepEqual(fbqCalls[0], ["track", "Lead", { content_name: "call" }, { eventID: "evt-9" }]);
});

test("400 returns the server field/message and fires nothing", async () => {
  stubEnv(() => json(400, { ok: false, field: "phone", message: "Enter a UK phone number." }));
  const r = await submitLead(INPUT);
  assert.deepEqual(r, { ok: false, field: "phone", message: "Enter a UK phone number." });
  assert.equal(fbqCalls.length, 0);
});

test("500 with a non-JSON body returns the fallback and fires nothing", async () => {
  stubEnv(() => Promise.resolve({ ok: false, status: 500, json: async () => { throw new Error("not json"); } }));
  const r = await submitLead(INPUT);
  assert.equal(r.ok, false);
  assert.match(r.ok ? "" : r.message, /01977 285014/);
  assert.equal(fbqCalls.length, 0);
});

test("500 with ok:false body does not fire", async () => {
  stubEnv(() => json(500, { ok: false, message: "Boom" }));
  const r = await submitLead(INPUT);
  assert.equal(r.ok, false);
  assert.equal(fbqCalls.length, 0);
});

test("a thrown fetch returns the fallback and fires nothing", async () => {
  stubEnv(() => Promise.reject(new Error("network down")));
  const r = await submitLead(INPUT);
  assert.equal(r.ok, false);
  assert.match(r.ok ? "" : r.message, /Something went wrong/);
  assert.equal(fbqCalls.length, 0);
});

test("an aborted fetch returns the fallback and fires nothing", async () => {
  stubEnv((_u, init) => new Promise((_res, rej) => {
    init.signal!.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError")));
  }));
  const realSetTimeout = globalThis.setTimeout;
  // Shorten the 10s timeout so the abort path runs quickly.
  (globalThis as unknown as { setTimeout: unknown }).setTimeout = ((fn: () => void, ms?: number) =>
    realSetTimeout(fn, ms === 10_000 ? 5 : ms)) as typeof setTimeout;
  try {
    const r = await submitLead(INPUT);
    assert.equal(r.ok, false);
    assert.match(r.ok ? "" : r.message, /Something went wrong/);
    assert.equal(fbqCalls.length, 0);
  } finally {
    globalThis.setTimeout = realSetTimeout;
  }
});

test("a throwing fbq does not break a saved lead", async () => {
  stubEnv(() => json(200, { ok: true, id: "a", eventId: "b" }));
  (g.window as { fbq: () => void }).fbq = () => { throw new Error("pixel blocked"); };
  const r = await submitLead(INPUT);
  assert.equal(r.ok, true);
});

test("body includes pagePath, referrer and utm; posts to /api/lead", async () => {
  await submitLead(INPUT);
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, "/api/lead");
  assert.equal(fetchCalls[0].init.method, "POST");
  const body = JSON.parse(fetchCalls[0].init.body as string);
  assert.equal(body.pagePath, "/gyms/test");
  assert.equal(body.referrer, "https://example.org/");
  assert.equal(body.name, "Sam Jones");
  assert.equal(body.intent, "call");
  assert.equal(body.utm.fts, "facebook");
  assert.equal(body.utm.ftc, "oct");
});
