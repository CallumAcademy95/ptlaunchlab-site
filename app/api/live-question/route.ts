import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, getIP } from '@/app/lib/rate-limit';
import { validateLiveQuestion } from '@/app/lib/security/validate';
import { logSec } from '@/app/lib/security/log';
import { EVENT } from '@/app/live/event';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/live-question
//
// Pre-submitted questions for the monthly live panel (the /ask page, linked
// from the confirmation + reminder emails). Deliberately NOT part of the
// registration form — keeping the signup to name+email protects the mailing-
// list conversion. Forwards to the same Zapier pipeline tagged
// `source: live-question` + the current event, so questions land alongside the
// leads for the host to review and pick the best before going live.
//
// No CAPI here — the person is already a registered lead; this is content, not
// a conversion signal.
// ─────────────────────────────────────────────────────────────────────────────

const rateLimiter = createRateLimiter(8, 60_000); // 8 / min / IP
const ENDPOINT = '/api/live-question';

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

  const result = validateLiveQuestion(raw);
  if (!result.ok) {
    if (result.silent) {
      logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'blocked-silent', signals: result.signals, ip, ua: request.headers.get('user-agent') });
      return NextResponse.json({ success: true });
    }
    logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'blocked-user', signals: result.signals, ip });
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  try {
    const { name, email, question } = result.data;

    const webhookUrl =
      process.env.LIVE_ZAPIER_WEBHOOK_URL ||
      process.env.PROSPECTUS_ZAPIER_WEBHOOK_URL;

    if (webhookUrl) {
      const payload = {
        name: name || '',
        email,
        question,
        source: 'live-question',
        event: `#${EVENT.number} — ${EVENT.title}`,
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
          console.error('[live-question] level:lead-lost — Zapier push failed after retry:', email, err);
        }
      };
      await pushToZapier();
    } else {
      console.warn('[live-question] no webhook configured — skipping.');
    }

    logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'accepted', signals: [], ip, email_domain: email.split('@')[1] });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[live-question]', err);
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 },
    );
  }
}
