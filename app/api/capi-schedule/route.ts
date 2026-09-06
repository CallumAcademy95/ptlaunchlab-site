import { NextRequest, NextResponse, after } from "next/server";
import { sendCapiEvent, extractRequestUserData, deterministicEventId } from "@/app/lib/metaCapi";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/capi-schedule
//
// Server-side relay for Meta CAPI Schedule events fired by PhoneCallbackForm
// and any other "book a call" submission flow. The browser fires
// fbq('track', 'Schedule', ..., { eventID }) and ALSO POSTs here with the
// same event_id so the two events dedup on Meta's side.
//
// Body shape:
//   { event_id: string, name?: string, email?: string, phone?: string,
//     avatar?: 'starter'|'switcher'|'returner', source?: string }
//
// Permissive validation — we never want to silently drop a Schedule event
// because the user typed a weird character in their name. The browser fbq
// fires regardless; this endpoint is best-effort augmentation.
// ─────────────────────────────────────────────────────────────────────────────

const rateLimiter = createRateLimiter(10, 60_000);

type Body = {
  event_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
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
    deterministicEventId("schedule", body.email || "", body.phone || "");

  const fullName = (body.name || "").trim();
  const [firstName, ...rest] = fullName.split(/\s+/);

  after(() => sendCapiEvent({
    eventName: "Schedule",
    eventId,
    eventSourceUrl: req.headers.get("referer") || "https://ptlaunchlab.co.uk/book-call",
    userData: {
      email: typeof body.email === "string" ? body.email : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      firstName: firstName || undefined,
      lastName: rest.join(" ") || undefined,
      country: "gb",
      ...extractRequestUserData(req),
    },
    customData: {
      contentCategory: typeof body.avatar === "string" ? body.avatar : undefined,
      contentName: typeof body.source === "string" ? body.source : "book_call",
    },
  }));

  return NextResponse.json({ success: true });
}
