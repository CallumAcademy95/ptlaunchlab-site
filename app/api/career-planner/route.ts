import { NextRequest, NextResponse, after } from "next/server";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";
import { validateCareerPlannerV2 } from "@/app/lib/security/validate";
import { logSec } from "@/app/lib/security/log";
import { sendCapiEvent, extractRequestUserData, deterministicEventId } from "@/app/lib/metaCapi";
import { buildCareerPlanEmail } from "@/app/lib/careerPlannerEmail";
import { computeCareerPlanV2, BAND_SCORE, CONSENT_TEXT } from "@/app/lib/careerPlannerV2";
import { notifyPlannerIntake } from "@/app/lib/setter-intake";
import { mlAddSubscriber } from "@/app/lib/mailerlite";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { sendOwnerPush, type OwnerPushDb } from "@/app/lib/owner-push";
import { newLeadPush, pushStatus, type LeadRow } from "@/app/lib/leads";
import { insertDirect, plannerLead, plannerPushNeeded } from "@/app/lib/directLeads";
import { signNextToken, nextTokenSecret, NEXT_TOKEN_TTL_MS } from "@/app/lib/plannerNextToken";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/career-planner (v2)
// Validate → compute the plan server-side → respond immediately with the plan →
// background (each step independent and non-fatal): plan email, MailerLite,
// Zapier backup, Leads Central intake, Meta CAPI (Lead + QualifiedPlannerLead).
// ─────────────────────────────────────────────────────────────────────────────

const rateLimiter = createRateLimiter(5, 60_000);
const ENDPOINT = "/api/career-planner";
export const maxDuration = 60;

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

  const v = validateCareerPlannerV2(raw);
  if (!v.ok) {
    if (v.silent) {
      logSec({ level: "security", endpoint: ENDPOINT, outcome: "blocked-silent", signals: v.signals, ip, ua: request.headers.get("user-agent") });
      // Look successful but signal lead:false so the browser doesn't fire Lead for junk.
      return NextResponse.json({ success: true, lead: false });
    }
    logSec({ level: "security", endpoint: ENDPOINT, outcome: "blocked-user", signals: v.signals, ip });
    return NextResponse.json({ success: false, error: v.error }, { status: v.status });
  }

  try {
    const d = v.data;
    const plan = computeCareerPlanV2(d.answers);
    const a = d.answers;

    const eventId = d.eventId || deterministicEventId("career_planner_lead", d.email);

    // 1. Save the lead to `leads` (same row shape as /api/lead). A failure pushes
    //    "NOT SAVED" and carries on: the after() chain below is the backstop.
    const lead = plannerLead({
      name: d.name, email: d.email, phone: d.phone, band: plan.band, consentAt: d.consentAt,
      answers: a, utm: d.utm, referrer: request.headers.get("referer"),
    });
    let db: ReturnType<typeof getSupabaseAdmin> | null = null;
    try { db = getSupabaseAdmin(); } catch (err) { console.error("[career-planner] supabase not configured:", err); }
    const push = (p: Parameters<typeof sendOwnerPush>[1]) =>
      db ? sendOwnerPush(db as unknown as OwnerPushDb, p) : Promise.resolve({ sent: 0, removed: 0, failed: 0, error: "no database" });
    const saved = await insertDirect(lead, eventId, {
      insert: async (row: LeadRow) => {
        if (!db) return { error: "supabase not configured" };
        const { data, error } = await db.from("leads").insert(row).select("id").single();
        return error || !data ? { error: error?.message ?? "no row" } : { id: data.id as string };
      },
      push,
    }, 5_000);
    const leadId = "id" in saved ? saved.id : null;

    // 2. Respond. Everything else is background and non-fatal.
    // nextToken lets the result page record its next step against THIS row only.
    // No row (save failed) or no secret: null, and the page still works, it just doesn't record.
    const secret = nextTokenSecret();
    const nextToken = leadId && secret ? signNextToken(leadId, Date.now() + NEXT_TOKEN_TTL_MS, secret) : null;
    const response = NextResponse.json({ success: true, lead: true, plan, nextToken });
    logSec({ level: "security", endpoint: ENDPOINT, outcome: "accepted", signals: [], ip, email_domain: d.email.split("@")[1] });

    const userData = {
      email: d.email,
      phone: d.phone,
      firstName: d.firstName,
      lastName: d.surname || undefined,
      city: d.answers.town || undefined,
      country: "gb",
      ...extractRequestUserData(request),
    };
    const sourceUrl = request.headers.get("referer") || "https://ptlaunchlab.co.uk/career-planner";

    after(async () => {
      // Leads Central first: it is the only route to the WhatsApp first touch (never throws).
      let intakeOk = false;
      try {
        intakeOk = await notifyPlannerIntake({
          name: d.name,
          firstName: d.firstName,
          email: d.email,
          phone: d.phone,
          source: "career-planner",
          planVersion: 2,
          band: plan.band,
          score: BAND_SCORE[plan.band],
          answers: a,
          consent: { text: CONSENT_TEXT, at: d.consentAt },
          utm: d.utm,
        });
      } catch (err) {
        console.error("[career-planner] Leads Central intake failed:", d.email, err);
      }

      // Owner "New lead" push for the saved row. Prime leads are already pushed
      // by the PT app's planner intake, so only when that intake failed.
      if (leadId && db) {
        let status = "skipped";
        if (plannerPushNeeded(lead, plan.band, intakeOk)) {
          try { status = pushStatus(await push(newLeadPush(lead, leadId))); } catch (err) { status = `failed: ${String(err)}`.slice(0, 300); }
        }
        try { await db.from("leads").update({ push_status: status }).eq("id", leadId); } catch (err) { console.error("[career-planner] push_status write failed", err); }
      }

      // Everything else is independent; each step logs its own failure.
      await Promise.allSettled([
        (async () => {
          if (!process.env.RESEND_API_KEY) return;
          try {
            const mail = buildCareerPlanEmail(d.firstName, plan);
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
              from: "Callum @ PT Launch Lab <callum@ptlaunchlab.co.uk>",
              replyTo: "callum@ptlaunchlab.co.uk",
              to: d.email,
              subject: mail.subject,
              html: mail.html,
              text: mail.text,
            });
          } catch (err) {
            console.error("[career-planner] level:lead-lost — plan email failed:", d.email, err);
          }
        })(),
        (async () => {
          try {
            await mlAddSubscriber({
              email: d.email,
              name: d.firstName,
              phone: d.phone,
              groupId: "193045414277022964", // PTLL Career Planner
              fields: {
                plan_version: "2",
                plan_band: plan.band,
                plan_timeframe: a.timeframe,
                plan_goal: a.goal,
                plan_blocker: a.blocker,
                plan_blocker_note: a.blockerNote,
                plan_payment: a.payment,
                plan_hours: a.hours,
                plan_training: a.training,
                plan_why: a.why,
                plan_town: a.town,
                plan_region: a.region,
                plan_current_job: a.job,
                plan_consent_at: d.consentAt,
              },
            });
          } catch (err) {
            console.error("[career-planner] level:lead-lost — MailerLite add failed:", d.email, err);
          }
        })(),
        (async () => {
          const hook = process.env.CAREER_PLANNER_ZAPIER_WEBHOOK_URL || process.env.PROSPECTUS_ZAPIER_WEBHOOK_URL;
          if (!hook) return;
          try {
            await fetch(hook, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: d.name,
                email: d.email,
                phone: d.phone,
                source: "career-planner",
                plan_version: 2,
                band: plan.band,
                ...a,
                consent_at: d.consentAt,
                submitted_at: new Date().toISOString(),
              }),
            });
          } catch (err) {
            console.error("[career-planner] Zapier backup failed:", d.email, err);
          }
        })(),
        // Meta: Lead for everyone (keeps the existing conversion working) ...
        (async () => {
          try {
            await sendCapiEvent({
              eventName: "Lead",
              eventId,
              eventSourceUrl: sourceUrl,
              userData,
              customData: { currency: "GBP", value: 0, contentName: "career_planner", contentCategory: plan.band },
            });
          } catch (err) {
            console.error("[career-planner] CAPI Lead failed:", err);
          }
        })(),
        // ... and QualifiedPlannerLead for Prime/Strong only (pixel conditioning).
        (async () => {
          if (plan.band === "nurture") return;
          try {
            await sendCapiEvent({
              eventName: "QualifiedPlannerLead",
              eventId: `q-${eventId}`,
              eventSourceUrl: sourceUrl,
              userData,
              customData: { currency: "GBP", value: 0, contentName: "career_planner", contentCategory: plan.band },
            });
          } catch (err) {
            console.error("[career-planner] CAPI QualifiedPlannerLead failed:", err);
          }
        })(),
      ]);
    });

    return response;
  } catch (err) {
    console.error("[career-planner]", err);
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}
