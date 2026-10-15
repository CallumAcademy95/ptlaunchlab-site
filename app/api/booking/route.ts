import { NextResponse } from "next/server";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";
import { logSec } from "@/app/lib/security/log";
import { validateBookingInput } from "@/app/lib/booking/validate";
import { verifyLinkToken } from "@/app/lib/booking/tokens";
import { book } from "@/app/lib/booking/service";
import { longLabel, slotLabel } from "@/app/lib/booking/london";

export const dynamic = "force-dynamic";
const SITE = "https://ptlaunchlab.co.uk";
const ENDPOINT = "/api/booking";
const rateLimiter = createRateLimiter(10, 60_000); // 10 bookings/min per IP: room for a "just gone" retry or two

export async function POST(req: Request) {
  const ip = getIP(req);
  if (!rateLimiter(ip)) {
    logSec({ level: "security", endpoint: ENDPOINT, outcome: "blocked-user", signals: ["rate-limit"], ip });
    return NextResponse.json({ ok: false, error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }
  const v = validateBookingInput(await req.json().catch(() => null));
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });
  const tok = v.value.t ? verifyLinkToken(v.value.t, process.env.BOOKING_LINK_SECRET ?? "", Date.now()) : null;
  const consultationId = tok && tok.callType === v.value.callType ? tok.leadId : null;
  const r = await book(v.value, { source: consultationId ? "setter" : "web", consultationId });
  if (!r.ok) {
    if ("existing" in r && r.existing) {
      const ms = Date.parse(r.existing.start_at);
      return NextResponse.json({ ok: true, duplicate: true, startIso: r.existing.start_at, label: longLabel(ms), phone: v.value.phone, manageUrl: null });
    }
    return NextResponse.json({
      ok: false, error: r.error, taken: r.taken ?? false,
      nearest: (r.nearest ?? []).map((ms) => ({ iso: new Date(ms).toISOString(), label: slotLabel(ms) })),
    }, { status: r.taken ? 409 : 400 });
  }
  const ms = Date.parse(r.booking.start_at);
  return NextResponse.json({ ok: true, startIso: r.booking.start_at, label: longLabel(ms), phone: r.booking.phone, manageUrl: `${SITE}/book/manage/${r.manageToken}` });
}
