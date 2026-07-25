import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, getIP } from '@/app/lib/rate-limit';
import { attachPromoCookie } from '@/app/lib/funnelPromo';
import { validateProspectus } from '@/app/lib/security/validate';
import { logSec } from '@/app/lib/security/log';
import { sendCapiEvent, extractRequestUserData, deterministicEventId } from '@/app/lib/metaCapi';
import { notifySetter } from '@/app/lib/setter-intake';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/prospectus
// Captures prospectus download leads → Zapier → Google Sheets
// ─────────────────────────────────────────────────────────────────────────────

const rateLimiter = createRateLimiter(5, 60_000); // 5 submissions per minute per IP
const ENDPOINT = '/api/prospectus';

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

  const result = validateProspectus(raw);
  if (!result.ok) {
    if (result.silent) {
      logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'blocked-silent', signals: result.signals, ip, ua: request.headers.get('user-agent') });
      return NextResponse.json({ success: true });
    }
    logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'blocked-user', signals: result.signals, ip });
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  try {
    const { name, email, phone } = result.data;
    const webhookUrl = process.env.PROSPECTUS_ZAPIER_WEBHOOK_URL;

    if (webhookUrl) {
      const payload = {
        name,
        email,
        phone,
        source:       'prospectus_download',
        submitted_at: new Date().toISOString(),
      };

      await fetch(webhookUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
    } else {
      console.warn('[prospectus] PROSPECTUS_ZAPIER_WEBHOOK_URL not set — skipping.');
    }

    // Add to email nurture sequence (non-blocking)
    const emailServerUrl = process.env.EMAIL_SERVER_URL;
    if (emailServerUrl) {
      fetch(`${emailServerUrl}/leads/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, source: 'prospectus' }),
      }).catch(err => console.error('[prospectus] email server error:', err));
    }

    // Spark a conversation: the setter sends one warm, reply-inviting email and
    // takes over the reply. (The day-7 nurture above stays as a fallback.)
    await notifySetter({ name, email, source: 'prospectus' });

    logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'accepted', signals: [], ip, email_domain: email.split('@')[1] });

    // Meta CAPI — server-side Lead. Dedups with the browser fbq Lead via the
    // client-provided event_id (or a deterministic fallback).
    const rawObj = raw as Record<string, unknown> | null;
    const rawEventId = typeof rawObj?.event_id === 'string' ? (rawObj.event_id as string).slice(0, 64) : null;
    const rawAvatar = typeof rawObj?.avatar === 'string' ? (rawObj.avatar as string).slice(0, 24) : undefined;
    const eventId = rawEventId || deterministicEventId('prospectus_lead', email);
    const [firstName, ...rest] = (name || '').split(/\s+/);
    const lastName = rest.join(' ');
    void sendCapiEvent({
      eventName: 'Lead',
      eventId,
      eventSourceUrl: request.headers.get('referer') || 'https://ptlaunchlab.co.uk/',
      userData: {
        email,
        phone,
        firstName,
        lastName,
        country: 'gb',
        ...extractRequestUserData(request),
      },
      customData: {
        currency: 'GBP',
        value: 0,
        contentName: 'prospectus_download',
        contentCategory: rawAvatar,
      },
    });

    const response = NextResponse.json({ success: true });
    try {
      attachPromoCookie(response, 'prospectus');
    } catch (err) {
      console.warn('[prospectus] promo cookie not set:', err);
    }
    return response;
  } catch (err) {
    console.error('[prospectus]', err);
    return NextResponse.json(
      { success: false, error: 'Server error.' },
      { status: 500 }
    );
  }
}
