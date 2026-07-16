import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, getIP } from '@/app/lib/rate-limit';
import { validateGymPartnership } from '@/app/lib/security/validate';
import { logSec } from '@/app/lib/security/log';
import { sendCapiEvent, extractRequestUserData, deterministicEventId } from '@/app/lib/metaCapi';

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
      // Look successful, but signal lead:false so the browser doesn't fire a
      // Meta Lead for honeypot/junk. Mirrors the career-planner contract.
      return NextResponse.json({ success: true, lead: false });
    }
    logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'blocked-user', signals: result.signals, ip });
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  try {
    const { gymName, name, email, phone, location, gymSize, referredBy } = result.data;
    const webhookUrl = process.env.GYM_PARTNERSHIP_ZAPIER_WEBHOOK_URL;

    if (!webhookUrl) {
      // No sink configured means the application goes nowhere. Never tell the
      // applicant it was received.
      console.error('[gym-partnership] level:lead-lost — GYM_PARTNERSHIP_ZAPIER_WEBHOOK_URL not set.');
      return NextResponse.json(
        { success: false, error: "We couldn't submit your application — please email partnerships@ptlaunchlab.co.uk." },
        { status: 500 },
      );
    }

    const payload = {
      gym_name: gymName,
      name,
      email,
      phone,
      location,
      gym_size: gymSize,
      referred_by: referredBy,
      submitted_at: new Date().toISOString(),
    };

    // Mirrors the career-planner push: retry once, and surface a real failure to
    // the applicant rather than returning success for a lead we didn't capture.
    const push = async (attempt = 1): Promise<boolean> => {
      try {
        const r = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error(`Zapier ${r.status}`);
        return true;
      } catch (err) {
        if (attempt < 2) return push(attempt + 1);
        console.error('[gym-partnership] level:lead-lost — Zapier push failed after retry:', email, err);
        return false;
      }
    };

    if (!(await push())) {
      return NextResponse.json(
        { success: false, error: "We couldn't submit your application — please email partnerships@ptlaunchlab.co.uk." },
        { status: 502 },
      );
    }

    logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'accepted', signals: [], ip, email_domain: email.split('@')[1] });

    // Meta CAPI Lead — this is the event the gym-partnership campaign
    // (52550722458518) optimises on. Paired with the browser fbq Lead via a
    // shared event_id so the two dedup on Meta's side. fbc/fbp/IP/UA are pulled
    // from the request cookies (the Pixel sets _fbc from ?fbclid on landing) so
    // the click can be attributed back to the ad.
    const rawEventId =
      typeof (raw as Record<string, unknown>)?.event_id === 'string'
        ? ((raw as Record<string, unknown>).event_id as string).slice(0, 64)
        : null;
    const eventId = rawEventId || deterministicEventId('gym_partnership_lead', email);
    const [firstName, ...rest] = (name || '').split(/\s+/);
    void sendCapiEvent({
      eventName: 'Lead',
      eventId,
      eventSourceUrl: request.headers.get('referer') || 'https://ptlaunchlab.co.uk/gym-partnership',
      userData: {
        email,
        phone,
        firstName,
        lastName: rest.join(' '),
        country: 'gb',
        ...extractRequestUserData(request),
      },
      customData: {
        currency: 'GBP',
        value: 0, // lead signal, not the £500/learner value
        contentName: 'gym_partnership',
        contentCategory: 'b2b_partner',
      },
    });

    return NextResponse.json({ success: true, lead: true });
  } catch (err) {
    console.error('[gym-partnership]', err);
    return NextResponse.json({ success: false, error: 'Server error.' }, { status: 500 });
  }
}
