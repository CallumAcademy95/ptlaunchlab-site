import { NextResponse } from "next/server";
import { RETIRED_PROMO_COOKIE } from "@/app/lib/retiredPromo";

// GET /api/funnel-promo/status — RETIRED (October 2026 change-over).
//
// Always reports no active promo: there are no discounts for anyone. Also
// expires any leftover 48-hour promo cookie from before the change-over so no
// cached page can read it as live.
export async function GET() {
  const res = NextResponse.json({ active: false });
  res.cookies.set({ name: RETIRED_PROMO_COOKIE, value: "", path: "/", maxAge: 0 });
  return res;
}
