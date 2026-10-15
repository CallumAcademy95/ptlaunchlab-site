// Optional "Where are you now?" answer on the prospectus form. Stored in the
// lead's `extra.stage` only. Pure module (no `@/` imports) so node --test can load it.

export const LEAD_STAGES = [
  { code: "curious", label: "Just curious about becoming a PT" },
  { code: "training_others", label: "Already training friends or family" },
  { code: "ready_3m", label: "Ready to start in the next 3 months" },
] as const;

export type LeadStage = (typeof LEAD_STAGES)[number]["code"];

export function cleanStage(v: unknown): LeadStage | null {
  return typeof v === "string" ? (LEAD_STAGES.find((s) => s.code === v)?.code ?? null) : null;
}

/** `extra` with `stage` kept only when it is one of the known codes; never rejects. */
export function withCleanStage(extra: Record<string, unknown>): Record<string, unknown> {
  const { stage, ...rest } = extra;
  const ok = cleanStage(stage);
  return ok ? { ...rest, stage: ok } : rest;
}
