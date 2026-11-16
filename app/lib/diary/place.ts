// Placement shared by the CRM Week page (server actions) and the bearer route
// (task-propose / task-place). Server only. Calendar writes go through handleDiary.
import "server-only";
import { revalidatePath } from "next/cache";
import { handleDiary, type DiaryDeps } from "./diary-core";
import { privacyTitle } from "./screenshot";
import { dataTaskDeps, getTask, claimForPlacing } from "./diary-data";
import { proposeSlot } from "./placement";
import { findClashes, planMoves, type MovePlan } from "./clashes";
import { loadPlacementCtx, placedTasks } from "./week-data";
import { londonDate, addDays, slotLabel, londonWallToUtc } from "../booking/london";
import type { Proposal, TaskRow } from "./types";

type Fail = { ok: false; error: string };
const done = () => revalidatePath("/admin/crm/week");
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));
const todayStartIso = () => new Date(londonWallToUtc(londonDate(Date.now()), "00:00")).toISOString();

/** Best slot for a task by the /plan-week rules. Writes nothing. With moving, the task's current slot is excluded and blocked. */
export async function proposeForTask(t: TaskRow, deps: DiaryDeps, opts: { moving?: boolean } = {}): Promise<{ proposal: Proposal | null; reason: string | null }> {
  const today = londonDate(Date.now());
  if (!opts.moving && t.deadline && t.deadline < today) return { proposal: null, reason: "Deadline has passed — it's in the inbox." };
  const cap = addDays(today, 28);
  const to = opts.moving ? cap : t.deadline && t.deadline < cap ? (t.deadline < today ? today : t.deadline) : cap;
  const ctx = await loadPlacementCtx(today, to, opts.moving ? t.id : undefined, deps);
  if (opts.moving && t.start_at && t.end_at) ctx.busy.push({ start: Date.parse(t.start_at), end: Date.parse(t.end_at) }); // a move must actually move
  const r = proposeSlot(t, ctx);
  return r.ok
    ? { proposal: { start: new Date(r.start).toISOString(), end: new Date(r.end).toISOString(), label: slotLabel(r.start), blockTitle: r.blockTitle }, reason: null }
    : { proposal: null, reason: r.reason };
}

/** Put a task in the calendar at start/end (claim → create → record → clash check). */
export async function placeTask(taskId: string, start: string, end: string, deps: DiaryDeps): Promise<{ ok: true; moves: MovePlan[]; warning?: string } | Fail> {
  let t: TaskRow | null;
  let prior: "inbox" | "approved" = "inbox";
  const why = (c: TaskRow | null): Fail => {
    if (!c) return { ok: false, error: "Task not found." };
    if (c.event_id) return { ok: false, error: "Already in the calendar." };
    if (c.status === "placed") return { ok: false, error: "Already being added to the calendar." };
    return { ok: false, error: "Task is done or dropped." };
  };
  try {
    // (a) claim the row first so a double tap cannot create two events
    const pre = await getTask(taskId);
    if (!pre || pre.event_id || (pre.status !== "inbox" && pre.status !== "approved")) return why(pre);
    t = await claimForPlacing(taskId, pre.status);
    if (!t) return why(await getTask(taskId));
    prior = pre.status;
  } catch (e) { return { ok: false, error: msg(e) }; }
  const revert = async () => { try { await dataTaskDeps.update({ id: taskId }, { status: prior, start_at: null, end_at: null, event_id: null }); } catch { /* best effort */ } };
  // (b) create the event
  let eventId: string;
  try {
    // Personal/appointment titles are re-sanitised at the Google write, whatever was stored.
    const summary = t.kind === "fixed" ? privacyTitle(t.title, "fixed") : `[${t.category}] ${t.title}`;
    const r = await handleDiary({ action: "create", summary, start, end, kind: t.kind, description: `PA task ${t.ref}` }, deps);
    if (r.status !== 200 || r.body.ok !== true) throw new Error(String(r.body.error ?? "Calendar write failed"));
    eventId = String(r.body.id);
  } catch (e) { await revert(); done(); return { ok: false, error: msg(e) }; }
  // (c) record the slot; compensate if that fails
  try {
    const row = await dataTaskDeps.update({ id: taskId }, { status: "placed", start_at: start, end_at: end, event_id: eventId });
    if (!row) throw new Error("Task not found.");
  } catch {
    let removed = false;
    try {
      const d = await handleDiary({ action: "delete", id: eventId }, deps);
      removed = d.status === 200 || d.status === 404;
    } catch { removed = false; }
    if (removed) {
      await revert();
      done();
      return { ok: false, error: "Couldn't save the slot; the calendar event was removed. Try again." };
    }
    // The event may still exist: keep the row pointing at it so it is not lost.
    let recorded = false;
    try { recorded = !!(await dataTaskDeps.update({ id: taskId }, { status: "placed", start_at: start, end_at: end, event_id: eventId })); } catch { recorded = false; }
    done();
    return { ok: false, error: `Saved the event but couldn't finish recording it; it's in your calendar — use Back to inbox if you don't want it.${recorded ? "" : ` (Calendar event id: ${eventId})`}` };
  }
  // (d) the task is placed now
  done();
  try {
    const s = Date.parse(start), e = Date.parse(end);
    const today = londonDate(Date.now());
    const ctx = await loadPlacementCtx(today, addDays(today, 28), t.id, deps);
    const others = placedTasks(await dataTaskDeps.list({ status: ["placed"], from: todayStartIso() })).filter((x) => x.id !== t.id);
    const clashes = findClashes({ start: s, end: e }, others);
    return { ok: true, moves: clashes.length ? planMoves(clashes, ctx, { start: s, end: e }) : [] };
  } catch (e) { return { ok: true, moves: [], warning: `Added, but couldn't check for clashes: ${msg(e)}` }; }
}
