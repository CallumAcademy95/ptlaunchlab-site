import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createRateLimiter, getIP } from '@/app/lib/rate-limit';
import { validateContact } from '@/app/lib/security/validate';
import { logSec } from '@/app/lib/security/log';
import { notifySetter } from '@/app/lib/setter-intake';
import { CONTACT_EMAIL } from '@/app/lib/contactDetails';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/contact
//
// Delivers a website enquiry to the team inbox by EMAIL, and mirrors it to
// Zapier → Google Sheets and to the setter where those are configured.
//
// WHY EMAIL IS THE PRIMARY ROUTE
// This route used to have exactly two ways out — CONTACT_ZAPIER_WEBHOOK_URL and
// SETTER_INTAKE_URL — and both are silently optional. With neither set (and
// neither is documented anywhere: no .env.example, no reference outside this
// file and setter-intake.ts) a valid enquiry was accepted, logged
// `outcome: "accepted"`, and delivered nowhere. The visitor still saw a tick.
// Every other lead route in the codebase sends a Resend email; this one didn't.
// It does now, and a submission we could not deliver by ANY route returns an
// error instead of a success the sender can't act on.
// ─────────────────────────────────────────────────────────────────────────────

const rateLimiter = createRateLimiter(5, 60_000); // 5 submissions per minute per IP
const ENDPOINT = '/api/contact';

// Lazy: `new Resend(undefined)` throws, and at module scope that would 500 the
// route instead of falling through to the guarded skip below.
let resendClient: Resend | null = null;
function resend(): Resend {
  resendClient ??= new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

const ENQUIRY_INBOX = process.env.ADMIN_EMAIL ?? CONTACT_EMAIL;

/** Escape for HTML text and double-quoted attribute contexts. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function enquiryEmail(d: { name: string; email: string; phone: string; message: string }) {
  const when = new Date().toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const row = (label: string, value: string, href?: string) => `
      <tr>
        <td style="padding:10px 0;color:#8CA3BF;font-size:13px;width:90px;vertical-align:top;">${esc(label)}</td>
        <td style="padding:10px 0;color:#ffffff;font-size:15px;font-weight:600;">
          ${href ? `<a href="${esc(href)}" style="color:#F5C518;text-decoration:none;">${esc(value)}</a>` : esc(value)}
        </td>
      </tr>`;

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#061F36;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#0D3559;border:1px solid rgba(59,130,246,.25);border-radius:16px;overflow:hidden;">
    <div style="padding:22px 26px;border-bottom:1px solid rgba(59,130,246,.2);">
      <div style="color:#F5C518;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">New website enquiry</div>
      <div style="color:#ffffff;font-size:20px;font-weight:700;margin-top:6px;">${esc(d.name)}</div>
    </div>
    <div style="padding:8px 26px 4px;">
      <table style="width:100%;border-collapse:collapse;">
        ${d.email ? row('Email', d.email, `mailto:${d.email}`) : ''}
        ${d.phone ? row('Phone', d.phone, `tel:${d.phone}`) : ''}
        ${row('Sent', when)}
      </table>
    </div>
    <div style="padding:6px 26px 26px;">
      <div style="color:#8CA3BF;font-size:13px;margin-bottom:8px;">Message</div>
      <div style="background:#072B4A;border:1px solid rgba(59,130,246,.2);border-radius:12px;padding:16px;color:#ffffff;font-size:15px;line-height:1.6;white-space:pre-wrap;">${esc(d.message)}</div>
    </div>
    ${d.email ? `<div style="padding:0 26px 26px;"><a href="mailto:${esc(d.email)}" style="display:inline-block;background:#F5C518;color:#072B4A;font-weight:700;font-size:14px;padding:12px 24px;border-radius:100px;text-decoration:none;">Reply to ${esc(d.name)}</a></div>` : ''}
    <div style="text-align:center;padding:14px;color:#2A4A6C;font-size:11px;">
      PT Launch Lab · /contact form
    </div>
  </div>
</body>
</html>`;

  const text = [
    `New website enquiry from ${d.name}`,
    d.email ? `Email: ${d.email}` : null,
    d.phone ? `Phone: ${d.phone}` : null,
    `Sent: ${when}`,
    '',
    d.message,
  ].filter(Boolean).join('\n');

  return { html, text };
}

export async function POST(request: NextRequest) {
  const ip = getIP(request);
  if (!rateLimiter(ip)) {
    logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'blocked-silent', signals: ['rate-limit'], ip });
    return NextResponse.json({ success: false, error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }

  const result = validateContact(raw);
  if (!result.ok) {
    if (result.silent) {
      // Silent drop — return success so bots don't learn what tripped them.
      logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'blocked-silent', signals: result.signals, ip, ua: request.headers.get('user-agent') });
      return NextResponse.json({ success: true });
    }
    logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'blocked-user', signals: result.signals, ip });
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  const { name, email, phone, message } = result.data;

  // ── 1. Email the enquiry to the team inbox. This is the delivery that
  //       matters — replying to it reaches the sender directly.
  let delivered = false;
  if (process.env.RESEND_API_KEY) {
    try {
      const { html, text } = enquiryEmail({ name, email, phone, message });
      await resend().emails.send({
        from: 'PT Launch Lab Website <enquiries@ptlaunchlab.co.uk>',
        to: ENQUIRY_INBOX,
        // Hitting Reply in the inbox answers the enquirer, not the robot.
        replyTo: email || undefined,
        subject: `New enquiry: ${name}`,
        html,
        text,
      });
      delivered = true;
    } catch (err) {
      console.error('[contact] level:lead-lost — enquiry email failed:', err);
    }
  } else {
    console.error('[contact] level:lead-lost — RESEND_API_KEY not set, cannot email the enquiry.');
  }

  // ── 2. Mirror to Zapier → Google Sheets, when configured. Secondary: a
  //       Zapier outage must not lose an enquiry the email already delivered,
  //       but a silent non-200 from Zapier shouldn't look like a success either.
  const webhookUrl = process.env.CONTACT_ZAPIER_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, phone, message, submitted_at: new Date().toISOString() }),
        signal:  AbortSignal.timeout(8_000),
      });
      if (res.ok) {
        delivered = true;
      } else {
        console.error('[contact] Zapier rejected the enquiry:', res.status);
      }
    } catch (err) {
      console.error('[contact] Zapier push failed:', err);
    }
  }

  // ── 3. Hand the enquiry to the setter, which opens a real conversation by
  //       email. Already fire-and-forget and no-ops when unconfigured.
  await notifySetter({ name, email, message, source: 'contact' });

  if (!delivered) {
    // Nothing got through. Say so, rather than showing a tick for an enquiry
    // that reached nobody — the page offers the phone number as a fallback.
    logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'blocked-user', signals: ['undelivered'], ip });
    return NextResponse.json(
      { success: false, error: "We couldn't send your message just now. Please call us instead — we'd rather hear from you than lose this." },
      { status: 502 }
    );
  }

  logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'accepted', signals: [], ip, email_domain: email ? email.split('@')[1] : null });
  return NextResponse.json({ success: true });
}
