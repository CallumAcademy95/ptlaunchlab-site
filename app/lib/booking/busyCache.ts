// Per-instance guards around Google Calendar for the public booking pages. Pure
// (no Google, no DB): service.ts wires them in.
import type { Interval } from "./slots.ts";

type Entry = { at: number; from: number; to: number; p: Promise<Interval[]> };

/**
 * 60s cache of free/busy for page loads, keyed by the window length. Each fetch
 * asks Google for `ttl` more than requested, so any request in the next `ttl`
 * (whose window has slid forward by at most that much) is fully covered.
 * Concurrent misses share one call; a failed call is dropped, never cached.
 * Booking/moving must NOT use this: their recheck always queries fresh.
 */
export function createBusyCache(ttlMs = 60_000) {
  const store = new Map<number, Entry>();
  return {
    async get(fromMs: number, toMs: number, nowMs: number, fetch: (from: number, to: number) => Promise<Interval[]>): Promise<{ busy: Interval[]; fresh: boolean }> {
      const key = toMs - fromMs;
      const hit = store.get(key);
      if (hit && nowMs - hit.at < ttlMs && hit.from <= fromMs && hit.to >= toMs) return { busy: await hit.p, fresh: false };
      const entry: Entry = { at: nowMs, from: fromMs, to: toMs + ttlMs, p: fetch(fromMs, toMs + ttlMs) };
      store.set(key, entry);
      try {
        return { busy: await entry.p, fresh: true };
      } catch (e) {
        if (store.get(key) === entry) store.delete(key);
        throw e;
      }
    },
  };
}

/** Write the Google health row only when the state flips, or at most once per interval. */
export function createHealthGate(intervalMs = 60_000) {
  let last: { ok: boolean; at: number } | null = null;
  return {
    shouldWrite(ok: boolean, nowMs: number): boolean {
      if (last && last.ok === ok && nowMs - last.at < intervalMs) return false;
      last = { ok, at: nowMs };
      return true;
    },
  };
}

/** Reject if `p` has not settled within `ms`, so a hung upstream can't hang a public request. */
export function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const t = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`${what} timed out after ${ms}ms`)), ms); });
  return Promise.race([p, t]).finally(() => clearTimeout(timer));
}
