import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";
import { logSec } from "@/app/lib/security/log";
import { validateBookCall } from "@/app/lib/security/validate";
import { notifySetter } from "@/app/lib/setter-intake";
import { CONTACT_EMAIL } from "@/app/lib/contactDetails";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/book-call
//
// Callback requests from PhoneCallbackForm.
//
// WHY THIS ROUTE EXISTS
// The form used to POST straight from the browser to hooks.zapier.com — the
// only form on the site that talked to a third-party domain instead of our own
// origin. That request is blocked before it leaves the device by ad and tracker
// blockers, privacy browsers, DNS filters (NextDNS, Pi-hole, a filtering VPN
// profile) and plenty of corporate and carrier networks, because
// hooks.zapier.com sits on the common blocklists. `fetch` then rejects with a
// TypeError and the visitor is shown a raw "Failed to fetch" on the highest-
// intent form on the site. Nothing reaches us, and nothing is logged, because
// the request never got as far as a server.
//
// Same-origin now: a blocker cannot distinguish this from any other request to
// our own domain. Zapier is called from here, where a failure is ours to see,
// and the callback request is emailed to the team inbox so a Zapier outage or a
// rotated hook URL can no longer lose a lead.
// ─────────────────────────────────────────────────────────────────────────────

const rateLimiter = createRateLimiter(5, 60_000);
const ENDPOINT = "/api/book-call";

// Prefer a server-only var, but fall back to the NEXT_PUBLIC one the form used
// to read so this works on the existing Vercel config with no env change. Once
// NEXT_PUBLIC_ZAPIER_PHONE_CALLBACK_HOOK is copied to ZAPIER_PHONE_CALLBACK_HOOK
// the public one can be deleted, which also stops the URL being shipped in the
// client bundle where anyone can read and spam it.
const ZAPIER_HOOK =
  process.env.ZAPIER_PHONE_CALLBACK_HOOK ||
  process.env.NEXT_PUBLIC_ZAPIER_PHONE_CALLBACK_HOOK ||
  "";

let resendClient: Resend | null = null;
function resend(): Resend {
  resendClient ??= new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}
const ENQUIRY_INBOX = process.env.ADMIN_EMAIL ?? CONTACT_EMAIL;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function callbackEmail(d: {
  name: string;
  mobile: string;
  email: string;
  topics: string;
  attribution: Record<string, string>;
}) {
  const when = new Date().toLocaleString("en-GB", {
    timeZone: "Europe/London",
    dateStyle: "full",
    timeStyle: "short",
  });

  const row = (label: string, value: string, href?: string) => `
      <tr>
        <td style="padding:9px 0;color:#8CA3BF;font-size:13px;width:96px;vertical-align:top;">${esc(label)}</td>
        <td style="padding:9px 0;color:#ffffff;font-size:15px;font-weight:600;">
          ${href ? `<a href="${esc(href)}" style="color:#F5C518;text-decoration:none;">${esc(value)}</a>` : esc(value)}
        </td>
      </tr>`;

  // Attribution matters on this form specifically — it is the one the paid
  // campaigns point at, so which ad produced the callback is the whole point.
  const attributionRows = Object.entries(d.attribution)
    .filter(([, v]) => v && v !== "(none)" && v !== "(direct)")
    .map(([k, v]) => `<tr><td style="padding:3px 0;color:#4A6280;font-size:12px;width:170px;">${esc(k)}</td><td style="padding:3px 0;color:#8CA3BF;font-size:12px;">${esc(v)}</td></tr>`)
    .join("");

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#061F36;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#0D3559;border:1px solid rgba(59,130,246,.25);border-radius:16px;overflow:hidden;">
    <div style="padding:22px 26px;border-bottom:1px solid rgba(59,130,246,.2);">
      <div style="color:#F5C518;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">Callback requested</div>
      <div style="color:#ffffff;font-size:20px;font-weight:700;margin-top:6px;">${esc(d.name)}</div>
    </div>
    <div style="padding:8px 26px 4px;">
      <table style="width:100%;border-collapse:collapse;">
        ${row("Mobile", d.mobile, `tel:${d.mobile}`)}
        ${row("Email", d.email, `mailto:${d.email}`)}
        ${row("Requested", when)}
      </table>
    </div>
    ${d.topics ? `<div style="padding:6px 26px 4px;">
      <div style="color:#8CA3BF;font-size:13px;margin-bottom:8px;">Wants to cover</div>
      <div style="background:#072B4A;border:1px solid rgba(59,130,246,.2);border-radius:12px;padding:16px;color:#ffffff;font-size:15px;line-height:1.6;white-space:pre-wrap;">${esc(d.topics)}</div>
    </div>` : ""}
    ${attributionRows ? `<div style="padding:16px 26px 4px;">
      <div style="color:#4A6280;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:6px;">Attribution</div>
      <table style="width:100%;border-collapse:collapse;">${attributionRows}</table>
    </div>` : ""}
    <div style="padding:18px 26px 26px;">
      <a href="https://wa.me/${esc(d.mobile.replace(/[^0-9]/g, ""))}" style="display:inline-block;background:#F5C518;color:#072B4A;font-weight:700;font-size:14px;padding:12px 24px;border-radius:100px;text-decoration:none;">WhatsApp ${esc(d.name)}</a>
    </div>
    <div style="text-align:center;padding:14px;color:#2A4A6C;font-size:11px;">
      PT Launch Lab · /book-call callback request
    </div>
  </div>
</body>
</html>`;

  const text = [
    `Callback requested by ${d.name}`,
    `Mobile: ${d.mobile}`,
    `Email: ${d.email}`,
    `Requested: ${when}`,
    d.topics ? `\nWants to cover:\n${d.topics}` : "",
  ].filter(Boolean).join("\n");

  return { html, text };
}

export async function POST(request: NextRequest) {
  const ip = getIP(request);
  if (!rateLimiter(ip)) {
    logSec({ level: "security", endpoint: ENDPOINT, outcome: "blocked-silent", signals: ["rate-limit"], ip });
    return NextResponse.json({ success: false, error: "Too many requests. Please try again in a minute." }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const result = validateBookCall(raw);
  if (!result.ok) {
    if (result.silent) {
      logSec({ level: "security", endpoint: ENDPOINT, outcome: "blocked-silent", signals: result.signals, ip, ua: request.headers.get("user-agent") });
      return NextResponse.json({ success: true });
    }
    logSec({ level: "security", endpoint: ENDPOINT, outcome: "blocked-user", signals: result.signals, ip });
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  const { name, mobile, email, topics, attribution } = result.data;

  // ── 1. Email the callback request to the team inbox. Marked as an automated
  //       notification so the setter's info@ poll leaves it alone — step 3 is
  //       the one route into the setter. See app/lib/setter-intake.ts.
  let delivered = false;
  if (process.env.RESEND_API_KEY) {
    try {
      const { html, text } = callbackEmail({ name, mobile, email, topics, attribution });
      await resend().emails.send({
        from: "PT Launch Lab Website <enquiries@ptlaunchlab.co.uk>",
        to: ENQUIRY_INBOX,
        replyTo: email || undefined,
        subject: `Callback requested: ${name} — ${mobile}`,
        html,
        text,
        headers: {
          "Auto-Submitted": "auto-generated",
          "X-Auto-Response-Suppress": "All",
          "X-PTLL-Notification": "book-call",
        },
      });
      delivered = true;
    } catch (err) {
      console.error("[book-call] level:lead-lost — callback email failed:", err);
    }
  } else {
    console.error("[book-call] level:lead-lost — RESEND_API_KEY not set, cannot email the callback request.");
  }

  // ── 2. Zapier, from the server this time. The same hook the browser used to
  //       call directly, with the same form-encoded body the catch hook expects.
  if (ZAPIER_HOOK) {
    try {
      const body = new URLSearchParams();
      Object.entries({ call_type: "phone", name, mobile, email, topics, ...attribution }).forEach(
        ([k, v]) => body.append(k, String(v ?? "")),
      );
      const res = await fetch(ZAPIER_HOOK, {
        method: "POST",
        body,
        signal: AbortSignal.timeout(8_000),
      });
      if (res.ok) {
        delivered = true;
      } else {
        console.error("[book-call] Zapier rejected the callback request:", res.status);
      }
    } catch (err) {
      console.error("[book-call] Zapier push failed:", err);
    }
  } else {
    console.error("[book-call] ZAPIER_PHONE_CALLBACK_HOOK not set — no Zapier push.");
  }

  // ── 3. The setter opens the conversation. Never fatal; logged when missed.
  const setterOk = await notifySetter({
    name,
    email,
    message: topics ? `Callback requested (${mobile}). Wants to cover: ${topics}` : `Callback requested (${mobile}).`,
    source: "book-call",
  });

  if (!delivered) {
    logSec({ level: "security", endpoint: ENDPOINT, outcome: "blocked-user", signals: ["undelivered"], ip });
    return NextResponse.json(
      { success: false, error: "We couldn't submit your request just now." },
      { status: 502 },
    );
  }

  logSec({
    level: "security",
    endpoint: ENDPOINT,
    outcome: "accepted",
    signals: setterOk ? [] : ["setter-missed"],
    ip,
    email_domain: email ? email.split("@")[1] : null,
  });
  return NextResponse.json({ success: true });
}
