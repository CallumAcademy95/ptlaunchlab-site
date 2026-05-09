import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/whatsapp-send
// Sends a free-form text message via WhatsApp Cloud API to a phone number
// that has an open 24-hour service window (i.e. has messaged the business
// recently). Persists outbound message to Supabase.
// ─────────────────────────────────────────────────────────────────────────────

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "1157607977427024";
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

function normalisePhone(input: string): string {
  // E.164 without the leading + (Cloud API requirement)
  const digits = input.replace(/[^\d]/g, "");
  if (digits.startsWith("0")) {
    return "44" + digits.slice(1); // assume UK if leading 0
  }
  return digits;
}

export async function POST(request: NextRequest) {
  if (!ACCESS_TOKEN) {
    return NextResponse.json(
      { success: false, error: "WHATSAPP_ACCESS_TOKEN not configured." },
      { status: 500 }
    );
  }

  let body: { phone?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const phoneRaw = (body.phone || "").trim();
  const message = (body.message || "").trim();

  if (!phoneRaw || !message) {
    return NextResponse.json(
      { success: false, error: "Phone and message are required." },
      { status: 400 }
    );
  }
  if (message.length > 4096) {
    return NextResponse.json(
      { success: false, error: "Message exceeds 4096 character limit." },
      { status: 400 }
    );
  }

  const phone = normalisePhone(phoneRaw);

  try {
    const apiRes = await fetch(
      `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: message },
        }),
      }
    );

    const apiData = await apiRes.json();

    if (!apiRes.ok) {
      const errorMsg =
        apiData?.error?.message ||
        apiData?.error?.error_user_msg ||
        "Cloud API rejected the message.";
      return NextResponse.json(
        { success: false, error: errorMsg, details: apiData },
        { status: apiRes.status }
      );
    }

    const metaMessageId = apiData?.messages?.[0]?.id || "";

    // Persist to Supabase (best-effort)
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from("whatsapp_messages").insert({
        direction: "outbound",
        phone,
        contact_name: null,
        body: message,
        message_type: "text",
        meta_message_id: metaMessageId,
        status: "sent",
      });
    } catch (err) {
      console.error("[whatsapp-send] Supabase insert failed:", err);
    }

    return NextResponse.json({
      success: true,
      message_id: metaMessageId,
      phone,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
