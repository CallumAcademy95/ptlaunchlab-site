import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-request-auth";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { sendOwnerPush } from "@/app/lib/owner-push";

// POST /api/admin-push/test — send a test alert to every subscribed device.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  if (!process.env.VAPID_PUBLIC_KEY?.trim() || !process.env.VAPID_PRIVATE_KEY?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Push is not configured on the server (VAPID keys missing)." },
      { status: 503 }
    );
  }

  let db;
  try {
    db = getSupabaseAdmin();
  } catch (err) {
    console.error("[admin-push] test: no db", err);
    return NextResponse.json({ ok: false, error: "Database not configured." }, { status: 500 });
  }

  const result = await sendOwnerPush(db, {
    title: "Test from PTLL Admin",
    body: "Phone alerts are working.",
    url: "/admin/leads",
    tag: "test",
  });
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  // Every subscription lands in exactly one bucket, so all-zero means there were none.
  if (result.sent + result.removed + result.failed === 0) {
    return NextResponse.json({ ok: true, ...result, message: "No devices subscribed yet." });
  }
  return NextResponse.json({ ok: true, ...result });
}
