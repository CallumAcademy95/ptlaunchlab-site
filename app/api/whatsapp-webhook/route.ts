import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// /api/whatsapp-webhook
// Receives WhatsApp Cloud API events (inbound messages, status updates).
// GET  → Meta's verification handshake (returns hub.challenge if token matches)
// POST → forwards inbound messages to a Zapier catch hook so Callum gets
//        notified on his personal WhatsApp via the WhatsApp Notifications
//        Zapier integration.
// ─────────────────────────────────────────────────────────────────────────────

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
const ZAPIER_INBOUND_HOOK = process.env.ZAPIER_INBOUND_HOOK;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token && token === VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

type MetaContact = { profile?: { name?: string }; wa_id?: string };
type MetaMessage = {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
};

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  // Always acknowledge to Meta first so they don't retry — process forwarding
  // best-effort. If forwarding fails we still 200 to prevent retry storms.
  try {
    const entry = (body as { entry?: Array<{ changes?: Array<{ value?: unknown }> }> })?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value as
      | {
          contacts?: MetaContact[];
          messages?: MetaMessage[];
          metadata?: { display_phone_number?: string; phone_number_id?: string };
        }
      | undefined;

    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (message && contact && ZAPIER_INBOUND_HOOK) {
      const payload = {
        event_type: "inbound_message",
        from_name: contact.profile?.name || "Unknown",
        from_number: message.from || contact.wa_id || "",
        message_text:
          message.type === "text"
            ? message.text?.body || ""
            : `[${message.type ?? "non-text"} message]`,
        message_type: message.type || "unknown",
        message_id: message.id || "",
        timestamp: message.timestamp || "",
        business_phone: value?.metadata?.display_phone_number || "",
      };

      const formBody = new URLSearchParams();
      Object.entries(payload).forEach(([k, v]) => formBody.append(k, String(v)));

      // fire-and-forget; do not await long enough to block Meta's retry window
      fetch(ZAPIER_INBOUND_HOOK, {
        method: "POST",
        body: formBody,
      }).catch(() => {
        // swallow — Meta retries cause more harm than missing one forward
      });
    }
  } catch {
    // ignore parsing errors — still ack to Meta
  }

  return new NextResponse("OK", { status: 200 });
}
