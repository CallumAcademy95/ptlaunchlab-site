// Website leads: saved FIRST, then everything else.
//
// processLead() is pure apart from its injected deps so the order of
// operations is unit-tested: validate → insert → respond → after-steps.
// Nothing after the insert can lose the lead or block the response.
// No `@/` imports so node --test can load it.

export const LEAD_INTENTS = ["call", "prospectus", "quiz", "career_planner", "gym_callback", "whatsapp", "live", "salary", "checkout_start", "contact", "gym_partnership"] as const;
export type LeadIntent = (typeof LEAD_INTENTS)[number];

/** Intents that call notifySetter TODAY. Leads Central must see no change (Callum, 11 Oct 2026). */
export const SETTER_INTENTS: ReadonlySet<LeadIntent> = new Set<LeadIntent>(["contact", "prospectus", "quiz"]);
export function setterSourceFor(intent: LeadIntent): string { return intent; }

export const INTENT_LABEL: Record<LeadIntent, string> = {
  call: "Book a call", prospectus: "Prospectus", quiz: "Quiz", career_planner: "Career planner",
  gym_callback: "Gym page callback", whatsapp: "WhatsApp enquiry", live: "Live session",
  salary: "Salary calculator", checkout_start: "Started checkout", contact: "Contact form",
  gym_partnership: "Gym partnership",
};

export type CleanLead = {
  name: string; phone: string | null; email: string; question: string | null;
  intent: LeadIntent; source: string; pagePath: string | null; gymSlug: string | null;
  extra: Record<string, unknown>; utm: Record<string, unknown>; referrer: string | null;
  isTest: boolean; isSpam: boolean;
};

const str = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** UK number → digits with a leading 0 (07…, 01…, 02…, 03…), or null. */
export function normaliseUkPhone(raw: string): string | null {
  // Drop a "(0)" that follows the country code: "+44 (0)7700…", "0044 (0) 7700…".
  const s = raw.trim().replace(/^(\+44|0044|44)\s*\(0\)\s*/, "$1");
  let d = s.replace(/[^\d+]/g, "");
  if (d.startsWith("+44")) d = "0" + d.slice(3);
  else if (d.startsWith("0044")) d = "0" + d.slice(4);
  else if (d.startsWith("44") && d.length === 12) d = "0" + d.slice(2);
  // Mobiles are exactly 11 digits; landlines (01, 02, 03…) are 10 or 11.
  if (/^07/.test(d)) return /^07\d{9}$/.test(d) ? d : null;
  return /^0[1-36]\d{8,9}$/.test(d) ? d : null;
}

export function validateLead(raw: unknown): { ok: true; lead: CleanLead } | { ok: false; field: string; message: string } {
  const r = obj(raw);
  const intent = str(r.intent, 40) as LeadIntent;
  if (!(LEAD_INTENTS as readonly string[]).includes(intent)) return { ok: false, field: "intent", message: "Unknown form." };
  const name = str(r.name, 120);
  if (!name) return { ok: false, field: "name", message: "Enter your name." };
  const email = str(r.email, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, field: "email", message: "Enter a valid email address." };
  const phoneRaw = str(r.phone, 40);
  const phone = phoneRaw ? normaliseUkPhone(phoneRaw) : null;
  if (intent !== "checkout_start" && !phone) return { ok: false, field: "phone", message: "Enter a UK phone number." };
  if (intent === "checkout_start" && phoneRaw && !phone) return { ok: false, field: "phone", message: "Enter a UK phone number." };
  const source = str(r.source, 80) || intent;
  return {
    ok: true,
    lead: {
      name, phone, email,
      question: str(r.question, 1000) || null,
      intent, source,
      pagePath: str(r.pagePath, 300) || null,
      gymSlug: str(r.gymSlug, 60) || null,
      extra: obj(r.extra), utm: obj(r.utm),
      referrer: str(r.referrer, 500) || null,
      isTest: name.startsWith("TEST "),
      isSpam: str(r.honeypot, 200) !== "",
    },
  };
}

export type LeadRow = {
  name: string; phone: string | null; email: string; question: string | null; intent: string; source: string;
  page_path: string | null; gym_slug: string | null; extra: Record<string, unknown>; utm: Record<string, unknown>;
  referrer: string | null; event_id: string; is_test: boolean; is_spam: boolean;
};
export type StepStatus = "ok" | "skipped" | string;

/** The `leads` row for a validated lead. Shared by processLead and the routes that insert directly. */
export function leadRowFrom(lead: CleanLead, eventId: string): LeadRow {
  return {
    name: lead.name, phone: lead.phone, email: lead.email, question: lead.question, intent: lead.intent,
    source: lead.source, page_path: lead.pagePath, gym_slug: lead.gymSlug, extra: lead.extra, utm: lead.utm,
    referrer: lead.referrer, event_id: eventId, is_test: lead.isTest, is_spam: lead.isSpam,
  };
}

type PushPayload = { title: string; body?: string; url?: string; tag?: string };

/** The owner alert when a lead could not be saved. */
export function notSavedPush(lead: CleanLead, eventId: string): PushPayload {
  return {
    title: `NOT SAVED — lead: ${lead.name}`,
    body: `${lead.phone ?? "no phone"} · ${lead.email} · ${INTENT_LABEL[lead.intent]} · ${lead.pagePath ?? ""}`,
    url: "/admin/site-leads",
    tag: `lead-unsaved-${eventId}`,
  };
}

/** The owner alert for a saved lead. */
export function newLeadPush(lead: CleanLead, id: string): PushPayload {
  return {
    title: `New lead: ${lead.name}`,
    body: `${lead.phone ?? "no phone"} · ${INTENT_LABEL[lead.intent]} · ${lead.pagePath ?? lead.source}`,
    url: `/admin/site-leads/${id}`,
    tag: `lead-${id}`,
  };
}

/** push_status value from a sendOwnerPush result. */
export function pushStatus(r: { sent: number; error?: string }): StepStatus {
  return r.error ? `failed: ${r.error}` : r.sent > 0 ? "ok" : "failed: no device";
}

/**
 * Resolve `p`, or `{ error }` after `ms`. Used where a save must never hold up
 * the visitor (checkout start). The underlying promise is not cancelled.
 */
export async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | { error: string }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<{ error: string }>((resolve) => { timer = setTimeout(() => resolve({ error: `timeout after ${ms} ms` }), ms); });
  try {
    return await Promise.race([p.catch((e: unknown) => ({ error: e instanceof Error ? e.message : String(e) })), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export interface LeadDeps {
  insert(row: LeadRow): Promise<{ id: string } | { error: string }>;
  update(id: string, patch: Record<string, unknown>): Promise<void>;
  push(payload: { title: string; body?: string; url?: string; tag?: string }): Promise<{ sent: number; error?: string }>;
  setter(lead: { name: string; email: string; message?: string; source: string }): Promise<void>;
  zapier(intent: LeadIntent, lead: CleanLead & { id: string }): Promise<StepStatus>;
  mailerlite(intent: LeadIntent, lead: CleanLead & { id: string }): Promise<StepStatus>;
  capi(intent: LeadIntent, lead: CleanLead & { id: string }, eventId: string): Promise<StepStatus>;
  newEventId(): string;
}

export type LeadResult =
  | { status: 200; body: { ok: true; id: string; eventId: string }; after: () => Promise<void> }
  | { status: 400 | 500; body: { ok: false; field?: string; message: string }; after?: () => Promise<void> };

const failed = (e: unknown) => `failed: ${e instanceof Error ? e.message : String(e)}`.slice(0, 300);

export async function processLead(raw: unknown, deps: LeadDeps): Promise<LeadResult> {
  const v = validateLead(raw);
  if (!v.ok) return { status: 400, body: { ok: false, field: v.field, message: v.message } };
  const lead = v.lead;
  const eventId = deps.newEventId();

  let inserted: { id: string } | { error: string };
  try {
    inserted = await deps.insert(leadRowFrom(lead, eventId));
  } catch (e) {
    inserted = { error: failed(e) };
  }

  if ("error" in inserted) {
    console.error("[lead] insert failed", inserted.error);
    if (!lead.isSpam) {
      try {
        await deps.push(notSavedPush(lead, eventId));
      } catch (e) { console.error("[lead] push after failed insert also failed", e); }
    }
    return { status: 500, body: { ok: false, message: "Something went wrong. Call us on 01977 285014 or try again." } };
  }

  const id = inserted.id;
  const full = { ...lead, id };
  const after = async () => {
    const step = async (col: string, fn: () => Promise<StepStatus>) => {
      let status: StepStatus;
      try { status = await fn(); } catch (e) { status = failed(e); }
      try { await deps.update(id, { [col]: status }); } catch (e) { console.error(`[lead] ${col} status write failed`, e); }
    };
    await step("push_status", async () => {
      if (lead.isSpam || lead.isTest) return "skipped";
      return pushStatus(await deps.push(newLeadPush(lead, id)));
    });
    if (lead.isSpam) return;
    // TEST leads are saved and pushed-skipped, and never reach external systems.
    await step("setter_status", async () => {
      if (lead.isTest || !SETTER_INTENTS.has(lead.intent)) return "skipped";
      await deps.setter({ name: lead.name, email: lead.email, ...(lead.intent === "contact" && lead.question ? { message: lead.question } : {}), source: setterSourceFor(lead.intent) });
      return "ok";
    });
    await step("zapier_status", async () => (lead.isTest ? "skipped" : deps.zapier(lead.intent, full)));
    await step("mailerlite_status", async () => (lead.isTest ? "skipped" : deps.mailerlite(lead.intent, full)));
    await step("capi_status", async () => (lead.isTest ? "skipped" : deps.capi(lead.intent, full, eventId)));
  };
  return { status: 200, body: { ok: true, id, eventId }, after };
}
