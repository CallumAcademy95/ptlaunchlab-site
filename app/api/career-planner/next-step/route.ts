import { NextRequest, NextResponse, after } from "next/server";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { sendCapiEvent, extractRequestUserData } from "@/app/lib/metaCapi";
import { validateNextStepBody, mergeNextStep, capiEventFor } from "@/app/lib/plannerNextStep";
import { verifyNextToken, nextTokenSecret } from "@/app/lib/plannerNextToken";

// POST /api/career-planner/next-step
// Records the commitment answers and the chosen next step (book / whatsapp / start)
// on the lead's own `leads` row, under extra.nextStep. Leads Central reads it from
// there (spec Part 2). Booked → Meta Schedule; WhatsApp → Meta Contact.

const rateLimiter = createRateLimiter(20, 60_000);

export async function POST(request: NextRequest) {
  if (!rateLimiter(getIP(request))) return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });

  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 }); }

  const now = new Date();
  const v = validateNextStepBody(raw, now);
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });

  const leadId = verifyNextToken(v.value.token, nextTokenSecret(), now.getTime());
  if (!leadId) return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });

  try {
    const db = getSupabaseAdmin();
    const { data: row, error: readErr } = await db.from("leads").select("id, email, phone, extra").eq("id", leadId).maybeSingle();
    if (readErr) throw readErr;
    if (!row) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

    const prevBooked = (row.extra as { nextStep?: { booked?: unknown } } | null)?.nextStep?.booked === true;
    const extra = mergeNextStep(row.extra, v.value, now.toISOString());
    const { error: upErr } = await db.from("leads").update({ extra }).eq("id", leadId);
    if (upErr) throw upErr;

    const eventName = v.value.booked && prevBooked ? null : capiEventFor(v.value); // a repeat booked must not fire Schedule again
    if (eventName) {
      after(async () => {
        try {
          await sendCapiEvent({
            eventName,
            eventId: v.value.eventId,
            eventSourceUrl: request.headers.get("referer") || "https://ptlaunchlab.co.uk/career-planner",
            userData: { email: row.email as string, phone: (row.phone as string | null) ?? undefined, country: "gb", ...extractRequestUserData(request) },
            customData: { currency: "GBP", value: 0, contentName: "career_planner", contentCategory: String((row.extra as { band?: string } | null)?.band ?? "") },
          });
        } catch (err) {
          console.error(`[career-planner/next-step] CAPI ${eventName} failed:`, err);
        }
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[career-planner/next-step]", err);
    return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
  }
}
