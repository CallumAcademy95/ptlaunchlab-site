import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";
import { validateGraduateStory } from "@/app/lib/security/validate";
import { logSec } from "@/app/lib/security/log";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/graduate-story  (Proof Engine capture, WS3 #2)
// A graduate submits their story to be published on /graduates. This is NOT a
// marketing lead — no CAPI, no promo cookie. It routes to a Zapier webhook
// (→ Google Sheet) for a curator to review, confirm the self-tags, and add the
// approved entry to app/lib/graduates.ts. Falls back to the prospectus Zap so
// submissions are never silently lost before a dedicated Zap is wired.
// ─────────────────────────────────────────────────────────────────────────────

const rateLimiter = createRateLimiter(5, 60_000);
const ENDPOINT = "/api/graduate-story";

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

  const result = validateGraduateStory(raw);
  if (!result.ok) {
    if (result.silent) {
      logSec({ level: "security", endpoint: ENDPOINT, outcome: "blocked-silent", signals: result.signals, ip, ua: request.headers.get("user-agent") });
      return NextResponse.json({ success: true });
    }
    logSec({ level: "security", endpoint: ENDPOINT, outcome: "blocked-user", signals: result.signals, ip });
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  try {
    const { name, email, phone, previousJob, region, specialism, avatar, story } = result.data;

    const webhookUrl =
      process.env.GRADUATE_STORY_ZAPIER_WEBHOOK_URL || process.env.PROSPECTUS_ZAPIER_WEBHOOK_URL;
    if (webhookUrl) {
      const payload = {
        name,
        email,
        phone,
        source: "graduate_story",
        previous_job: previousJob,
        region,
        specialism,
        avatar: avatar ?? "",
        story,
        status: "pending_review", // curator confirms tags → add to graduates.ts
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
          console.error("[graduate-story] level:lead-lost — Zapier push failed after retry:", email, err);
        }
      };
      await push();
    } else {
      console.warn("[graduate-story] no Zapier webhook configured — logging only.", { email });
    }

    logSec({ level: "security", endpoint: ENDPOINT, outcome: "accepted", signals: [], ip, email_domain: email.split("@")[1] });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[graduate-story]", err);
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}
