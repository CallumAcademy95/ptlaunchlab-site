import { NextResponse } from "next/server";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";
import { logSec } from "@/app/lib/security/log";
import { freeSlots } from "@/app/lib/booking/service";
import { slotLabel } from "@/app/lib/booking/london";

export const dynamic = "force-dynamic";
const ENDPOINT = "/api/booking/slots";
const rateLimiter = createRateLimiter(30, 60_000); // 30 page loads/min per IP

export async function GET(req: Request) {
  const ip = getIP(req);
  if (!rateLimiter(ip)) {
    logSec({ level: "security", endpoint: ENDPOINT, outcome: "blocked-user", signals: ["rate-limit"], ip });
    return NextResponse.json({ ok: false, reason: "rate_limited" }, { status: 429, headers: { "Cache-Control": "no-store" } });
  }
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  if (type !== "consultation" && type !== "gym_partner") return NextResponse.json({ ok: false, reason: "bad_type" }, { status: 400 });
  const max = Math.min(Math.max(Number(url.searchParams.get("max") ?? 500) || 500, 1), 500);
  const r = await freeSlots(type, Date.now());
  const res = r.ok
    ? NextResponse.json({ ok: true, slots: r.slots.slice(0, max).map((ms) => ({ iso: new Date(ms).toISOString(), label: slotLabel(ms) })) })
    : NextResponse.json({ ok: false, reason: r.reason });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
