// Leads that are saved by their own routes rather than through POST /api/lead:
// the career planner (its route keeps its own validation, Leads Central intake,
// email, MailerLite, Zapier and CAPI) and checkout start (/api/enrolment-pending).
// They write the same `leads` row shape as processLead via leadRowFrom.
// Pure apart from injected deps. No `@/` imports so node --test can load it.
import { leadRowFrom, normaliseUkPhone, notSavedPush, withTimeout, type CleanLead, type LeadRow } from "./leads.ts";

export type DirectInsert = (row: LeadRow) => Promise<{ id: string } | { error: string }>;
type Push = (p: { title: string; body?: string; url?: string; tag?: string }) => Promise<unknown>;

export function plannerLead(d: {
  name: string; email: string; phone: string; band: string; consentAt: string;
  answers: Record<string, unknown> | object; utm: Record<string, unknown> | null; referrer?: string | null;
}): CleanLead {
  return {
    name: d.name.trim(),
    phone: normaliseUkPhone(d.phone) ?? d.phone,
    email: d.email.trim().toLowerCase(),
    question: null,
    intent: "career_planner",
    source: "career-planner",
    pagePath: "/career-planner",
    gymSlug: null,
    extra: { answers: d.answers, band: d.band, consentAt: d.consentAt },
    utm: d.utm ?? {},
    referrer: d.referrer || null,
    isTest: d.name.trim().startsWith("TEST "),
    isSpam: false,
  };
}

/**
 * Should the site push "New lead" for a planner lead? Prime leads already
 * alert the owner from the PT app's planner intake (push + WhatsApp + email),
 * so the site only pushes for Prime when that intake failed. TEST leads never push.
 */
export function plannerPushNeeded(lead: CleanLead, band: string, intakeOk: boolean): boolean {
  if (lead.isTest) return false;
  return band !== "prime" || !intakeOk;
}

const ATP_RUNGS = new Set(["six_month", "pif_1599"]);

export function checkoutStartLead(d: { name: string; email: string; plan: string; rung?: unknown; gymReferral?: string }): CleanLead {
  const rung = typeof d.rung === "string" && ATP_RUNGS.has(d.rung) ? d.rung : null;
  return {
    name: d.name.trim().slice(0, 120),
    phone: null,
    email: d.email.trim().toLowerCase().slice(0, 254),
    question: null,
    intent: "checkout_start",
    source: "checkout",
    pagePath: "/enrol",
    gymSlug: null,
    extra: { plan: d.plan, rung, ...(d.gymReferral ? { gymReferral: d.gymReferral.slice(0, 200) } : {}) },
    utm: {},
    referrer: null,
    isTest: d.name.trim().startsWith("TEST "),
    isSpam: false,
  };
}

/**
 * Insert one row, capped at `timeoutMs`. Never throws. On failure (or timeout)
 * it logs, and pushes the "NOT SAVED" alert when `push` is given.
 */
export async function insertDirect(
  lead: CleanLead, eventId: string,
  deps: { insert: DirectInsert; push?: Push; log?: (msg: string, detail: unknown) => void },
  timeoutMs: number,
): Promise<{ id: string } | { error: string }> {
  const log = deps.log ?? ((m, d) => console.error(m, d));
  let out: { id: string } | { error: string };
  try {
    out = await withTimeout(deps.insert(leadRowFrom(lead, eventId)), timeoutMs);
  } catch (e) {
    out = { error: e instanceof Error ? e.message : String(e) };
  }
  if ("error" in out) {
    log(`[lead] ${lead.intent} insert failed`, out.error);
    if (deps.push) {
      try { await deps.push(notSavedPush(lead, eventId)); } catch (e) { log("[lead] NOT SAVED push failed", e); }
    }
  }
  return out;
}
