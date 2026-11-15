import "server-only";
import { getSupabaseAdmin } from "../supabase-admin";
import { londonDate, addDays, weekdayOf, londonWallToUtc } from "../booking/london";
import { handleDiary } from "./diary-core";
import { createGoogleDiaryDeps } from "./diary-google";
import { dataTaskDeps, loadSettings } from "./diary-data";
import type { PlacementCtx } from "./placement";
import { planMoves, type MovePlan, type PlacedTask } from "./clashes";
import type { Interval, TaskRow, TemplateRow } from "./types";

export type WeekEvent = { id: string; summary: string; start: string; end: string; kind: "block" | "task" | "fixed" };
export type WeekCall = { id: string; start_at: string; end_at: string; name: string; call_type: string };
export type WeekData = { monday: string; today: string; days: string[]; events: WeekEvent[]; calls: WeekCall[]; tasks: TaskRow[]; template: TemplateRow[]; errors: string[] };

export function mondayOf(date: string): string {
  const wd = weekdayOf(date); return addDays(date, wd === 0 ? -6 : 1 - wd);
}
const isoAt = (date: string, hhmm: string) => new Date(londonWallToUtc(date, hhmm)).toISOString();

async function diary(raw: Record<string, unknown>) {
  const r = await handleDiary(raw, createGoogleDiaryDeps());
  if (r.status !== 200 || r.body.ok !== true) throw new Error(String(r.body.error ?? `diary ${raw.action} failed`));
  return r.body;
}

export async function loadWeek(monday: string): Promise<WeekData> {
  const days = [0, 1, 2, 3, 4].map((i) => addDays(monday, i));
  const from = isoAt(monday, "00:00"), to = isoAt(addDays(monday, 7), "00:00");
  const errors: string[] = [];
  const [events, calls, tasks, settings] = await Promise.all([
    diary({ action: "list", from, to }).then((b) => b.events as WeekEvent[]).catch((e) => { errors.push(`Calendar: ${e.message}`); return []; }),
    Promise.resolve(getSupabaseAdmin().from("crm_bookings").select("id, start_at, end_at, name, call_type").eq("status", "booked").gte("start_at", from).lt("start_at", to).order("start_at"))
      .then((r) => { if (r.error) throw new Error(r.error.message); return (r.data ?? []) as WeekCall[]; }).catch((e) => { errors.push(`Calls: ${e.message}`); return []; }),
    dataTaskDeps.list({}).catch((e) => { errors.push(`Tasks: ${e.message}`); return [] as TaskRow[]; }),
    loadSettings().catch((e) => { errors.push(`Settings: ${e.message}`); return { template: [] as TemplateRow[], buffer_min: 30 }; }),
  ]);
  return { monday, today: londonDate(Date.now()), days, events, calls, tasks: tasks.filter((t) => t.status !== "dropped"), template: settings.template, errors };
}

export function placedTasks(tasks: TaskRow[]): PlacedTask[] {
  return tasks.filter((t) => t.status === "placed" && t.kind === "task" && t.start_at && t.end_at && t.estimate_min && t.deadline)
    .map((t) => ({ id: t.id, title: t.title, category: t.category, estimate_min: t.estimate_min!, deadline: t.deadline!, start: Date.parse(t.start_at!), end: Date.parse(t.end_at!) }));
}

export async function loadPlacementCtx(fromDate: string, toDate: string, excludeTaskId?: string): Promise<PlacementCtx> {
  const from = isoAt(fromDate, "00:00"), to = isoAt(addDays(toDate, 1), "00:00");
  const [busyBody, tasks, settings] = await Promise.all([diary({ action: "busy", from, to }), dataTaskDeps.list({ status: ["placed"] }), loadSettings()]);
  const busy = (busyBody.busy as { start: string; end: string }[]).map((b) => ({ start: Date.parse(b.start), end: Date.parse(b.end) }));
  const taken: Interval[] = tasks.filter((t) => t.id !== excludeTaskId && t.start_at && t.end_at).map((t) => ({ start: Date.parse(t.start_at!), end: Date.parse(t.end_at!) }));
  return { template: settings.template, bufferMin: settings.buffer_min, busy, taken, nowMs: Date.now(), fromDate };
}
/** Placed, still-upcoming tasks that a booked call or other busy event now overlaps, with proposed new slots. */
export async function busyClashMoves(): Promise<MovePlan[]> {
  const today = londonDate(Date.now());
  const ctx = await loadPlacementCtx(today, addDays(today, 28));
  const placed = placedTasks(await dataTaskDeps.list({ status: ["placed"] })).filter((t) => t.end > Date.now());
  const hit = placed.filter((t) => ctx.busy.some((b) => b.start < t.end && t.start < b.end));
  if (!hit.length) return [];
  // ctx.busy already holds the calls/appointments; the zero-length "new event" adds nothing.
  return planMoves(hit, ctx, { start: 0, end: 0 });
}
