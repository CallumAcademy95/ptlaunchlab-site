import { NextRequest, NextResponse } from "next/server";
import { RETIRED_PROMO_COOKIE } from "@/app/lib/retiredPromo";

// GET /api/funnel-promo/checkout — RETIRED (October 2026 change-over).
//
// Used to 302 a funnel lead to a discounted £1,399 Payment Link. That price and
// the 48-hour promo are gone; everyone pays £999.99 in full or 10 × £99.99, and
// both are bought through /enrol. A page cached from before the change-over
// still links here, so it now sends the buyer to /enrol and clears the old
// promo cookie on the way.
export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/enrol", req.url), { status: 302 });
  res.cookies.set({ name: RETIRED_PROMO_COOKIE, value: "", path: "/", maxAge: 0 });
  return res;
}
