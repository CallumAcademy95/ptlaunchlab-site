// "Lay out this week": template rows → (open) block events. Pure.
import { londonWallToUtc, addDays, weekdayOf } from "../booking/london.ts";
import type { Category, TemplateRow } from "./types.ts";

export type LayoutEvent = { summary: string; start: number; end: number; category: Category };

export function layoutWeek(template: TemplateRow[], monday: string, existing: { start: number; end: number; summary: string }[]): LayoutEvent[] {
  if (weekdayOf(monday) !== 1) throw new Error(`${monday} is not a Monday`);
  const out: LayoutEvent[] = [];
  for (const row of [...template].sort((a, b) => a.day - b.day || a.start.localeCompare(b.start))) {
    const date = addDays(monday, row.day - 1);
    const ev = { summary: `[${row.category}] ${row.title} (open)`, start: londonWallToUtc(date, row.start), end: londonWallToUtc(date, row.end), category: row.category };
    if (existing.some((e) => e.summary === ev.summary && e.start === ev.start && e.end === ev.end)) continue;
    out.push(ev);
  }
  return out;
}
