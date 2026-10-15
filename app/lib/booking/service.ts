import "server-only";
import { CALL_TYPES, type CallType } from "./callTypes";
import { computeSlots, isSlotFree } from "./slots";
import { newManageToken } from "./tokens";
import type { BookingInput } from "./validate";
import { loadSettings, loadBooked, rpcBook, rpcMove, setGoogle, markGoogleHealth, findRecentDuplicate, type BookingRow } from "./data";
import { getBusy, createEvent, updateEvent, deleteEvent } from "./google";
import { alertOwner } from "./alerts";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";

const MIN = 60_000;
/** One failure shape for book/move/cancel, so callers can read any field after `!r.ok`. */
export type Fail = { ok: false; error: string; taken?: boolean; nearest?: number[]; existing?: BookingRow };

/** Free starts for a call type. Never offers times it could not check against Google. */
export async function freeSlots(callType: CallType, nowMs: number) {
  const { rules, typesEnabled } = await loadSettings();
  if (!typesEnabled[callType]) return { ok: false as const, reason: "disabled" as const };
  const to = nowMs + (rules.horizonDays + 1) * 24 * 60 * MIN;
  let busy;
  try {
    busy = await getBusy(nowMs, to);
    await markGoogleHealth(true);
  } catch (e) {
    await markGoogleHealth(false, e instanceof Error ? e.message : String(e));
    return { ok: false as const, reason: "calendar_unavailable" as const };
  }
  const booked = await loadBooked(nowMs, to);
  return { ok: true as const, slots: computeSlots(rules, busy, booked, nowMs, CALL_TYPES[callType].minutes) };
}

async function recheck(callType: CallType, startMs: number, excludeStartMs?: number): Promise<Fail | null> {
  const now = Date.now();
  const { rules } = await loadSettings();
  const minutes = CALL_TYPES[callType].minutes;
  let busy;
  try { busy = await getBusy(now, now + (rules.horizonDays + 1) * 24 * 60 * MIN); }
  catch { return { ok: false, error: "We can't check the diary right now. Please try again in a minute." }; }
  // On a move, the call's own current slot is not a clash with itself.
  const booked = (await loadBooked(now, now + (rules.horizonDays + 1) * 24 * 60 * MIN)).filter((b) => b.start !== excludeStartMs);
  if (isSlotFree(rules, busy, booked, now, startMs, minutes)) return null;
  const all = computeSlots(rules, busy, booked, now, minutes);
  const nearest = [...all].sort((a, b) => Math.abs(a - startMs) - Math.abs(b - startMs)).slice(0, 3).sort((a, b) => a - b);
  return { ok: false, error: "That time's just gone.", taken: true, nearest };
}

async function syncCreate(b: BookingRow) {
  try { await setGoogle(b.id, { google_event_id: await createEvent(b), google_sync_error: null }); }
  catch (e) { await setGoogle(b.id, { google_sync_error: `create: ${e instanceof Error ? e.message : String(e)}` }); }
}

export async function book(input: BookingInput, opts: { source: "web" | "setter" | "manual"; isTest?: boolean; consultationId?: string | null; skipSlotCheck?: boolean }): Promise<{ ok: true; booking: BookingRow; manageToken: string } | Fail> {
  const dup = await findRecentDuplicate(input.email, input.startMs);
  if (dup) return { ok: false, error: "already_booked", existing: dup };
  if (!opts.skipSlotCheck) { const f = await recheck(input.callType, input.startMs); if (f) return f; }
  const { rules } = await loadSettings();
  const { token, hash } = newManageToken();
  const r = await rpcBook({
    call_type: input.callType,
    start_at: new Date(input.startMs).toISOString(),
    end_at: new Date(input.startMs + CALL_TYPES[input.callType].minutes * MIN).toISOString(),
    name: input.name, email: input.email, phone: input.phone, answers: input.answers,
    consultation_id: opts.consultationId ?? "", source: opts.source, is_test: !!opts.isTest,
    manage_token_hash: hash, manage_token_plain: token,
  }, rules.bufferMinutes);
  if (!r.ok) return r.taken ? { ok: false as const, error: "That time's just gone.", taken: true } : { ok: false as const, error: r.error };
  await syncCreate(r.booking);
  await alertOwner("booked", r.booking);
  return { ok: true as const, booking: r.booking, manageToken: token };
}

export async function move(b: BookingRow, startMs: number, opts: { skipSlotCheck?: boolean } = {}): Promise<{ ok: true; booking: BookingRow } | Fail> {
  if (b.status !== "booked") return { ok: false as const, error: "This call is no longer booked." };
  if (!opts.skipSlotCheck) { const f = await recheck(b.call_type, startMs, Date.parse(b.start_at)); if (f) return f; }
  const { rules } = await loadSettings();
  const r = await rpcMove(b.id, startMs, startMs + CALL_TYPES[b.call_type].minutes * MIN, rules.bufferMinutes);
  if (!r.ok) return r.taken ? { ok: false as const, error: "That time's just gone.", taken: true } : { ok: false as const, error: r.error };
  try {
    if (r.booking.google_event_id) await updateEvent(r.booking.google_event_id, r.booking);
    else await syncCreate(r.booking);
  } catch (e) { await setGoogle(r.booking.id, { google_sync_error: `update: ${e instanceof Error ? e.message : String(e)}` }); }
  await alertOwner("moved", r.booking);
  return { ok: true as const, booking: r.booking };
}

export async function cancel(b: BookingRow, reason: string | null): Promise<{ ok: true } | Fail> {
  if (b.status !== "booked") return { ok: false as const, error: "This call is no longer booked." };
  const { data, error } = await getSupabaseAdmin().from("crm_bookings")
    .update({ status: "cancelled", cancel_reason: reason }).eq("id", b.id).eq("status", "booked").select("*").maybeSingle();
  if (error || !data) return { ok: false as const, error: error?.message ?? "Already changed." };
  if (b.google_event_id) {
    try { await deleteEvent(b.google_event_id); await setGoogle(b.id, { google_sync_error: null }); }
    catch (e) { await setGoogle(b.id, { google_sync_error: `delete: ${e instanceof Error ? e.message : String(e)}` }); }
  }
  await alertOwner("cancelled", data as BookingRow);
  return { ok: true as const };
}
