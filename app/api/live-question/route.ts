import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, getIP } from '@/app/lib/rate-limit';
import { validateLiveQuestion } from '@/app/lib/security/validate';
import { logSec } from '@/app/lib/security/log';
import { EVENT } from '@/app/live/event';
import { getSupabaseAdmin } from '@/app/lib/supabase-admin';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/live-question
//
// Pre-submitted questions for the monthly live panel (the /ask page, linked
// from the confirmation + reminder emails). Deliberately NOT part of the
// registration form — keeping the signup to name+email protects the mailing-
// list conversion.
//
// Saves to the live_questions table; the host reads + triages them on
// /admin/live-questions before going live. No MailerLite add here on purpose —
// anyone reaching /ask came from a confirmation/reminder email, so they are
// already on the "Live Sessions" list (subscribed at registration).
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
    const eventLabel = `#${EVENT.number} — ${EVENT.title}`;

    const { error } = await getSupabaseAdmin().from('live_questions').insert({
      name: name || null,
      email,
      question,
      event: eventLabel,
      source: 'live-question',
      ip,
    });
    if (error) {
      console.error('[live-question] level:lead-lost — Supabase insert failed:', email, error);
      return NextResponse.json(
        { success: false, error: 'Server error. Please try again.' },
        { status: 500 },
      );
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
