import { hashManageToken } from "@/app/lib/booking/tokens";
import { findByManageHash } from "@/app/lib/booking/data";
import { icsFor } from "@/app/lib/booking/ics";
import { CALL_TYPES } from "@/app/lib/booking/callTypes";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const b = token ? await findByManageHash(hashManageToken(token)) : null;
  if (!b || b.status !== "booked") return new Response("Not found", { status: 404 });
  const ics = icsFor({
    id: b.id, startMs: Date.parse(b.start_at), endMs: Date.parse(b.end_at),
    title: `${CALL_TYPES[b.call_type].title} with PT Launch Lab`,
    description: `Callum will ring you on ${b.phone}. To move or cancel: https://ptlaunchlab.co.uk/book/manage/${token}`,
  });
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="ptll-call.ics"' } });
}
