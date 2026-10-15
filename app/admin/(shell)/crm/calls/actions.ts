"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { ADMIN_AUTH_COOKIE, verifyAuthCookieValue } from "@/app/lib/admin-auth";
import { book, move, cancel, freeSlots } from "@/app/lib/booking/service";
import { validateRules, validateBookingInput, markRefusal } from "@/app/lib/booking/validate";
import { slotLabel } from "@/app/lib/booking/london";
import type { BookingRow } from "@/app/lib/booking/data";
import type { CallType } from "@/app/lib/booking/callTypes";

type R = { ok: true } | { ok: false; error: string };
const DENIED: R = { ok: false, error: "Not signed in. Sign in at /admin/login." };
async function isAdmin() {
  const jar = await cookies();
  return verifyAuthCookieValue(jar.get(ADMIN_AUTH_COOKIE)?.value).catch(() => false);
}
const isUuid = (s: unknown): s is string => typeof s === "string" && /^[0-9a-f-]{36}$/i.test(s);
// Explicit columns: never read the manage-token columns in the admin UI.
const COLS =
  "id, call_type, start_at, end_at, status, name, email, phone, answers, consultation_id, source, is_test, google_event_id, google_sync_error, notes, cancel_reason, created_at, confirm_sent_at, reminder_day_sent_at, reminder_hour_sent_at, send_failures, last_send_error";
async function row(id: string): Promise<BookingRow | null> {
  const { data } = await getSupabaseAdmin().from("crm_bookings").select(COLS).eq("id", id).maybeSingle();
  return (data ?? null) as unknown as BookingRow | null;
}
const done = () => { revalidatePath("/admin/crm/calls"); revalidatePath("/admin/crm"); };

export async function markCall(id: unknown, status: unknown, notes?: unknown): Promise<R> {
  if (!(await isAdmin())) return DENIED;
  if (!isUuid(id) || (status !== "done" && status !== "no_show")) return { ok: false, error: "Bad request." };
  const b = await row(id); if (!b) return { ok: false, error: "Call not found." };
  const refusal = markRefusal(b.start_at, Date.now());
  if (refusal) return { ok: false, error: refusal };
  // Only overwrite notes when some were given; a no-show keeps what is there.
  const patch: Record<string, unknown> = { status };
  if (typeof notes === "string") patch.notes = notes.slice(0, 4000);
  const { error } = await getSupabaseAdmin().from("crm_bookings")
    .update(patch).eq("id", id).eq("status", "booked").lte("start_at", new Date().toISOString());
  if (error) return { ok: false, error: error.message };
  done(); return { ok: true };
}

export async function cancelCall(id: unknown, reason?: unknown): Promise<R> {
  if (!(await isAdmin())) return DENIED;
  if (!isUuid(id)) return { ok: false, error: "Bad request." };
  const b = await row(id); if (!b) return { ok: false, error: "Call not found." };
  const r = await cancel(b, typeof reason === "string" && reason.trim() ? reason.trim().slice(0, 500) : "Cancelled by Callum");
  done(); return r.ok ? { ok: true } : r;
}

export async function moveCall(id: unknown, startIso: unknown): Promise<R> {
  if (!(await isAdmin())) return DENIED;
  if (!isUuid(id) || typeof startIso !== "string") return { ok: false, error: "Bad request." };
  const b = await row(id); if (!b) return { ok: false, error: "Call not found." };
  const r = await move(b, Date.parse(startIso));
  done(); return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function bookForSomeone(input: unknown): Promise<R> {
  if (!(await isAdmin())) return DENIED;
  const v = validateBookingInput(input);
  if (!v.ok) return v;
  const cid = (input as { consultationId?: unknown })?.consultationId;
  const r = await book(v.value, { source: "manual", consultationId: isUuid(cid) ? cid : null });
  done(); return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function saveSettings(raw: unknown): Promise<R> {
  if (!(await isAdmin())) return DENIED;
  const v = validateRules(raw);
  if (!v.ok) return v;
  const te = (raw as { typesEnabled?: Record<string, unknown> })?.typesEnabled ?? {};
  const { error } = await getSupabaseAdmin().from("crm_booking_settings").update({
    weekly_hours: v.value.weeklyHours, days_off: v.value.daysOff, min_notice_minutes: v.value.minNoticeMinutes,
    horizon_days: v.value.horizonDays, buffer_minutes: v.value.bufferMinutes, max_per_day: v.value.maxPerDay,
    types_enabled: { consultation: te.consultation !== false, gym_partner: te.gym_partner !== false },
    updated_at: new Date().toISOString(),
  }).eq("id", 1);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/crm/calls"); return { ok: true };
}

export async function adminSlots(type: unknown): Promise<{ ok: true; slots: { iso: string; label: string }[] } | { ok: false; error: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Not signed in." };
  if (type !== "consultation" && type !== "gym_partner") return { ok: false, error: "Bad type." };
  const r = await freeSlots(type as CallType, Date.now());
  return r.ok ? { ok: true, slots: r.slots.map((ms) => ({ iso: new Date(ms).toISOString(), label: slotLabel(ms) })) } : { ok: false, error: r.reason };
}
