import { NextResponse } from "next/server";

// POST /api/funnel-promo/start — RETIRED (October 2026 change-over).
//
// This used to issue a signed 48-hour "£200 discount unlocked" cookie to anyone
// who completed a lead form. There are no discounts any more — the course is
// £999.99 in full or 10 × £99.99 for everyone — so it issues nothing. Kept as a
// harmless no-op only so a page cached from before the change-over that still
// calls it gets a clean response rather than a 404.
export async function POST() {
  return NextResponse.json({ active: false });
}
