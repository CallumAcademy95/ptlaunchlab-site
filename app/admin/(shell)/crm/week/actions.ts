"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_AUTH_COOKIE, verifyAuthCookieValue } from "@/app/lib/admin-auth";
import { handleDiary } from "@/app/lib/diary/diary-core";
import { createGoogleDiaryDeps } from "@/app/lib/diary/diary-google";
import { dataTaskDeps, getTask } from "@/app/lib/diary/diary-data";
import { TaskFields } from "@/app/lib/diary/tasks-core";
import type { MovePlan } from "@/app/lib/diary/clashes";
import { layoutWeek, type LayoutEvent } from "@/app/lib/diary/template";
import { readScreenshot } from "@/app/lib/diary/vision";
import { loadWeek, mondayOf, diary } from "@/app/lib/diary/week-data";
import { londonDate, slotLabel } from "@/app/lib/booking/london";
import { placeTask, proposeForTask } from "@/app/lib/diary/place";
import type { Proposal, TaskRow } from "@/app/lib/diary/types";

type Fail = { ok: false; error: string };
const DENIED: Fail = { ok: false, error: "Not signed in. Sign in at /admin/login." };
async function isAdmin() {
  const jar = await cookies();
  return verifyAuthCookieValue(jar.get(ADMIN_AUTH_COOKIE)?.value).catch(() => false);
}
const isUuid = (s: unknown): s is string => typeof s === "string" && /^[0-9a-f-]{36}$/i.test(s);
const done = () => revalidatePath("/admin/crm/week");
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));
export type { Proposal } from "@/app/lib/diary/types";

/** Add a task. With start/end it is pinned to that time; otherwise a slot is proposed. Nothing is written to Google here. */
export async function addTask(input: unknown): Promise<{ ok: true; task: TaskRow; proposal: Proposal | null; reason: string | null } | Fail> {
  if (!(await isAdmin())) return DENIED;
  const p = TaskFields.safeParse(input);
  if (!p.success || !p.data.title || !p.data.category) return { ok: false, error: "Title and category are required; check the fields." };
  const f = p.data; // the TaskFields date schema already rejects impossible deadlines (e.g. 2026-02-31)
  if (f.kind === "fixed" && (!f.start_at || !f.end_at)) return { ok: false, error: "A personal/fixed event needs a start and end time." };
  if (!!f.start_at !== !!f.end_at) return { ok: false, error: "Give both a start and an end time, or neither." };
  if (f.start_at && f.end_at && Date.parse(f.end_at) <= Date.parse(f.start_at)) return { ok: false, error: "End must be after start." };
  let task: TaskRow;
  try {
    task = await dataTaskDeps.insert({ ...f, status: "inbox", start_at: null, end_at: null, event_id: null });
  } catch (e) { return { ok: false, error: msg(e) }; }
  // From here the task is saved: never report an error, always revalidate.
  done();
  if (f.start_at && f.end_at) {
    const s = Date.parse(f.start_at);
    return { ok: true, task, proposal: { start: f.start_at, end: f.end_at, label: slotLabel(s), blockTitle: null }, reason: null };
  }
  try {
    const { proposal, reason } = await proposeForTask(task, createGoogleDiaryDeps());
    return { ok: true, task, proposal, reason };
  } catch (e) { return { ok: true, task, proposal: null, reason: `Couldn't find a slot right now (${msg(e)}). It's in the inbox.` }; }
}

/** Put a task in the calendar at start/end, then report any placed tasks it clashes with and proposed moves. */
export async function confirmSlot(taskId: unknown, start: unknown, end: unknown): Promise<{ ok: true; moves: MovePlan[]; warning?: string } | Fail> {
  if (!(await isAdmin())) return DENIED;
  if (!isUuid(taskId) || typeof start !== "string" || typeof end !== "string") return { ok: false, error: "Bad request." };
  return placeTask(taskId, start, end, createGoogleDiaryDeps());
}

/** Apply proposed moves (one tap). Returns how many moved; any failure is reported per task. */
export async function applyMoves(moves: unknown): Promise<{ ok: true; moved: number; failed: string[]; failedIds: string[] } | Fail> {
  if (!(await isAdmin())) return DENIED;
  if (!Array.isArray(moves) || moves.length > 20) return { ok: false, error: "Bad request." };
  const deps = createGoogleDiaryDeps();
  let moved = 0; const failed: string[] = []; const failedIds: string[] = [];
  for (const m of moves as { id: unknown; start: unknown; end: unknown }[]) {
    let label = "a task";
    try {
      if (!isUuid(m.id) || typeof m.start !== "string" || typeof m.end !== "string") throw new Error("bad move");
      const t = await getTask(m.id);
      if (t) label = t.title;
      if (!t?.event_id) throw new Error("not in the calendar");
      await diary(deps, { action: "move", id: t.event_id, start: m.start, end: m.end });
      const row = await dataTaskDeps.update({ id: t.id }, { start_at: m.start, end_at: m.end });
      if (!row) throw new Error("moved in the calendar but the task record wasn't found");
      moved++;
    } catch (e) { failed.push(`${label}: ${msg(e)}`); if (typeof m.id === "string") failedIds.push(m.id); }
  }
  done();
  return { ok: true, moved, failed, failedIds };
}

/** Propose a new slot for a placed task (not written until applyMoves). */
export async function moveTask(taskId: unknown): Promise<{ ok: true; proposal: Proposal | null; reason: string | null } | Fail> {
  if (!(await isAdmin())) return DENIED;
  if (!isUuid(taskId)) return { ok: false, error: "Bad request." };
  try {
    const t = await getTask(taskId);
    if (!t) return { ok: false, error: "Task not found." };
    const { proposal, reason } = await proposeForTask(t, createGoogleDiaryDeps(), { moving: true });
    return { ok: true, proposal, reason };
  } catch (e) { return { ok: false, error: msg(e) }; }
}

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
/** Read a screenshot; returns prefill fields. The file is never stored. */
export async function readShot(form: FormData) {
  if (!(await isAdmin())) return DENIED;
  const file = form.get("file");
  if (!(file instanceof File) || !ALLOWED.has(file.type)) return { ok: false as const, error: "Use a JPEG, PNG or WebP screenshot." };
  if (file.size > 900_000) return { ok: false as const, error: "Screenshot too large after resizing; try a crop." };
  const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const today = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  return readScreenshot(b64, file.type as "image/jpeg" | "image/png" | "image/webp", `${today} (${londonDate(Date.now())})`);
}

async function setStatus(taskId: unknown, status: "done" | "dropped" | "inbox" | "approved", unplace: boolean): Promise<{ ok: true } | Fail> {
  if (!(await isAdmin())) return DENIED;
  if (!isUuid(taskId)) return { ok: false, error: "Bad request." };
  try {
    const t = await getTask(taskId);
    if (!t) return { ok: false, error: "Task not found." };
    if (unplace && t.event_id) {
      const r = await handleDiary({ action: "delete", id: t.event_id }, createGoogleDiaryDeps());
      if (r.status !== 200 && r.status !== 404) return { ok: false, error: String(r.body.error ?? "Calendar delete failed") };
    }
    const row = await dataTaskDeps.update({ id: t.id }, unplace ? { status, start_at: null, end_at: null, event_id: null } : { status });
    if (!row) return { ok: false, error: "Task not found." };
    done();
    return { ok: true };
  } catch (e) { return { ok: false, error: msg(e) }; }
}
export async function markDone(taskId: unknown) { return setStatus(taskId, "done", false); }
export async function dropTask(taskId: unknown) { return setStatus(taskId, "dropped", true); }
export async function returnToInbox(taskId: unknown) { return setStatus(taskId, "inbox", true); }
export async function approveClaudeTask(taskId: unknown): Promise<{ ok: true } | Fail> {
  if (!(await isAdmin())) return DENIED;
  if (!isUuid(taskId)) return { ok: false, error: "Bad request." };
  try {
    const t = await getTask(taskId);
    if (!t) return { ok: false, error: "Task not found." };
    if (t.event_id) return { ok: false, error: "That task is already in the calendar; it can't be approved." };
    if (t.status !== "inbox") return { ok: false, error: `Only inbox tasks can be approved (this one is ${t.status}).` };
  } catch (e) { return { ok: false, error: msg(e) }; }
  return setStatus(taskId, "approved", false);
}

const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
/** Preview the template blocks for a week (nothing written). */
export async function previewLayout(monday: unknown): Promise<{ ok: true; events: LayoutEvent[] } | Fail> {
  if (!(await isAdmin())) return DENIED;
  return previewLayoutWith(monday, createGoogleDiaryDeps());
}
async function previewLayoutWith(monday: unknown, deps: ReturnType<typeof createGoogleDiaryDeps>): Promise<{ ok: true; events: LayoutEvent[] } | Fail> {
  if (!isDate(monday) || mondayOf(monday) !== monday) return { ok: false, error: "Pick a Monday." };
  try {
    const w = await loadWeek(monday, deps);
    if (w.errors.length) return { ok: false, error: w.errors.join(" · ") };
    const existing = w.events.filter((e) => e.kind === "block").map((e) => ({ summary: e.summary, start: Date.parse(e.start), end: Date.parse(e.end) }));
    return { ok: true, events: layoutWeek(w.template, monday, existing) };
  } catch (e) { return { ok: false, error: msg(e) }; }
}
/** Create the template blocks for a week. Reports created vs planned. */
export async function applyLayout(monday: unknown): Promise<{ ok: true; created: number; planned: number; failed: string[] } | Fail> {
  if (!(await isAdmin())) return DENIED;
  const deps = createGoogleDiaryDeps();
  const prev = await previewLayoutWith(monday, deps);
  if (!prev.ok) return prev;
  let created = 0; const failed: string[] = [];
  // Create with a concurrency of 4 so a full week fits the time limit.
  let next = 0;
  const worker = async () => {
    while (next < prev.events.length) {
      const ev = prev.events[next++];
      try {
        await diary(deps, { action: "create", summary: ev.summary, start: new Date(ev.start).toISOString(), end: new Date(ev.end).toISOString(), kind: "block" });
        created++;
      } catch (e) { failed.push(`${ev.summary}: ${msg(e)}`); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, prev.events.length) }, worker));
  done();
  return { ok: true, created, planned: prev.events.length, failed };
}
