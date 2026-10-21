// app/lib/plannerNextStep.ts
// The step after the Career Planner plan: two commitment questions (Prime/Strong)
// and a choice of book / WhatsApp / start. Pure and client-safe: no node:crypto,
// no "@/" imports, so node --test and the browser can both load it.
// Spec: docs/superpowers/specs/2026-10-21-career-planner-next-step-design.md
import { QUESTIONS, type Band, type Blocker, type Why } from "./careerPlannerV2.ts";

export const PRICE_FIT_VALUES = ["yes", "plan", "no"] as const;
export const NEXT_STEP_VALUES = ["book", "whatsapp", "start"] as const;
export type PriceFit = (typeof PRICE_FIT_VALUES)[number];
export type NextStepChoice = (typeof NEXT_STEP_VALUES)[number];

export type NextStepBody = {
  token: string;
  priceFit?: PriceFit;
  startMonth?: string;
  nextStep?: NextStepChoice;
  booked?: true;
  eventId?: string;
};

export function showCommitmentCard(band: Band): boolean {
  return band === "prime" || band === "strong";
}

function londonYearMonth(now: Date): { y: number; m: number } {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "numeric" }).formatToParts(now);
  return { y: Number(parts.find((p) => p.type === "year")!.value), m: Number(parts.find((p) => p.type === "month")!.value) };
}

/** The current London month and the next two, as YYYY-MM with a month-name label. */
export function startMonthOptions(now: Date): { value: string; label: string }[] {
  const { y, m } = londonYearMonth(now);
  return [0, 1, 2].map((i) => {
    const d = new Date(Date.UTC(y, m - 1 + i, 1));
    return {
      value: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-GB", { month: "long", timeZone: "UTC" }),
    };
  });
}

/** Accepts today's options, or the options from 2 days ago (a page left open over a month end). */
export function isValidStartMonth(v: unknown, now: Date): v is string {
  if (v === "not_sure") return true;
  if (typeof v !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(v)) return false;
  const earlier = new Date(now.getTime() - 2 * 864e5);
  return [...startMonthOptions(now), ...startMonthOptions(earlier)].some((o) => o.value === v);
}

// First person, because the lead sends this message (BLOCKER_PHRASE in
// careerPlannerV2 is written to the lead, so it says "you'd").
const WA_BLOCKER: Record<Exclude<Blocker, "other">, string> = {
  cost: "the cost",
  time: "finding the time",
  confidence: "whether I'd be good enough",
  clients: "finding clients once I'm qualified",
  where_to_start: "knowing where to start",
};

export function whatsappMessage(p: { startMonthLabel?: string | null; blocker?: Blocker | null }): string {
  const parts = ["Hi, I've just done my PT career plan."];
  if (p.startMonthLabel) parts.push(`I'm aiming to start in ${p.startMonthLabel}.`);
  if (p.blocker && p.blocker !== "other") parts.push(`My main worry is ${WA_BLOCKER[p.blocker]}.`);
  parts.push("Can we talk it through?");
  return parts.join(" ");
}

export function whatsappHref(base: string, message: string): string {
  return `${base}?text=${encodeURIComponent(message)}`;
}

/** Prefill for BookingFlow's consultation questions ("why" and "source" are both required). */
export function bookingPrefill(p: { name: string; email: string; phone: string; why?: Why | null; blocker?: Blocker | null }) {
  const whyLabel = p.why ? (QUESTIONS.why.options as readonly (readonly [string, string])[]).find(([v]) => v === p.why)?.[1] ?? "" : "";
  const worry = p.blocker && p.blocker !== "other" ? ` Biggest worry: ${WA_BLOCKER[p.blocker]}.` : "";
  const why = whyLabel ? `${whyLabel}.${worry}` : worry.trim();
  return { name: p.name, email: p.email, phone: p.phone, answers: { why, source: "Career Planner" } };
}

export function validateNextStepBody(raw: unknown, now: Date): { ok: true; value: NextStepBody } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "bad body" };
  const r = raw as Record<string, unknown>;
  if (typeof r.token !== "string" || !r.token || r.token.length > 500) return { ok: false, error: "token required" };
  const value: NextStepBody = { token: r.token };
  if (r.priceFit !== undefined) {
    if (!(PRICE_FIT_VALUES as readonly unknown[]).includes(r.priceFit)) return { ok: false, error: "bad priceFit" };
    value.priceFit = r.priceFit as PriceFit;
  }
  if (r.startMonth !== undefined) {
    if (!isValidStartMonth(r.startMonth, now)) return { ok: false, error: "bad startMonth" };
    value.startMonth = r.startMonth;
  }
  if (r.nextStep !== undefined) {
    if (!(NEXT_STEP_VALUES as readonly unknown[]).includes(r.nextStep)) return { ok: false, error: "bad nextStep" };
    value.nextStep = r.nextStep as NextStepChoice;
  }
  if (r.booked !== undefined) {
    if (r.booked !== true) return { ok: false, error: "bad booked" };
    value.booked = true;
  }
  if (r.eventId !== undefined) {
    if (typeof r.eventId !== "string" || !r.eventId || r.eventId.length > 100) return { ok: false, error: "bad eventId" };
    value.eventId = r.eventId;
  }
  if (!value.priceFit && !value.startMonth && !value.nextStep && !value.booked) return { ok: false, error: "nothing to record" };
  return { ok: true, value };
}

/** Merge into leads.extra under `nextStep`. Earlier answers survive; the latest of each wins. */
export function mergeNextStep(extra: unknown, b: NextStepBody, nowIso: string): Record<string, unknown> {
  const base = extra && typeof extra === "object" ? { ...(extra as Record<string, unknown>) } : {};
  const prev = base.nextStep && typeof base.nextStep === "object" ? { ...(base.nextStep as Record<string, unknown>) } : {};
  const next: Record<string, unknown> = { ...prev };
  if (b.priceFit) next.priceFit = b.priceFit;
  if (b.startMonth) next.startMonth = b.startMonth;
  if (b.nextStep) { next.step = b.nextStep; next.stepAt = nowIso; }
  if (b.booked) { next.booked = true; next.bookedAt = nowIso; }
  delete next.updatedAt;
  next.updatedAt = nowIso;
  return { ...base, nextStep: next };
}

export function capiEventFor(b: NextStepBody): "Schedule" | "Contact" | null {
  if (b.booked) return "Schedule";
  if (b.nextStep === "whatsapp") return "Contact";
  return null;
}
