import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/whatsapp-conversations
// Returns one entry per unique phone number with the latest message preview,
// timestamp, contact name (if known), and unread/inbound count.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Pull recent messages (last 7 days, capped at 1000 rows) and group client-side.
    // For PTLL volume this is far simpler than a window function in SQL.
    const { data, error } = await supabase
      .from("whatsapp_messages")
      .select("phone, contact_name, body, direction, created_at, message_type")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    type Conv = {
      phone: string;
      contact_name: string | null;
      latest_body: string;
      latest_direction: "inbound" | "outbound";
      latest_at: string;
      latest_type: string;
      inbound_count: number;
      outbound_count: number;
    };

    const map = new Map<string, Conv>();
    for (const row of data ?? []) {
      const r = row as {
        phone: string;
        contact_name: string | null;
        body: string | null;
        direction: "inbound" | "outbound";
        created_at: string;
        message_type: string | null;
      };
      const existing = map.get(r.phone);
      if (!existing) {
        map.set(r.phone, {
          phone: r.phone,
          contact_name: r.contact_name,
          latest_body: r.body || "",
          latest_direction: r.direction,
          latest_at: r.created_at,
          latest_type: r.message_type || "text",
          inbound_count: r.direction === "inbound" ? 1 : 0,
          outbound_count: r.direction === "outbound" ? 1 : 0,
        });
      } else {
        if (r.direction === "inbound") existing.inbound_count += 1;
        else existing.outbound_count += 1;
        // contact_name: prefer non-null
        if (!existing.contact_name && r.contact_name) {
          existing.contact_name = r.contact_name;
        }
      }
    }

    const conversations = Array.from(map.values()).sort((a, b) =>
      a.latest_at < b.latest_at ? 1 : -1
    );

    return NextResponse.json({ success: true, conversations });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
