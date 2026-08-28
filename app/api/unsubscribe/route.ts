import { NextRequest, NextResponse } from 'next/server';
import { mlUnsubscribe } from '@/app/lib/mailerlite';

// ─────────────────────────────────────────────────────────────────────────────
// Unsubscribe — POST only, deliberately.
//
// This mutates state, so it must not be a GET. Email clients, corporate spam
// filters and link scanners routinely prefetch GET links in a message; a GET
// unsubscribe would silently drop people who never clicked anything. The
// /unsubscribe page issues this POST from a form the human submits.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let email = '';
  let oneClick = false;

  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({}));
    email = typeof body.email === 'string' ? body.email : '';
  } else {
    // Read as text rather than formData so we can spot the RFC 8058 marker.
    // urlencoded form posts parse identically through URLSearchParams.
    const raw = await req.text().catch(() => '');
    if (raw.includes('List-Unsubscribe=One-Click')) oneClick = true;
    email = new URLSearchParams(raw).get('email') || '';
  }

  // RFC 8058 one-click carries nothing in the body but the marker, so the
  // address has to come from the URL. Prefer it outright for one-click rather
  // than merely falling back, so a non-conformant body cannot override it.
  const queryEmail = req.nextUrl.searchParams.get('email') || '';
  if (oneClick) email = queryEmail;
  else if (!email) email = queryEmail;

  email = email.trim().toLowerCase();

  // Loose check only. The point is to reject junk, not to police RFC 5322 —
  // a real address that fails a clever regex must never be blocked from leaving.
  if (!email || !email.includes('@') || email.length > 320) {
    if (oneClick) return new NextResponse('Missing or invalid address', { status: 400 });
    return NextResponse.redirect(new URL('/unsubscribe?error=1', req.url), 303);
  }

  try {
    await mlUnsubscribe(email);
  } catch (err) {
    console.error('[unsubscribe] level:send-blocked — MailerLite update failed:', email, err);
    // Do not report success we did not achieve. A recipient who believes they
    // unsubscribed and keeps receiving mail reaches for the spam button instead.
    if (oneClick) return new NextResponse('Unsubscribe failed', { status: 500 });
    return NextResponse.redirect(new URL('/unsubscribe?error=1', req.url), 303);
  }

  // Mail clients want a plain 2xx; they have no browser to follow a redirect.
  if (oneClick) return new NextResponse('Unsubscribed', { status: 200 });

  // 303 so the browser follows with a GET and a refresh cannot re-POST.
  return NextResponse.redirect(new URL('/unsubscribe?done=1', req.url), 303);
}
