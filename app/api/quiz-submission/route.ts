import { NextRequest, NextResponse } from 'next/server';
import { after } from "next/server";
import { createRateLimiter, getIP } from '@/app/lib/rate-limit';
import { attachPromoCookie } from '@/app/lib/funnelPromo';
import { validateQuiz } from '@/app/lib/security/validate';
import { logSec } from '@/app/lib/security/log';
import { sendCapiEvent, extractRequestUserData, deterministicEventId } from '@/app/lib/metaCapi';
import { notifySetter } from '@/app/lib/setter-intake';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/quiz-submission
// Forwards quiz leads to Zapier → Google Sheets
// ─────────────────────────────────────────────────────────────────────────────

const rateLimiter = createRateLimiter(5, 60_000); // 5 submissions per minute per IP
const ENDPOINT = '/api/quiz-submission';

const resultLabels: Record<string, string> = {
  onFloor:          'On-Floor PT Path',
  online:           'Online Coach Path',
  hybrid:           'Hybrid Coach Path',
  alreadyQualified: 'Already Qualified — Needs Direction',
};

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

  const result = validateQuiz(raw);
  if (!result.ok) {
    if (result.silent) {
      logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'blocked-silent', signals: result.signals, ip, ua: request.headers.get('user-agent') });
      // Silent bot/spam block: look successful to the client but signal lead:false
      // so the browser does NOT fire Lead/quiz_complete for junk submissions.
      return NextResponse.json({ success: true, lead: false });
    }
    logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'blocked-user', signals: result.signals, ip });
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  try {
    const { name, phone, email, result: quizResult, avatar, answers } = result.data;
    const webhookUrl = process.env.QUIZ_ZAPIER_WEBHOOK_URL;

    if (webhookUrl) {
      const payload = {
        name,
        email,
        phone,
        quiz_result:  resultLabels[quizResult] ?? quizResult,
        avatar:       avatar ?? '',
        answers:      Array.isArray(answers) ? answers.map((a) => a.label).join(' | ') : '',
        source:       avatar ? `quiz-funnel:${avatar}` : 'quiz-funnel',
        submitted_at: new Date().toISOString(),
      };

      // Resilient push — a Zapier blip must not 500 the submission or silently
      // lose the lead. Retry once, then log loudly so it's recoverable from the
      // server logs (search `level:lead-lost`). The CAPI Lead + email-server
      // calls below still run regardless, so the conversion signal survives.
      const pushToZapier = async (attempt = 1): Promise<void> => {
        try {
          const r = await fetch(webhookUrl, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
          });
          if (!r.ok) throw new Error(`Zapier responded ${r.status}`);
        } catch (err) {
          if (attempt < 2) return pushToZapier(attempt + 1);
          console.error('[quiz-submission] level:lead-lost — Zapier push failed after retry, lead may be missing from MailerLite:', payload.email, err);
        }
      };
      await pushToZapier();
    } else {
      console.warn('[quiz-submission] QUIZ_ZAPIER_WEBHOOK_URL not set — skipping.');
    }

    // Add to nurture sequence starting day 7 (after Miles' warmup emails finish)
    const emailServerUrl = process.env.EMAIL_SERVER_URL;
    if (emailServerUrl) {
      fetch(`${emailServerUrl}/leads/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, source: 'quiz', quizResult: resultLabels[quizResult] ?? quizResult, avatar: avatar ?? null }),
      }).catch(err => console.error('[quiz] email server error:', err));
    }

    // Open a real conversation instead of a one-way drip: the setter sends one
    // warm, reply-inviting email and takes over the reply. (Replaces the old
    // warmup sequence; the day-7 nurture above stays as a fallback for non-repliers.)
    await notifySetter({ name, email, source: 'quiz' });

    logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'accepted', signals: [], ip, email_domain: email.split('@')[1] });

    // Meta Conversions API — server-side Lead event paired with the browser
    // fbq Lead via event_id for dedup. event_id is provided by the client
    // (QuizApp.tsx) so both sides match; if absent we generate a deterministic
    // one from email + result for retry/idempotency.
    const rawEventId = typeof (raw as Record<string, unknown>)?.event_id === 'string'
      ? ((raw as Record<string, unknown>).event_id as string).slice(0, 64)
      : null;
    const eventId = rawEventId || deterministicEventId('quiz_lead', email, quizResult);
    const [firstName, ...rest] = (name || '').split(/\s+/);
    const lastName = rest.join(' ');
    after(() => sendCapiEvent({
      eventName: 'Lead',
      eventId,
      eventSourceUrl: request.headers.get('referer') || 'https://ptlaunchlab.co.uk/quiz',
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
        value: 0,                // lead value — not the course price, just a Lead signal
        contentName: quizResult, // result key (onFloor / online / hybrid / alreadyQualified)
        contentCategory: avatar ?? undefined,
      },
    }));

    const response = NextResponse.json({ success: true, lead: true });
    try {
      attachPromoCookie(response, 'quiz');
    } catch (err) {
      console.warn('[quiz-submission] promo cookie not set:', err);
    }
    return response;
  } catch (err) {
    console.error('[quiz-submission]', err);
    return NextResponse.json(
      { success: false, error: 'Server error.' },
      { status: 500 }
    );
  }
}
