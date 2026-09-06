import { NextRequest, NextResponse, after } from "next/server";
import {
  readPromoFromRequest,
  STRIPE_LINKS,
  encodeClientRef,
} from "@/app/lib/funnelPromo";
import { sendCapiEvent, extractRequestUserData, deterministicEventId } from "@/app/lib/metaCapi";
import { createCheckoutSession } from "@/app/lib/stripeCheckout";

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

  const email = utm.get("email");

  // Prefer a server-created Checkout Session so the post-payment return URL
  // (/enrol/success) comes from code. The Dashboard redirect on the £1,399
  // funnel link and the £599 deposit link was never set, so buyers using them
  // landed on stripe.com and skipped the enrolment form. Falls back to the raw
  // Payment Link if session creation fails — paying must never be blocked.
  const session = await createCheckoutSession({
    paymentLink: dest,
    clientReferenceId: clientRef,
    email: email ?? undefined,
    funnelPromo: promo?.source,
    cancelPath: "/courses",
  });

  const url = new URL(session?.url ?? dest);
  if (!session) {
    url.searchParams.set("client_reference_id", clientRef);
    if (email) url.searchParams.set("prefilled_email", email);
  }

  // Meta CAPI InitiateCheckout — fires server-side just before the 302 to
  // Stripe. Browser FunnelPricingBlock.handleCheckout fires the matching
  // fbq IC with the same event_id (passed here as `ic_eid`), so Meta dedups
  // the two on event_name + event_id within 7 days. user_data is limited to
  // fbp/fbc/IP/UA because the promo cookie carries no PII — the browser
  // pixel's matching cookies (which extractRequestUserData picks up) handle
  // identity matching.
  const value = plan === "full" ? (promo ? 1399 : 1599) : 599;
  const contentName = plan === "full" ? "course_pif" : "course_deposit";
  const icEventId =
    (utm.get("ic_eid") ?? "").slice(0, 64) ||
    deterministicEventId("funnel_promo_ic", promo?.source ?? "anon", plan, String(Date.now()));

  after(() => sendCapiEvent({
    eventName: "InitiateCheckout",
    eventId: icEventId,
    eventSourceUrl: req.headers.get("referer") || "https://ptlaunchlab.co.uk/",
    userData: {
      country: "gb",
      ...extractRequestUserData(req),
    },
    customData: {
      currency: "GBP",
      value,
      contentName,
      contentCategory: promo?.source ?? undefined,
    },
  }));

  return NextResponse.redirect(url.toString(), { status: 302 });
}
