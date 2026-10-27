// Which post a GBP cron run sends. Pure, so tests/gbpRotation.test.mts can pin it.
//
// Two pools, each with its own rotation:
//
//   default  lib/gbp/posts.json          one step per UTC day (Tue + Fri crons)
//   podcast  lib/gbp/podcast-posts.json  one step per week   (Wed cron)
//
// The podcast pool counts weeks from PODCAST_EPOCH_MS, so the week starting
// Wed 4 Nov 2026 sends item 0, the next Wednesday item 1, and so on round the
// list. Before that date the pool sends nothing unless ?index= is given.

export const DAY_MS = 86_400_000;
export const WEEK_MS = 7 * DAY_MS;

// Wed 4 Nov 2026 00:00 UTC. Weeks are counted from here, so each week boundary
// falls on a Wednesday at midnight UTC, before the 09:30 cron.
export const PODCAST_EPOCH_MS = Date.UTC(2026, 10, 4);

export type Pool = "default" | "podcast";

/** null for an unrecognised ?pool= value. An absent or empty one is the default pool. */
export function parsePool(raw: string | null): Pool | null {
  if (raw === null || raw === "" || raw === "default") return "default";
  if (raw === "podcast") return "podcast";
  return null;
}

/**
 * Index into the pool's post list, or null when the podcast pool has not started yet.
 * `override` is the raw ?index= value; it is handled exactly as the route always has.
 */
export function pickIndex(pool: Pool, length: number, now: number, override: string | null): number | null {
  if (override !== null) return Number(override) % length;

  if (pool === "default") return Math.floor(now / DAY_MS) % length;

  if (now < PODCAST_EPOCH_MS) return null;
  return Math.floor((now - PODCAST_EPOCH_MS) / WEEK_MS) % length;
}
