import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/whatsapp-upload-media
// Accepts a file from the browser (multipart/form-data) and uploads it to
// Meta's WhatsApp Cloud API media endpoint. Returns the media_id which can
// then be passed to /api/whatsapp-send to attach as an outbound message.
// ─────────────────────────────────────────────────────────────────────────────

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "1157607977427024";
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const MAX_BYTES = 16 * 1024 * 1024; // 16MB matches Meta's image cap

export async function POST(req: NextRequest) {
  if (!ACCESS_TOKEN) {
    return NextResponse.json(
      { success: false, error: "WHATSAPP_ACCESS_TOKEN not configured" },
      { status: 500 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid form data" },
      { status: 400 }
    );
  }

  const fileEntry = formData.get("file");
  if (!fileEntry || typeof fileEntry === "string") {
    return NextResponse.json(
      { success: false, error: "No file provided in 'file' field" },
      { status: 400 }
    );
  }
  const file = fileEntry as File;

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      {
        success: false,
        error: `Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF, PDF.`,
      },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { success: false, error: "File too large (max 16MB)" },
      { status: 413 }
    );
  }

  // Re-package into Meta's expected multipart shape and upload
  const metaForm = new FormData();
  metaForm.append("messaging_product", "whatsapp");
  metaForm.append("type", file.type);
  metaForm.append("file", file, file.name);

  try {
    const apiRes = await fetch(
      `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/media`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        body: metaForm,
      }
    );
    const data = await apiRes.json();
    if (!apiRes.ok) {
      const msg = data?.error?.message || "Meta media upload failed";
      return NextResponse.json(
        { success: false, error: msg, details: data },
        { status: apiRes.status }
      );
    }
    return NextResponse.json({
      success: true,
      media_id: data.id,
      mime_type: file.type,
      filename: file.name,
      size: file.size,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
