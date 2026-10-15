// Free call times. Pure: settings + busy intervals + "now" in, start times out.
// Works in Europe/London wall time; every interval is epoch ms.
import { londonDate, londonWallToUtc, addDays, weekdayOf } from "./london.ts";

export interface Block { start: string; end: string }
export interface Rules {
  weeklyHours: Record<string, Block[]>;
  daysOff: { from: string; to: string }[];
  minNoticeMinutes: number;
  horizonDays: number;
  bufferMinutes: number;
  maxPerDay: number | null;
}
export interface Interval { start: number; end: number }

const MIN = 60_000;

function isDayOff(day: string, daysOff: Rules["daysOff"]): boolean {
  return daysOff.some((r) => day >= r.from && day <= r.to);
}

export function computeSlots(rules: Rules, busy: Interval[], booked: Interval[], nowMs: number, slotMinutes = 30): number[] {
  const out: number[] = [];
  const earliest = nowMs + rules.minNoticeMinutes * MIN;
  const buf = rules.bufferMinutes * MIN;
  const blockers = [...busy, ...booked];
  const today = londonDate(nowMs);
  for (let i = 0; i < rules.horizonDays; i++) {
    const day = addDays(today, i);
    if (isDayOff(day, rules.daysOff)) continue;
    if (rules.maxPerDay != null && booked.filter((b) => londonDate(b.start) === day).length >= rules.maxPerDay) continue;
    for (const block of rules.weeklyHours[String(weekdayOf(day))] ?? []) {
      const end = londonWallToUtc(day, block.end);
      for (let t = londonWallToUtc(day, block.start); t + slotMinutes * MIN <= end; t += slotMinutes * MIN) {
        if (t < earliest) continue;
        const tEnd = t + slotMinutes * MIN;
        if (blockers.some((b) => t < b.end + buf && tEnd + buf > b.start)) continue;
        out.push(t);
      }
    }
  }
  return out.sort((a, b) => a - b);
}

export function isSlotFree(rules: Rules, busy: Interval[], booked: Interval[], nowMs: number, startMs: number, slotMinutes = 30): boolean {
  return computeSlots(rules, busy, booked, nowMs, slotMinutes).includes(startMs);
}
