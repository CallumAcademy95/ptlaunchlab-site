import { NextResponse } from "next/server";
import { checkDiaryAuth, handleDiary } from "@/app/lib/diary/diary-core";
import { createGoogleDiaryDeps } from "@/app/lib/diary/diary-google";

// POST /api/admin/diary — Callum's PA diary (spec 2026-11-15-pa-weekly-diary-design).
// Not behind the admin cookie (/api/admin/* is not middleware-gated): it is
// called by local Claude with Authorization: Bearer DIARY_API_SECRET.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const json = (body: Record<string, unknown>, status: number) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  const auth = checkDiaryAuth(req.headers.get("authorization"), process.env.DIARY_API_SECRET);
  if (auth === "unconfigured") return json({ ok: false, error: "Diary API is not configured." }, 503);
  if (auth !== "ok") return json({ ok: false, error: "Unauthorised." }, 401);
  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ ok: false, error: "Body must be JSON." }, 400); }
  const r = await handleDiary(raw, createGoogleDiaryDeps());
  return json(r.body, r.status);
}
