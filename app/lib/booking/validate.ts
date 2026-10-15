// Validation for the public booking POST and Callum's availability settings. Pure.
import { CALL_TYPES, type CallType } from "./callTypes.ts";
import type { Rules, Block } from "./slots.ts";

export interface BookingInput {
  callType: CallType;
  startMs: number;
  name: string;
  email: string;
  phone: string;
  answers: Record<string, string | string[]>;
  t: string | null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const fail = (error: string) => ({ ok: false as const, error });

export function normaliseUkPhone(s: string): string | null {
  const d = String(s ?? "").replace(/[^\d]/g, "");
  if (/^07\d{9}$/.test(d)) return `+44${d.slice(1)}`;
  if (/^447\d{9}$/.test(d)) return `+${d}`;
  if (/^\d{10,15}$/.test(d) && String(s).trim().startsWith("+")) return `+${d}`;
  return null;
}

export function validateBookingInput(raw: unknown): { ok: true; value: BookingInput } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return fail("Missing details.");
  const r = raw as Record<string, unknown>;
  const callType = r.type === "consultation" || r.type === "gym_partner" ? r.type : null;
  if (!callType) return fail("Unknown call type.");
  const startMs = typeof r.startIso === "string" ? Date.parse(r.startIso) : NaN;
  if (!Number.isFinite(startMs) || startMs % (30 * 60_000) !== 0) return fail("Pick a time from the list.");
  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (name.length < 2 || name.length > 120) return fail("Please enter your name.");
  const email = typeof r.email === "string" ? r.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email) || email.length > 200) return fail("Please enter a valid email address.");
  const phone = normaliseUkPhone(typeof r.phone === "string" ? r.phone : "");
  if (!phone) return fail("Please enter a mobile number we can ring.");
  const given = (r.answers && typeof r.answers === "object" ? r.answers : {}) as Record<string, unknown>;
  const answers: Record<string, string | string[]> = {};
  for (const q of CALL_TYPES[callType].questions) {
    const v = given[q.key];
    if (q.kind === "multi") {
      const arr = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
      if (arr.some((x) => !q.choices?.includes(x))) return fail(`Please choose from the list for "${q.label}".`);
      if (q.required && arr.length === 0) return fail(`Please answer "${q.label}".`);
      answers[q.key] = arr;
    } else {
      const s = typeof v === "string" ? v.trim() : "";
      if (q.required && !s) return fail(`Please answer "${q.label}".`);
      if (s.length > 2000) return fail("That answer is too long.");
      answers[q.key] = s;
    }
  }
  const t = typeof r.t === "string" && r.t.length > 0 && r.t.length < 600 ? r.t : null;
  return { ok: true, value: { callType, startMs, name, email, phone, answers, t } };
}

const DEFAULTS: Rules = { weeklyHours: {}, daysOff: [], minNoticeMinutes: 240, horizonDays: 14, bufferMinutes: 15, maxPerDay: null };

export function validateRules(raw: unknown): { ok: true; value: Rules } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return fail("Missing settings.");
  const r = raw as Record<string, unknown>;
  const wh = (r.weeklyHours && typeof r.weeklyHours === "object" ? r.weeklyHours : {}) as Record<string, unknown>;
  const weeklyHours: Record<string, Block[]> = {};
  for (const [k, v] of Object.entries(wh)) {
    if (!/^[0-6]$/.test(k)) return fail("Unknown weekday.");
    if (!Array.isArray(v)) return fail("Hours must be a list.");
    const blocks: Block[] = [];
    for (const b of v) {
      const s = (b as Block)?.start, e = (b as Block)?.end;
      if (!HHMM.test(s ?? "") || !HHMM.test(e ?? "")) return fail("Times must look like 09:30.");
      if (s >= e) return fail("Each block must start before it ends (no crossing midnight).");
      blocks.push({ start: s, end: e });
    }
    weeklyHours[k] = blocks.sort((a, b) => a.start.localeCompare(b.start));
  }
  const daysOffRaw = Array.isArray(r.daysOff) ? r.daysOff : [];
  const daysOff: Rules["daysOff"] = [];
  for (const d of daysOffRaw) {
    const from = (d as { from?: string })?.from ?? "", to = (d as { to?: string })?.to ?? "";
    if (!DATE.test(from) || !DATE.test(to) || from > to) return fail("Days off must be valid date ranges.");
    daysOff.push({ from, to });
  }
  const int = (v: unknown, lo: number, hi: number) => (Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi ? (v as number) : null);
  const minNoticeMinutes = int(r.minNoticeMinutes, 0, 10080);
  const horizonDays = int(r.horizonDays, 1, 60);
  const bufferMinutes = int(r.bufferMinutes, 0, 120);
  if (minNoticeMinutes == null || horizonDays == null || bufferMinutes == null) return fail("Notice, horizon or gap is out of range.");
  const maxPerDay = r.maxPerDay == null ? null : int(r.maxPerDay, 1, 50);
  if (r.maxPerDay != null && maxPerDay == null) return fail("Max calls per day must be 1-50 or empty.");
  return { ok: true, value: { weeklyHours, daysOff, minNoticeMinutes, horizonDays, bufferMinutes, maxPerDay } };
}

export function rulesFromRow(row: Record<string, unknown> | null): Rules {
  if (!row) return { ...DEFAULTS };
  const v = validateRules({
    weeklyHours: row.weekly_hours, daysOff: row.days_off, minNoticeMinutes: row.min_notice_minutes,
    horizonDays: row.horizon_days, bufferMinutes: row.buffer_minutes, maxPerDay: row.max_per_day,
  });
  return v.ok ? v.value : { ...DEFAULTS };
}
