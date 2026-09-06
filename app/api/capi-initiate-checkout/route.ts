import { NextRequest, NextResponse, after } from "next/server";
import { sendCapiEvent, extractRequestUserData, deterministicEventId } from "@/app/lib/metaCapi";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/capi-initiate-checkout
//
// Server-side relay for the Meta CAPI InitiateCheckout event fired by the
// /enrol flow right before redirecting to Stripe. The browser fires
// fbq('track', 'InitiateCheckout', { value, currency }, { eventID }) and
// ALSO POSTs here with the same event_id so the two events dedup on Meta's
// side.
//
// Body shape:
//   { event_id: string, name?: string, email?: string, phone?: string,
//     plan?: 'course_pif'|'course_deposit', value?: number,
//     currency?: string, source?: string }
//
// Mirrors the pattern of /api/capi-schedule. Permissive validation — we
// never want to silently drop the event because of a weird field value.
// ─────────────────────────────────────────────────────────────────────────────

const rateLimiter = createRateLimiter(10, 60_000);

type Body = {
  event_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  plan?: string;
  value?: number;
  currency?: string;
  source?: string;
};

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  if (!rateLimiter(ip)) {
    return NextResponse.json({ success: false, error: "rate-limited" }, { status: 429 });
  }

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ success: false, error: "invalid json" }, { status: 400 });
  }

  const eventId =
    (typeof body.event_id === "string" && body.event_id.slice(0, 64)) ||
    deterministicEventId("initiate_checkout", body.email || "", body.phone || "");

  const fullName = (body.name || "").trim();
  const [firstName, ...rest] = fullName.split(/\s+/);

  const value = typeof body.value === "number" && Number.isFinite(body.value) ? body.value : undefined;
  const currency = typeof body.currency === "string" && body.currency.length === 3 ? body.currency : "GBP";

  after(() => sendCapiEvent({
    eventName: "InitiateCheckout",
    eventId,
    eventSourceUrl: req.headers.get("referer") || "https://ptlaunchlab.co.uk/enrol",
    userData: {
      email: typeof body.email === "string" ? body.email : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      firstName: firstName || undefined,
      lastName: rest.join(" ") || undefined,
      country: "gb",
      ...extractRequestUserData(req),
    },
    customData: {
      currency,
      value,
      contentName: typeof body.plan === "string" ? body.plan : undefined,
      contentCategory: typeof body.source === "string" ? body.source : undefined,
    },
  }));

  return NextResponse.json({ success: true });
}
