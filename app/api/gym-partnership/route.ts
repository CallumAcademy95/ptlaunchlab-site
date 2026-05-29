import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, getIP } from '@/app/lib/rate-limit';
import { validateGymPartnership } from '@/app/lib/security/validate';
import { logSec } from '@/app/lib/security/log';

const rateLimiter = createRateLimiter(3, 60_000);
const ENDPOINT = '/api/gym-partnership';

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

  const result = validateGymPartnership(raw);
  if (!result.ok) {
    if (result.silent) {
      logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'blocked-silent', signals: result.signals, ip, ua: request.headers.get('user-agent') });
      return NextResponse.json({ success: true });
    }
    logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'blocked-user', signals: result.signals, ip });
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  try {
    const { gymName, name, email, phone, location, gymSize, referredBy } = result.data;
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
          gym_size: gymSize,
          referred_by: referredBy,
          submitted_at: new Date().toISOString(),
        }),
      });
    } else {
      console.warn('[gym-partnership] GYM_PARTNERSHIP_ZAPIER_WEBHOOK_URL not set — skipping.');
    }

    logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'accepted', signals: [], ip, email_domain: email.split('@')[1] });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[gym-partnership]', err);
    return NextResponse.json({ success: false, error: 'Server error.' }, { status: 500 });
  }
}
