import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, getIP } from '@/app/lib/rate-limit';
import { validateReferral } from '@/app/lib/security/validate';
import { logSec } from '@/app/lib/security/log';
import { getSupabaseAdmin } from '@/app/lib/supabase-admin';
import { notifySetter } from '@/app/lib/setter-intake';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/refer
//
// A learner refers someone. £200 to them if that person enrols.
//
// Unlike /api/contact, this does NOT forward to Zapier and forget. A referral
// is a payment promise, so the row is the point: it has to be queryable months
// later when someone asks "who referred this learner, and did we pay them?".
// The Zapier→Sheets route would make this the seventh system that disagrees
// with the other six about PTLL customers.
//
// A duplicate (same referrer, same referred email) is answered with success.
// Telling someone "you already referred them" is noise — they know, and the
// unique index has already done the real work.
// ─────────────────────────────────────────────────────────────────────────────

const rateLimiter = createRateLimiter(5, 60_000); // 5 per minute per IP
const ENDPOINT = '/api/refer';

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

  const result = validateReferral(raw);
  if (!result.ok) {
    if (result.silent) {
      // Silent drop — 200 so bots don't learn what tripped them.
      logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'blocked-silent', signals: result.signals, ip, ua: request.headers.get('user-agent') });
      return NextResponse.json({ success: true });
    }
    logSec({ level: 'security', endpoint: ENDPOINT, outcome: 'blocked-user', signals: result.signals, ip });
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  const r = result.data;

  try {
    const { error } = await getSupabaseAdmin()
      .from('referrals')
      .insert({
        referrer_email: r.referrer_email,
        referrer_name: r.referrer_name || null,
        referred_name: r.referred_name,
        referred_email: r.referred_email || null,
        referred_phone: r.referred_phone || null,
        note: r.note || null,
        source: 'nurture-email',
      });

    // 23505 = unique violation, i.e. they already referred this person.
    // Not an error from the referrer's point of view.
    if (error && error.code !== '23505') {
      console.error('[refer] insert failed', error);
      return NextResponse.json(
        { success: false, error: 'Something went wrong saving that. Please message us on WhatsApp instead.' },
        { status: 500 }
      );
    }

    if (!error) {
      // Best effort — a failed notification must never lose the row, which is
      // already committed above.
      try {
        await notifySetter({
          name: r.referred_name,
          email: r.referred_email || r.referrer_email,
          message:
            `REFERRAL (£200 due to referrer on enrolment)\n` +
            `Referred by: ${r.referrer_name || '(no name given)'} <${r.referrer_email}>\n` +
            `Their phone: ${r.referred_phone || '—'}\n` +
            `Note: ${r.note || '—'}`,
          source: 'learner-referral',
        });
      } catch (notifyErr) {
        console.error('[refer] notify failed, row is saved', notifyErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[refer] unexpected', err);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please message us on WhatsApp instead.' },
      { status: 500 }
    );
  }
}
