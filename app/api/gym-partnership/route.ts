import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, getIP } from '@/app/lib/rate-limit';

const rateLimiter = createRateLimiter(3, 60_000);

export async function POST(request: NextRequest) {
  if (!rateLimiter(getIP(request))) {
    return NextResponse.json({ success: false, error: 'Too many requests.' }, { status: 429 });
  }
  try {
    const body = await request.json();
    const { gymName, name, email, phone, location, gymSize } = body;

    if (!gymName || !name || !email || !phone || !location) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    const webhookUrl = process.env.GYM_PARTNERSHIP_ZAPIER_WEBHOOK_URL;

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gym_name: gymName,
          name,
          email,
          phone,
          location,
          gym_size: gymSize || '',
          submitted_at: new Date().toISOString(),
        }),
      });
    } else {
      console.warn('[gym-partnership] GYM_PARTNERSHIP_ZAPIER_WEBHOOK_URL not set — skipping.');
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[gym-partnership]', err);
    return NextResponse.json({ success: false, error: 'Server error.' }, { status: 500 });
  }
}
