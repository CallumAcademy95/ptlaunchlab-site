import { NextRequest, NextResponse } from "next/server";
import {
  readPromoFromRequest,
  STRIPE_LINKS,
  encodeClientRef,
} from "@/app/lib/funnelPromo";

// GET /api/funnel-promo/checkout?plan=full|deposit
//
// Server-gated redirect to a Stripe Payment Link. The discounted £1,399
// Payment Link URL is never exposed in the client bundle — it is only
// revealed via this 302 response when the request carries a valid,
// unexpired ptll_promo cookie.
//
// Plans:
//   full    — discounted £1,399 PIF link (funnel only) | falls back to
//             the £1,599 PIF link if cookie missing/expired
//   deposit — same £599 + 5×£200 link in both cases, but funnel users
//             get a client_reference_id carrying `funnel_promo` so the
//             Stripe webhook can flag them for admin to cancel the 5th
//             instalment in Stripe Billing → effective £1,399

type Plan = "full" | "deposit";

function isPlan(p: string | null): p is Plan {
  return p === "full" || p === "deposit";
}

export async function GET(req: NextRequest) {
  const plan = req.nextUrl.searchParams.get("plan");
  if (!isPlan(plan)) {
    return NextResponse.redirect(new URL("/courses", req.url));
  }

  let promo = null;
  try {
    promo = readPromoFromRequest(req);
  } catch (err) {
    console.error("[funnel-promo/checkout]", err);
  }

  // Pass through UTMs the existing webhook expects, plus our funnel marker
  const utm = req.nextUrl.searchParams;
  const refData: Record<string, string> = {
    fts: utm.get("utm_source") ?? "(direct)",
    ftm: utm.get("utm_medium") ?? "(none)",
    ftc: utm.get("utm_campaign") ?? "(none)",
  };
  if (promo) {
    refData.funnel_promo = promo.source;
  }
  const clientRef = encodeClientRef(refData);

  // Pick the destination
  let dest: string;
  if (plan === "full") {
    dest = promo ? STRIPE_LINKS.discountedPif : STRIPE_LINKS.fullPif;
  } else {
    // Same deposit link regardless — discount is applied admin-side via the funnel marker
    dest = STRIPE_LINKS.deposit;
  }

  const url = new URL(dest);
  url.searchParams.set("client_reference_id", clientRef);
  const email = utm.get("email");
  if (email) url.searchParams.set("prefilled_email", email);

  return NextResponse.redirect(url.toString(), { status: 302 });
}
