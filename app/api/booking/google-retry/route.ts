import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { createEvent, updateEvent, deleteEvent } from "@/app/lib/booking/google";
import { setGoogle, type BookingRow } from "@/app/lib/booking/data";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await getSupabaseAdmin().from("crm_bookings").select("*").not("google_sync_error", "is", null).limit(50);
  if (error) return NextResponse.json({ ok: false, error: error.message });
  let fixed = 0;
  for (const b of (data ?? []) as BookingRow[]) {
    try {
      if (b.status === "cancelled") { if (b.google_event_id) await deleteEvent(b.google_event_id); await setGoogle(b.id, { google_sync_error: null }); }
      else if (b.google_event_id) { await updateEvent(b.google_event_id, b); await setGoogle(b.id, { google_sync_error: null }); }
      else { await setGoogle(b.id, { google_event_id: await createEvent(b), google_sync_error: null }); }
      fixed++;
    } catch (e) {
      await setGoogle(b.id, { google_sync_error: `retry: ${e instanceof Error ? e.message : String(e)}` });
    }
  }
  return NextResponse.json({ ok: true, retried: (data ?? []).length, fixed });
}
