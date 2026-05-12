import { NextRequest, NextResponse } from 'next/server';
import { attachPromoCookie } from '@/app/lib/funnelPromo';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/salary-calculator
// Captures email after the salary-calculator preliminary result is shown,
// then unlocks the full projection + 48h £200 promo via the cookie.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, inputs, results } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Please enter your name and email.' },
        { status: 400 },
      );
    }

    const webhookUrl =
      process.env.SALARY_CALC_ZAPIER_WEBHOOK_URL ||
      process.env.PROSPECTUS_ZAPIER_WEBHOOK_URL;

    if (webhookUrl) {
      const payload = {
        name,
        email,
        phone: phone || '',
        source: 'salary_calculator',
        // Persist a snapshot of what the user entered + saw so the admin
        // notification has full context without having to re-run the calc.
        employment: inputs?.employment ?? '',
        region: inputs?.region ?? '',
        experience: inputs?.experience ?? '',
        hours_per_week: inputs?.hoursPerWeek ?? '',
        projected_year1: results?.year1 ?? '',
        projected_year2_3: results?.year2_3 ?? '',
        projected_year4plus: results?.year4plus ?? '',
        submitted_at: new Date().toISOString(),
      };
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      console.warn('[salary-calculator] no webhook configured — skipping.');
    }

    const emailServerUrl = process.env.EMAIL_SERVER_URL;
    if (emailServerUrl) {
      fetch(`${emailServerUrl}/leads/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, source: 'salary_calculator' }),
      }).catch((err) => console.error('[salary-calculator] email server error:', err));
    }

    const response = NextResponse.json({ success: true });
    try {
      attachPromoCookie(response, 'salary-calculator');
    } catch (err) {
      console.warn('[salary-calculator] promo cookie not set:', err);
    }
    return response;
  } catch (err) {
    console.error('[salary-calculator]', err);
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 },
    );
  }
}
