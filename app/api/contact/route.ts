import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, getIP } from '@/app/lib/rate-limit';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/contact
// Forwards contact form submissions to Zapier → Google Sheets
// ─────────────────────────────────────────────────────────────────────────────

const rateLimiter = createRateLimiter(5, 60_000); // 5 submissions per minute per IP

export async function POST(request: NextRequest) {
  if (!rateLimiter(getIP(request))) {
    return NextResponse.json({ success: false, error: 'Too many requests.' }, { status: 429 });
  }
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

      await fetch(webhookUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
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
