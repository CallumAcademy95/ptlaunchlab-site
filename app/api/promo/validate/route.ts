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

// `unknown` and `wrong-partner` deliberately share a message. Confirming that
// HITIO500 exists tells a stranger that a code with three places is worth
// guessing, and the pattern across partners is obvious.
const MESSAGES: Record<PromoRefusal, string> = {
  unknown: "We don't recognise that code.",
  "wrong-partner": "We don't recognise that code.",
  exhausted: "That code has been fully claimed.",
  inactive: "That code is no longer available.",
};

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, reason: "unknown", message: MESSAGES.unknown });
  }

  const code = typeof body.code === "string" ? body.code.trim().slice(0, 60) : "";
  const gymSlug = typeof body.gymSlug === "string" ? body.gymSlug.trim().slice(0, 60) : "";
  const prefix = PARTNER_PROMO_PREFIXES[gymSlug];

  if (!code || !prefix) {
    return NextResponse.json({ valid: false, reason: "unknown", message: MESSAGES.unknown });
  }

  const result = await resolvePromoCode(code, prefix);
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
