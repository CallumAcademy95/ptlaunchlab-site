import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";
import { validateObjection } from "@/app/lib/security/validate";
import { logSec } from "@/app/lib/security/log";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/objection  (Objection Intelligence, Sprint 3)
// Captures WHY a warm lead didn't convert at a drop-off point. Anonymous by
// design (email optional) — the value is the aggregate trend, so keep it
// frictionless. Routes to Zapier (→ Sheet) for trend analysis. No CAPI: this is
// intelligence, not a marketing lead.
// ─────────────────────────────────────────────────────────────────────────────

const rateLimiter = createRateLimiter(8, 60_000);
const ENDPOINT = "/api/objection";

export async function POST(request: NextRequest) {
  const ip = getIP(request);
  if (!rateLimiter(ip)) {
    logSec({ level: "security", endpoint: ENDPOINT, outcome: "blocked-silent", signals: ["rate-limit"], ip });
    return NextResponse.json({ success: false, error: "Too many requests." }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const result = validateObjection(raw);
  if (!result.ok) {
    if (result.silent) {
      logSec({ level: "security", endpoint: ENDPOINT, outcome: "blocked-silent", signals: result.signals, ip });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  try {
    const { reason, note, context, email } = result.data;
    const webhookUrl =
      process.env.OBJECTION_ZAPIER_WEBHOOK_URL || process.env.PROSPECTUS_ZAPIER_WEBHOOK_URL;
    if (webhookUrl) {
      const payload = {
        source: "objection",
        reason,
        note,
        context,
        email, // may be empty — anonymous is fine
        submitted_at: new Date().toISOString(),
      };
      const push = async (attempt = 1): Promise<void> => {
        try {
          const r = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!r.ok) throw new Error(`Zapier ${r.status}`);
        } catch (err) {
          if (attempt < 2) return push(attempt + 1);
          console.error("[objection] Zapier push failed after retry:", err);
        }
      };
      await push();
    } else {
      console.warn("[objection] no Zapier webhook configured — logging only.", { reason, context });
    }

    logSec({ level: "security", endpoint: ENDPOINT, outcome: "accepted", signals: [`reason:${reason}`, `ctx:${context}`], ip });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[objection]", err);
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}
