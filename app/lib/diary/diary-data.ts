// Supabase access for the PA diary (service role). Server only.
import "server-only";
import { getSupabaseAdmin } from "../supabase-admin";
import { TASK_COLS, type TaskRow, type TemplateRow } from "./types";
import type { TaskDeps } from "./tasks-core";

const db = () => getSupabaseAdmin();
const must = <T,>(r: { data: T | null; error: { message: string } | null }, what: string): T => {
  if (r.error) throw new Error(`${what}: ${r.error.message}`);
  if (r.data === null) throw new Error(`${what}: no data`);
  return r.data;
};

export const dataTaskDeps: TaskDeps = {
  async list(f) {
    let q = db().from("diary_tasks").select(TASK_COLS).order("start_at", { ascending: true, nullsFirst: false }).order("created_at").limit(500);
    if (f.status?.length) q = q.in("status", f.status);
    if (f.from) q = q.gte("end_at", f.from);
    if (f.to) q = q.lt("start_at", f.to);
    return must(await q, "list tasks") as unknown as TaskRow[];
  },
  async insert(f) {
    return must(await db().from("diary_tasks").insert(f).select(TASK_COLS).single(), "insert task") as unknown as TaskRow;
  },
  async update(key, f) {
    let q = db().from("diary_tasks").update({ ...f, updated_at: new Date().toISOString() });
    q = key.id ? q.eq("id", key.id) : q.eq("ref", key.ref!);
    const r = await q.select(TASK_COLS).maybeSingle();
    if (r.error) throw new Error(`update task: ${r.error.message}`);
    return (r.data ?? null) as unknown as TaskRow | null;
  },
};

export async function getTask(id: string): Promise<TaskRow | null> {
  const r = await db().from("diary_tasks").select(TASK_COLS).eq("id", id).maybeSingle();
  if (r.error) throw new Error(`get task: ${r.error.message}`);
  return (r.data ?? null) as unknown as TaskRow | null;
}

/** Atomically claim an unplaced task for placing (status placed, no event yet). Null when it no longer qualifies. */
export async function claimForPlacing(id: string): Promise<TaskRow | null> {
  const r = await db()
    .from("diary_tasks")
    .update({ status: "placed", updated_at: new Date().toISOString() })
    .eq("id", id)
    .is("event_id", null)
    .in("status", ["inbox", "approved"])
    .select(TASK_COLS)
    .maybeSingle();
  if (r.error) throw new Error(`claim task: ${r.error.message}`);
  return (r.data ?? null) as unknown as TaskRow | null;
}

export async function loadSettings(): Promise<{ template: TemplateRow[]; buffer_min: number }> {
  return must(await db().from("diary_settings").select("template, buffer_min").eq("id", 1).single(), "load diary settings") as { template: TemplateRow[]; buffer_min: number };
}
