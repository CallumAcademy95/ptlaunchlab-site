import "server-only";
import { CALL_TYPES, type CallType } from "./callTypes";
import { computeSlots, isSlotFree } from "./slots";
import { newManageToken } from "./tokens";
import type { BookingInput } from "./validate";
import { loadSettings, loadBooked, rpcBook, rpcMove, setGoogle, markGoogleHealth, findRecentDuplicate, type BookingRow } from "./data";
import { getBusy, createEvent, updateEvent, deleteEvent } from "./google";
import { alertOwner } from "./alerts";
import { createBusyCache, createHealthGate } from "./busyCache";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";

const MIN = 60_000;
const GENERIC = "Something went wrong. Please try again.";
/** One failure shape for book/move/cancel, so callers can read any field after `!r.ok`. */
export type Fail = { ok: false; error: string; taken?: boolean; nearest?: number[]; existing?: BookingRow };

/** Strip the manage-token columns (DB rows from select("*") carry them) before a row leaves this module. */
function publicRow(b: BookingRow): BookingRow {
  const { manage_token_hash: _h, manage_token_plain: _p, ...rest } = b as BookingRow & { manage_token_hash?: unknown; manage_token_plain?: unknown };
  void _h; void _p;
  return rest as BookingRow;
}

function unexpected(where: string, e: unknown): Fail {
  console.error(`[booking] ${where} failed`, e);
  return { ok: false, error: GENERIC };
}

// Page loads share a 60s free/busy cache and only touch the health row on a
// change or once a minute (per instance). recheck() below always asks Google fresh.
const busyCache = createBusyCache(60_000);
const healthGate = createHealthGate(60_000);

/** Free starts for a call type. Never offers times it could not check against Google. */
export async function freeSlots(callType: CallType, nowMs: number) {
  try {
    const { rules, typesEnabled } = await loadSettings();
    if (!typesEnabled[callType]) return { ok: false as const, reason: "disabled" as const };
    const to = nowMs + (rules.horizonDays + 1) * 24 * 60 * MIN;
    let busy;
    try {
      const r = await busyCache.get(nowMs, to, nowMs, getBusy);
      busy = r.busy;
      if (r.fresh && healthGate.shouldWrite(true, nowMs)) {
        await markGoogleHealth(true).catch((e) => console.error("[booking] markGoogleHealth failed", e));
      }
    } catch (e) {
      if (healthGate.shouldWrite(false, nowMs)) {
        await markGoogleHealth(false, e instanceof Error ? e.message : String(e)).catch(() => {});
      }
      return { ok: false as const, reason: "calendar_unavailable" as const };
    }
    const booked = await loadBooked(nowMs, to);
    return { ok: true as const, slots: computeSlots(rules, busy, booked, nowMs, CALL_TYPES[callType].minutes) };
  } catch (e) {
    console.error("[booking] freeSlots failed", e);
    return { ok: false as const, reason: "calendar_unavailable" as const };
  }
}

/** `exclude` is the call's own current slot on a move: it is not a clash with itself. */
async function recheck(callType: CallType, startMs: number, exclude?: { start: number; end: number }): Promise<Fail | null> {
  const now = Date.now();
  const { rules } = await loadSettings();
  const minutes = CALL_TYPES[callType].minutes;
  const to = now + (rules.horizonDays + 1) * 24 * 60 * MIN;
  let busy;
  try { busy = await getBusy(now, to); }
  catch { return { ok: false, error: "We can't check the diary right now. Please try again in a minute." }; }
  let booked = await loadBooked(now, to);
  if (exclude) {
    // Google still reports the call's own event as busy; it was created with exactly these times.
    busy = busy.filter((i) => !(i.start === exclude.start && i.end === exclude.end));
    booked = booked.filter((b) => b.start !== exclude.start);
  }
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
  try {
    const dup = await findRecentDuplicate(input.email, input.startMs);
    if (dup) return { ok: false, error: "already_booked", existing: publicRow(dup) };
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
    return { ok: true as const, booking: publicRow(r.booking), manageToken: token };
  } catch (e) { return unexpected("book", e); }
}

export async function move(b: BookingRow, startMs: number, opts: { skipSlotCheck?: boolean } = {}): Promise<{ ok: true; booking: BookingRow } | Fail> {
  if (b.status !== "booked") return { ok: false as const, error: "This call is no longer booked." };
  try {
    if (!opts.skipSlotCheck) {
      const f = await recheck(b.call_type, startMs, { start: Date.parse(b.start_at), end: Date.parse(b.end_at) });
      if (f) return f;
    }
    const { rules } = await loadSettings();
    const r = await rpcMove(b.id, startMs, startMs + CALL_TYPES[b.call_type].minutes * MIN, rules.bufferMinutes);
    if (!r.ok) return r.taken ? { ok: false as const, error: "That time's just gone.", taken: true } : { ok: false as const, error: r.error };
    try {
      if (r.booking.google_event_id) await updateEvent(r.booking.google_event_id, r.booking);
      else await syncCreate(r.booking);
    } catch (e) { await setGoogle(r.booking.id, { google_sync_error: `update: ${e instanceof Error ? e.message : String(e)}` }); }
    await alertOwner("moved", r.booking);
    return { ok: true as const, booking: publicRow(r.booking) };
  } catch (e) { return unexpected("move", e); }
}

export async function cancel(b: BookingRow, reason: string | null): Promise<{ ok: true } | Fail> {
  if (b.status !== "booked") return { ok: false as const, error: "This call is no longer booked." };
  try {
    const { data, error } = await getSupabaseAdmin().from("crm_bookings")
      .update({ status: "cancelled", cancel_reason: reason }).eq("id", b.id).eq("status", "booked").select("*").maybeSingle();
    if (error) return unexpected("cancel update", error.message);
    if (!data) return { ok: false as const, error: "Already changed." };
    const row = data as BookingRow;
    if (row.google_event_id) {
      try { await deleteEvent(row.google_event_id); await setGoogle(row.id, { google_event_id: null, google_sync_error: null }); }
      catch (e) { await setGoogle(row.id, { google_sync_error: `delete: ${e instanceof Error ? e.message : String(e)}` }); }
    }
    await alertOwner("cancelled", row);
    return { ok: true as const };
  } catch (e) { return unexpected("cancel", e); }
}
