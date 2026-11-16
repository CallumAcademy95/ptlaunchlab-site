import { NextResponse } from "next/server";
import { checkDiaryAuth, handleDiary } from "@/app/lib/diary/diary-core";
import { createGoogleDiaryDeps } from "@/app/lib/diary/diary-google";
import { handleTaskAction, type TaskDeps } from "@/app/lib/diary/tasks-core";
import { dataTaskDeps, getTask, getTaskByRef } from "@/app/lib/diary/diary-data";
import { proposeForTask, placeTask } from "@/app/lib/diary/place";

// POST /api/admin/diary — Callum's PA diary (spec 2026-11-15-pa-weekly-diary-design).
// Not behind the admin cookie (/api/admin/* is not middleware-gated): it is
// called by local Claude with Authorization: Bearer DIARY_API_SECRET.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TASK_ACTIONS = new Set(["tasks", "task-save", "task-propose", "task-place"]);

const json = (body: Record<string, unknown>, status: number) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  const auth = checkDiaryAuth(req.headers.get("authorization"), process.env.DIARY_API_SECRET);
  if (auth === "unconfigured") return json({ ok: false, error: "Diary API is not configured." }, 503);
  if (auth !== "ok") return json({ ok: false, error: "Unauthorised." }, 401);
  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ ok: false, error: "Body must be JSON." }, 400); }
  const action = (raw as { action?: unknown } | null)?.action;
  if (typeof action === "string" && TASK_ACTIONS.has(action)) {
    const g = createGoogleDiaryDeps();
    const taskDeps: TaskDeps = {
      ...dataTaskDeps,
      async get(k) { return k.id ? getTask(k.id) : k.ref ? getTaskByRef(k.ref) : null; },
      propose: (t) => proposeForTask(t, g),
      place: (id, s, e) => placeTask(id, s, e, g),
    };
    const r = await handleTaskAction(raw, taskDeps);
    return json(r.body, r.status);
  }
  const r = await handleDiary(raw, createGoogleDiaryDeps());
  return json(r.body, r.status);
}
