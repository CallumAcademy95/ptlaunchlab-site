// Real side effects for POST /api/lead: Zapier, MailerLite / email-server, Meta CAPI.
// Each branch reproduces what the matching legacy form route sends today.
// Heavy `@/` modules are imported lazily so node --test can load this file.
import type { CleanLead, LeadIntent, StepStatus } from "./leads.ts";

type Lead = CleanLead & { id: string };
type Env = Record<string, string | undefined>;
export type SideEffectOpts = {
  fetchImpl?: typeof fetch;
  env?: Env;
  /** Test seam: replaces the real sendCapiEvent call. */
  capiSend?: (input: Record<string, unknown>) => Promise<unknown>;
};

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

export function zapierPayload(lead: Lead): Payload | null {
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
      return { kind: "json", data: { name: lead.name, email: lead.email, phone: lead.phone, quiz_result: result, avatar, answers, source: avatar ? `quiz-funnel:${avatar}` : "quiz-funnel", submitted_at: now } };
    }
    case "live": // app/api/live-register/route.ts:79-85
      return { kind: "json", data: { name: lead.name, email: lead.email, phone: lead.phone ?? "", source: "live-webinar", submitted_at: now } };
    case "salary": // app/api/salary-calculator/route.ts:26-41
      return { kind: "json", data: {
        name: lead.name, email: lead.email, phone: lead.phone ?? "", source: "salary_calculator",
        employment: x.employment ?? "", region: x.region ?? "", experience: x.experience ?? "", hours_per_week: x.hoursPerWeek ?? "",
        projected_year1: x.projected_year1 ?? "", projected_year2_3: x.projected_year2_3 ?? "", projected_year4plus: x.projected_year4plus ?? "",
        submitted_at: now,
      } };
    case "gym_partnership": // app/api/gym-partnership/route.ts:51-60
      return { kind: "json", data: { gym_name: x.gymName ?? "", name: lead.name, email: lead.email, phone: lead.phone, location: x.location ?? "", gym_size: x.gymSize ?? "", referred_by: x.referredBy ?? "", submitted_at: now } };
    case "call": { // app/book-call/components/PhoneCallbackForm.tsx:66-86 (form-encoded)
      const u = lead.utm;
      return { kind: "form", data: {
        call_type: "phone", name: lead.name, mobile: lead.phone, email: lead.email, topics: lead.question ?? "",
        page_url: s(x.page_url) || (lead.pagePath ? "https://ptlaunchlab.co.uk" + lead.pagePath : ""), page_referrer: lead.referrer ?? "", submitted_at: now,
        first_touch_source: s(u.first_source) || "(direct)", first_touch_medium: s(u.first_medium) || "(none)", first_touch_campaign: s(u.first_campaign) || "(none)",
        first_touch_content: s(u.first_content), first_touch_landing: s(u.first_landing), first_touch_referrer: s(u.first_referrer),
        last_touch_source: s(u.last_source) || s(u.first_source) || "(direct)", last_touch_medium: s(u.last_medium) || s(u.first_medium) || "(none)",
        last_touch_campaign: s(u.last_campaign) || s(u.first_campaign) || "(none)", fbclid: s(u.fbclid), gclid: s(u.gclid),
      } };
    }
    case "gym_callback": { // app/api/gym-callback/route.ts:85-101 (form-encoded)
      const u = lead.utm;
      return { kind: "form", data: {
        call_type: "gym_callback", name: lead.name, mobile: lead.phone, email: lead.email,
        topics: `Ring-me request from the ${s(x.gymName)} PT Academy page`,
        gym_slug: lead.gymSlug ?? "", gym_name: s(x.gymName), consent: s(x.consentText), consent_at: s(x.consentAt) || now,
        page_url: s(x.page_url, 300) || (lead.pagePath ? "https://ptlaunchlab.co.uk" + lead.pagePath : ""), submitted_at: now,
        first_touch_source: s(u.first_source, 200) || "(direct)", first_touch_medium: s(u.first_medium, 200) || "(none)",
        first_touch_campaign: s(u.first_campaign, 200) || "(none)", last_touch_source: s(u.last_source, 200) || s(u.first_source, 200) || "(direct)",
      } };
    }
    default: return null;
  }
}

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function makeSideEffects(req: Request, opts: SideEffectOpts = {}) {
  const env: Env = opts.env ?? (process.env as Env);
  const doFetch: typeof fetch = opts.fetchImpl ?? fetch;

  async function gymCallbackEmail(lead: Lead): Promise<StepStatus> {
    // app/api/gym-callback/route.ts:130-155
    if (!env.RESEND_API_KEY) return "skipped";
    const { Resend } = await import("resend");
    const { GYM_CALLBACK_CONSENT_TEXT } = await import("@/app/lib/gymCallback");
    const { getGymByPartnerSlug } = await import("@/app/lib/gyms");
    const gym = getGymByPartnerSlug(lead.gymSlug ?? "");
    const gymName = gym?.gymName ?? s(lead.extra.gymName);
    const canonicalPath = gym?.canonicalPath ?? "";
    const phone = lead.phone ?? "";
    const submittedAt = new Date().toISOString();
    const resend = new Resend(env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
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
          <p style="font-size:12px;color:#8CA3BF;">Consent: "${esc(GYM_CALLBACK_CONSENT_TEXT)}" at ${submittedAt}</p>
        </div>`,
    });
    return error ? `failed: email ${JSON.stringify(error).slice(0, 200)}` : "ok";
  }

  async function zapier(intent: LeadIntent, lead: Lead): Promise<StepStatus> {
    const hook = zapierHookFor(intent, env);
    const payload = zapierPayload(lead);
    let result: StepStatus = "skipped";
    // live: today MailerLite is primary and Zapier only the fallback when no token is set.
    const liveViaMailerLite = intent === "live" && !!env.MAILERLITE_TOKEN;
    if (hook && payload && !liveViaMailerLite) {
      const init: RequestInit = payload.kind === "form"
        ? { method: "POST", body: new URLSearchParams(Object.entries(payload.data).map(([k, v]) => [k, String(v ?? "")])) }
        : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload.data) };
      const res = await doFetch(hook, init);
      result = res.ok ? "ok" : `failed: ${res.status}`;
    }
    if (intent === "gym_callback") {
      const mail = await gymCallbackEmail(lead).catch((e) => `failed: email ${e instanceof Error ? e.message : String(e)}`);
      if (mail === "ok") return result.startsWith("failed") ? `${result}; email ok` : "ok";
      if (mail !== "skipped") return result === "ok" || result === "skipped" ? mail : `${result}; ${mail}`;
    }
    return result;
  }

  async function mailerlite(intent: LeadIntent, lead: Lead): Promise<StepStatus> {
    if (intent === "live") { // app/api/live-register/route.ts:70-77
      if (!env.MAILERLITE_TOKEN) return "skipped";
      const { mlAddSubscriber } = await import("@/app/lib/mailerlite");
      await mlAddSubscriber({ email: lead.email, name: lead.name, phone: lead.phone || undefined, groupId: env.LIVE_MAILERLITE_GROUP_ID || "191617669489756012" });
      return "ok";
    }
    if (intent === "prospectus" || intent === "quiz") { // email-server nurture: prospectus route.ts:60-67, quiz-submission route.ts:90-97
      if (!env.EMAIL_SERVER_URL) return "skipped";
      const body = intent === "prospectus"
        ? { name: lead.name, email: lead.email, phone: lead.phone, source: "prospectus" }
        : { name: lead.name, email: lead.email, phone: lead.phone, source: "quiz", quizResult: s(lead.extra.quiz_result ?? lead.extra.result) || null, avatar: s(lead.extra.avatar) || null };
      const res = await doFetch(`${env.EMAIL_SERVER_URL}/leads/new`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return res.ok ? "ok" : `failed: ${res.status}`;
    }
    return "skipped";
  }

  async function capi(intent: LeadIntent, lead: Lead, eventId: string): Promise<StepStatus> {
    if (intent === "checkout_start") return "skipped";
    const { extractRequestUserData, sendCapiEvent } = await import("@/app/lib/metaCapi");
    const send = opts.capiSend ?? ((i: Record<string, unknown>) => sendCapiEvent(i as never));
    await send({
      eventName: "Lead",
      eventId,
      eventSourceUrl: "https://ptlaunchlab.co.uk" + (lead.pagePath ?? "/"),
      actionSource: "website",
      userData: { email: lead.email, phone: lead.phone ?? undefined, firstName: lead.name.split(" ")[0], ...extractRequestUserData(req as never) },
      customData: { content_name: lead.intent },
    });
    return "ok";
  }

  return { zapier, mailerlite, capi };
}
