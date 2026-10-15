import { NextResponse } from "next/server";
import { freeSlots } from "@/app/lib/booking/service";
import { slotLabel } from "@/app/lib/booking/london";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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
