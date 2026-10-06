// What the gym cold outreach is actually doing, derived from the rows.
//
// WHY THIS IS A SEPARATE, PURE MODULE
//
// The outreach runs on a Vercel cron in a different project (pt-app), and for
// three weeks the only way to answer "is it sending?" was to read a cron
// expression by eye. That is how `0 9 1-3,6-10 10 *` shipped: the gap was meant
// to be the weekend, but 3 October is a Saturday and the 5th is a Monday, so it
// sent twelve cold emails on the Saturday and nothing at all on the Monday.
// Nobody saw it for a day, because nothing displayed it.
//
// So the schedule is described here, in one place, as data — and the screen
// reads it rather than restating it in prose that can drift from the cron.
//
// Everything here is a pure function over rows. No I/O, no Supabase, no React,
// which is what lets the awkward parts (DST, UK calendar days, the end of the
// month) be tested rather than hoped about.

export interface ProspectRow {
  status: string;
  last_contacted_at: string | null;
  replied_at: string | null;
}

/**
 * The cron that actually runs, mirrored from pt-app's vercel.json:
 *
 *   0 9  * 10 1-5   -> the send
 *   0 13 * 10 1-5   -> a retry, which sends nothing if the morning worked
 *
 * Both are UTC, weekdays, October only. If that file changes, change this and
 * the test that pins it will tell you what else to look at.
 */
export const SEND_HOUR_UTC = 9;
export const RETRY_HOUR_UTC = 13;
export const SEND_MONTH_UTC = 9; // zero-based: October
export const DAILY_CAP = 12;

/**
 * Would pt-app refuse a send right now because the day's cap is spent?
 *
 * This exists because a dry run and a send do NOT agree, on purpose. pt-app
 * composes a full batch for a dry run whatever the cap says, so you can read
 * the copy at any hour — but a send takes `remaining` instead. Preview after
 * the morning cron has run and you get twelve gyms listed and a send that
 * refuses them, which reads as a broken button rather than a working guard.
 */
export function sendWouldBeRefused(sentToday: number, cap: number = DAILY_CAP): boolean {
  return sentToday >= cap;
}

/** The UK calendar day an instant falls on, which is how sends are counted. */
export function ukDay(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

/** Whole days between then and now, or null if it never happened. */
export function daysSince(iso: string | null, now: number): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.floor((now - t) / 86_400_000);
}

export interface PipelineCounts {
  queued: number;
  contacted: number;
  replied: number;
  closed: number;
}

/**
 * The four numbers worth putting on a tile.
 *
 * `replied` counts rows that actually wrote back, NOT rows whose status says
 * "replied" — the reconciler stamps `replied_at` and leaves status alone, so
 * reading status here would report zero while two gyms sat in the inbox.
 */
export function pipelineCounts(rows: ProspectRow[]): PipelineCounts {
  let queued = 0;
  let contacted = 0;
  let replied = 0;
  let closed = 0;
  for (const r of rows) {
    if (r.replied_at) replied++;
    else if (r.status === "new") queued++;
    else if (r.status === "contacted") contacted++;
    else closed++;
  }
  return { queued, contacted, replied, closed };
}

/**
 * Contacted, never wrote back, and long enough ago to be worth chasing.
 *
 * "Never wrote back" is the best we can say, not the truth. The reply
 * reconciler will not domain-match a shared mail host, so a gym that replied
 * from a different gmail address than the one we wrote to is invisible here by
 * design. Chasing is the one place that gap can embarrass us, which is why the
 * screen says "no reply recorded" rather than "did not reply".
 */
export function needsChasing<T extends ProspectRow>(rows: T[], afterDays: number, now: number): T[] {
  return rows.filter((r) => {
    if (r.status !== "contacted" || r.replied_at) return false;
    const age = daysSince(r.last_contacted_at, now);
    return age !== null && age >= afterDays;
  });
}

/** How many went out on the UK day that `now` falls in. */
export function sentToday(rows: ProspectRow[], now: number): number {
  const today = ukDay(new Date(now));
  return rows.filter((r) => r.last_contacted_at && ukDay(r.last_contacted_at) === today).length;
}

export interface SendDay {
  day: string;
  count: number;
}

/** Sends per UK day, newest first — the run history, straight from the rows. */
export function sendHistory(rows: ProspectRow[], limit = 14): SendDay[] {
  const byDay = new Map<string, number>();
  for (const r of rows) {
    if (!r.last_contacted_at) continue;
    const d = ukDay(r.last_contacted_at);
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  return [...byDay.entries()]
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => (a.day < b.day ? 1 : -1))
    .slice(0, limit);
}

/**
 * When the cron next fires, or null if it has run out of month.
 *
 * Deliberately computed from the schedule rather than written as a sentence.
 * Two things this gets right that prose kept getting wrong:
 *
 *   - Weekday means weekday in UTC, which is what cron evaluates.
 *   - 09:00 UTC is 10:00 UK through most of October and 09:00 UK after the
 *     clocks go back on the 25th. The screen shows the UK time, so it changes
 *     by itself rather than needing anyone to remember.
 *
 * Returning null is the point: the schedule stops at the end of October, and a
 * screen that silently showed nothing would look identical to one that was
 * running fine.
 */
export function nextRun(now: Date): Date | null {
  for (let i = 0; i < 70; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + i, SEND_HOUR_UTC, 0, 0));
    if (d.getTime() <= now.getTime()) continue;
    if (d.getUTCMonth() !== SEND_MONTH_UTC) continue;
    const wd = d.getUTCDay();
    if (wd === 0 || wd === 6) continue;
    return d;
  }
  return null;
}

/** The last firing of the current schedule, so the screen can say when it stops. */
export function finalRun(year: number): Date {
  for (let day = 31; day >= 1; day--) {
    const d = new Date(Date.UTC(year, SEND_MONTH_UTC, day, SEND_HOUR_UTC, 0, 0));
    if (d.getUTCMonth() !== SEND_MONTH_UTC) continue;
    const wd = d.getUTCDay();
    if (wd === 0 || wd === 6) continue;
    return d;
  }
  throw new Error("a month with no weekdays is not possible");
}

/** How many sending days are left, and therefore how many emails. */
export function remainingSendDays(now: Date): number {
  let n = 0;
  let cursor = nextRun(now);
  while (cursor) {
    n++;
    cursor = nextRun(new Date(cursor.getTime() + 1000));
  }
  return n;
}
