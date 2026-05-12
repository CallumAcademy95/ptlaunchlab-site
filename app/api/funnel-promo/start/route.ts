import { NextRequest, NextResponse } from "next/server";
import { attachPromoCookie, type FunnelSource } from "@/app/lib/funnelPromo";

// POST /api/funnel-promo/start
// Issues the 48h signed cookie. Primary callers are /api/quiz-submission and
// /api/prospectus (which set the cookie inline on their own success response),
// but this route is here for the case where the client needs to set it
// directly — e.g. arriving from a Zapier-only submission flow.

const ALLOWED: ReadonlyArray<FunnelSource> = ["quiz", "prospectus", "youtube", "salary-calculator"] as const;

export async function POST(req: NextRequest) {
  let source: FunnelSource = "quiz";
  try {
    const body = await req.json();
    if (body?.source && ALLOWED.includes(body.source)) {
      source = body.source as FunnelSource;
    }
  } catch {
    // No body / invalid JSON — default to "quiz"
  }

  try {
    const response = NextResponse.json({ success: true, source });
    const payload = attachPromoCookie(response, source);
    return NextResponse.json(
      {
        success: true,
        source: payload.source,
        expiresAt: payload.exp * 1000,
      },
      { headers: response.headers },
    );
  } catch (err) {
    console.error("[funnel-promo/start]", err);
    return NextResponse.json(
      { success: false, error: "promo not configured" },
      { status: 503 },
    );
  }
}
