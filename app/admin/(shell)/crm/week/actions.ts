"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_AUTH_COOKIE, verifyAuthCookieValue } from "@/app/lib/admin-auth";
import { handleDiary } from "@/app/lib/diary/diary-core";
import { createGoogleDiaryDeps } from "@/app/lib/diary/diary-google";
import { dataTaskDeps, getTask, claimForPlacing } from "@/app/lib/diary/diary-data";
import { TaskFields } from "@/app/lib/diary/tasks-core";
import { proposeSlot } from "@/app/lib/diary/placement";
import { findClashes, planMoves, type MovePlan } from "@/app/lib/diary/clashes";
import { layoutWeek, type LayoutEvent } from "@/app/lib/diary/template";
import { readScreenshot } from "@/app/lib/diary/vision";
import { loadPlacementCtx, loadWeek, placedTasks, mondayOf } from "@/app/lib/diary/week-data";
import { londonDate, addDays, slotLabel } from "@/app/lib/booking/london";
import type { TaskRow } from "@/app/lib/diary/types";

type Fail = { ok: false; error: string };
const DENIED: Fail = { ok: false, error: "Not signed in. Sign in at /admin/login." };
async function isAdmin() {
  const jar = await cookies();
  return verifyAuthCookieValue(jar.get(ADMIN_AUTH_COOKIE)?.value).catch(() => false);
}
const isUuid = (s: unknown): s is string => typeof s === "string" && /^[0-9a-f-]{36}$/i.test(s);
const done = () => revalidatePath("/admin/crm/week");
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));
async function diary(raw: Record<string, unknown>) {
  const r = await handleDiary(raw, createGoogleDiaryDeps());
  if (r.status !== 200 || r.body.ok !== true) throw new Error(String(r.body.error ?? "Calendar write failed"));
  return r.body;
}
export type Proposal = { start: string; end: string; label: string; blockTitle: string | null };

/** Add a task. With start/end it is pinned to that time; otherwise a slot is proposed. Nothing is written to Google here. */
export async function addTask(input: unknown): Promise<{ ok: true; task: TaskRow; proposal: Proposal | null; reason: string | null } | Fail> {
  if (!(await isAdmin())) return DENIED;
  const p = TaskFields.safeParse(input);
  if (!p.success || !p.data.title || !p.data.category) return { ok: false, error: "Title and category are required; check the fields." };
  const f = p.data;
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
    const today = londonDate(Date.now());
    if (f.deadline && f.deadline < today) return { ok: true, task, proposal: null, reason: "Deadline has passed — it's in the inbox." };
    const cap = addDays(today, 28);
    const to = f.deadline && f.deadline < cap ? f.deadline : cap;
    const r = proposeSlot(task, await loadPlacementCtx(today, to < today ? today : to));
    return r.ok
      ? { ok: true, task, proposal: { start: new Date(r.start).toISOString(), end: new Date(r.end).toISOString(), label: slotLabel(r.start), blockTitle: r.blockTitle }, reason: null }
      : { ok: true, task, proposal: null, reason: r.reason };
  } catch (e) { return { ok: true, task, proposal: null, reason: `Couldn't find a slot right now (${msg(e)}). It's in the inbox.` }; }
}

/** Put a task in the calendar at start/end, then report any placed tasks it clashes with and proposed moves. */
export async function confirmSlot(taskId: unknown, start: unknown, end: unknown): Promise<{ ok: true; moves: MovePlan[]; warning?: string } | Fail> {
  if (!(await isAdmin())) return DENIED;
  if (!isUuid(taskId) || typeof start !== "string" || typeof end !== "string") return { ok: false, error: "Bad request." };
  let t: TaskRow | null;
  try {
    // (a) claim the row first so a double tap cannot create two events
    t = await claimForPlacing(taskId);
    if (!t) {
      const cur = await getTask(taskId);
      if (!cur) return { ok: false, error: "Task not found." };
      if (cur.event_id) return { ok: false, error: "Already in the calendar." };
      return { ok: false, error: "Task is done or dropped." };
    }
  } catch (e) { return { ok: false, error: msg(e) }; }
  const revert = async () => { try { await dataTaskDeps.update({ id: taskId }, { status: "inbox", start_at: null, end_at: null, event_id: null }); } catch { /* best effort */ } };
  // (b) create the event
  let eventId: string;
  try {
    const summary = t.kind === "fixed" ? t.title : `[${t.category}] ${t.title}`;
    const r = await handleDiary({ action: "create", summary, start, end, kind: t.kind, description: `PA task ${t.ref}` }, createGoogleDiaryDeps());
    if (r.status !== 200 || r.body.ok !== true) throw new Error(String(r.body.error ?? "Calendar write failed"));
    eventId = String(r.body.id);
  } catch (e) { await revert(); done(); return { ok: false, error: msg(e) }; }
  // (c) record the slot; compensate if that fails
  try {
    const row = await dataTaskDeps.update({ id: taskId }, { status: "placed", start_at: start, end_at: end, event_id: eventId });
    if (!row) throw new Error("Task not found.");
  } catch {
    try { await handleDiary({ action: "delete", id: eventId }, createGoogleDiaryDeps()); } catch { /* 404 or already gone */ }
    await revert();
    done();
    return { ok: false, error: "Couldn't save the slot; the calendar event was removed. Try again." };
  }
  // (d) the task is placed now
  done();
  try {
    const s = Date.parse(start), e = Date.parse(end);
    const today = londonDate(Date.now());
    const ctx = await loadPlacementCtx(today, addDays(today, 28), t.id);
    const others = placedTasks(await dataTaskDeps.list({ status: ["placed"] })).filter((x) => x.id !== t.id);
    const clashes = findClashes({ start: s, end: e }, others);
    return { ok: true, moves: clashes.length ? planMoves(clashes, ctx, { start: s, end: e }) : [] };
  } catch (e) { return { ok: true, moves: [], warning: `Added, but couldn't check for clashes: ${msg(e)}` }; }
}

/** Apply proposed moves (one tap). Returns how many moved; any failure is reported per task. */
export async function applyMoves(moves: unknown): Promise<{ ok: true; moved: number; failed: string[] } | Fail> {
  if (!(await isAdmin())) return DENIED;
  if (!Array.isArray(moves) || moves.length > 20) return { ok: false, error: "Bad request." };
  let moved = 0; const failed: string[] = [];
  for (const m of moves as { id: unknown; start: unknown; end: unknown }[]) {
    try {
      if (!isUuid(m.id) || typeof m.start !== "string" || typeof m.end !== "string") throw new Error("bad move");
      const t = await getTask(m.id);
      if (!t?.event_id) throw new Error("not in the calendar");
      await diary({ action: "move", id: t.event_id, start: m.start, end: m.end });
      await dataTaskDeps.update({ id: t.id }, { start_at: m.start, end_at: m.end });
      moved++;
    } catch (e) { failed.push(`${String(m.id)}: ${msg(e)}`); }
  }
  done();
  return { ok: true, moved, failed };
}

/** Propose a new slot for a placed task (not written until applyMoves). */
export async function moveTask(taskId: unknown): Promise<{ ok: true; proposal: Proposal | null; reason: string | null } | Fail> {
  if (!(await isAdmin())) return DENIED;
  if (!isUuid(taskId)) return { ok: false, error: "Bad request." };
  try {
    const t = await getTask(taskId);
    if (!t) return { ok: false, error: "Task not found." };
    const today = londonDate(Date.now());
    const ctx = await loadPlacementCtx(today, addDays(today, 28), t.id);
    if (t.start_at && t.end_at) ctx.busy.push({ start: Date.parse(t.start_at), end: Date.parse(t.end_at) }); // a move must actually move
    const r = proposeSlot(t, ctx);
    return r.ok ? { ok: true, proposal: { start: new Date(r.start).toISOString(), end: new Date(r.end).toISOString(), label: slotLabel(r.start), blockTitle: r.blockTitle }, reason: null }
      : { ok: true, proposal: null, reason: r.reason };
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
export async function approveClaudeTask(taskId: unknown) { return setStatus(taskId, "approved", false); }

const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
/** Preview the template blocks for a week (nothing written). */
export async function previewLayout(monday: unknown): Promise<{ ok: true; events: LayoutEvent[] } | Fail> {
  if (!(await isAdmin())) return DENIED;
  if (!isDate(monday) || mondayOf(monday) !== monday) return { ok: false, error: "Pick a Monday." };
  try {
    const w = await loadWeek(monday);
    if (w.errors.length) return { ok: false, error: w.errors.join(" · ") };
    const existing = w.events.filter((e) => e.kind === "block").map((e) => ({ summary: e.summary, start: Date.parse(e.start), end: Date.parse(e.end) }));
    return { ok: true, events: layoutWeek(w.template, monday, existing) };
  } catch (e) { return { ok: false, error: msg(e) }; }
}
/** Create the template blocks for a week. Reports created vs planned. */
export async function applyLayout(monday: unknown): Promise<{ ok: true; created: number; planned: number; failed: string[] } | Fail> {
  const prev = await previewLayout(monday);
  if (!prev.ok) return prev;
  let created = 0; const failed: string[] = [];
  for (const ev of prev.events) {
    try {
      await diary({ action: "create", summary: ev.summary, start: new Date(ev.start).toISOString(), end: new Date(ev.end).toISOString(), kind: "block" });
      created++;
    } catch (e) { failed.push(`${ev.summary}: ${msg(e)}`); }
  }
  done();
  return { ok: true, created, planned: prev.events.length, failed };
}
