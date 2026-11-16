// Task API for the skills (bearer route). Pure: deps injected.
import { z } from "zod";
import { AREAS, CATEGORIES, isRealDate, type Proposal, type TaskRow } from "./types.ts";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isRealDate, "not a real date");
const ts = z.string().refine((s) => /(Z|[+-]\d\d:\d\d)$/i.test(s) && !Number.isNaN(Date.parse(s)), "ISO with offset");
export const TaskFields = z.object({
  title: z.string().trim().min(1).max(200),
  area: z.enum(AREAS as [string, ...string[]]),
  category: z.enum(CATEGORIES as [string, ...string[]]),
  estimate_min: z.number().int().min(5).max(600).nullable(),
  deadline: date.nullable(),
  owner: z.enum(["Callum", "Claude"]),
  status: z.enum(["inbox", "placed", "done", "approved", "dropped"]),
  kind: z.enum(["task", "fixed"]),
  start_at: ts.nullable(), end_at: ts.nullable(),
  event_id: z.string().max(1024).nullable(),
  source: z.enum(["typed", "screenshot", "claude", "import"]),
  notes: z.string().max(1000).nullable(),
}).partial().strict();
export type TaskFieldsT = z.infer<typeof TaskFields>;

export interface TaskDeps {
  list(f: { status?: string[]; from?: string; to?: string }): Promise<TaskRow[]>;
  insert(f: TaskFieldsT): Promise<TaskRow>;
  update(key: { id?: string; ref?: string }, f: TaskFieldsT): Promise<TaskRow | null>;
  get(key: { id?: string; ref?: string }): Promise<TaskRow | null>;
  propose(t: TaskRow): Promise<{ proposal: Proposal | null; reason: string | null }>;
  place(id: string, start: string, end: string): Promise<{ ok: true; moves: unknown[]; warning?: string } | { ok: false; error: string }>;
}
type Res = { status: number; body: Record<string, unknown> };
const fail = (status: number, error: string): Res => ({ status, body: { ok: false, error } });

const ListReq = z.object({ action: z.literal("tasks"), status: z.array(z.string()).max(5).optional(), from: ts.optional(), to: ts.optional() }).strict();
const SaveKey = z.object({ action: z.literal("task-save"), id: z.string().uuid().optional(), ref: z.string().regex(/^T\d{3,}$/).optional() });
const Key = z.object({ id: z.string().uuid().optional(), ref: z.string().regex(/^T\d{3,}$/).optional() })
  .refine((k) => !!(k.id || k.ref), "id or ref is required");
const PlaceTimes = z.object({ start_at: ts, end_at: ts }).refine(
  (t) => { const s = Date.parse(t.start_at), e = Date.parse(t.end_at); return e > s && e - s <= 24 * 3600_000; },
  "end_at must be after start_at and within 24 hours");

export async function handleTaskAction(raw: unknown, deps: TaskDeps): Promise<Res> {
  const action = (raw as { action?: unknown })?.action;
  try {
    if (action === "tasks") {
      const p = ListReq.safeParse(raw);
      if (!p.success) return fail(400, p.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
      const { action: _a, ...f } = p.data; void _a;
      return { status: 200, body: { ok: true, tasks: await deps.list(f) } };
    }
    if (action === "task-save") {
      const { action: _a, id, ref, ...rest } = raw as Record<string, unknown>; void _a;
      const k = SaveKey.safeParse({ action, id, ref });
      if (!k.success) return fail(400, "id must be a uuid; ref like T001");
      const f = TaskFields.safeParse(rest);
      if (!f.success) return fail(400, f.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; "));
      // Mirror the table's row-level CHECKs so bad input is a 400, not a raw Postgres 502.
      const hasS = "start_at" in f.data, hasE = "end_at" in f.data;
      if (hasS !== hasE) return fail(400, "start_at and end_at must be set together.");
      if (f.data.start_at && f.data.end_at && !(Date.parse(f.data.end_at) > Date.parse(f.data.start_at))) {
        return fail(400, "end_at must be after start_at.");
      }
      if (k.data.id || k.data.ref) {
        const row = await deps.update({ id: k.data.id, ref: k.data.ref }, f.data);
        return row ? { status: 200, body: { ok: true, task: row } } : fail(404, "No such task.");
      }
      if (!f.data.title || !f.data.category) return fail(400, "A new task needs title and category.");
      if (f.data.estimate_min == null && (f.data.kind ?? "task") !== "fixed") {
        return fail(400, "A task needs estimate_min (only fixed events can omit it).");
      }
      return { status: 200, body: { ok: true, task: await deps.insert(f.data) } };
    }
    if (action === "task-propose" || action === "task-place") {
      const { action: _a, id, ref, start_at, end_at, ...extra } = raw as Record<string, unknown>; void _a;
      if (Object.keys(extra).length) return fail(400, `Unknown field(s): ${Object.keys(extra).join(", ")}`);
      const k = Key.safeParse({ id, ref });
      if (!k.success) return fail(400, "id (uuid) or ref (like T001) is required");
      let times: { start_at: string; end_at: string } | null = null;
      if (action === "task-place") {
        const t = PlaceTimes.safeParse({ start_at, end_at });
        if (!t.success) return fail(400, t.error.issues.map((i) => i.message).join("; "));
        times = t.data;
      } else if (start_at !== undefined || end_at !== undefined) return fail(400, "task-propose takes no times");
      const task = await deps.get(k.data);
      if (!task) return fail(404, "No such task.");
      if (!times) {
        const p = await deps.propose(task);
        return { status: 200, body: { ok: true, task, proposal: p.proposal, reason: p.reason } };
      }
      const r = await deps.place(task.id, times.start_at, times.end_at);
      return r.ok ? { status: 200, body: { ...r } } : fail(409, r.error);
    }
    return fail(400, "Unknown task action.");
  } catch (e) {
    return fail(502, e instanceof Error ? e.message : String(e));
  }
}
