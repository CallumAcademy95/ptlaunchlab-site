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

  // Read raw body and parse defensively — Zapier sometimes sends JSON as a
  // form-encoded payload, sometimes nested under a 'data' key, sometimes as
  // a stringified JSON value. Handle all of those cleanly.
  type RecordBody = {
    phone?: string;
    body?: string;
    meta_message_id?: string;
    message_type?: string;
    contact_name?: string;
    status?: string;
  };

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not read request body." },
      { status: 400 }
    );
  }

  let body: RecordBody = {};
  let parsed: unknown = null;

  // Try JSON first
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Fall through to form-encoded
  }

  // If JSON parsing didn't work, try form-encoded
  if (parsed === null) {
    try {
      const params = new URLSearchParams(raw);
      const obj: Record<string, string> = {};
      params.forEach((v, k) => {
        obj[k] = v;
      });
      parsed = obj;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid body format." },
        { status: 400 }
      );
    }
  }

  // If parsed is a string (double-encoded JSON), parse again
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      // leave as-is
    }
  }

  // If parsed is an object with a single "data" key wrapping the real payload
  // (a Zapier serialisation quirk when payload_type=json + key/value mode),
  // unwrap it.
  if (
    parsed &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    "data" in (parsed as Record<string, unknown>) &&
    Object.keys(parsed as Record<string, unknown>).length <= 2
  ) {
    const dataField = (parsed as Record<string, unknown>).data;
    if (typeof dataField === "string") {
      try {
        parsed = JSON.parse(dataField);
      } catch {
        // ignore
      }
    } else if (dataField && typeof dataField === "object") {
      parsed = dataField;
    }
  }

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    body = parsed as RecordBody;
  }

  const phoneRaw = (body.phone || "").trim();
  if (!phoneRaw) {
    // Temporary debug response so we can see what Zapier actually sent.
    // Remove once the integration is stable.
    return NextResponse.json(
      {
        success: false,
        error: "phone is required.",
        _debug: {
          version: "v3-defensive",
          rawBodyFirst500: raw.slice(0, 500),
          rawLength: raw.length,
          contentType: request.headers.get("content-type") || "(none)",
          parsedType: typeof parsed,
          parsedKeys:
            parsed && typeof parsed === "object" && !Array.isArray(parsed)
              ? Object.keys(parsed as Record<string, unknown>)
              : [],
          bodyKeys: Object.keys(body),
        },
      },
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
