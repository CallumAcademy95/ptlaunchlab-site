// tests/outreachPipeline.test.mts
//
// WHAT THIS PROTECTS
//
// A cold outreach that sends on the wrong days, and a screen that cannot tell
// you it happened.
//
// The schedule was once pinned to days of the month — `0 9 1-3,6-10 10 *`. The
// gap at 4-5 was meant to be the weekend. It was a day out: 3 October 2026 is a
// Saturday, so twelve cold B2B emails went out at 10am on a Saturday, and
// Monday the 5th had no cron at all and sent nothing. It took a day to notice
// because the only way to read the schedule was to parse the cron by eye.
//
// These tests pin the replacement to the real 2026 calendar, in UTC, which is
// what cron actually evaluates. If someone edits the schedule constants without
// meaning to, the Saturday and the Monday are both named here by date.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  pipelineCounts,
  needsChasing,
  sentToday,
  sendHistory,
  daysSince,
  ukDay,
  nextRun,
  finalRun,
  remainingSendDays,
  DAILY_CAP,
} from "../app/admin/(shell)/outreach/pipeline.ts";

const at = (iso: string) => Date.parse(iso);

test("the schedule sends on the Monday it used to skip", () => {
  // Sunday 4 Oct 2026, late evening. The next send must be Monday the 5th.
  const next = nextRun(new Date("2026-10-04T22:00:00Z"));
  assert.ok(next);
  assert.equal(next.toISOString(), "2026-10-05T09:00:00.000Z");
  assert.equal(next.getUTCDay(), 1, "Monday");
});

test("the schedule does not send on the Saturday it used to", () => {
  // Friday 2 Oct evening. The old cron fired on Saturday the 3rd; this one
  // must skip the weekend entirely and land on Monday the 5th.
  const next = nextRun(new Date("2026-10-02T20:00:00Z"));
  assert.ok(next);
  assert.equal(next.toISOString(), "2026-10-05T09:00:00.000Z");
  assert.notEqual(next.getUTCDate(), 3, "3 October 2026 is a Saturday");
});

test("no send lands on a weekend, all month", () => {
  let cursor: Date | null = nextRun(new Date("2026-09-30T23:59:00Z"));
  const days: number[] = [];
  while (cursor) {
    assert.notEqual(cursor.getUTCDay(), 0, `${cursor.toISOString()} is a Sunday`);
    assert.notEqual(cursor.getUTCDay(), 6, `${cursor.toISOString()} is a Saturday`);
    days.push(cursor.getUTCDate());
    cursor = nextRun(new Date(cursor.getTime() + 1000));
  }
  // October 2026 has 22 weekdays.
  assert.equal(days.length, 22);
  assert.equal(days[0], 1, "Thursday 1 October");
  assert.equal(days.at(-1), 30, "Friday 30 October");
});

test("the schedule runs out, and says so rather than going quiet", () => {
  // A screen that showed nothing here would look identical to one that was
  // running fine. November has to come back null, loudly.
  assert.equal(nextRun(new Date("2026-10-30T12:00:00Z")), null);
  assert.equal(nextRun(new Date("2026-11-03T08:00:00Z")), null);
  assert.equal(finalRun(2026).toISOString(), "2026-10-30T09:00:00.000Z");
});

test("the UK send time shifts itself when the clocks go back", () => {
  // 09:00 UTC is 10:00 UK until the 25th and 09:00 UK after it. The screen
  // renders UK time, so this must not need anyone to remember it.
  const before = nextRun(new Date("2026-10-22T20:00:00Z"))!;
  const after = nextRun(new Date("2026-10-25T20:00:00Z"))!;
  const uk = (d: Date) =>
    d.toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hour12: false });
  assert.equal(uk(before), "10:00", "BST");
  assert.equal(uk(after), "09:00", "GMT, after the 25th");
});

test("the send time stays inside pt-app's active-hours guard", () => {
  // pt-app refuses to send when the UK hour is < 9. After the clocks change
  // the run lands exactly on 09:00, which passes — but only just, so it is
  // pinned here rather than left to luck.
  const after = nextRun(new Date("2026-10-25T20:00:00Z"))!;
  const hour = Number(
    after.toLocaleString("en-GB", { timeZone: "Europe/London", hour: "2-digit", hour12: false }),
  );
  assert.ok(hour >= 9 && hour < 18, `UK hour ${hour} must be within 09:00-18:00`);
});

test("remaining sends are counted from the schedule, not guessed", () => {
  // Monday 5 Oct, after that morning's run: 6-9, 12-16, 19-23, 26-30.
  assert.equal(remainingSendDays(new Date("2026-10-05T12:00:00Z")), 19);
  assert.equal(remainingSendDays(new Date("2026-10-05T12:00:00Z")) * DAILY_CAP, 228);
});

test("a gym that wrote back counts as replied even though its status does not say so", () => {
  // The real shape of the data, and the reason this is not `status === 'replied'`.
  // The reconciler stamps replied_at and leaves status at 'contacted'. Reading
  // status would report zero replies while two gyms sat in the inbox.
  const rows = [
    { status: "contacted", last_contacted_at: "2026-09-16T09:00:00Z", replied_at: "2026-09-16T10:00:00Z" },
    { status: "contacted", last_contacted_at: "2026-09-21T09:00:00Z", replied_at: "2026-09-21T09:22:00Z" },
    { status: "contacted", last_contacted_at: "2026-10-01T09:00:00Z", replied_at: null },
    { status: "new", last_contacted_at: null, replied_at: null },
    { status: "lost", last_contacted_at: null, replied_at: null },
  ];
  const c = pipelineCounts(rows);
  assert.equal(c.replied, 2, "both repliers, despite status reading 'contacted'");
  assert.equal(c.contacted, 1, "a replier is not also counted as awaiting reply");
  assert.equal(c.queued, 1);
  assert.equal(c.closed, 1);
});

test("a gym that replied is never put in the chase queue", () => {
  const now = at("2026-10-06T10:00:00Z");
  const rows = [
    { status: "contacted", last_contacted_at: "2026-09-16T09:00:00Z", replied_at: "2026-09-16T10:00:00Z" },
    { status: "contacted", last_contacted_at: "2026-09-16T09:00:00Z", replied_at: null },
  ];
  const chase = needsChasing(rows, 14, now);
  assert.equal(chase.length, 1);
  assert.equal(chase[0].replied_at, null, "chasing someone who already answered is the costly mistake");
});

test("the chase queue respects the waiting period", () => {
  const now = at("2026-10-06T10:00:00Z");
  const rows = [
    { status: "contacted", last_contacted_at: "2026-09-21T09:00:00Z", replied_at: null }, // 15d
    { status: "contacted", last_contacted_at: "2026-10-01T09:00:00Z", replied_at: null }, // 5d
    { status: "new", last_contacted_at: null, replied_at: null },
  ];
  assert.equal(needsChasing(rows, 14, now).length, 1);
  assert.equal(needsChasing(rows, 3, now).length, 2);
  assert.equal(needsChasing(rows, 60, now).length, 0);
});

test("today's sends are counted by UK day, not by UTC day", () => {
  // A send at 00:30 UK on 6 October is 23:30 UTC on the 5th. Counting in UTC
  // would put it on the wrong day and let the cap send thirteen.
  const now = at("2026-10-06T12:00:00Z");
  const rows = [
    { status: "contacted", last_contacted_at: "2026-10-06T09:00:00Z", replied_at: null },
    { status: "contacted", last_contacted_at: "2026-10-05T09:00:00Z", replied_at: null },
  ];
  assert.equal(sentToday(rows, now), 1);
  assert.equal(ukDay("2026-07-15T23:30:00Z"), "2026-07-16", "BST pushes late UTC into the next UK day");
});

test("history is newest first and counts per day", () => {
  const rows = [
    { status: "contacted", last_contacted_at: "2026-10-05T09:00:00Z", replied_at: null },
    { status: "contacted", last_contacted_at: "2026-10-05T09:00:01Z", replied_at: null },
    { status: "contacted", last_contacted_at: "2026-10-02T09:00:00Z", replied_at: null },
    { status: "new", last_contacted_at: null, replied_at: null },
  ];
  assert.deepEqual(sendHistory(rows), [
    { day: "2026-10-05", count: 2 },
    { day: "2026-10-02", count: 1 },
  ]);
});

test("daysSince tolerates the nulls the table actually contains", () => {
  const now = at("2026-10-06T10:00:00Z");
  assert.equal(daysSince(null, now), null);
  assert.equal(daysSince("not a date", now), null);
  assert.equal(daysSince("2026-10-01T10:00:00Z", now), 5);
});
