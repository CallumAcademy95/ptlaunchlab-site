// The PA diary's rules, pure: no Google, no DB, no @/ imports, so node --test
// can load it. app/api/admin/diary/route.ts supplies real deps
// (app/lib/diary/diary-google.ts). Spec:
// C:\Users\User\docs\superpowers\specs\2026-11-15-pa-weekly-diary-design.md
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const DIARY_TAG = "ptllDiary";
export type DiaryKind = "block" | "task" | "fixed";
export type DiaryEventInput = { summary: string; start: string; end: string; kind: DiaryKind; description?: string };
export type DiaryEventBody = {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  transparency: "transparent" | "opaque";
  extendedProperties: { private: Record<string, string> };
};
export type GEvent = {
  id?: string | null;
  summary?: string | null;
  start?: { dateTime?: string | null } | null;
  end?: { dateTime?: string | null } | null;
  extendedProperties?: { private?: Record<string, string> | null } | null;
};
export interface DiaryDeps {
  busy(fromIso: string, toIso: string): Promise<{ start: string; end: string }[]>;
  /** Events carrying ptllDiary=1 (and ptllWeek=week if given), in the range if given. */
  listTagged(fromIso: string | null, toIso: string | null, week?: string): Promise<GEvent[]>;
  /** null when the event does not exist. */
  get(id: string): Promise<GEvent | null>;
  insert(body: DiaryEventBody): Promise<string>;
  patch(id: string, body: Partial<DiaryEventBody>): Promise<void>;
  remove(id: string): Promise<void>;
  push(title: string, body?: string): Promise<{ sent: number; error?: string }>;
}
export type DiaryResponse = { status: number; body: Record<string, unknown> };

const TZ = "Europe/London";
const HOUR = 3_600_000, DAY = 24 * HOUR;

export function checkDiaryAuth(header: string | null, secret: string | undefined): "ok" | "unauthorised" | "unconfigured" {
  const s = secret?.trim();
  if (!s || s.length < 32) return "unconfigured";
  const m = /^Bearer (.+)$/.exec(header ?? "");
  if (!m) return "unauthorised";
  const a = createHash("sha256").update(m[1]).digest();
  const b = createHash("sha256").update(s).digest();
  return timingSafeEqual(a, b) ? "ok" : "unauthorised";
}

/** ISO 8601 week of the UTC date, e.g. "2026-W47". */
export function isoWeek(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(t.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((t.getTime() - yearStart) / DAY + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function diaryEventBody(i: DiaryEventInput): DiaryEventBody {
  return {
    summary: i.summary,
    ...(i.description ? { description: i.description } : {}),
    start: { dateTime: i.start, timeZone: TZ },
    end: { dateTime: i.end, timeZone: TZ },
    transparency: i.kind === "fixed" ? "opaque" : "transparent",
    extendedProperties: { private: { [DIARY_TAG]: "1", ptllKind: i.kind, ptllWeek: isoWeek(new Date(i.start)) } },
  };
}

export function isDiaryEvent(e: GEvent | null | undefined): boolean {
  return e?.extendedProperties?.private?.[DIARY_TAG] === "1";
}

const iso = z.string().refine((s) => /(Z|[+-]\d\d:\d\d)$/i.test(s) && !Number.isNaN(Date.parse(s)), "must be an ISO date-time with a Z or ±hh:mm offset");
const id = z.string().min(1).max(1024);
const Req = z.discriminatedUnion("action", [
  z.object({ action: z.literal("busy"), from: iso, to: iso }),
  z.object({ action: z.literal("list"), from: iso, to: iso }),
  z.object({ action: z.literal("create"), summary: z.string().trim().min(1).max(200), start: iso, end: iso, kind: z.enum(["block", "task", "fixed"]), description: z.string().max(2000).optional() }),
  z.object({ action: z.literal("move"), id, start: iso, end: iso }),
  z.object({ action: z.literal("delete"), id }),
  z.object({ action: z.literal("delete-week"), week: z.string().regex(/^\d{4}-W\d{2}$/) }),
  z.object({ action: z.literal("notify"), title: z.string().trim().min(1).max(80), body: z.string().max(300).optional() }),
]);

const ok = (body: Record<string, unknown>): DiaryResponse => ({ status: 200, body: { ok: true, ...body } });
const fail = (status: number, error: string): DiaryResponse => ({ status, body: { ok: false, error } });
function rangeError(from: string, to: string, max: number): string | null {
  const span = Date.parse(to) - Date.parse(from);
  if (span <= 0) return "end must be after start";
  if (span > max) return `range longer than ${max / HOUR}h`;
  return null;
}
const summarise = (e: GEvent) => ({
  id: e.id, summary: e.summary, start: e.start?.dateTime, end: e.end?.dateTime,
  kind: e.extendedProperties?.private?.ptllKind, week: e.extendedProperties?.private?.ptllWeek,
});

/** Load an event and confirm the diary owns it; returns a response to send if not. */
async function owned(deps: DiaryDeps, eventId: string): Promise<GEvent | DiaryResponse> {
  const ev = await deps.get(eventId);
  if (!ev) return fail(404, "No such event.");
  if (!isDiaryEvent(ev)) return fail(403, "Not a diary event; refusing to touch it.");
  return ev;
}
const isResponse = (x: GEvent | DiaryResponse): x is DiaryResponse => "status" in x && "body" in x;

export async function handleDiary(raw: unknown, deps: DiaryDeps): Promise<DiaryResponse> {
  const parsed = Req.safeParse(raw);
  if (!parsed.success) return fail(400, parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; "));
  const r = parsed.data;
  try {
    switch (r.action) {
      case "busy": {
        const e = rangeError(r.from, r.to, 31 * DAY); if (e) return fail(400, e);
        return ok({ busy: await deps.busy(r.from, r.to) });
      }
      case "list": {
        const e = rangeError(r.from, r.to, 31 * DAY); if (e) return fail(400, e);
        return ok({ events: (await deps.listTagged(r.from, r.to)).filter(isDiaryEvent).map(summarise) });
      }
      case "create": {
        const e = rangeError(r.start, r.end, DAY); if (e) return fail(400, e);
        const newId = await deps.insert(diaryEventBody(r));
        if (!newId) return fail(502, "Google returned no event id.");
        return ok({ id: newId });
      }
      case "move": {
        const e = rangeError(r.start, r.end, DAY); if (e) return fail(400, e);
        const ev = await owned(deps, r.id); if (isResponse(ev)) return ev;
        await deps.patch(r.id, {
          start: { dateTime: r.start, timeZone: TZ },
          end: { dateTime: r.end, timeZone: TZ },
          extendedProperties: { private: { ...(ev.extendedProperties?.private ?? {}), ptllWeek: isoWeek(new Date(r.start)) } },
        });
        return ok({ id: r.id });
      }
      case "delete": {
        const ev = await owned(deps, r.id); if (isResponse(ev)) return ev;
        await deps.remove(r.id);
        return ok({ deleted: [r.id] });
      }
      case "delete-week": {
        const evs = (await deps.listTagged(null, null, r.week))
          .filter((e) => isDiaryEvent(e) && e.extendedProperties?.private?.ptllWeek === r.week && e.id);
        const deleted: string[] = [];
        for (const e of evs) { await deps.remove(e.id!); deleted.push(e.id!); }
        return ok({ deleted });
      }
      case "notify": {
        const res = await deps.push(r.title, r.body);
        if (res.error) return fail(502, res.error);
        if (res.sent === 0) return fail(502, "No phone received the push (no devices subscribed or all failed).");
        return ok({ sent: res.sent });
      }
    }
  } catch (err) {
    return fail(502, err instanceof Error ? err.message : String(err));
  }
}
