import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { Resend } from "resend";
import { sendCapiEvent } from "@/app/lib/metaCapi";
import { INSTALMENTS_ENABLED } from "@/app/lib/instalments";
import {
  getSubscription,
  setSubscriptionMetadata,
  cancelSubscription,
  countSettledInstalments,
} from "@/app/lib/stripeCheckout";

// Stripe -> GA4 Measurement Protocol webhook
//
// Fires the server-side `purchase` event (the only revenue event we trust —
// browser thank-you pages get blocked by ITP / closed tabs / ad blockers).
//
// Required env vars:
//   STRIPE_WEBHOOK_SECRET     — from Stripe Dashboard > Webhooks > endpoint
//   GA4_MEASUREMENT_ID        — same value as the client (G-90W2KGSL55)
//   GA4_API_SECRET            — GA4 Admin > Data Streams > [stream] > Measurement Protocol API secrets
//
// Stripe configuration (manual, one-time):
//   1. Stripe Dashboard > Webhooks > Add endpoint
//   2. URL: https://ptlaunchlab.co.uk/api/stripe-webhook
//   3. Events: checkout.session.completed
//   4. Copy signing secret to STRIPE_WEBHOOK_SECRET on Vercel
//   5. STRIPE_SECRET_KEY needs "Checkout Sessions → write" so /api/checkout can
//      create sessions with the return URL set in code (app/lib/stripeCheckout.ts).
//   6. Belt-and-braces: on each Payment Link still set the Dashboard redirect to
//      https://ptlaunchlab.co.uk/enrol/success?session_id={CHECKOUT_SESSION_ID}
//      — that's the path a buyer takes if session creation ever falls back.
//
// Attribution: the enrolment flow stashes UTMs + a generated client_reference_id
// against the learner record before redirecting to Stripe (TODO — see
// follow-up note). The webhook reads `client_reference_id` from the Stripe
// session and looks the UTMs back up.

export const runtime = "nodejs"; // need crypto + raw body

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "info@ptlaunchlab.co.uk";

// Separate PTLL course sales from anything else on this shared Stripe account
// (e.g. Ultimate Shred gym memberships) so only course sales fire the PTLL
// pixel + GA4 Purchase.
//
// Deposit sales became subscriptions when instalments were automated (£599 now
// + £200/month), so `mode` alone no longer separates a course sale from a gym
// membership. Sessions created by /api/checkout carry source=api-checkout-session
// and are ALWAYS ours — trust that first. Everything else falls back to the old
// mode + £500 floor test, which still covers sales made through raw Payment
// Links (the fallback path) and keeps USA gym subscriptions out.
function isCourseSale(session: StripeSession): boolean {
  if (session.metadata?.source === "api-checkout-session") return true;
  const amountGbp = (session.amount_total ?? 0) / 100;
  return session.mode !== "subscription" && amountGbp >= 500;
}

function verifySignature(payload: string, header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  // Header shape: t=timestamp,v1=signature,v0=optional
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k, v];
    }),
  );
  const ts = parts["t"];
  const sig = parts["v1"];
  if (!ts || !sig) return false;
  // Reject events older than 5 minutes — Stripe's recommended replay window
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (Number.isNaN(age) || age > 300) return false;
  const signed = `${ts}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(signed).digest("hex");
  // timingSafeEqual requires equal-length buffers
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

type StripeSession = {
  id: string;
  amount_total?: number;
  currency?: string;
  customer_email?: string | null;
  customer_details?: { email?: string | null; phone?: string | null; name?: string | null };
  client_reference_id?: string | null;
  metadata?: Record<string, string>;
  payment_status?: string;
  mode?: string; // "payment" | "subscription" | "setup"
};

type StripeEvent = {
  id: string;
  type: string;
  data: { object: StripeSession };
};

function decodeClientRef(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    // Reverse the url-safe substitutions made on the client (- -> +, _ -> /)
    // and re-add padding so Buffer can decode it.
    const padded = raw.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (padded.length % 4)) % 4;
    const decoded = Buffer.from(padded + "=".repeat(padLen), "base64").toString("utf8");
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === "object") return parsed as Record<string, string>;
  } catch {
    // fall through — client_reference_id wasn't our encoded payload
  }
  return {};
}

// Stripe only captures a name when the payment method or billing-address step
// asks for one, so it can come back empty. /api/checkout puts the name the
// buyer typed on the enrol form into session metadata as a backstop — it keeps
// the admin alert readable and the Meta CAPI match quality up.
function buyerName(session: StripeSession): string {
  return session.customer_details?.name || session.metadata?.buyer_name || "";
}

function hash(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

async function sendToGa4(session: StripeSession) {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;
  if (!measurementId || !apiSecret) {
    console.warn("[stripe-webhook] GA4 env vars missing — skipping purchase event");
    return;
  }

  const attribution = decodeClientRef(session.client_reference_id);
  const amount = (session.amount_total ?? 0) / 100;
  const currency = (session.currency ?? "gbp").toUpperCase();

  // GA4 Measurement Protocol requires a client_id. We use a hashed session id
  // since the buyer's original GA client_id is locked in their browser.
  // Not perfect for cross-device, but ensures the event lands attributable to
  // a stable id.
  const clientId =
    attribution["ga_client_id"] ||
    crypto.createHash("md5").update(session.id).digest("hex");

  const event = {
    client_id: clientId,
    user_id: hash(session.customer_email || session.customer_details?.email),
    events: [
      {
        name: "purchase",
        params: {
          transaction_id: session.id,
          value: amount,
          currency,
          payment_status: session.payment_status ?? "paid",
          first_touch_source: attribution["fts"] ?? "(direct)",
          first_touch_medium: attribution["ftm"] ?? "(none)",
          first_touch_campaign: attribution["ftc"] ?? "(none)",
          last_touch_source: attribution["lts"] ?? attribution["fts"] ?? "(direct)",
          last_touch_medium: attribution["ltm"] ?? attribution["ftm"] ?? "(none)",
          last_touch_campaign: attribution["ltc"] ?? attribution["ftc"] ?? "(none)",
          fbclid: attribution["fbclid"] ?? "",
          gclid: attribution["gclid"] ?? "",
          gym_referral: session.metadata?.gym_referral ?? "",
          promo_code: session.metadata?.promo_code ?? "",
          funnel_promo: attribution["funnel_promo"] ?? "",
          engagement_time_msec: 1,
        },
      },
    ],
  };

  // Funnel-promo redemption marker, logged for visibility only.
  //
  // This used to tell admin to cancel the 5th instalment for promo buyers who
  // chose the deposit plan, honouring £200 off. That practice is retired:
  // discounts do not apply to deposit plans, because the plan itself is the
  // concession and the full £1,599 is what gets spread. The promo only ever
  // discounts pay-in-full. Confirmed by Callum 2026-07-26.
  if (attribution["funnel_promo"]) {
    const isPif = amount >= 1300; // discounted PIF is £1,399; deposit is £599
    console.warn(
      `[stripe-webhook] FUNNEL PROMO ${isPif ? "PIF" : "DEPOSIT"} — ` +
        `source=${attribution["funnel_promo"]} ` +
        `email=${session.customer_email || session.customer_details?.email || "?"} ` +
        `session=${session.id} ` +
        `amount=£${amount}` +
        (isPif ? "" : " — deposit plan, full £1,599 over 5 instalments (no promo discount)"),
    );

    const hookUrl = process.env.FUNNEL_PROMO_ADMIN_WEBHOOK;
    if (hookUrl && !isPif) {
      // Fire-and-forget admin notification for deposit-plan promo redemptions
      fetch(hookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "funnel_promo_deposit",
          source: attribution["funnel_promo"],
          email: session.customer_email || session.customer_details?.email || "",
          phone: session.customer_details?.phone || "",
          name: buyerName(session),
          stripe_session_id: session.id,
          amount,
          currency,
          action_required: "None — deposit plans take the full £1,599 over 5 instalments; the promo discount applies to pay-in-full only",
        }),
      }).catch((err) => console.error("[stripe-webhook] admin hook failed:", err));
    }
  }

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(
    measurementId,
  )}&api_secret=${encodeURIComponent(apiSecret)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    console.warn("[stripe-webhook] GA4 MP returned non-2xx:", res.status, await res.text());
  }
}

// Meta Conversions API — server-side Purchase. Uses the Stripe session id as
// the event_id; the browser thank-you page at /enrol/success fires the same
// event_id so Meta deduplicates. If the browser thank-you tab is closed
// (ITP / mobile multitasking) we still capture the conversion server-side.
async function sendToMetaCapi(session: StripeSession) {
  const attribution = decodeClientRef(session.client_reference_id);
  const amountPaid = (session.amount_total ?? 0) / 100;
  const currency = (session.currency ?? "gbp").toUpperCase();
  const email = session.customer_email || session.customer_details?.email || undefined;
  const phone = session.customer_details?.phone || undefined;
  const fullName = buyerName(session);
  const [firstName, ...rest] = fullName.split(/\s+/);
  const lastName = rest.join(" ");

  // Value sent to Meta = the FULL course contract value, not just the cash
  // collected in this one Stripe session. Why: the deposit plan charges £599
  // up front and the remaining £1,000 arrives later as Stripe Billing
  // subscription invoices (invoice.paid) which this webhook does NOT forward.
  // Without this uplift Meta would learn a deposit buyer is worth £599 when
  // they're really a £1,599 course sale — starving value-based bidding and the
  // value-based lookalike of ~62% of each deposit enrolment's worth.
  //
  //   PIF (single payment ≥ £1,300)  → amount already equals the full value
  //                                     (£1,599, or £1,399 with the PIF promo)
  //   Deposit (£599 exactly)         → uplift to the full course value
  //                                     (£1,399 if a funnel/PIF promo applies,
  //                                      else £1,599)
  //
  // The £599-exact gate keeps this from ever mis-valuing a non-course charge
  // (e.g. a gym-membership subscription that shares this Stripe account) as a
  // course sale — those keep their real amount.
  const hasFunnelPromo = !!attribution["funnel_promo"];
  const isPif = amountPaid >= 1300;
  const isCourseDeposit = amountPaid === 599;
  const courseValue = isCourseDeposit ? (hasFunnelPromo ? 1399 : 1599) : amountPaid;

  await sendCapiEvent({
    eventName: "Purchase",
    eventId: session.id,                  // stripe session id is unique + stable
    eventSourceUrl: `https://ptlaunchlab.co.uk/enrol/success?session_id=${session.id}`,
    actionSource: "website",
    userData: {
      email: email || undefined,
      phone: phone || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      country: "gb",
      externalId: session.id,
      fbp: attribution["fbp"] || undefined,
      fbc: attribution["fbc"] || undefined,
    },
    customData: {
      currency,
      value: courseValue,                 // full contract value for optimisation
      amount_paid: amountPaid,            // cash collected in this session (ref)
      contentName: isPif ? "course_pif" : "course_deposit",
      contentCategory: attribution["funnel_promo"] || undefined,
      orderId: session.id,
      promo_code: session.metadata?.promo_code ?? "",
      funnel_promo: attribution["funnel_promo"] ?? "",
    },
  });
}

// Live gym-partner sales tracker — POSTs one row of sale data to a Make.com
// webhook URL, which appends a row to the Google Sheet tracker.
//
// Required env var:
//   GYM_TRACKER_WEBHOOK_URL  — the Make.com custom-webhook URL
//
// Filter: only PTLL course sales (deposit £599 or PIF £1,399 ± promo).
// USA gym-membership signups go through the same Stripe account but use
// monthly subscription pricing in a different range, so we cap at £1,500.
async function sendToGymTracker(session: StripeSession) {
  const url = process.env.GYM_TRACKER_WEBHOOK_URL;
  if (!url) return; // not configured — no-op

  const amount = (session.amount_total ?? 0) / 100;
  const currency = (session.currency ?? "gbp").toUpperCase();

  // Heuristic: PTLL course sales are one-off £599 (deposit) or £1,399 (PIF).
  // Skip USA-membership monthly subscriptions which land here too.
  const isPtllCourseSale = amount > 0 && amount <= 1500;
  if (!isPtllCourseSale) return;

  const email = session.customer_email || session.customer_details?.email || "";
  const name = buyerName(session);
  const phone = session.customer_details?.phone || "";
  // Gym attribution falls back to the client_reference_id payload because all
  // gym Payment Links share the same Stripe URL — metadata isn't per-gym.
  const attribution = decodeClientRef(session.client_reference_id);
  const gym_referral = session.metadata?.gym_referral || attribution.gym || "";
  const promo_code = session.metadata?.promo_code ?? "";
  const plan_type = amount >= 1300 ? "PIF" : "deposit";

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      gym_referral,                  // blank = direct sale
      promo_code,
      customer_email: email,
      customer_name: name,
      customer_phone: phone,
      amount_gbp: amount,
      currency,
      plan_type,                     // "deposit" | "PIF"
      stripe_session_id: session.id,
      stripe_link: `https://dashboard.stripe.com/payments/${session.id}`,
    }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Paid-but-form-not-completed safety net.
//
// The pay-first enrolment flow only writes a learner record when the buyer
// completes the post-payment form on /enrol/success (→ /api/enrolments →
// Google Sheet + PDF + "New Enrolment" email). If they pay but abandon that
// form, NOTHING on our side records that a paying customer exists — the sale
// silently vanishes.
//
// This function fires on every confirmed course payment (checkout.session
// .completed, payment_status=paid, isCourseSale) and does two things:
//
//   1. Emails admin a "💳 Payment confirmed" record with the buyer's Stripe
//      contact details. Guarantees a paid customer ALWAYS lands in the inbox,
//      independent of whether they finish the enrolment form.
//   2. Optionally appends a row to a reconciliation Google Sheet (set
//      PAID_ENROLMENT_ZAPIER_WEBHOOK_URL). Reconcile this "Paid" sheet against
//      the completed-enrolments sheet: anyone Paid without a matching complete
//      = paid but never finished the form → chase them.
//
// A buyer who DOES complete the form generates both this email and the later
// "New Enrolment" email — that pairing is the reconciliation signal, not noise.
// Filter the "💳 Payment confirmed" subject in Gmail if you only want to see
// the ones missing a follow-up.
// ─────────────────────────────────────────────────────────────────────────────
async function sendPaidReconciliation(session: StripeSession) {
  const amount = (session.amount_total ?? 0) / 100;
  const currency = (session.currency ?? "gbp").toUpperCase();
  const email = session.customer_email || session.customer_details?.email || "";
  const name = buyerName(session);
  const phone = session.customer_details?.phone || "";
  const planType = amount >= 1300 ? "PIF" : "deposit";
  const planLabel = planType === "PIF"
    ? `Pay in Full — £${amount.toLocaleString()}`
    : `Deposit — £${amount.toLocaleString()}`;
  const attribution = decodeClientRef(session.client_reference_id);
  const gymReferral = session.metadata?.gym_referral || attribution.gym || "";
  const promoCode = session.metadata?.promo_code ?? "";
  const stripeLink = `https://dashboard.stripe.com/payments/${session.id}`;

  // A deposit that arrived as a one-off payment while instalments are switched
  // on means /api/checkout fell back to the raw Payment Link — so no £200/month
  // mandate was taken. The buyer was shown a page promising automatic monthly
  // collection, and there is now no mechanism to collect the £1,000 balance.
  // Silence here would mean discovering it a month later, or never.
  const missingMandate =
    INSTALMENTS_ENABLED && planType === "deposit" && session.mode !== "subscription";

  const paidAt = new Date().toLocaleString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "Europe/London",
  });

  // ── Admin "payment confirmed" email ─────────────────────────────────────
  if (process.env.RESEND_API_KEY) {
    const adminHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#061F36;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:#072B4A;border-radius:12px 12px 0 0;padding:22px 26px;border-bottom:3px solid #F5C518;">
      <div style="font-size:19px;font-weight:800;color:#ffffff;">PT Launch Lab</div>
      <div style="font-size:13px;color:#8CA3BF;margin-top:4px;">💳 Payment confirmed via Stripe</div>
    </div>
    <div style="background:#0A2A44;padding:22px 26px;border-radius:0 0 12px 12px;">
      <div style="font-size:17px;font-weight:700;color:#F5C518;margin-bottom:6px;">${name || "(name not captured)"} — £${amount.toLocaleString()}</div>
      ${missingMandate ? `
      <div style="margin:12px 0 16px;padding:14px 16px;background:#3A0D0D;border:1px solid #C0392B;border-radius:10px;color:#FFD9D4;font-size:13px;line-height:1.6;">
        <strong style="color:#ffffff;">⚠️ NO INSTALMENT MANDATE TAKEN</strong><br><br>
        This deposit arrived as a one-off payment, so checkout fell back to the raw Payment Link and
        <strong style="color:#ffffff;">no £200/month plan was set up</strong> — but the enrol page told this buyer it would be.
        The remaining <strong style="color:#ffffff;">£1,000 has no way of collecting itself.</strong><br><br>
        Contact them to arrange the balance, then check
        <a href="https://ptlaunchlab.co.uk/api/checkout" style="color:#F5C518;">/api/checkout</a> —
        a fallback means Stripe session creation is failing.
      </div>` : ""}
      <div style="color:#8CA3BF;font-size:13px;margin-bottom:18px;">${paidAt} &nbsp;·&nbsp; ${planLabel}</div>

      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#4A6280;font-size:12px;padding:4px 0;width:120px;">Email</td><td style="color:#ffffff;font-size:13px;font-weight:600;padding:4px 0;">${email ? `<a href="mailto:${email}" style="color:#F5C518;">${email}</a>` : "—"}</td></tr>
        <tr><td style="color:#4A6280;font-size:12px;padding:4px 0;">Phone</td><td style="color:#ffffff;font-size:13px;font-weight:600;padding:4px 0;">${phone || "—"}</td></tr>
        <tr><td style="color:#4A6280;font-size:12px;padding:4px 0;">Plan</td><td style="color:#ffffff;font-size:13px;font-weight:600;padding:4px 0;">${planLabel}</td></tr>
        ${gymReferral ? `<tr><td style="color:#4A6280;font-size:12px;padding:4px 0;">Gym referral</td><td style="color:#ffffff;font-size:13px;font-weight:600;padding:4px 0;">${gymReferral}</td></tr>` : ""}
        ${promoCode ? `<tr><td style="color:#4A6280;font-size:12px;padding:4px 0;">Promo code</td><td style="color:#ffffff;font-size:13px;font-weight:600;padding:4px 0;">${promoCode}</td></tr>` : ""}
        <tr><td style="color:#4A6280;font-size:12px;padding:4px 0;">Stripe</td><td style="color:#ffffff;font-size:13px;font-weight:600;padding:4px 0;"><a href="${stripeLink}" style="color:#F5C518;">${session.id}</a></td></tr>
      </table>

      <div style="margin-top:18px;padding:14px 16px;background:#061F36;border:1px solid #1A3A5C;border-radius:10px;color:#8CA3BF;font-size:12px;line-height:1.6;">
        This is the <strong style="color:#ffffff;">money-confirmed</strong> record. You should also get a full
        <strong style="color:#ffffff;">"New Enrolment"</strong> email once they complete the enrolment form.
        <br><br>
        <strong style="color:#F5C518;">If that follow-up never arrives</strong>, this learner paid but didn't finish the
        form — send them <a href="https://ptlaunchlab.co.uk/enrol/success?session_id=${session.id}" style="color:#F5C518;">this completion link</a> to capture their details.
      </div>
    </div>
    <div style="text-align:center;padding:14px;color:#2A4A6C;font-size:11px;">
      PT Launch Lab · automated payment-confirmed record
    </div>
  </div>
</body>
</html>`;

    try {
      await resend.emails.send({
        from: "PT Launch Lab Enrolments <enrolments@ptlaunchlab.co.uk>",
        to: ADMIN_EMAIL,
        subject: missingMandate
          ? `🚨 Deposit paid with NO instalment plan: ${name || email || session.id} — £1,000 uncollected`
          : `💳 Payment confirmed: ${name || email || session.id} — ${planLabel}`,
        html: adminHtml,
      });
    } catch (err) {
      console.error("[stripe-webhook] paid-reconciliation email failed:", err);
    }
  } else {
    console.warn("[stripe-webhook] RESEND_API_KEY not set — skipping payment-confirmed alert.");
  }

  // ── Optional: append a "Paid" row to a reconciliation Google Sheet ───────
  const reconcileHook = process.env.PAID_ENROLMENT_ZAPIER_WEBHOOK_URL;
  if (reconcileHook) {
    try {
      await fetch(reconcileHook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paid_at: paidAt,
          full_name: name,
          email,
          phone,
          amount,
          currency,
          plan_type: planType,       // "PIF" | "deposit"
          gym_referral: gymReferral,
          promo_code: promoCode,
          stripe_session_id: session.id,
          stripe_link: stripeLink,
          completion_link: `https://ptlaunchlab.co.uk/enrol/success?session_id=${session.id}`,
        }),
      });
    } catch (err) {
      console.error("[stripe-webhook] paid-reconciliation Zapier hook failed:", err);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Learner-side enrolment recovery email.
//
// The admin reconciliation email above tells US that someone paid. This one
// tells the LEARNER what to do next, and — critically — gives them a permanent
// link back to their enrolment form.
//
// Why it's needed even now the return URL is fixed in code: the redirect only
// helps a buyer who is still holding the tab. It does nothing for someone who
// pays on their phone and closes it, loses signal mid-redirect, or has Safari
// bin the localStorage that prefills the form. An email survives all of that.
//
// Sent on every confirmed course payment. Someone who has already finished the
// form gets a mild duplicate, so the copy says as much up front — that is a
// far cheaper failure than a paying learner with no signed agreement on file.
// ─────────────────────────────────────────────────────────────────────────────
async function sendLearnerCompletionEmail(session: StripeSession) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[stripe-webhook] RESEND_API_KEY not set — skipping learner completion email.");
    return;
  }

  const email = session.customer_email || session.customer_details?.email || "";
  if (!email) {
    console.warn(`[stripe-webhook] no buyer email on ${session.id} — cannot send completion email.`);
    return;
  }

  const amount = (session.amount_total ?? 0) / 100;
  const name = buyerName(session);
  const firstName = name.trim().split(/\s+/)[0] || "";
  const planLabel = amount >= 1300
    ? `Pay in Full — £${amount.toLocaleString()}`
    : `Deposit — £${amount.toLocaleString()}`;
  const completionLink = `https://ptlaunchlab.co.uk/enrol/success?session_id=${session.id}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#061F36;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:#072B4A;border-radius:12px 12px 0 0;padding:26px;border-bottom:3px solid #F5C518;">
      <div style="font-size:20px;font-weight:800;color:#ffffff;">PT Launch Lab</div>
      <div style="font-size:13px;color:#8CA3BF;margin-top:4px;">Payment received — one last step</div>
    </div>
    <div style="background:#0A2A44;padding:26px;border-radius:0 0 12px 12px;color:#C7D6E8;font-size:14px;line-height:1.65;">
      <p style="margin:0 0 14px;">Hi${firstName ? ` ${firstName}` : ""},</p>
      <p style="margin:0 0 14px;">
        Your payment of <strong style="color:#ffffff;">£${amount.toLocaleString()}</strong> (${planLabel}) has gone through —
        thank you, and welcome to PT Launch Lab.
      </p>
      <p style="margin:0 0 20px;">
        To finish your enrolment we need your NCFE learner details and your signed learner
        agreement. It takes about two minutes, and we can't register you with NCFE until it's done.
      </p>

      <div style="text-align:center;margin:26px 0;">
        <a href="${completionLink}" style="display:inline-block;background:#F5C518;color:#061F36;font-weight:800;font-size:15px;text-decoration:none;padding:15px 32px;border-radius:999px;">
          Complete my enrolment →
        </a>
      </div>

      <p style="margin:0 0 18px;font-size:13px;color:#8CA3BF;">
        If the button doesn't work, paste this into your browser:<br>
        <a href="${completionLink}" style="color:#F5C518;word-break:break-all;">${completionLink}</a>
      </p>

      <div style="padding:14px 16px;background:#061F36;border:1px solid #1A3A5C;border-radius:10px;font-size:13px;color:#8CA3BF;">
        <strong style="color:#ffffff;">Already filled this in?</strong> Then you're all set — ignore this email.
        Your tutor will be in touch within 24 hours.
      </div>

      <p style="margin:20px 0 0;font-size:13px;color:#8CA3BF;">
        Any problems, just reply to this email or call <strong style="color:#ffffff;">01977 365001</strong>.
      </p>
    </div>
    <div style="text-align:center;padding:14px;color:#2A4A6C;font-size:11px;">
      PT Launch Lab · NCFE Accredited Centre No. 9002788
    </div>
  </div>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: "PT Launch Lab <enrolments@ptlaunchlab.co.uk>",
      to: email,
      replyTo: ADMIN_EMAIL,
      bcc: ADMIN_EMAIL,
      subject: firstName
        ? `${firstName} — one last step to finish your enrolment`
        : "One last step to finish your enrolment",
      html,
    });
  } catch (err) {
    console.error("[stripe-webhook] learner completion email failed:", err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Deposit instalment plan — £599 at checkout then 5 × £200/month.
//
// The plan has to stop itself. A Stripe subscription runs forever unless told
// otherwise, and the failure mode here is charging a learner a 6th, 7th, 12th
// £200 for a course they've already paid off in full — so the counting is
// deliberately conservative: count only settled instalment invoices, cancel as
// soon as the target is reached, and cancel on the way past it rather than
// exactly on it if the count is ever ambiguous.
//
// Counting invoices rather than computing an end date matters because Stripe's
// smart retries push billing dates around on a failed payment, and month-end
// enrolments (31 Jan → 28 Feb) break naive month arithmetic.
//
// Requires `invoice.paid` and `invoice.payment_failed` on the webhook endpoint.
// ─────────────────────────────────────────────────────────────────────────────

type StripeInvoice = {
  id: string;
  subscription?: string | null;
  // Stripe moved the subscription pointer under `parent` in later API versions;
  // read both so this doesn't quietly stop counting after an API upgrade.
  parent?: { subscription_details?: { subscription?: string | null } | null } | null;
  billing_reason?: string;
  amount_paid?: number;
  amount_due?: number;
  currency?: string;
  customer_email?: string | null;
  customer_name?: string | null;
  hosted_invoice_url?: string | null;
  attempt_count?: number;
  next_payment_attempt?: number | null;
};

function invoiceSubscriptionId(invoice: StripeInvoice): string | null {
  return invoice.subscription || invoice.parent?.subscription_details?.subscription || null;
}

async function handleInstalmentPaid(invoice: StripeInvoice) {
  const subId = invoiceSubscriptionId(invoice);
  if (!subId) return;

  const sub = await getSubscription(subId);
  if (!sub || sub.metadata?.ptll_plan !== "deposit_instalments") return; // not our plan

  const target = Number(sub.metadata?.instalments_target ?? "5");
  const name = sub.metadata?.buyer_name || invoice.customer_name || "";
  const email = sub.metadata?.buyer_email || invoice.customer_email || "";
  const amount = (invoice.amount_paid ?? 0) / 100;

  // Recomputed from Stripe on every delivery rather than incremented, so a
  // duplicate webhook can't cancel the plan an instalment early. This also
  // handles plans whose first invoice IS an instalment (hand-built ones that
  // took the deposit separately) without special-casing billing_reason.
  const paid = await countSettledInstalments(subId);
  if (paid === null) {
    console.error(`[stripe-webhook] could not count instalments for ${subId} — leaving plan running`);
    return;
  }

  // Informational: the authoritative count is the invoice list above.
  await setSubscriptionMetadata(subId, { instalments_paid: String(paid) });
  console.log(`[stripe-webhook] instalment ${paid}/${target} collected — £${amount} ${email} (${subId})`);

  if (paid < target) return;

  // Balance settled — stop the mandate before another month comes round.
  const cancelled = await cancelSubscription(subId);
  const total = 599 + paid * 200;
  console.log(
    cancelled
      ? `[stripe-webhook] plan complete for ${email} — cancelled ${subId} after ${paid} instalments`
      : `[stripe-webhook] PLAN COMPLETE BUT CANCEL FAILED for ${email} (${subId}) — cancel it by hand`,
  );

  if (process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: "PT Launch Lab Enrolments <enrolments@ptlaunchlab.co.uk>",
        to: ADMIN_EMAIL,
        subject: cancelled
          ? `✅ Course paid in full: ${name || email} — £${total.toLocaleString()}`
          : `🚨 ACTION NEEDED: cancel subscription for ${name || email} (${subId})`,
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;">
          <p style="font-size:15px;">${name || email} has now paid <strong>£${total.toLocaleString()}</strong> in full
          (£599 deposit + ${paid} × £200).</p>
          <p style="font-size:14px;color:#4A6280;">Email: ${email}<br>Subscription: ${subId}</p>
          ${cancelled
            ? `<p style="font-size:14px;">The instalment plan has been cancelled automatically — no further payments will be taken.</p>`
            : `<p style="font-size:14px;color:#b00;"><strong>The automatic cancellation failed.</strong> Cancel
               <a href="https://dashboard.stripe.com/subscriptions/${subId}">${subId}</a> in Stripe now, or they will be
               charged £200 again next month.</p>`}
        </div>`,
      });
    } catch (err) {
      console.error("[stripe-webhook] plan-complete email failed:", err);
    }
  }
}

async function handleInstalmentFailed(invoice: StripeInvoice) {
  const subId = invoiceSubscriptionId(invoice);
  if (!subId) return;

  const sub = await getSubscription(subId);
  if (!sub || sub.metadata?.ptll_plan !== "deposit_instalments") return;

  const target = Number(sub.metadata?.instalments_target ?? "5");
  const paid = Number(sub.metadata?.instalments_paid ?? "0");
  const name = sub.metadata?.buyer_name || invoice.customer_name || "";
  const email = sub.metadata?.buyer_email || invoice.customer_email || "";
  const amount = (invoice.amount_due ?? 0) / 100;
  const attempt = invoice.attempt_count ?? 1;
  const nextAttempt = invoice.next_payment_attempt
    ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London",
      })
    : null;

  console.warn(`[stripe-webhook] instalment FAILED — ${email} attempt ${attempt} (${subId})`);

  if (!process.env.RESEND_API_KEY) return;
  try {
    await resend.emails.send({
      from: "PT Launch Lab Enrolments <enrolments@ptlaunchlab.co.uk>",
      to: ADMIN_EMAIL,
      subject: nextAttempt
        ? `⚠️ Instalment failed: ${name || email} — £${amount} (retrying ${nextAttempt})`
        : `🚨 Instalment failed — no retries left: ${name || email} — £${amount}`,
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;">
        <p style="font-size:15px;">Instalment ${paid + 1} of ${target} failed for <strong>${name || email}</strong>.</p>
        <table style="font-size:14px;color:#4A6280;">
          <tr><td style="padding:2px 12px 2px 0;">Amount</td><td>£${amount}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:2px 12px 2px 0;">Attempt</td><td>${attempt}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;">Collected so far</td><td>£${(599 + paid * 200).toLocaleString()} of £${(599 + target * 200).toLocaleString()}</td></tr>
        </table>
        ${nextAttempt
          ? `<p style="font-size:14px;">Stripe will retry on <strong>${nextAttempt}</strong> and has emailed them to update their card. No action needed yet.</p>`
          : `<p style="font-size:14px;color:#b00;"><strong>Stripe has stopped retrying.</strong> Chase this one directly.</p>`}
        <p style="font-size:13px;"><a href="https://dashboard.stripe.com/subscriptions/${subId}">View subscription</a>
        ${invoice.hosted_invoice_url ? ` · <a href="${invoice.hosted_invoice_url}">View invoice</a>` : ""}</p>
        <p style="font-size:13px;color:#4A6280;">Course access is unaffected — this is a billing alert only.</p>
      </div>`,
    });
  } catch (err) {
    console.error("[stripe-webhook] instalment-failure email failed:", err);
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const payload = await req.text();
  const sigHeader = req.headers.get("stripe-signature");

  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  if (!verifySignature(payload, sigHeader, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data?.object;
    if (session && session.payment_status === "paid") {
      const amountGbp = (session.amount_total ?? 0) / 100;

      // PTLL analytics (GA4 purchase + Meta CAPI Purchase) only fire for actual
      // course sales — this keeps Ultimate Shred gym-membership charges on the
      // shared Stripe account out of the PTLL pixel + GA4 property.
      if (isCourseSale(session)) {
        try {
          await sendToGa4(session);
        } catch (err) {
          console.error("[stripe-webhook] GA4 dispatch failed:", err);
        }
        try {
          await sendToMetaCapi(session);
        } catch (err) {
          console.error("[stripe-webhook] Meta CAPI dispatch failed:", err);
        }
        // Safety net: guarantee a paid customer is recorded even if they never
        // complete the post-payment enrolment form.
        try {
          await sendPaidReconciliation(session);
        } catch (err) {
          console.error("[stripe-webhook] paid-reconciliation dispatch failed:", err);
        }
        // Learner-side recovery: gives the buyer a permanent link back to the
        // enrolment form regardless of what happened to their browser tab.
        try {
          await sendLearnerCompletionEmail(session);
        } catch (err) {
          console.error("[stripe-webhook] learner completion email dispatch failed:", err);
        }
      } else {
        console.log(`[stripe-webhook] non-course sale (£${amountGbp}) — skipping PTLL GA4 + Meta Purchase`);
      }

      // Gym tracker keeps its own internal filtering.
      try {
        await sendToGymTracker(session);
      } catch (err) {
        console.error("[stripe-webhook] gym tracker dispatch failed:", err);
      }
    }
  }

  // Deposit instalment plan lifecycle — see handleInstalmentPaid for why the
  // 5-payment cap is enforced by counting invoices rather than by a date.
  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const invoice = event.data?.object as unknown as StripeInvoice;
    try {
      if (event.type === "invoice.paid") await handleInstalmentPaid(invoice);
      else await handleInstalmentFailed(invoice);
    } catch (err) {
      console.error(`[stripe-webhook] ${event.type} handling failed:`, err);
    }
  }

  // Always 200 unless we couldn't authenticate — Stripe retries on non-2xx
  return NextResponse.json({ received: true });
}
