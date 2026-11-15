// Task API for the skills (bearer route). Pure: deps injected.
import { z } from "zod";
import { AREAS, CATEGORIES, type TaskRow } from "./types.ts";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
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
}
type Res = { status: number; body: Record<string, unknown> };
const fail = (status: number, error: string): Res => ({ status, body: { ok: false, error } });

const ListReq = z.object({ action: z.literal("tasks"), status: z.array(z.string()).max(5).optional(), from: ts.optional(), to: ts.optional() }).strict();
const SaveKey = z.object({ action: z.literal("task-save"), id: z.string().uuid().optional(), ref: z.string().regex(/^T\d{3,}$/).optional() });

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
      if (k.data.id || k.data.ref) {
        const row = await deps.update({ id: k.data.id, ref: k.data.ref }, f.data);
        return row ? { status: 200, body: { ok: true, task: row } } : fail(404, "No such task.");
      }
      if (!f.data.title || !f.data.category) return fail(400, "A new task needs title and category.");
      return { status: 200, body: { ok: true, task: await deps.insert(f.data) } };
    }
    return fail(400, "Unknown task action.");
  } catch (e) {
    return fail(502, e instanceof Error ? e.message : String(e));
  }
}
