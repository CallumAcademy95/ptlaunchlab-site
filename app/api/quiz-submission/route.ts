import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, getIP } from '@/app/lib/rate-limit';
import { attachPromoCookie } from '@/app/lib/funnelPromo';
import { validateQuiz } from '@/app/lib/security/validate';
import { logSec } from '@/app/lib/security/log';

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
      return NextResponse.json({ success: true });
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

      await fetch(webhookUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
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

    // Trigger Claude warming email sequence (non-blocking)
    const baseUrl = request.nextUrl.origin;
    fetch(`${baseUrl}/api/send-warmup-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        result: quizResult,
        avatar: avatar ?? null,
        answers: Array.isArray(answers) ? answers.map((a) => a.label) : [],
      }),
    }).catch(err => console.error('[warmup-email trigger]', err));

    logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'accepted', signals: [], ip, email_domain: email.split('@')[1] });
    const response = NextResponse.json({ success: true });
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
