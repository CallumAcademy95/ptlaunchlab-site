import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { constantTimeEqual } from "@/app/lib/admin-auth";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/whatsapp-record-outbound
//
// Server-to-server endpoint for Zapier (or any other automation that calls
// Cloud API directly) to record an outbound message in Supabase so it shows
// up in /admin/whatsapp.
//
// Auth: X-Internal-Key header must match the ZAPIER_INTERNAL_KEY env var.
// (Admin cookie auth doesn't work for Zapier — no browser, no cookies.)
//
// Body:
//   {
//     phone: string,             // E.164 without + (e.g. "447399635694")
//     body: string,              // rendered text of what was actually sent
//     meta_message_id: string,   // wamid returned by Cloud API
//     message_type?: string,     // "text" | "template" | "image" | "document"
//     contact_name?: string,     // optional, e.g. lead's name from the form
//     status?: string            // defaults to "sent"
//   }
// ─────────────────────────────────────────────────────────────────────────────

const INTERNAL_KEY = process.env.ZAPIER_INTERNAL_KEY;

function normalisePhone(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  if (digits.startsWith("0")) return "44" + digits.slice(1);
  return digits;
}

export async function POST(request: NextRequest) {
  if (!INTERNAL_KEY) {
    return NextResponse.json(
      { success: false, error: "Internal API key not configured." },
      { status: 500 }
    );
  }

  const presented = request.headers.get("x-internal-key") || "";
  if (!constantTimeEqual(presented, INTERNAL_KEY)) {
    return NextResponse.json(
      { success: false, error: "Unauthorised." },
      { status: 401 }
    );
  }

  let body: {
    phone?: string;
    body?: string;
    meta_message_id?: string;
    message_type?: string;
    contact_name?: string;
    status?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const phoneRaw = (body.phone || "").trim();
  if (!phoneRaw) {
    return NextResponse.json(
      { success: false, error: "phone is required." },
      { status: 400 }
    );
  }
  const phone = normalisePhone(phoneRaw);

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("whatsapp_messages")
      .insert({
        direction: "outbound",
        phone,
        contact_name: body.contact_name || null,
        body: body.body || null,
        message_type: body.message_type || "text",
        meta_message_id: body.meta_message_id || null,
        status: body.status || "sent",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
