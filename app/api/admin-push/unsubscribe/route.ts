import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-request-auth";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { OWNER_PUSH_TABLE, parseEndpoint } from "@/app/lib/owner-push";

// POST /api/admin-push/unsubscribe — forget this device's push subscription.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const endpoint = parseEndpoint(await req.json().catch(() => null));
  if (!endpoint) {
    return NextResponse.json({ ok: false, error: "Missing endpoint." }, { status: 400 });
  }
  try {
    const { error } = await getSupabaseAdmin().from(OWNER_PUSH_TABLE).delete().eq("endpoint", endpoint);
    if (error) throw error;
  } catch (err) {
    console.error("[admin-push] unsubscribe failed", err);
    return NextResponse.json({ ok: false, error: "Could not remove subscription." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
