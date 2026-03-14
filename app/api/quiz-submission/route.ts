import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/quiz-submission
// Forwards quiz leads to Zapier → Google Sheets
// ─────────────────────────────────────────────────────────────────────────────

const resultLabels: Record<string, string> = {
  onFloor:          'On-Floor PT Path',
  online:           'Online Coach Path',
  hybrid:           'Hybrid Coach Path',
  alreadyQualified: 'Already Qualified — Needs Direction',
};

export async function POST(request: NextRequest) {
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[quiz-submission]', err);
    return NextResponse.json(
      { success: false, error: 'Server error.' },
      { status: 500 }
    );
  }
}
