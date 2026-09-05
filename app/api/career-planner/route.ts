import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";
import { attachPromoCookie } from "@/app/lib/funnelPromo";
import { validateCareerPlanner } from "@/app/lib/security/validate";
import { logSec } from "@/app/lib/security/log";
import { sendCapiEvent, extractRequestUserData, deterministicEventId } from "@/app/lib/metaCapi";
import { buildEscapePlanEmail, type EscapePlanResult } from "@/app/lib/careerPlannerEmail";
import { notifySetter } from "@/app/lib/setter-intake";
import { mlAddSubscriber } from "@/app/lib/mailerlite";
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

    // Nurture. Straight into the MailerLite group that triggers the 7-day
    // Career Planner sequence, carrying the plan so the emails can personalise
    // on it without recomputing anything.
    //
    // This replaces the Render drip (`${EMAIL_SERVER_URL}/leads/new`), which
    // owned the career_planner track and never reliably ran: the free instance
    // sleeps after ~15 minutes so its in-process cron rarely fired, and every
    // lead sat frozen at step 0 with nobody advancing or handing off. MailerLite
    // runs this on a group trigger with no cron of ours in the path.
    //
    // Non-fatal on purpose: a MailerLite hiccup must never break the result the
    // user is already looking at, and the Zapier push above is a second route in.
    try {
      await mlAddSubscriber({
        email,
        name,
        phone,
        groupId: "193045414277022964", // PTLL Career Planner
        fields: {
          plan_readiness_score: res.readinessScore as number | undefined,
          plan_readiness_band: res.readinessBand as string | undefined,
          plan_quit_months: res.quitMonths as number | undefined,
          plan_recommended_route: res.recommendedRoute as string | undefined,
          plan_region: inp.region as string | undefined,
          plan_current_job: inp.job as string | undefined,
        },
      });
    } catch (err) {
      console.error("[career-planner] level:lead-lost — MailerLite add failed:", email, err);
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

    // Hand the lead to the setter so it lands in Leads Central with every other
    // enquiry, rather than only in Zapier/MailerLite. Fire-and-forget by design:
    // notifySetter swallows its own errors and no-ops when unconfigured, so this
    // can never break the submission.
    await notifySetter({ name, email, source: "career-planner" });

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
