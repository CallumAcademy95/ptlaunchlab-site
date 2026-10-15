// tests/booking-busy-cache.test.mts
//
// WHAT THIS PROTECTS
// Public page loads can't hammer Google: free/busy is cached per instance for
// 60s (a hit must cover the whole requested window), concurrent loads share one
// call, failures are not cached. The health row is written only on a change or
// at most once a minute. A hung Google call gives up after a timeout.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createBusyCache, createHealthGate, withTimeout } from "../app/lib/booking/busyCache.ts";

const MIN = 60_000, DAY = 24 * 60 * MIN;

test("busy cache: second load inside 60s is served from cache, covering the later window", async () => {
  const c = createBusyCache(60_000);
  const calls: Array<[number, number]> = [];
  const fetch = async (from: number, to: number) => { calls.push([from, to]); return [{ start: from + MIN, end: from + 2 * MIN }]; };
  const t0 = Date.parse("2026-10-21T09:00:00Z");
  const a = await c.get(t0, t0 + 15 * DAY, t0, fetch);
  const b = await c.get(t0 + 30_000, t0 + 30_000 + 15 * DAY, t0 + 30_000, fetch);
  assert.equal(calls.length, 1);
  assert.equal(a.fresh, true);
  assert.equal(b.fresh, false);
  assert.deepEqual(b.busy, a.busy);
  // The one fetch covered more than the first window, so the later window fits.
  assert.ok(calls[0][1] >= t0 + 30_000 + 15 * DAY);
});

test("busy cache: expires after 60s; a different window length is a different key", async () => {
  const c = createBusyCache(60_000);
  let n = 0;
  const fetch = async () => { n++; return []; };
  const t0 = 1_000_000_000_000;
  await c.get(t0, t0 + 15 * DAY, t0, fetch);
  await c.get(t0, t0 + 8 * DAY, t0, fetch);
  assert.equal(n, 2);
  await c.get(t0 + 61_000, t0 + 61_000 + 15 * DAY, t0 + 61_000, fetch);
  assert.equal(n, 3);
});

test("busy cache: concurrent loads share one call; a failure is not cached", async () => {
  const c = createBusyCache(60_000);
  let n = 0;
  let fail = true;
  const fetch = async () => { n++; await new Promise((r) => setTimeout(r, 5)); if (fail) throw new Error("google down"); return []; };
  const t0 = 1_000_000_000_000;
  const rs = await Promise.allSettled([c.get(t0, t0 + DAY, t0, fetch), c.get(t0, t0 + DAY, t0, fetch)]);
  assert.equal(n, 1);
  assert.ok(rs.every((r) => r.status === "rejected"));
  fail = false;
  const ok = await c.get(t0 + 1000, t0 + 1000 + DAY, t0 + 1000, fetch);
  assert.equal(n, 2);
  assert.equal(ok.fresh, true);
});

test("health gate: writes on a state change, otherwise at most once a minute", () => {
  const g = createHealthGate(60_000);
  const t0 = 1_000_000_000_000;
  assert.equal(g.shouldWrite(true, t0), true);          // first
  assert.equal(g.shouldWrite(true, t0 + 10_000), false); // same state, too soon
  assert.equal(g.shouldWrite(false, t0 + 20_000), true); // changed
  assert.equal(g.shouldWrite(false, t0 + 30_000), false);
  assert.equal(g.shouldWrite(true, t0 + 31_000), true);  // changed back
  assert.equal(g.shouldWrite(true, t0 + 91_000), true);  // a minute on
});

test("withTimeout: rejects a hung call, passes a quick one through", async () => {
  await assert.rejects(withTimeout(new Promise(() => {}), 20, "freebusy"), /freebusy timed out after 20ms/);
  assert.equal(await withTimeout(Promise.resolve(7), 1000, "x"), 7);
});

// Wiring (source checks): every public booking route is rate limited per IP;
// page loads use the cache, the confirm/move recheck asks Google fresh.
import { readFileSync } from "node:fs";
const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
test("public booking routes are rate limited per IP", () => {
  for (const p of ["app/api/booking/route.ts", "app/api/booking/slots/route.ts", "app/api/booking/ics/route.ts"]) {
    const s = src(p);
    assert.match(s, /createRateLimiter\(\d+, 60_000\)/, p);
    assert.match(s, /if \(!rateLimiter\(ip\)\)/, p);
    assert.match(s, /status: 429/, p);
  }
  const m = src("app/api/booking/manage/route.ts");
  assert.match(m, /export async function GET\(req: Request\) \{\s*const tooMany = limited\(req, readLimiter\);/);
  assert.match(m, /export async function POST\(req: Request\) \{\s*const tooMany = limited\(req, writeLimiter\);/);
});
test("freeSlots uses the cache and the health gate; recheck stays fresh; Google calls time out", () => {
  const s = src("app/lib/booking/service.ts");
  const fs = s.slice(s.indexOf("export async function freeSlots"), s.indexOf("async function recheck"));
  assert.match(fs, /busyCache\.get\(nowMs, to, nowMs, getBusy\)/);
  assert.match(fs, /healthGate\.shouldWrite\(true, nowMs\)/);
  assert.match(fs, /healthGate\.shouldWrite\(false, nowMs\)/);
  const rc = s.slice(s.indexOf("async function recheck"));
  assert.match(rc, /busy = await getBusy\(now, to\)/);
  assert.doesNotMatch(rc.slice(0, rc.indexOf("\n}\n")), /busyCache/);
  const g = src("app/lib/booking/google.ts");
  assert.match(g, /google\.calendar\(\{ version: "v3", auth, timeout: TIMEOUT_MS \}\)/);
  assert.equal((g.match(/await limit\(cal\(\)\./g) ?? []).length, 4, "free/busy, insert, patch, delete");
});
