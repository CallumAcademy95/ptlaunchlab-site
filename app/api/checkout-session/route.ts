// Reads back the gym attribution Stripe already holds for a completed checkout.
//
// /enrol/success used to recover the partner gym from localStorage, written on
// the gym's enrol page. That breaks whenever the browser that paid isn't the
// browser that finishes the form — pay on a phone, complete on a laptop, or
// clear storage in between — and the enrolment record then loses the gym even
// though Stripe knew it the whole time. The Google Sheet is populated from that
// form, so a lost gym there is a partner not getting credited.
//
// Stripe is the durable copy: gym_slug and gym_referral are in session metadata,
// and the client_reference_id payload carries them too.

import { NextRequest, NextResponse } from "next/server";
import { getCheckoutSession } from "@/app/lib/stripeCheckout";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";

export const dynamic = "force-dynamic";

const limiter = createRateLimiter(30, 60_000);

/** Stripe caps client_reference_id at 200 chars, so the JSON can arrive truncated. */
function decodeRef(raw?: string | null): Record<string, string> {
  if (!raw) return {};
  let decoded = "";
  try {
    const p = raw.replace(/-/g, "+").replace(/_/g, "/");
    decoded = Buffer.from(p + "=".repeat((4 - (p.length % 4)) % 4), "base64").toString("utf8");
  } catch {
    return {};
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === "object") return parsed as Record<string, string>;
  } catch {
    const out: Record<string, string> = {};
    for (const [, k, v] of decoded.matchAll(/"([a-z_]+)"\s*:\s*"([^"]*)"/g)) out[k] = v;
    return out;
  }
  return {};
}

export async function GET(req: NextRequest) {
  if (!limiter(getIP(req))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const id = req.nextUrl.searchParams.get("session_id") ?? "";
  // Session ids are long unguessable tokens — that unguessability is the access
  // control here, exactly as it is for Stripe's own hosted success pages. Shape
  // check first so we never forward junk to Stripe.
  if (!/^cs_(live|test)_[A-Za-z0-9]{20,}$/.test(id)) {
    return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
  }

  const session = await getCheckoutSession(id);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only ever describe a checkout that was actually paid.
  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Not paid" }, { status: 409 });
  }

  const ref = decodeRef(session.client_reference_id);

  // Nothing here is secret from the person who just made this payment, and
  // nothing extra is added — no address, no phone, no payment method.
  return NextResponse.json({
    gymSlug: session.metadata?.gym_slug || ref.gyms || null,
    gymReferral: session.metadata?.gym_referral || ref.gym || null,
    promoCode: session.metadata?.promo_code || null,
    amountPaid: (session.amount_total ?? 0) / 100,
    planType: session.metadata?.plan || null,
    buyerName: session.metadata?.buyer_name || session.customer_details?.name || null,
    buyerEmail: session.customer_email || session.customer_details?.email || null,
  });
}
