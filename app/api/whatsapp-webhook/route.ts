import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";

// ─────────────────────────────────────────────────────────────────────────────
// /api/whatsapp-webhook
// Receives WhatsApp Cloud API events.
// GET  → Meta's verification handshake.
// POST → persists inbound messages to Supabase + forwards a flat record to a
//        Zapier catch hook (which alerts Callum on personal WhatsApp).
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

    if (message && contact) {
      const fromNumber = message.from || contact.wa_id || "";
      const fromName = contact.profile?.name || "Unknown";
      const messageType = message.type || "unknown";
      const messageBody =
        message.type === "text"
          ? message.text?.body || ""
          : `[${messageType} message]`;
      const messageId = message.id || "";

      // 1) Persist to Supabase (best-effort; never block Meta ack)
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from("whatsapp_messages").insert({
          direction: "inbound",
          phone: fromNumber,
          contact_name: fromName,
          body: messageBody,
          message_type: messageType,
          meta_message_id: messageId,
          status: "received",
        });
      } catch (err) {
        console.error("[whatsapp-webhook] Supabase insert failed:", err);
      }

      // 2) Forward to Zapier so Callum gets a personal-WhatsApp alert
      if (ZAPIER_INBOUND_HOOK) {
        const payload = {
          event_type: "inbound_message",
          from_name: fromName,
          from_number: fromNumber,
          message_text: messageBody,
          message_type: messageType,
          message_id: messageId,
          timestamp: message.timestamp || "",
          business_phone: value?.metadata?.display_phone_number || "",
        };

        const formBody = new URLSearchParams();
        Object.entries(payload).forEach(([k, v]) => formBody.append(k, String(v)));

        fetch(ZAPIER_INBOUND_HOOK, {
          method: "POST",
          body: formBody,
        }).catch(() => {
          // swallow — Meta retries cause more harm than missing one forward
        });
      }
    }
  } catch (err) {
    console.error("[whatsapp-webhook] handler error:", err);
  }

  // Always 200 to prevent retry storms
  return new NextResponse("OK", { status: 200 });
}
