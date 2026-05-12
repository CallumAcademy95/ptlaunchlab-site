import { NextRequest, NextResponse } from 'next/server';
import { attachPromoCookie } from '@/app/lib/funnelPromo';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/youtube-subscribe
// Honor-system YouTube subscribe funnel. After the user clicks the subscribe
// button on /youtube-discount and confirms they subscribed, they submit their
// email here to unlock the £200 promo. Forwards to Zapier so the YouTube
// audience growth + lead capture both land in the existing Sheets pipeline.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone } = body;

    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: 'Please enter your name and email.' },
        { status: 400 },
      );
    }

    // Reuse the prospectus Zapier hook if a YouTube-specific one isn't set —
    // both end up in the same Sheet/MailerLite pipeline anyway, and the
    // payload's `source: youtube_subscribe` field lets the Zap branch logic
    // route accordingly.
    const webhookUrl =
      process.env.YOUTUBE_ZAPIER_WEBHOOK_URL ||
      process.env.PROSPECTUS_ZAPIER_WEBHOOK_URL;

    if (webhookUrl) {
      const payload = {
        name,
        email,
        phone: phone || '',
        source: 'youtube_subscribe',
        submitted_at: new Date().toISOString(),
      };
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      console.warn('[youtube-subscribe] no webhook configured — skipping.');
    }

    // Add to nurture sequence (non-blocking)
    const emailServerUrl = process.env.EMAIL_SERVER_URL;
    if (emailServerUrl) {
      fetch(`${emailServerUrl}/leads/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, source: 'youtube' }),
      }).catch((err) => console.error('[youtube-subscribe] email server error:', err));
    }

    const response = NextResponse.json({ success: true });
    try {
      attachPromoCookie(response, 'youtube');
    } catch (err) {
      console.warn('[youtube-subscribe] promo cookie not set:', err);
    }
    return response;
  } catch (err) {
    console.error('[youtube-subscribe]', err);
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 },
    );
  }
}
