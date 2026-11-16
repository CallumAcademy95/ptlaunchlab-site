// Clash handling: a set-time item lands on placed tasks → propose moves. Pure.
import { proposeSlot, priorityOf, type PlacementCtx } from "./placement.ts";
import { londonDate } from "../booking/london.ts";
import type { Category, Interval } from "./types.ts";

export type PlacedTask = { id: string; title: string; category: Category; estimate_min: number; deadline: string; start: number; end: number };
export type MovePlan = { id: string; title: string; from: Interval; to: Interval | null; reason: string | null };

const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

export function findClashes(newEv: Interval, placed: PlacedTask[]): PlacedTask[] {
  return placed.filter((t) => overlaps(t, newEv));
}

export function planMoves(clashes: PlacedTask[], ctx: PlacementCtx, newEv: Interval): MovePlan[] {
  const taken = ctx.taken.filter((t) => !clashes.some((c) => c.start === t.start && c.end === t.end));
  const busy = [...ctx.busy, newEv];
  const out: MovePlan[] = [];
  const order = [...clashes].sort((x, y) => priorityOf(x.category) - priorityOf(y.category) || x.start - y.start);
  for (const c of order) {
    const r = proposeSlot(c, { ...ctx, busy, taken, fromDate: ctx.fromDate || londonDate(ctx.nowMs) });
    if (r.ok) { out.push({ id: c.id, title: c.title, from: { start: c.start, end: c.end }, to: { start: r.start, end: r.end }, reason: null }); taken.push({ start: r.start, end: r.end }); }
    else { out.push({ id: c.id, title: c.title, from: { start: c.start, end: c.end }, to: null, reason: r.reason }); taken.push({ start: c.start, end: c.end }); }
  }
  return out;
}
