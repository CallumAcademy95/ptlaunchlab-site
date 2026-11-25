import { NextRequest, NextResponse } from 'next/server';
import { getIP } from '@/app/lib/rate-limit';
import { logSec } from '@/app/lib/security/log';

// Retired 25 Nov 2026. PartnershipForm saves through /api/lead (intent gym_partnership),
// which stores the lead and runs the spam gates. Nothing on the site posts here any more,
// but bots that learned this address kept posting random-text "gyms" straight to Zapier
// and a Meta CAPI Lead. Look successful so they don't adapt; send nothing anywhere.
// (/api/gym-partnership/sign is a separate, live route.)
export async function POST(request: NextRequest) {
  logSec({ level: 'security', endpoint: '/api/gym-partnership', outcome: 'blocked-silent', signals: ['retired-route'], ip: getIP(request), ua: request.headers.get('user-agent') });
  return NextResponse.json({ success: true, lead: false });
}
