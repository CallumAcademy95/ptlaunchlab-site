// Env vars needed: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN,
// GOOGLE_CALENDAR_ID (defaults to "primary"). Booking links also need BOOKING_LINK_SECRET (see tokens.ts).
import "server-only";
import { google } from "googleapis";
import type { Interval } from "./slots";
import type { BookingRow } from "./data";
import { CALL_TYPES } from "./callTypes";

// Callum's info@ Google Calendar. Read free/busy only (never event contents);
// write one event per booking with no attendees (no Google invite to the lead).
const CAL = () => process.env.GOOGLE_CALENDAR_ID || "primary";

function cal() {
  const id = process.env.GOOGLE_CLIENT_ID, secret = process.env.GOOGLE_CLIENT_SECRET, refresh = process.env.GOOGLE_REFRESH_TOKEN;
  if (!id || !secret || !refresh) throw new Error("Google Calendar is not connected (GOOGLE_* env missing).");
  const auth = new google.auth.OAuth2(id, secret);
  auth.setCredentials({ refresh_token: refresh });
  return google.calendar({ version: "v3", auth });
}

export async function getBusy(fromMs: number, toMs: number): Promise<Interval[]> {
  const res = await cal().freebusy.query({
    requestBody: { timeMin: new Date(fromMs).toISOString(), timeMax: new Date(toMs).toISOString(), timeZone: "Europe/London", items: [{ id: CAL() }] },
  });
  const c = res.data.calendars?.[CAL()];
  if (!c || (c.errors && c.errors.length)) throw new Error(`free/busy error: ${JSON.stringify(c?.errors ?? "no calendar")}`);
  return (c.busy ?? []).map((b) => ({ start: Date.parse(b.start!), end: Date.parse(b.end!) }));
}

function eventBody(b: BookingRow) {
  const t = CALL_TYPES[b.call_type];
  const answers = t.questions.map((q) => {
    const v = b.answers?.[q.key];
    return `${q.label}\n${Array.isArray(v) ? v.join(", ") : v || "-"}`;
  }).join("\n\n");
  return {
    summary: `PTLL call: ${b.name} (${t.title})${b.is_test ? " [TEST]" : ""}`,
    description: `Ring: ${b.phone}\nEmail: ${b.email}\n\n${answers}\n\nCRM: https://ptlaunchlab.co.uk/admin/crm/calls`,
    start: { dateTime: b.start_at, timeZone: "Europe/London" },
    end: { dateTime: b.end_at, timeZone: "Europe/London" },
  };
}

export async function createEvent(b: BookingRow): Promise<string> {
  const res = await cal().events.insert({ calendarId: CAL(), requestBody: eventBody(b) });
  if (!res.data.id) throw new Error("Google returned no event id");
  return res.data.id;
}

export async function updateEvent(eventId: string, b: BookingRow): Promise<void> {
  await cal().events.patch({ calendarId: CAL(), eventId, requestBody: eventBody(b) });
}

export async function deleteEvent(eventId: string): Promise<void> {
  try {
    await cal().events.delete({ calendarId: CAL(), eventId });
  } catch (e) {
    const code = (e as { code?: number }).code;
    if (code === 404 || code === 410) return; // already gone
    throw e;
  }
}
