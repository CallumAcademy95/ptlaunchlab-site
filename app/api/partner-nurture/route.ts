// Hourly cron (vercel.json): sends whatever partner-page follow-up emails are
// due. See app/lib/partnerNurture.ts for the sequences.
// Manual: GET /api/partner-nurture  (Authorization: Bearer CRON_SECRET)
import { NextRequest, NextResponse } from "next/server";
import { runPartnerNurture } from "@/app/lib/server/partnerNurture.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const result = await runPartnerNurture();
  if (result.failed.length) console.error("[partner-nurture] failures:", result.failed.join(" | "));
  return NextResponse.json({ ok: result.failed.length === 0, ...result });
}
