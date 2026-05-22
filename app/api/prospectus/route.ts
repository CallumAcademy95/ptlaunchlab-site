import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, getIP } from '@/app/lib/rate-limit';
import { attachPromoCookie } from '@/app/lib/funnelPromo';
import { validateProspectus } from '@/app/lib/security/validate';
import { logSec } from '@/app/lib/security/log';

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

    logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'accepted', signals: [], ip, email_domain: email.split('@')[1] });
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
