import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, getIP } from '@/app/lib/rate-limit';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/quiz-submission
// Forwards quiz leads to Zapier → Google Sheets
// ─────────────────────────────────────────────────────────────────────────────

const rateLimiter = createRateLimiter(5, 60_000); // 5 submissions per minute per IP

const resultLabels: Record<string, string> = {
  onFloor:          'On-Floor PT Path',
  online:           'Online Coach Path',
  hybrid:           'Hybrid Coach Path',
  alreadyQualified: 'Already Qualified — Needs Direction',
};

export async function POST(request: NextRequest) {
  if (!rateLimiter(getIP(request))) {
    return NextResponse.json({ success: false, error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { name, phone, email, result, answers } = body;

    if (!name || !phone || !email || !result) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.QUIZ_ZAPIER_WEBHOOK_URL;

    if (webhookUrl) {
      const payload = {
        name,
        email,
        phone,
        quiz_result:  resultLabels[result] ?? result,
        answers:      Array.isArray(answers) ? answers.map((a: { label: string }) => a.label).join(' | ') : '',
        source:       'quiz-funnel',
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
        body: JSON.stringify({ name, email, phone, source: 'quiz', quizResult: resultLabels[result] ?? result }),
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
        result,
        answers: Array.isArray(answers) ? answers.map((a: { label: string }) => a.label) : [],
      }),
    }).catch(err => console.error('[warmup-email trigger]', err));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[quiz-submission]', err);
    return NextResponse.json(
      { success: false, error: 'Server error.' },
      { status: 500 }
    );
  }
}
