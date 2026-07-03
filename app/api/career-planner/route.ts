import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";
import { attachPromoCookie } from "@/app/lib/funnelPromo";
import { validateCareerPlanner } from "@/app/lib/security/validate";
import { logSec } from "@/app/lib/security/log";
import { sendCapiEvent, extractRequestUserData, deterministicEventId } from "@/app/lib/metaCapi";
import { buildEscapePlanEmail, type EscapePlanResult } from "@/app/lib/careerPlannerEmail";
import { Resend } from "resend";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/career-planner
// Lead gate on the Career Planning Suite result. Same shape as quiz-submission:
// validate → Zapier (→ MailerLite/Sheets) → email server → CAPI Lead. Uses a
// distinct `career-planner` source so a Meta Custom Audience + nurture segment
// can be built from these leads specifically.
// ─────────────────────────────────────────────────────────────────────────────

const rateLimiter = createRateLimiter(5, 60_000);
const ENDPOINT = "/api/career-planner";

type Snapshot = {
  inputs?: Record<string, unknown>;
  result?: Record<string, unknown>;
};

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

  const result = validateCareerPlanner(raw);
  if (!result.ok) {
    if (result.silent) {
      logSec({ level: "security", endpoint: ENDPOINT, outcome: "blocked-silent", signals: result.signals, ip, ua: request.headers.get("user-agent") });
      // Look successful but signal lead:false so the browser doesn't fire Lead for junk.
      return NextResponse.json({ success: true, lead: false });
    }
    logSec({ level: "security", endpoint: ENDPOINT, outcome: "blocked-user", signals: result.signals, ip });
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  try {
    const { name, email, phone } = result.data;
    const snap = (raw as Snapshot) || {};
    const inp = snap.inputs ?? {};
    const res = snap.result ?? {};

    const webhookUrl = process.env.CAREER_PLANNER_ZAPIER_WEBHOOK_URL || process.env.PROSPECTUS_ZAPIER_WEBHOOK_URL;
    if (webhookUrl) {
      const payload = {
        name,
        email,
        phone,
        source: "career-planner",
        // snapshot for admin context (no re-run needed)
        region: inp.region ?? "",
        current_job: inp.job ?? "",
        experience: inp.experience ?? "",
        hours_per_week: inp.hoursPerWeek ?? "",
        target_monthly_income: inp.targetMonthlyIncome ?? "",
        readiness_score: res.readinessScore ?? "",
        readiness_band: res.readinessBand ?? "",
        quit_months: res.quitMonths ?? "",
        year1_income: res.year1Income ?? "",
        business_model: res.businessModel ?? "",
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
          console.error("[career-planner] level:lead-lost — Zapier push failed after retry:", email, err);
        }
      };
      await push();
    } else {
      console.warn("[career-planner] no Zapier webhook configured — skipping.");
    }

    // Instant, personalised "Your Escape Plan" email (transactional; non-fatal so
    // a delivery hiccup never breaks the on-page result the user already sees).
    if (process.env.RESEND_API_KEY) {
      try {
        const { subject, html, text } = buildEscapePlanEmail(name, res as unknown as EscapePlanResult);
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Callum @ PT Launch Lab <callum@ptlaunchlab.co.uk>",
          to: email,
          replyTo: "callum@ptlaunchlab.co.uk",
          subject,
          html,
          text,
        });
      } catch (err) {
        console.error("[career-planner] level:lead-lost — instant email failed:", email, err);
      }
    }

    // Nurture sequence (email server), non-blocking. Pass the plan snapshot so the
    // server can route to the dedicated `career_planner` track and personalise on
    // their result (readiness / quit date / income) instead of the generic quiz track.
    const emailServerUrl = process.env.EMAIL_SERVER_URL;
    if (emailServerUrl) {
      const plan = {
        readinessScore: res.readinessScore ?? null,
        readinessBand: res.readinessBand ?? null,
        quitMonths: res.quitMonths ?? null,
        year1Income: res.year1Income ?? null,
        steadyIncome: res.steadyIncome ?? null,
        recommendedRoute: res.recommendedRoute ?? null,
        businessModel: res.businessModel ?? null,
        financeOption: res.financeOption ?? null,
        region: inp.region ?? null,
        currentJob: inp.job ?? null,
      };
      fetch(`${emailServerUrl}/leads/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, source: "career-planner", plan }),
      }).catch((err) => console.error("[career-planner] email server error:", err));
    }

    logSec({ level: "security", endpoint: ENDPOINT, outcome: "accepted", signals: [], ip, email_domain: email.split("@")[1] });

    // Meta CAPI Lead — paired with the browser fbq Lead via event_id for dedup.
    const rawEventId =
      typeof (raw as Record<string, unknown>)?.event_id === "string"
        ? ((raw as Record<string, unknown>).event_id as string).slice(0, 64)
        : null;
    const eventId = rawEventId || deterministicEventId("career_planner_lead", email);
    const [firstName, ...rest] = (name || "").split(/\s+/);
    void sendCapiEvent({
      eventName: "Lead",
      eventId,
      eventSourceUrl: request.headers.get("referer") || "https://ptlaunchlab.co.uk/career-planner",
      userData: {
        email,
        phone,
        firstName,
        lastName: rest.join(" "),
        country: "gb",
        ...extractRequestUserData(request),
      },
      customData: {
        currency: "GBP",
        value: 0, // lead signal, not the course price
        contentName: "career_planner",
        contentCategory: typeof res.businessModel === "string" ? res.businessModel : undefined,
      },
    });

    const response = NextResponse.json({ success: true, lead: true });
    try {
      attachPromoCookie(response, "career-planner");
    } catch (err) {
      console.warn("[career-planner] promo cookie not set:", err);
    }
    return response;
  } catch (err) {
    console.error("[career-planner]", err);
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}
