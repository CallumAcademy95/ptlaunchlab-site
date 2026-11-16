// Where a task goes: the /plan-week rules as code. Pure (relative .ts imports
// only) so node --test loads it. Spec: 2026-11-15-crm-week-page-design.md §2.
import { londonWallToUtc, addDays, weekdayOf } from "../booking/london.ts";
import type { Category, Interval, TemplateRow } from "./types.ts";

export const WORKING_HOURS: Record<number, [string, string]> = {
  1: ["09:00", "16:00"], 2: ["09:00", "16:00"], 3: ["09:00", "16:00"], 4: ["12:00", "13:00"], 5: ["09:00", "15:00"],
};
export const BLOCKS_FOR: Record<Category, Category[]> = {
  Sales: ["Sales"], Outreach: ["Outreach", "Scaling"], Scaling: ["Scaling", "Outreach"], Praxel: ["Praxel"],
  Content: ["Content", "Podcast"], Podcast: ["Podcast", "Content"], SEO: ["SEO"], Admin: ["Admin", "Review"],
  Review: ["Review", "Admin"], Fixed: [],
};
export const PRIORITY: Category[] = ["Sales", "Outreach", "Scaling", "Praxel", "Content", "Podcast", "SEO", "Admin", "Review", "Fixed"];
export const priorityOf = (c: Category) => PRIORITY.indexOf(c);

const MIN = 60_000, STEP = 15 * MIN, MAX_DAYS = 28;
const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

/** When work must stop that day (end minus buffer on days ≥ 4 h), or null on a non-working day. */
export function bufferStart(date: string, bufferMin: number): number | null {
  const wh = WORKING_HOURS[weekdayOf(date)];
  if (!wh) return null;
  const s = londonWallToUtc(date, wh[0]), e = londonWallToUtc(date, wh[1]);
  return e - s >= 4 * 60 * MIN ? e - bufferMin * MIN : e;
}

export type PlacementCtx = {
  template: TemplateRow[]; bufferMin: number;
  /** Real commitments from Google free/busy (calls, fixed events, Callum's own events). */
  busy: Interval[];
  /** Diary tasks already placed (transparent, so not in busy). */
  taken: Interval[];
  nowMs: number;
  /** London date to start searching from (YYYY-MM-DD). */
  fromDate: string;
};
export type SlotProposal =
  | { ok: true; start: number; end: number; date: string; blockTitle: string }
  | { ok: false; reason: string };
export type PlaceableTask = { category: Category; estimate_min: number | null; deadline: string | null };

export function proposeSlot(task: PlaceableTask, ctx: PlacementCtx): SlotProposal {
  if (task.category === "Fixed") return { ok: false, reason: "Fixed events go in at their own time." };
  if (!task.estimate_min || task.estimate_min <= 0) return { ok: false, reason: "Needs an estimate." };
  if (!task.deadline) return { ok: false, reason: "Needs a deadline." };
  const dur = task.estimate_min * MIN;
  const cats = BLOCKS_FOR[task.category];
  const blocked = [...ctx.busy, ...ctx.taken];
  const earliest = Math.ceil(ctx.nowMs / STEP) * STEP;
  let date = ctx.fromDate;
  for (let i = 0; i < MAX_DAYS && date <= task.deadline; i++, date = addDays(date, 1)) {
    const cutoff = bufferStart(date, ctx.bufferMin);
    if (cutoff === null) continue;
    const wd = weekdayOf(date);
    const rows = ctx.template
      .filter((r) => r.day === wd && cats.includes(r.category))
      .sort((a, b) => cats.indexOf(a.category) - cats.indexOf(b.category) || a.start.localeCompare(b.start));
    for (const row of rows) {
      const bEnd = Math.min(londonWallToUtc(date, row.end), cutoff);
      for (let s = Math.max(londonWallToUtc(date, row.start), earliest); s + dur <= bEnd; s += STEP) {
        const cand = { start: s, end: s + dur };
        if (!blocked.some((b) => overlaps(cand, b))) return { ok: true, start: s, end: s + dur, date, blockTitle: row.title };
      }
    }
  }
  return { ok: false, reason: `No free ${task.category} time of ${task.estimate_min} min on or before ${task.deadline}.` };
}
