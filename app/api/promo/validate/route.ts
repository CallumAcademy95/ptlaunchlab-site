// app/api/promo/validate/route.ts
//
// The only way the browser learns whether a promo code is real and what it is
// worth. The client used to decide this from a hardcoded object, which is why
// HITIO's launch codes returned "invalid" while working perfectly in Stripe.
//
// The Stripe key never leaves the server, and the amount comes back from Stripe
// so the page can never display a discount Stripe will not honour.

import { NextRequest, NextResponse } from "next/server";
import { resolvePromoCode, type PromoRefusal } from "@/app/lib/promoCodes";
import { PARTNER_PROMO_PREFIXES } from "@/app/lib/partnerPromo";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";

// `unknown` and `wrong-partner` deliberately share a message. Confirming that
// HITIO500 exists tells a stranger that a code with three places is worth
// guessing, and the pattern across partners is obvious.
const MESSAGES: Record<PromoRefusal, string> = {
  unknown: "We don't recognise that code.",
  "wrong-partner": "We don't recognise that code.",
  exhausted: "That code has been fully claimed.",
  inactive: "That code is no longer available.",
};

// This endpoint's entire threat model is code-guessing: launch codes are
// slot-capped and follow an obvious per-gym pattern (GYMNGO000..GYMNGO999),
// and every single request — valid or not — triggers a live paginated
// Stripe lookup, so an unthrottled sweep is both a guessing oracle and a way
// to burn Stripe API quota for free. Checkout's 10/min suits a buyer retrying
// at the pay step; a learner validating a promo code legitimately does it
// once or twice, so 5/min per IP is generous for a human and far too slow to
// sweep a keyspace or meaningfully dent Stripe's own rate limits.
const rateLimiter = createRateLimiter(5, 60_000);

export async function POST(req: NextRequest) {
  // Checked first, before parsing the body or touching Stripe, so a
  // rate-limited response returns in constant time — a guesser who trips the
  // limit learns nothing from response timing, only from the fact that they
  // got throttled at all, which is about the caller, not the code.
  const ip = getIP(req);
  if (!rateLimiter(ip)) {
    return NextResponse.json({
      valid: false,
      reason: "rate-limited",
      message: "Too many attempts. Try again in a minute.",
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, reason: "unknown", message: MESSAGES.unknown });
  }

  const code = typeof body.code === "string" ? body.code.trim().slice(0, 60) : "";
  const gymSlug = typeof body.gymSlug === "string" ? body.gymSlug.trim().slice(0, 60) : "";
  const prefixes = PARTNER_PROMO_PREFIXES[gymSlug];

  // Checked by shape, not truthiness: PARTNER_PROMO_PREFIXES is a plain
  // object, so a gymSlug of "constructor", "__proto__", "toString", or
  // "hasOwnProperty" resolves to a truthy non-array (an inherited function)
  // that `!prefixes` alone would not catch. resolvePromoCode's try/catch
  // happens to swallow the resulting TypeError today, but that's an accident
  // three call frames away in another file, not a guarantee this route makes.
  if (!code || !Array.isArray(prefixes) || prefixes.length === 0) {
    return NextResponse.json({ valid: false, reason: "unknown", message: MESSAGES.unknown });
  }

  const result = await resolvePromoCode(code, prefixes);
  if (!result.ok) {
    // `wrong-partner` is collapsed into `unknown` here so the response body —
    // not just the message text — is byte-identical for "no such code" and
    // "not this gym's code". The internal distinction (kept for server-side
    // logging in resolvePromoCode/selectPromoCode) must never reach the caller
    // as a machine-readable `reason`, or a scripted guesser could branch on it
    // even while the human-readable message reads the same.
    const clientReason = result.reason === "wrong-partner" ? "unknown" : result.reason;
    return NextResponse.json({ valid: false, reason: clientReason, message: MESSAGES[result.reason] });
  }

  // promoId is deliberately NOT returned. The browser sends the code string
  // back at checkout and the server resolves it again, so a tampered client
  // cannot nominate an arbitrary promotion code id.
  return NextResponse.json({ valid: true, code: result.code, amountOffPence: result.amountOffPence });
}
