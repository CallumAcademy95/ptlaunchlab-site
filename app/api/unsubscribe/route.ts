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

  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({}));
    email = typeof body.email === 'string' ? body.email : '';
  } else {
    const form = await req.formData().catch(() => null);
    const value = form?.get('email');
    email = typeof value === 'string' ? value : '';
  }

  email = email.trim().toLowerCase();

  // Loose check only. The point is to reject junk, not to police RFC 5322 —
  // a real address that fails a clever regex must never be blocked from leaving.
  if (!email || !email.includes('@') || email.length > 320) {
    return NextResponse.redirect(new URL('/unsubscribe?error=1', req.url), 303);
  }

  try {
    await mlUnsubscribe(email);
  } catch (err) {
    console.error('[unsubscribe] level:send-blocked — MailerLite update failed:', email, err);
    return NextResponse.redirect(new URL('/unsubscribe?error=1', req.url), 303);
  }

  // 303 so the browser follows with a GET and a refresh cannot re-POST.
  return NextResponse.redirect(new URL('/unsubscribe?done=1', req.url), 303);
}
