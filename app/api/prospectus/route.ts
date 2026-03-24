import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/prospectus
// Captures prospectus download leads → Zapier → Google Sheets
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Please fill in all fields.' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[prospectus]', err);
    return NextResponse.json(
      { success: false, error: 'Server error.' },
      { status: 500 }
    );
  }
}
