import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";
import { validateProspectus } from "@/app/lib/security/validate";
import { logSec } from "@/app/lib/security/log";
import { getGymByPartnerSlug } from "@/app/lib/gyms";
import { GYM_CALLBACK_CONSENT_TEXT } from "@/app/lib/gymCallback";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/gym-callback
//
// The "Not ready yet? Leave your number and the academy team will ring you"
// form on every gym academy page (v4.1 sales ladder).
//
// Follows the site's existing call-back path: the same Zapier phone-callback
// hook /book-call's PhoneCallbackForm posts to (NEXT_PUBLIC_ZAPIER_PHONE_CALLBACK_HOOK),
// sent server-side here so the gym can't be dropped by the browser. The lead
// carries gym_slug — the partner join key — so a later enrolment inside the
// 90-day window in agreement clause 4.2 can be credited to the gym. An admin
// email goes out alongside it so somebody actually rings, and so there is a
// second record of the gym attribution if the hook is ever down.
//
// Deliberately NOT handed to the Leads Central setter (notifySetter): the setter
// opens with an email in PT Launch Lab's voice, and a gym's member must only
// ever hear from "the academy team" (white-label rule).
//
// Body: { name, email, phone, consent: true, gymSlug, page_url?, utm?, _sec }
// ─────────────────────────────────────────────────────────────────────────────

export const runtime = "nodejs";

const rateLimiter = createRateLimiter(5, 60_000);
const ENDPOINT = "/api/gym-callback";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "info@ptlaunchlab.co.uk";

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(request: NextRequest) {
  const ip = getIP(request);
  if (!rateLimiter(ip)) {
    logSec({ level: "security", endpoint: ENDPOINT, outcome: "blocked-silent", signals: ["rate-limit"], ip });
    return NextResponse.json({ success: false, error: "Too many requests." }, { status: 429 });
  }

  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  // The gym must be a real partner page, or the lead is attributed to nobody.
  const gymSlug = typeof raw.gymSlug === "string" ? raw.gymSlug.trim().slice(0, 60) : "";
  const gym = getGymByPartnerSlug(gymSlug);
  if (!gym || gymSlug === "GYM-SLUG-HERE") {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }
  if (raw.consent !== true) {
    return NextResponse.json(
      { success: false, error: "Please tick the box so the academy team can contact you." },
      { status: 422 },
    );
  }

  const v = validateProspectus({ name: raw.name, email: raw.email, phone: raw.phone, _sec: raw._sec });
  if (!v.ok) {
    if (v.silent) {
      logSec({ level: "security", endpoint: ENDPOINT, outcome: "blocked-silent", signals: v.signals, ip, ua: request.headers.get("user-agent") });
      return NextResponse.json({ success: true });
    }
    logSec({ level: "security", endpoint: ENDPOINT, outcome: "blocked-user", signals: v.signals, ip });
    return NextResponse.json({ success: false, error: v.error }, { status: v.status });
  }

  const { name, email, phone } = v.data;
  const utm = (raw.utm && typeof raw.utm === "object" ? raw.utm : {}) as Record<string, unknown>;
  const s = (x: unknown, max = 200) => (typeof x === "string" ? x.slice(0, max) : "");
  const submittedAt = new Date().toISOString();

  const payload = {
    call_type: "gym_callback",
    name,
    mobile: phone,
    email,
    topics: `Ring-me request from the ${gym.gymName} PT Academy page`,
    // Partner attribution. gym_slug is the join key (pp_partners.slug); the
    // display name is for whoever picks up the lead.
    gym_slug: gymSlug,
    gym_name: gym.gymName,
    consent: GYM_CALLBACK_CONSENT_TEXT,
    consent_at: submittedAt,
    page_url: s(raw.page_url, 300),
    submitted_at: submittedAt,
    first_touch_source: s(utm.first_source) || "(direct)",
    first_touch_medium: s(utm.first_medium) || "(none)",
    first_touch_campaign: s(utm.first_campaign) || "(none)",
    last_touch_source: s(utm.last_source) || s(utm.first_source) || "(direct)",
  };

  let delivered = 0;

  const hook = process.env.ZAPIER_PHONE_CALLBACK_HOOK || process.env.NEXT_PUBLIC_ZAPIER_PHONE_CALLBACK_HOOK;
  if (hook) {
    try {
      // Form-encoded, exactly as PhoneCallbackForm sends it to the same hook.
      const body = new URLSearchParams();
      for (const [k, val] of Object.entries(payload)) body.append(k, String(val ?? ""));
      const res = await fetch(hook, { method: "POST", body });
      if (res.ok) delivered++;
      else console.error(`[gym-callback] Zapier hook HTTP ${res.status} for ${email} (${gymSlug})`);
    } catch (err) {
      console.error(`[gym-callback] Zapier hook failed for ${email} (${gymSlug}):`, err);
    }
  } else {
    console.warn("[gym-callback] no phone-callback hook configured");
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: "PT Launch Lab Leads <enrolments@ptlaunchlab.co.uk>",
        to: ADMIN_EMAIL,
        replyTo: email,
        subject: `📞 Ring-me request via ${gym.gymName}: ${name}`,
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;">
          <p style="font-size:15px;"><strong>${esc(name)}</strong> asked the academy team to ring them from the
          <strong>${esc(gym.gymName)}</strong> PT Academy page.</p>
          <p style="font-size:14px;">Phone: <a href="tel:${esc(phone)}">${esc(phone)}</a><br>Email: ${esc(email)}</p>
          <p style="font-size:14px;color:#4A6280;">Gym slug: <strong>${esc(gymSlug)}</strong> — if they enrol within 90 days
          (agreement clause 4.2) the sale belongs to ${esc(gym.gymName)}. Send them that gym's enrol link
          (https://ptlaunchlab.co.uk${esc(gym.canonicalPath)}/enrol) so it is attributed automatically.</p>
          <p style="font-size:13px;color:#4A6280;">White-label: introduce yourself as the ${esc(gym.gymName)} academy team.</p>
          <p style="font-size:12px;color:#8CA3BF;">Consent: "${esc(GYM_CALLBACK_CONSENT_TEXT)}" at ${submittedAt}</p>
        </div>`,
      });
      if (error) console.error(`[gym-callback] admin email failed for ${email}:`, error);
      else delivered++;
    } catch (err) {
      console.error(`[gym-callback] admin email threw for ${email}:`, err);
    }
  }

  if (delivered === 0) {
    console.error(`[gym-callback] level:lead-lost — ${email} ${phone} (${gymSlug}) reached no destination`);
    return NextResponse.json(
      { success: false, error: "We couldn't send that just now. Please try again in a minute." },
      { status: 503 },
    );
  }

  logSec({ level: "security", endpoint: ENDPOINT, outcome: "accepted", signals: [], ip, email_domain: email.split("@")[1] });
  return NextResponse.json({ success: true });
}
