// app/api/promo/validate/route.ts — RETIRED (October 2026 change-over).
//
// Promo codes no longer exist on this site: the course is £999.99 in full or
// 10 × £99.99 a month for everyone — direct, funnel or partner gym — and
// /api/checkout accepts no code. This route never validates a code and never
// touches Stripe. It survives only so a page cached from before the change-over
// gets a clean "no discount" answer rather than a 404.

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    valid: false,
    reason: "retired",
    message: "Codes are no longer used — everyone pays the same price.",
  });
}
