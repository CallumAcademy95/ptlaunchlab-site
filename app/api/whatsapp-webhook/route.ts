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
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const MEDIA_BUCKET = "whatsapp-media";

// Pull a media object from Meta and cache it in Supabase Storage.
// Returns a public URL for the stored file (or null on failure).
async function cacheInboundMedia(
  mediaId: string,
  filenameHint: string,
  mimeTypeHint: string
): Promise<{ url: string | null; mimeType: string; filename: string }> {
  const fallback = { url: null, mimeType: mimeTypeHint, filename: filenameHint };
  if (!ACCESS_TOKEN) return fallback;

  try {
    // Step 1: ask Meta for the temporary download URL for this media id
    const lookupRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });
    if (!lookupRes.ok) return fallback;
    const lookup = (await lookupRes.json()) as {
      url?: string;
      mime_type?: string;
      file_size?: number;
    };
    if (!lookup.url) return fallback;

    // Step 2: download the actual bytes from Meta (must include auth header)
    const blobRes = await fetch(lookup.url, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });
    if (!blobRes.ok) return fallback;
    const arrayBuffer = await blobRes.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const mimeType = lookup.mime_type || mimeTypeHint || "application/octet-stream";
    const ext = mimeType.split("/")[1]?.split(";")[0] || "bin";
    const safeName = `${mediaId}.${ext}`;

    // Step 3: upload to Supabase Storage
    const { getSupabaseAdmin } = await import("@/app/lib/supabase-admin");
    const supabase = getSupabaseAdmin();
    const { error: uploadErr } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(safeName, bytes, {
        contentType: mimeType,
        upsert: true,
      });
    if (uploadErr) {
      console.error("[whatsapp-webhook] storage upload failed:", uploadErr);
      return { ...fallback, mimeType };
    }

    // Step 4: get the public URL (bucket is public)
    const { data: pub } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(safeName);

    return {
      url: pub.publicUrl,
      mimeType,
      filename: filenameHint || safeName,
    };
  } catch (err) {
    console.error("[whatsapp-webhook] cacheInboundMedia failed:", err);
    return fallback;
  }
}

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
type MetaMediaRef = { id?: string; mime_type?: string; sha256?: string; caption?: string; filename?: string };
type MetaMessage = {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  image?: MetaMediaRef;
  document?: MetaMediaRef;
  audio?: MetaMediaRef;
  video?: MetaMediaRef;
  voice?: MetaMediaRef;
  sticker?: MetaMediaRef;
};
type MetaStatus = {
  id?: string;          // wamid of the original outbound message
  recipient_id?: string;
  status?: "sent" | "delivered" | "read" | "failed";
  timestamp?: string;
  errors?: Array<{ code?: number; title?: string; message?: string }>;
};

// Meta delivers status updates in increasing order. We never want to overwrite
// a "read" with a stale "delivered", so rank statuses and skip downgrades.
const STATUS_RANK: Record<string, number> = {
  sent: 1,
  delivered: 2,
  read: 3,
  failed: 99, // failed always wins (it's a terminal error state)
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
          statuses?: MetaStatus[];
          metadata?: { display_phone_number?: string; phone_number_id?: string };
        }
      | undefined;

    // ─── A) Status updates for previously-sent outbound messages ──────────
    if (value?.statuses && value.statuses.length > 0) {
      try {
        const supabase = getSupabaseAdmin();
        for (const st of value.statuses) {
          if (!st.id || !st.status) continue;
          const incomingRank = STATUS_RANK[st.status] ?? 0;

          // Look up current status; only update if incoming rank is higher.
          const { data: existing } = await supabase
            .from("whatsapp_messages")
            .select("status")
            .eq("meta_message_id", st.id)
            .maybeSingle();

          const currentRank =
            existing && existing.status ? STATUS_RANK[existing.status] ?? 0 : 0;

          if (incomingRank > currentRank) {
            await supabase
              .from("whatsapp_messages")
              .update({ status: st.status })
              .eq("meta_message_id", st.id);
          }
        }
      } catch (err) {
        console.error("[whatsapp-webhook] status update failed:", err);
      }
    }

    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (message && contact) {
      const fromNumber = message.from || contact.wa_id || "";
      const fromName = contact.profile?.name || "Unknown";
      const messageType = message.type || "unknown";
      const messageId = message.id || "";

      // Pull the media reference if this message has any
      const mediaRef: MetaMediaRef | undefined =
        message.image ||
        message.document ||
        message.audio ||
        message.voice ||
        message.video ||
        message.sticker;

      let messageBody: string;
      let mediaUrl: string | null = null;
      let mediaMimeType: string | null = null;
      let mediaFilename: string | null = null;
      let mediaCaption: string | null = null;

      if (message.type === "text") {
        messageBody = message.text?.body || "";
      } else if (mediaRef && mediaRef.id) {
        // Cache Meta-hosted media in Supabase Storage (URLs from Meta expire ~5 min)
        const cached = await cacheInboundMedia(
          mediaRef.id,
          mediaRef.filename || `${mediaRef.id}`,
          mediaRef.mime_type || ""
        );
        mediaUrl = cached.url;
        mediaMimeType = cached.mimeType;
        mediaFilename = cached.filename;
        mediaCaption = mediaRef.caption || null;
        messageBody = mediaRef.caption || `[${messageType}]`;
      } else {
        messageBody = `[${messageType} message]`;
      }

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
          media_id: mediaRef?.id || null,
          media_url: mediaUrl,
          media_mime_type: mediaMimeType,
          media_filename: mediaFilename,
          media_caption: mediaCaption,
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
