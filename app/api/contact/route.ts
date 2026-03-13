import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/contact
// Forwards contact form submissions to Zapier → Google Sheets
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    if (!name || !message || (!email && !phone)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.CONTACT_ZAPIER_WEBHOOK_URL;

    if (webhookUrl) {
      const payload = {
        name,
        email:        email || '',
        phone:        phone || '',
        message,
        submitted_at: new Date().toISOString(),
      };

      fetch(webhookUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      }).catch((err) => console.error('[contact] Zapier push failed:', err));
    } else {
      console.warn('[contact] CONTACT_ZAPIER_WEBHOOK_URL not set — skipping.');
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[contact]', err);
    return NextResponse.json(
      { success: false, error: 'Server error.' },
      { status: 500 }
    );
  }
}
