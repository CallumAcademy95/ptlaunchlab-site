import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createRateLimiter, getIP } from "@/app/lib/rate-limit";
import { validateEnrolmentSec } from "@/app/lib/security/validate";
import { logSec } from "@/app/lib/security/log";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/enrolment-pending
//
// Safety net for the pay-first enrolment flow. Fired (fire-and-forget) from
// the /enrol checkout step the moment a buyer clicks Pay and is sent to
// Stripe — BEFORE they complete the post-payment enrolment form on
// /enrol/success.
//
// Why: in the pay-first flow the full learner record + signed agreement are
// collected AFTER payment, on Praxel. If a buyer drops out at Stripe, or pays
// and never creates their account, nothing else here records that they existed.
// This endpoint captures name + email + plan up front so admin always has the
// contact details to chase.
//
// Reconciliation: every buyer who triggers this should be followed by a
// "New enrolment" email from Praxel. Anyone here WITHOUT that follow-up either
// never paid, or paid and never enrolled — the latter also shows up as an
// unconsumed row in Praxel's enrolment_invites (the chase list).
//
// Body shape:
//   { name, email, plan: 'full'|'deposit', amount?, gymReferral?, promoCode?,
//     [SEC_KEY]: {...} }
// ─────────────────────────────────────────────────────────────────────────────

// Lazy because `new Resend(undefined)` throws,
// and at module scope that would 500 this route instead of quietly skipping the
// alert email as the guard below intends.
let resendClient: Resend | null = null;
function resend(): Resend {
  resendClient ??= new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "info@ptlaunchlab.co.uk";
const PENDING_ZAPIER_WEBHOOK = process.env.PENDING_ENROLMENT_ZAPIER_WEBHOOK_URL;

const rateLimiter = createRateLimiter(5, 60_000); // 5 per minute per IP

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  if (!rateLimiter(ip)) {
    return NextResponse.json({ ok: true }); // never surface friction at the pay step
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: true });
  }

  // Honeypot-only drop — be permissive, this fires at a high-value moment.
  const secCheck = validateEnrolmentSec(body);
  if (!secCheck.ok) {
    logSec({ level: "security", endpoint: "/api/enrolment-pending", outcome: "blocked-silent", signals: [`sec:${secCheck.reason}`], ip, ua: req.headers.get("user-agent") });
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const plan = body.plan === "deposit" ? "deposit" : "full";
  const amount = typeof body.amount === "number" && Number.isFinite(body.amount)
    ? body.amount
    : (plan === "deposit" ? 599 : 1599);
  const gymReferral = typeof body.gymReferral === "string" ? body.gymReferral : "";
  const promoCode = typeof body.promoCode === "string" ? body.promoCode : "";

  if (!name || !email) {
    return NextResponse.json({ ok: true }); // nothing useful to alert on
  }

  const planLabel = plan === "full"
    ? `Pay in Full — £${amount.toLocaleString()}`
    : `Deposit Plan — £${amount.toLocaleString()} deposit`;

  const startedAt = new Date().toLocaleString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "Europe/London",
  });

  // ── Admin "checkout started" email ──────────────────────────────────────
  const adminHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#061F36;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:#072B4A;border-radius:12px 12px 0 0;padding:22px 26px;border-bottom:3px solid #F5C518;">
      <div style="font-size:19px;font-weight:800;color:#ffffff;">PT Launch Lab</div>
      <div style="font-size:13px;color:#8CA3BF;margin-top:4px;">⏳ Checkout started — enrolment not yet completed</div>
    </div>
    <div style="background:#0A2A44;padding:22px 26px;border-radius:0 0 12px 12px;">
      <div style="font-size:17px;font-weight:700;color:#F5C518;margin-bottom:6px;">${name}</div>
      <div style="color:#8CA3BF;font-size:13px;margin-bottom:18px;">${startedAt} &nbsp;·&nbsp; ${planLabel}</div>

      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#4A6280;font-size:12px;padding:4px 0;width:120px;">Email</td><td style="color:#ffffff;font-size:13px;font-weight:600;padding:4px 0;"><a href="mailto:${email}" style="color:#F5C518;">${email}</a></td></tr>
        <tr><td style="color:#4A6280;font-size:12px;padding:4px 0;">Plan</td><td style="color:#ffffff;font-size:13px;font-weight:600;padding:4px 0;">${planLabel}</td></tr>
        ${gymReferral ? `<tr><td style="color:#4A6280;font-size:12px;padding:4px 0;">Gym referral</td><td style="color:#ffffff;font-size:13px;font-weight:600;padding:4px 0;">${gymReferral}</td></tr>` : ""}
        ${promoCode ? `<tr><td style="color:#4A6280;font-size:12px;padding:4px 0;">Promo code</td><td style="color:#ffffff;font-size:13px;font-weight:600;padding:4px 0;">${promoCode}</td></tr>` : ""}
      </table>

      <div style="margin-top:18px;padding:14px 16px;background:#061F36;border:1px solid #1A3A5C;border-radius:10px;color:#8CA3BF;font-size:12px;line-height:1.6;">
        This learner clicked <strong style="color:#ffffff;">Pay</strong> and was sent to Stripe. You should receive a full
        <strong style="color:#ffffff;">"New Enrolment"</strong> email once they pay and complete the enrolment form.
        <br><br>
        <strong style="color:#F5C518;">If that follow-up never arrives</strong>, they may have paid without finishing the
        form — reach out on the email above to complete their enrolment.
      </div>
    </div>
    <div style="text-align:center;padding:14px;color:#2A4A6C;font-size:11px;">
      PT Launch Lab · automated checkout-start alert
    </div>
  </div>
</body>
</html>`;

  if (process.env.RESEND_API_KEY) {
    try {
      await resend().emails.send({
        from: "PT Launch Lab Enrolments <enrolments@ptlaunchlab.co.uk>",
        to: ADMIN_EMAIL,
        subject: `⏳ Checkout started: ${name} — ${planLabel}`,
        html: adminHtml,
      });
    } catch (err) {
      console.error("[enrolment-pending] email failed:", err);
    }
  } else {
    console.warn("[enrolment-pending] RESEND_API_KEY not set — skipping alert email.");
  }

  // ── Optional: append a "Checkout Started" row to a Google Sheet ──────────
  // Set PENDING_ENROLMENT_ZAPIER_WEBHOOK_URL to reconcile starts vs completes.
  if (PENDING_ZAPIER_WEBHOOK) {
    fetch(PENDING_ZAPIER_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        started_at: startedAt,
        full_name: name,
        email,
        plan: planLabel,
        gym_referral: gymReferral,
        promo_code: promoCode,
        amount,
      }),
    }).catch((err) => console.error("[enrolment-pending] Zapier webhook error:", err));
  }

  return NextResponse.json({ ok: true });
}
