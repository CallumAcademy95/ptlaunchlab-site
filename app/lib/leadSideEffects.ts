// Real side effects for POST /api/lead: Zapier, MailerLite / email-server, Meta CAPI.
// Each branch reproduces what the matching legacy form route sends today.
// Heavy `@/` modules are imported lazily so node --test can load this file.
import { QUIZ_RESULT_LABELS } from "./quizResultLabels.ts";
import type { CleanLead, LeadIntent, StepStatus } from "./leads.ts";
import { validateUKPhone } from "./security/phone.ts";

type Lead = CleanLead & { id: string };

/** Each external call gets this long, so one hung call can't stall the rest. */
export const SIDE_EFFECT_TIMEOUT_MS = 8_000;

/**
 * The phone every external system gets: what the legacy validators produced,
 * E.164 `+44…` (validateUKPhone). leads.phone keeps the national 07… form for
 * the admin tel: link. A gym_partnership number that is not UK is already `+…`
 * (validateAnyPhone) and passes through.
 */
export function externalPhone(phone: string | null): string | null {
  if (!phone) return phone;
  const uk = validateUKPhone(phone);
  return uk.ok ? uk.normalised : phone;
}
const forExternal = (lead: Lead): Lead => ({ ...lead, phone: externalPhone(lead.phone) });
type Env = Record<string, string | undefined>;
export type SideEffectOpts = {
  fetchImpl?: typeof fetch;
  env?: Env;
  /** Test seam: replaces the real sendCapiEvent call. */
  capiSend?: (input: Record<string, unknown>) => Promise<unknown | null>;
  /** Test seam: server-side gym lookup (defaults to getGymByPartnerSlug). */
  gymLookup?: (slug: string) => { gymName: string; canonicalPath: string } | undefined;
  /** Test seam: defaults to GYM_CALLBACK_CONSENT_TEXT. */
  consentText?: string;
};

/** Extra fields the /api/lead route adds to its 200 body: the private watch link, for `live` only. */
export function liveExtras(intent: string, env: Env): { streamUrl?: string } {
  return intent === "live" && env.LIVE_STREAM_URL ? { streamUrl: env.LIVE_STREAM_URL } : {};
}

export const quizLabel = (result: string): string => QUIZ_RESULT_LABELS[result] ?? result;

/** Gym-callback gate for the route: a bogus gym slug is rejected before anything is saved. */
export function validateGymCallback(gymSlug: unknown, lookup: (slug: string) => unknown): { ok: false; field: "gymSlug"; message: string } | null {
  const slug = typeof gymSlug === "string" ? gymSlug.trim().slice(0, 60) : "";
  if (!slug || slug === "GYM-SLUG-HERE" || !lookup(slug)) return { ok: false, field: "gymSlug", message: "Unknown gym." };
  return null;
}

type Ctx = { gymName?: string; consentText?: string };

const s = (v: unknown, max = 500): string => (typeof v === "string" ? v.slice(0, max) : v == null ? "" : String(v).slice(0, max));

/** Env var(s) that feed each intent's Zapier hook, first set wins. Empty = no Zapier. */
export const ZAPIER_ENV: Record<LeadIntent, string[]> = {
  contact: ["CONTACT_ZAPIER_WEBHOOK_URL"],
  prospectus: ["PROSPECTUS_ZAPIER_WEBHOOK_URL"],
  quiz: ["QUIZ_ZAPIER_WEBHOOK_URL"],
  call: ["ZAPIER_PHONE_CALLBACK_HOOK", "NEXT_PUBLIC_ZAPIER_PHONE_CALLBACK_HOOK"],
  gym_callback: ["ZAPIER_PHONE_CALLBACK_HOOK", "NEXT_PUBLIC_ZAPIER_PHONE_CALLBACK_HOOK"],
  live: ["LIVE_ZAPIER_WEBHOOK_URL", "PROSPECTUS_ZAPIER_WEBHOOK_URL"],
  salary: ["SALARY_CALC_ZAPIER_WEBHOOK_URL", "PROSPECTUS_ZAPIER_WEBHOOK_URL"],
  gym_partnership: ["GYM_PARTNERSHIP_ZAPIER_WEBHOOK_URL"],
  career_planner: [], whatsapp: [], checkout_start: [],
};

export function zapierHookFor(intent: LeadIntent, env: Env): string | undefined {
  for (const k of ZAPIER_ENV[intent]) if (env[k]) return env[k];
  return undefined;
}

type Payload = { kind: "json" | "form"; data: Record<string, unknown> };

export function zapierPayload(lead: Lead, ctx: Ctx = {}): Payload | null {
  const now = new Date().toISOString();
  const x = lead.extra;
  switch (lead.intent) {
    case "contact": // app/api/contact/route.ts:44-50
      return { kind: "json", data: { name: lead.name, email: lead.email, phone: lead.phone, message: lead.question ?? "", submitted_at: now } };
    case "prospectus": // app/api/prospectus/route.ts:43-49
      return { kind: "json", data: { name: lead.name, email: lead.email, phone: lead.phone, source: "prospectus_download", submitted_at: now } };
    case "quiz": { // app/api/quiz-submission/route.ts:52-61
      const result = s(x.quiz_result ?? x.result);
      const avatar = s(x.avatar);
      const answers = Array.isArray(x.answers)
        ? x.answers.map((a) => (a && typeof a === "object" ? s((a as Record<string, unknown>).label) : s(a))).join(" | ")
        : s(x.answers);
      return { kind: "json", data: { name: lead.name, email: lead.email, phone: lead.phone, quiz_result: quizLabel(result), avatar, answers, source: avatar ? `quiz-funnel:${avatar}` : "quiz-funnel", submitted_at: now } };
    }
    case "live": // app/api/live-register/route.ts:79-85
      return { kind: "json", data: { name: lead.name, email: lead.email, phone: lead.phone ?? "", source: "live-webinar", submitted_at: now } };
    case "salary": { // app/api/salary-calculator/route.ts:26-41; extra = { inputs, results } as the form sends today
      const inputs = (x.inputs && typeof x.inputs === "object" ? x.inputs : {}) as Record<string, unknown>;
      const results = (x.results && typeof x.results === "object" ? x.results : {}) as Record<string, unknown>;
      return { kind: "json", data: {
        name: lead.name, email: lead.email, phone: lead.phone ?? "", source: "salary_calculator",
        employment: inputs.employment ?? "", region: inputs.region ?? "", experience: inputs.experience ?? "", hours_per_week: inputs.hoursPerWeek ?? "",
        projected_year1: results.year1 ?? "", projected_year2_3: results.year2_3 ?? "", projected_year4plus: results.year4plus ?? "",
        submitted_at: now,
      } };
    }
    case "gym_partnership": // app/api/gym-partnership/route.ts:51-60
      return { kind: "json", data: { gym_name: x.gymName ?? "", name: lead.name, email: lead.email, phone: lead.phone, location: x.location ?? "", gym_size: x.gymSize ?? "", referred_by: x.referredBy ?? "", submitted_at: now } };
    case "call": { // app/book-call/components/PhoneCallbackForm.tsx:66-86 (form-encoded)
      // lead.utm is readAttribution()'s output (attribution.ts): ft* = first touch,
      // lt* = last touch, present only when it differs from first touch, so
      // `lt* || ft*` equals the old `lastTouch.x || firstTouch.x`.
      // first_touch_referrer was the full first-touch referrer URL; utm only keeps
      // its host (ftr), so the full referrer the lead arrived with is sent instead.
      const u = lead.utm;
      return { kind: "form", data: {
        call_type: "phone", name: lead.name, mobile: lead.phone, email: lead.email, topics: lead.question ?? "",
        page_url: s(x.page_url) || (lead.pagePath ? "https://ptlaunchlab.co.uk" + lead.pagePath : ""), page_referrer: lead.referrer ?? "", submitted_at: now,
        first_touch_source: s(u.fts) || "(direct)", first_touch_medium: s(u.ftm) || "(none)", first_touch_campaign: s(u.ftc) || "(none)",
        first_touch_content: s(u.ftco), first_touch_landing: s(u.ftl), first_touch_referrer: lead.referrer ?? "",
        last_touch_source: s(u.lts) || s(u.fts) || "(direct)", last_touch_medium: s(u.ltm) || s(u.ftm) || "(none)",
        last_touch_campaign: s(u.ltc) || s(u.ftc) || "(none)", fbclid: s(u.fbclid), gclid: s(u.gclid),
      } };
    }
    case "gym_callback": { // app/api/gym-callback/route.ts:85-101 (form-encoded)
      const u = lead.utm;
      return { kind: "form", data: {
        call_type: "gym_callback", name: lead.name, mobile: lead.phone, email: lead.email,
        topics: `Ring-me request from the ${ctx.gymName ?? ""} PT Academy page`,
        gym_slug: lead.gymSlug ?? "", gym_name: ctx.gymName ?? "", consent: `Privacy notice shown: ${ctx.consentText ?? ""}`, consent_at: now,
        page_url: s(x.page_url, 300) || (lead.pagePath ? "https://ptlaunchlab.co.uk" + lead.pagePath : ""), submitted_at: now,
        // readAttribution() keys, as for call above (old GymCallbackForm sent first_source/… from the same touches).
        first_touch_source: s(u.fts, 200) || "(direct)", first_touch_medium: s(u.ftm, 200) || "(none)",
        first_touch_campaign: s(u.ftc, 200) || "(none)", last_touch_source: s(u.lts, 200) || s(u.fts, 200) || "(direct)",
      } };
    }
    default: return null;
  }
}

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function makeSideEffects(req: Request, opts: SideEffectOpts = {}) {
  const env: Env = opts.env ?? (process.env as Env);
  const rawFetch: typeof fetch = opts.fetchImpl ?? fetch;
  const doFetch = (url: string, init: RequestInit) => rawFetch(url, { ...init, signal: AbortSignal.timeout(SIDE_EFFECT_TIMEOUT_MS) });
  /** For calls that are not a plain fetch (Resend, MailerLite, CAPI): give up after the same timeout. */
  function timed<T>(p: Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`timeout after ${SIDE_EFFECT_TIMEOUT_MS} ms`)), SIDE_EFFECT_TIMEOUT_MS);
    });
    return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
  }

  async function gymFor(slug: string | null) {
    if (opts.gymLookup) return opts.gymLookup(slug ?? "");
    const { getGymByPartnerSlug } = await import("@/app/lib/gyms");
    return getGymByPartnerSlug(slug ?? "");
  }
  async function consent(): Promise<string> {
    if (opts.consentText !== undefined) return opts.consentText;
    const { GYM_CALLBACK_CONSENT_TEXT } = await import("@/app/lib/gymCallback");
    return GYM_CALLBACK_CONSENT_TEXT;
  }
  /** Retry once on a thrown error or a "failed" status, as the quiz/live/partnership routes do today. */
  async function retryOnce(fn: () => Promise<StepStatus>): Promise<StepStatus> {
    const attempt = async (): Promise<StepStatus> => { try { return await fn(); } catch (e) { return `failed: ${e instanceof Error ? e.message : String(e)}`.slice(0, 300); } };
    const first = await attempt();
    return first.startsWith("failed") ? attempt() : first;
  }

  async function gymCallbackEmail(lead: Lead): Promise<StepStatus> {
    // app/api/gym-callback/route.ts:130-155
    if (!env.RESEND_API_KEY) return "skipped";
    const { Resend } = await import("resend");
    const gym = await gymFor(lead.gymSlug);
    const gymName = gym?.gymName ?? "";
    const canonicalPath = gym?.canonicalPath ?? "";
    const phone = lead.phone ?? "";
    const submittedAt = new Date().toISOString();
    const resend = new Resend(env.RESEND_API_KEY);
    const { error } = await timed(resend.emails.send({
      from: "PT Launch Lab Leads <enrolments@ptlaunchlab.co.uk>",
      to: env.ADMIN_EMAIL ?? "info@ptlaunchlab.co.uk",
      replyTo: lead.email,
      subject: `📞 Ring-me request via ${gymName}: ${lead.name}`,
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;">
          <p style="font-size:15px;"><strong>${esc(lead.name)}</strong> asked the academy team to ring them from the
          <strong>${esc(gymName)}</strong> PT Academy page.</p>
          <p style="font-size:14px;">Phone: <a href="tel:${esc(phone)}">${esc(phone)}</a><br>Email: ${esc(lead.email)}</p>
          <p style="font-size:14px;color:#4A6280;">Gym slug: <strong>${esc(lead.gymSlug)}</strong> — if they enrol within 90 days
          (agreement clause 4.2) the sale belongs to ${esc(gymName)}. Send them that gym's enrol link
          (https://ptlaunchlab.co.uk${esc(canonicalPath)}/enrol) so it is attributed automatically.</p>
          <p style="font-size:13px;color:#4A6280;">White-label: introduce yourself as the ${esc(gymName)} academy team.</p>
          <p style="font-size:12px;color:#8CA3BF;">Privacy notice shown: "${esc(await consent())}" at ${submittedAt}</p>
        </div>`,
    }));
    return error ? `failed: email ${JSON.stringify(error).slice(0, 200)}` : "ok";
  }

  async function zapier(intent: LeadIntent, rawLead: Lead): Promise<StepStatus> {
    const lead = forExternal(rawLead);
    const hook = zapierHookFor(intent, env);
    let ctx: Ctx = {};
    if (intent === "gym_callback") ctx = { gymName: (await gymFor(lead.gymSlug))?.gymName ?? "", consentText: await consent() };
    const payload = zapierPayload(lead, ctx);
    let result: StepStatus = "skipped";
    // live: today MailerLite is primary and Zapier only the fallback when no token is set.
    const liveViaMailerLite = intent === "live" && !!env.MAILERLITE_TOKEN;
    if (hook && payload && !liveViaMailerLite) {
      const init: RequestInit = payload.kind === "form"
        ? { method: "POST", body: new URLSearchParams(Object.entries(payload.data).map(([k, v]) => [k, String(v ?? "")])) }
        : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload.data) };
      const post = async (): Promise<StepStatus> => { const res = await doFetch(hook, init); return res.ok ? "ok" : `failed: ${res.status}`; };
      result = intent === "quiz" || intent === "live" || intent === "gym_partnership" ? await retryOnce(post) : await post();
    }
    if (intent === "gym_callback") {
      const mail = await gymCallbackEmail(lead).catch((e) => `failed: email ${e instanceof Error ? e.message : String(e)}`);
      if (mail === "ok") return result.startsWith("failed") ? `${result}; email ok` : "ok";
      if (mail !== "skipped") return result === "ok" || result === "skipped" ? mail : `${result}; ${mail}`;
    }
    return result;
  }

  async function mailerlite(intent: LeadIntent, rawLead: Lead): Promise<StepStatus> {
    const lead = forExternal(rawLead);
    if (intent === "live") { // app/api/live-register/route.ts:70-77 (retries once)
      if (!env.MAILERLITE_TOKEN) return "skipped";
      const { mlAddSubscriber } = await import("@/app/lib/mailerlite");
      return retryOnce(async () => {
        await timed(mlAddSubscriber({ email: lead.email, name: lead.name, phone: lead.phone || undefined, groupId: env.LIVE_MAILERLITE_GROUP_ID || "191617669489756012" }));
        return "ok";
      });
    }
    if (intent === "prospectus" || intent === "quiz" || intent === "salary") {
      // email-server nurture: prospectus route.ts:60-67, quiz-submission route.ts:90-97, salary-calculator route.ts:66-72
      if (!env.EMAIL_SERVER_URL) return "skipped";
      const base = { name: lead.name, email: lead.email, phone: lead.phone };
      const body = intent === "prospectus" ? { ...base, source: "prospectus" }
        : intent === "salary" ? { ...base, source: "salary_calculator" }
        : { ...base, source: "quiz", quizResult: quizLabel(s(lead.extra.quiz_result ?? lead.extra.result)) || null, avatar: s(lead.extra.avatar) || null };
      const res = await doFetch(`${env.EMAIL_SERVER_URL}/leads/new`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return res.ok ? "ok" : `failed: ${res.status}`;
    }
    return "skipped";
  }

  /** Per-intent customData, copied from the legacy routes (camelCase; toMetaCustomData maps the keys). */
  function capiCustomData(intent: LeadIntent, lead: Lead): Record<string, unknown> {
    const x = lead.extra;
    const avatar = s(x.avatar, 24) || undefined;
    switch (intent) {
      case "quiz": // quiz-submission/route.ts:127-132
        return { currency: "GBP", value: 0, contentName: s(x.quiz_result ?? x.result), contentCategory: avatar };
      case "live": // live-register/route.ts:133-138
        return { currency: "GBP", value: 0, contentName: "live_webinar_registration", contentCategory: "live-sessions" };
      case "prospectus": // prospectus/route.ts:106-111
        return { currency: "GBP", value: 0, contentName: "prospectus_download", contentCategory: avatar };
      case "gym_partnership": // gym-partnership/route.ts:111-117
        return { currency: "GBP", value: 0, contentName: "gym_partnership", contentCategory: "b2b_partner" };
      default:
        return { contentName: intent };
    }
  }

  async function capi(intent: LeadIntent, rawLead: Lead, eventId: string): Promise<StepStatus> {
    const lead = forExternal(rawLead);
    if (intent === "checkout_start") return "skipped";
    // With the capiSend test seam there is no metaCapi import (the @/ alias is unavailable under node --test).
    const mc = opts.capiSend ? null : await import("@/app/lib/metaCapi");
    const send = opts.capiSend ?? ((i: Record<string, unknown>) => mc!.sendCapiEvent(i as never));
    const requestUserData = mc ? mc.extractRequestUserData(req as never) : {};
    const [firstName, ...rest] = lead.name.split(/\s+/);
    const out = await timed(send({
      eventName: "Lead",
      eventId,
      eventSourceUrl: req.headers.get("referer") || "https://ptlaunchlab.co.uk" + (lead.pagePath ?? "/"),
      actionSource: "website",
      userData: { email: lead.email, phone: lead.phone ?? undefined, firstName, lastName: rest.join(" "), country: "gb", ...requestUserData },
      customData: capiCustomData(intent, lead),
    }));
    if (out === null) return env.META_CAPI_ACCESS_TOKEN ? "failed: capi" : "skipped";
    return "ok";
  }

  return { zapier, mailerlite, capi };
}
