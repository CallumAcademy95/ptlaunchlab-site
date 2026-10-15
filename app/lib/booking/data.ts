import "server-only";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import type { CallType } from "./callTypes";
import type { Interval, Rules } from "./slots";
import { rulesFromRow } from "./validate";

export interface BookingRow {
  id: string; call_type: CallType; start_at: string; end_at: string;
  status: "booked" | "done" | "no_show" | "cancelled";
  name: string; email: string; phone: string; answers: Record<string, string | string[]>;
  consultation_id: string | null; source: "setter" | "web" | "manual"; is_test: boolean;
  google_event_id: string | null; google_sync_error: string | null;
  notes: string | null; cancel_reason: string | null; created_at: string;
  confirm_sent_at: string | null; reminder_day_sent_at: string | null; reminder_hour_sent_at: string | null;
  send_failures: number; last_send_error: string | null;
}

const db = () => getSupabaseAdmin();

export async function loadSettings() {
  const { data, error } = await db().from("crm_booking_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(`booking_settings: ${error.message}`);
  const row = (data ?? null) as Record<string, unknown> | null;
  const te = (row?.types_enabled ?? {}) as Record<string, unknown>;
  return {
    rules: rulesFromRow(row) as Rules,
    typesEnabled: { consultation: te.consultation !== false, gym_partner: te.gym_partner !== false } as Record<CallType, boolean>,
    row,
  };
}

export async function loadBooked(fromMs: number, toMs: number): Promise<Interval[]> {
  const { data, error } = await db().from("crm_bookings").select("start_at, end_at")
    .eq("status", "booked").lt("start_at", new Date(toMs).toISOString()).gt("end_at", new Date(fromMs).toISOString());
  if (error) throw new Error(`bookings: ${error.message}`);
  return (data ?? []).map((r) => ({ start: Date.parse(r.start_at), end: Date.parse(r.end_at) }));
}

type RpcResult = { ok: true; booking: BookingRow } | { ok: false; taken: boolean; error: string };
function interpret(data: unknown, error: { message: string } | null): RpcResult {
  if (error) {
    const taken = /slot_taken|crm_bookings_one_live_per_start/.test(error.message);
    if (!taken) console.error("[booking] rpc failed", error.message);
    return { ok: false, taken, error: taken ? "That time's just gone." : "Something went wrong. Please try again." };
  }
  return { ok: true, booking: data as BookingRow };
}

export async function rpcBook(row: Record<string, unknown>, buffer: number): Promise<RpcResult> {
  const { data, error } = await db().rpc("crm_book_call", { p_row: row, p_buffer_minutes: buffer });
  return interpret(data, error);
}

export async function rpcMove(id: string, startMs: number, endMs: number, buffer: number): Promise<RpcResult> {
  const { data, error } = await db().rpc("crm_move_call", {
    p_id: id, p_start: new Date(startMs).toISOString(), p_end: new Date(endMs).toISOString(), p_buffer_minutes: buffer,
  });
  return interpret(data, error);
}

export async function findByManageHash(hash: string): Promise<BookingRow | null> {
  const { data } = await db().from("crm_bookings").select("*").eq("manage_token_hash", hash).maybeSingle();
  return (data ?? null) as BookingRow | null;
}

export async function findRecentDuplicate(email: string, startMs: number): Promise<BookingRow | null> {
  const since = new Date(Date.now() - 5 * 60_000).toISOString();
  const { data } = await db().from("crm_bookings").select("*").eq("status", "booked").eq("email", email)
    .eq("start_at", new Date(startMs).toISOString()).gte("created_at", since).limit(1).maybeSingle();
  return (data ?? null) as BookingRow | null;
}

export async function setGoogle(id: string, patch: { google_event_id?: string | null; google_sync_error?: string | null }) {
  const { error } = await db().from("crm_bookings").update(patch).eq("id", id);
  if (error) console.error(`[booking] google state update failed for ${id}`, error.message);
}

export async function markGoogleHealth(ok: boolean, err?: string) {
  await db().from("crm_booking_settings").update(ok ? { google_checked_at: new Date().toISOString(), google_error: null } : { google_error: err ?? "unknown" }).eq("id", 1);
}

/** What the setter knows about this lead, for pre-filling the form. */
export async function loadPrefill(leadId: string) {
  const empty = { name: null, email: null, phone: null, answers: {} as Record<string, string> };
  const { data } = await db().from("consultations").select("name, email, phone, booking_prefill").eq("id", leadId).maybeSingle();
  if (!data) return empty;
  const pre = (data.booking_prefill ?? {}) as Record<string, unknown>;
  const answers: Record<string, string> = {};
  for (const [k, v] of Object.entries(pre)) if (typeof v === "string" && k !== "phone") answers[k] = v;
  return {
    name: (data.name as string | null) ?? null,
    email: (data.email as string | null) ?? null,
    phone: (data.phone as string | null) ?? (typeof pre.phone === "string" ? pre.phone : null),
    answers,
  };
}
