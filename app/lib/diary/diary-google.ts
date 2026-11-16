// Real deps for the PA diary: Google Calendar (the CRM's token) + owner push.
// All rules live in diary-core.ts; this file only talks to services.
import "server-only";
import { calendarClient, calendarId, getBusy } from "../booking/google";
import { withTimeout } from "../booking/busyCache";
import { getSupabaseAdmin } from "../supabase-admin";
import { sendOwnerPush } from "../owner-push";
import { DIARY_TAG, type DiaryDeps, type GEvent } from "./diary-core";

const TIMEOUT_MS = 8_000;
const lim = <T>(p: Promise<T>, what: string) => withTimeout(p, TIMEOUT_MS, `Google ${what}`);
const gone = (e: unknown) => { const c = (e as { code?: number }).code; return c === 404 || c === 410; };

/** One Google client per request, built on first use (so a missing GOOGLE_* env surfaces inside handleDiary's try as a JSON 502). */
export function createGoogleDiaryDeps(): DiaryDeps {
  let client: ReturnType<typeof calendarClient> | null = null;
  const cal = () => (client ??= calendarClient());
  return {
    async busy(from, to) {
      return (await getBusy(Date.parse(from), Date.parse(to)))
        .map((b) => ({ start: new Date(b.start).toISOString(), end: new Date(b.end).toISOString() }));
    },
    async listTagged(from, to, week) {
      const props = [`${DIARY_TAG}=1`, ...(week ? [`ptllWeek=${week}`] : [])];
      const out: GEvent[] = [];
      let pageToken: string | undefined;
      do {
        const res = await lim(cal().events.list({
          calendarId: calendarId(), privateExtendedProperty: props, singleEvents: true, maxResults: 250, pageToken,
          ...(from ? { timeMin: from } : {}), ...(to ? { timeMax: to } : {}),
        }), "event list");
        out.push(...((res.data.items ?? []) as GEvent[]));
        pageToken = res.data.nextPageToken ?? undefined;
      } while (pageToken);
      return out;
    },
    async get(id) {
      try {
        const res = await lim(cal().events.get({ calendarId: calendarId(), eventId: id }), "event get");
        if (res.data.status === "cancelled") return null;
        return res.data as GEvent;
      } catch (e) { if (gone(e)) return null; throw e; }
    },
    async insert(body) {
      const res = await lim(cal().events.insert({ calendarId: calendarId(), requestBody: body }), "event insert");
      if (!res.data.id) throw new Error("Google returned no event id");
      return res.data.id;
    },
    async patch(id, body) {
      await lim(cal().events.patch({ calendarId: calendarId(), eventId: id, requestBody: body }), "event patch");
    },
    async remove(id) {
      try { await lim(cal().events.delete({ calendarId: calendarId(), eventId: id }), "event delete"); }
      catch (e) { if (!gone(e)) throw e; }
    },
    async push(title, body) {
      const r = await sendOwnerPush(getSupabaseAdmin(), { title, body, url: "/admin/crm", tag: "pa-brief" });
      return { sent: r.sent, error: r.error };
    },
  };
}
