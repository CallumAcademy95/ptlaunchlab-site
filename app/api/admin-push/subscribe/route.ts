import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-request-auth";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { OWNER_PUSH_TABLE, parseSubscription } from "@/app/lib/owner-push";

// POST /api/admin-push/subscribe — save this device's push subscription.
// Idempotent: upserts on endpoint, so the admin re-posts on every load.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const sub = parseSubscription(body);
  if (!sub) {
    return NextResponse.json({ ok: false, error: "Invalid push subscription." }, { status: 400 });
  }

  const userAgent = (req.headers.get("user-agent") ?? "").slice(0, 300) || null;
  try {
    const { error } = await getSupabaseAdmin()
      .from(OWNER_PUSH_TABLE)
      .upsert(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth, user_agent: userAgent, failure_count: 0 },
        { onConflict: "endpoint" }
      );
    if (error) throw error;
  } catch (err) {
    console.error("[admin-push] subscribe failed", err);
    return NextResponse.json({ ok: false, error: "Could not save subscription." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
