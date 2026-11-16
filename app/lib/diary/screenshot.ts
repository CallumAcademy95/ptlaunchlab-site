// Screenshot → validated fields. Pure. The model's output is untrusted input.
import { z } from "zod";
import { AREAS, CATEGORIES, isRealDate } from "./types.ts";

export const EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["type", "title", "date", "start", "end", "estimate_min", "deadline", "area", "category", "questions"],
  properties: {
    type: { type: "string", enum: ["fixed", "task", "info"] },
    title: { type: "string" },
    date: { type: ["string", "null"], description: "YYYY-MM-DD" },
    start: { type: ["string", "null"], description: "HH:MM 24h, Europe/London" },
    end: { type: ["string", "null"], description: "HH:MM 24h" },
    estimate_min: { type: ["integer", "null"] },
    deadline: { type: ["string", "null"], description: "YYYY-MM-DD" },
    area: { anyOf: [{ type: "string", enum: [...AREAS] }, { type: "null" }] },
    category: { anyOf: [{ type: "string", enum: [...CATEGORIES] }, { type: "null" }] },
    questions: { type: "array", items: { type: "string" } },
  },
} as const;

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const Raw = z.object({
  type: z.enum(["fixed", "task", "info"]),
  title: z.string().min(1).max(300),
  date: date.nullable(), start: hhmm.nullable(), end: hhmm.nullable(),
  estimate_min: z.number().int().min(5).max(600).nullable(),
  deadline: date.nullable(),
  area: z.enum(AREAS as [string, ...string[]]).nullable(),
  category: z.enum(CATEGORIES as [string, ...string[]]).nullable(),
  questions: z.array(z.string().max(200)).max(5),
});
export type Extraction = z.infer<typeof Raw>;

export function privacyTitle(raw: string, kind: "fixed" | "task" | "info"): string {
  const words = raw
    .replace(/^\[Personal\]\s*/i, "")
    .replace(/\S+@\S+/g, " ").replace(/@\w+/g, " ")
    .replace(/\+?\(?\d[\d\s().-]{4,}\d\)?/g, " ").replace(/\d{3,}/g, " ")
    .split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).slice(0, 6);
  const t = words.join(" ").trim() || "Untitled";
  return kind === "fixed" ? `[Personal] ${t}` : t;
}

export function parseExtraction(text: string | undefined): { ok: true; value: Extraction } | { ok: false; error: string } {
  if (!text) return { ok: false, error: "Couldn't read that screenshot — type it instead." };
  let json: unknown;
  try { json = JSON.parse(text); } catch { return { ok: false, error: "Couldn't read that screenshot — type it instead." }; }
  const p = Raw.safeParse(json);
  if (!p.success) return { ok: false, error: "Couldn't read that screenshot — type it instead." };
  const v = { ...p.data, title: privacyTitle(p.data.title, p.data.type), questions: [...p.data.questions] };
  const ask = (q: string) => { if (!v.questions.includes(q)) v.questions.push(q); };
  // Round-trip: "2026-02-31" matches the regex but is not a real day.
  if (v.date && !isRealDate(v.date)) v.date = null;
  if (v.deadline && !isRealDate(v.deadline)) v.deadline = null;
  if (v.type === "fixed") {
    if (!v.date) ask("What date is it?");
    if (!v.start) ask("What time does it start?");
    if (!v.end) ask("What time does it finish?");
  } else if (v.type === "task") {
    if (!v.estimate_min) ask("How long will it take?");
    if (!v.deadline) ask("When is it due?");
  }
  return { ok: true, value: v };
}
