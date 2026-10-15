import { NextResponse } from "next/server";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";
import { logSec } from "@/app/lib/security/log";
import { hashManageToken } from "@/app/lib/booking/tokens";
import { findByManageHash } from "@/app/lib/booking/data";
import { move, cancel } from "@/app/lib/booking/service";
import { CALL_TYPES } from "@/app/lib/booking/callTypes";
import { longLabel, slotLabel } from "@/app/lib/booking/london";

export const dynamic = "force-dynamic";
const ENDPOINT = "/api/booking/manage";
const readLimiter = createRateLimiter(30, 60_000);  // 30 views/min per IP
const writeLimiter = createRateLimiter(10, 60_000); // 10 move/cancel attempts/min per IP

function limited(req: Request, allow: (ip: string) => boolean) {
  const ip = getIP(req);
  if (allow(ip)) return null;
  logSec({ level: "security", endpoint: ENDPOINT, outcome: "blocked-user", signals: ["rate-limit"], ip });
  return NextResponse.json({ ok: false, error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
}

async function load(token: unknown) {
  if (typeof token !== "string" || token.length < 20 || token.length > 100) return null;
  return findByManageHash(hashManageToken(token));
}

export async function GET(req: Request) {
  const tooMany = limited(req, readLimiter);
  if (tooMany) return tooMany;
  const b = await load(new URL(req.url).searchParams.get("token"));
  if (!b) return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });
  return NextResponse.json({ ok: true, booking: {
    type: b.call_type, title: CALL_TYPES[b.call_type].title, startIso: b.start_at,
    label: longLabel(Date.parse(b.start_at)), status: b.status, phone: b.phone,
  } });
}

export async function POST(req: Request) {
  const tooMany = limited(req, writeLimiter);
  if (tooMany) return tooMany;
  const body = (await req.json().catch(() => null)) as { token?: unknown; action?: unknown; startIso?: unknown } | null;
  const b = await load(body?.token);
  if (!b) return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });
  if (Date.parse(b.start_at) <= Date.now()) return NextResponse.json({ ok: false, error: "This call has already started." }, { status: 400 });
  if (body?.action === "cancel") {
    const r = await cancel(b, "Cancelled by the lead");
    // Explicit fields only: never spread a service result (could carry row data).
    return NextResponse.json(r.ok ? { ok: true } : { ok: false, error: r.error }, { status: r.ok ? 200 : 400 });
  }
  if (body?.action === "move" && typeof body.startIso === "string") {
    const ms = Date.parse(body.startIso);
    if (!Number.isFinite(ms) || ms % (30 * 60_000) !== 0) return NextResponse.json({ ok: false, error: "Pick a time from the list." }, { status: 400 });
    const r = await move(b, ms);
    if (!r.ok) return NextResponse.json({ ok: false, error: r.error, nearest: (r.nearest ?? []).map((x) => ({ iso: new Date(x).toISOString(), label: slotLabel(x) })) }, { status: r.taken ? 409 : 400 });
    return NextResponse.json({ ok: true, label: longLabel(ms) });
  }
  return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
