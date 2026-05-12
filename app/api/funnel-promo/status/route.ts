import { NextRequest, NextResponse } from "next/server";
import { readPromoFromRequest } from "@/app/lib/funnelPromo";

// GET /api/funnel-promo/status
// Returns the current promo state for the requesting browser. Used by the
// <FunnelPricingBlock> component to drive the countdown and decide whether
// to render the discounted-price view or fall back to full price.

export async function GET(req: NextRequest) {
  let payload = null;
  try {
    payload = readPromoFromRequest(req);
  } catch (err) {
    console.error("[funnel-promo/status]", err);
  }

  if (!payload) {
    return NextResponse.json(
      { active: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const expiresAt = payload.exp * 1000;
  const secondsRemaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  return NextResponse.json(
    {
      active: secondsRemaining > 0,
      source: payload.source,
      expiresAt,
      secondsRemaining,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
