import { NextRequest, NextResponse } from 'next/server';
import { after } from "next/server";
import { createRateLimiter, getIP } from '@/app/lib/rate-limit';
import { validateLiveRegister } from '@/app/lib/security/validate';
import { logSec } from '@/app/lib/security/log';
import { sendCapiEvent, extractRequestUserData, deterministicEventId } from '@/app/lib/metaCapi';
import { mlAddSubscriber } from '@/app/lib/mailerlite';

// "Live Sessions" group in MailerLite. Override via env if it ever changes.
const LIVE_GROUP_ID = process.env.LIVE_MAILERLITE_GROUP_ID || '191617669489756012';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/live-register
//
// Registration gate for the monthly live webinar/podcast (the "Live Sessions"
// funnel). Captures the email into the dedicated MailerLite segment via the
// existing Zapier pipeline, fires a server-side CAPI Lead (paired with the
// browser fbq Lead via event_id), and returns the private stream link so the
// page can reveal it immediately — the gate is "email required, then open".
//
// The reminder sequence (instant link → T-24h → T-1h → live now → +1wk replay)
// is built in MailerLite, triggered when the lead lands in the segment.
//
// Env:
//   LIVE_ZAPIER_WEBHOOK_URL  Zapier hook → "Live Sessions" MailerLite group.
//                            Falls back to PROSPECTUS_ZAPIER_WEBHOOK_URL; the
//                            `source: live-webinar` field lets the Zap branch.
//   LIVE_STREAM_URL          Private Riverside audience/stream link returned to
//                            registrants. Update per event (or keep a permanent
//                            studio link).
// ─────────────────────────────────────────────────────────────────────────────

const rateLimiter = createRateLimiter(5, 60_000); // 5 submissions / min / IP
const ENDPOINT = '/api/live-register';

export async function POST(request: NextRequest) {
  const ip = getIP(request);
  if (!rateLimiter(ip)) {
    logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'blocked-silent', signals: ['rate-limit'], ip });
    return NextResponse.json({ success: false, error: 'Too many requests.' }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }

  const result = validateLiveRegister(raw);
  if (!result.ok) {
    if (result.silent) {
      logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'blocked-silent', signals: result.signals, ip, ua: request.headers.get('user-agent') });
      // Look successful to the bot, but lead:false so the browser skips the Lead fire.
      return NextResponse.json({ success: true, lead: false });
    }
    logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'blocked-user', signals: result.signals, ip });
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  try {
    const { name, email, phone } = result.data;
    const streamUrl = process.env.LIVE_STREAM_URL || '';

    // Primary: add straight into the "Live Sessions" MailerLite group via API.
    // Fallback: the legacy Zapier hook (if no MailerLite token is configured).
    // A blip here must not 500 the registration or lose the lead — retry once,
    // then log loudly (search `level:lead-lost`).
    if (process.env.MAILERLITE_TOKEN) {
      const pushToMailerLite = async (attempt = 1): Promise<void> => {
        try {
          await mlAddSubscriber({ email, name, phone: phone || undefined, groupId: LIVE_GROUP_ID });
        } catch (err) {
          if (attempt < 2) return pushToMailerLite(attempt + 1);
          console.error('[live-register] level:lead-lost — MailerLite add failed after retry:', email, err);
        }
      };
      await pushToMailerLite();
    } else {
      const webhookUrl =
        process.env.LIVE_ZAPIER_WEBHOOK_URL ||
        process.env.PROSPECTUS_ZAPIER_WEBHOOK_URL;
      if (webhookUrl) {
        const payload = {
          name,
          email,
          phone: phone || '',
          source: 'live-webinar',
          submitted_at: new Date().toISOString(),
        };
        const pushToZapier = async (attempt = 1): Promise<void> => {
          try {
            const r = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (!r.ok) throw new Error(`Zapier responded ${r.status}`);
          } catch (err) {
            if (attempt < 2) return pushToZapier(attempt + 1);
            console.error('[live-register] level:lead-lost — Zapier push failed after retry:', payload.email, err);
          }
        };
        await pushToZapier();
      } else {
        console.warn('[live-register] no MailerLite token or webhook configured — skipping.');
      }
    }

    logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'accepted', signals: [], ip, email_domain: email.split('@')[1] });

    // Meta CAPI Lead — paired with browser fbq Lead via event_id for dedup.
    const rawEventId = typeof (raw as Record<string, unknown>)?.event_id === 'string'
      ? ((raw as Record<string, unknown>).event_id as string).slice(0, 64)
      : null;
    const eventId = rawEventId || deterministicEventId('live_register', email, 'live-webinar');
    const [firstName, ...rest] = (name || '').split(/\s+/);
    const lastName = rest.join(' ');
    after(() => sendCapiEvent({
      eventName: 'Lead',
      eventId,
      eventSourceUrl: request.headers.get('referer') || 'https://ptlaunchlab.co.uk/live',
      userData: {
        email,
        phone: phone || undefined,
        firstName,
        lastName,
        country: 'gb',
        ...extractRequestUserData(request),
      },
      customData: {
        currency: 'GBP',
        value: 0,
        contentName: 'live_webinar_registration',
        contentCategory: 'live-sessions',
      },
    }));

    return NextResponse.json({ success: true, lead: true, streamUrl });
  } catch (err) {
    console.error('[live-register]', err);
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 },
    );
  }
}
