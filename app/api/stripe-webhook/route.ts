import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { Resend } from "resend";
import { sendCapiEvent } from "@/app/lib/metaCapi";
import { INSTALMENTS_ENABLED } from "@/app/lib/instalments";
import {
  getSubscription,
  setSubscriptionMetadata,
  cancelSubscription,
  endSubscriptionWithoutProration,
  countSettledInstalments,
  countSettledMonthlyPayments,
  subscriptionPriceIds,
  MONTHLY_999_PRICE_ID,
  type StripeSubscription,
} from "@/app/lib/stripeCheckout";
import { recordPartnerSale, applyInstalmentToPartnerSale } from "@/app/lib/partner-sales";
import {
  isDepositSale,
  planTypeForSale,
  planKindForSale,
  planLabel,
  outstandingBalancePence,
  formatGbp,
  type SaleShape,
} from "@/app/lib/coursePlan";
import {
  subscriptionPlanKind,
  collectedPence,
  contractPence,
  legacyEntryPence,
  legacyInstalmentPence,
  monthlyTarget,
  planIsComplete,
} from "@/app/lib/paymentPlans";
import { formatPence, MONTHLY_PAYMENTS, MONTHLY_PRICE_LABEL, MONTHLY_PLAN_TOTAL_PENCE } from "@/app/lib/pricing";
import { PHONE_NATIONAL } from "@/app/lib/contactDetails";
import { buildInviteUrl, invitePostBody, type InvitePayload } from "@/app/lib/enrolmentInvite";

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
//
// The £99 September entry price sits UNDER that floor, so a sale that took the
// Payment Link fallback would drop out of GA4 and CAPI entirely — silently, and
// only on the path that runs when something else has already gone wrong. It is
// admitted by its Payment Link id rather than by its amount: a bare "£99 counts"
// rule would also admit any unrelated one-off £99 charge on this shared account.
// (Legacy: the September link is retired, kept so a late sale is still seen.)
const SEPT99_PAYMENT_LINK_ID =
  process.env.STRIPE_SEPT99_PAYMENT_LINK_ID || "plink_1U8Jic99z9lThumnrEWofv3y";

// From October 2026 the monthly plan's first payment is £99.99 on a SUBSCRIPTION
// — under the £500 floor AND in the mode the floor test rejects outright. So the
// two current plans are admitted by metadata, never by amount: API sessions
// carry source=api-checkout-session, and the two raw fallback Payment Links must
// be created with metadata ptll_product=course (Stripe copies a Payment Link's
// metadata onto every session it creates).
function isCourseSale(session: StripeSession): boolean {
  if (session.metadata?.source === "api-checkout-session") return true;
  if (session.metadata?.ptll_product === "course") return true;
  if (session.mode === "subscription") return false;
  if (session.payment_link === SEPT99_PAYMENT_LINK_ID) return true;
  const amountGbp = (session.amount_total ?? 0) / 100;
  return amountGbp >= 500;
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
  // Set when the buyer came through a raw Stripe Payment Link rather than an
  // API-created session — i.e. the fail-safe fallback path. Lets isCourseSale
  // recognise the £99 entry price, which sits under its £500 floor.
  payment_link?: string | null;
  // Set when mode is "subscription" — a deposit plan. pp_sales stores it so
  // later invoice.paid events can find the sale they belong to.
  subscription?: string | null;
};

type StripeEvent = {
  id: string;
  type: string;
  data: { object: StripeSession };
};

// The single place a Stripe session is reduced to what decides deposit-vs-PIF.
// Everything downstream — the alarm, both emails, the Sheet, Meta — classifies
// off this, so they cannot disagree with each other again. See app/lib/coursePlan.
function saleShape(session: StripeSession): SaleShape {
  // contract_value_pence is exact and stamped from October 2026. Older sessions
  // only carry contract_value in POUNDS; SaleShape works in pence throughout, so
  // convert here (rounded — 999.9 × 100 is not an integer in floating point)
  // rather than letting two units meet anywhere near a balance calculation.
  const stampedPence = Number(session.metadata?.contract_value_pence);
  const contractPounds = Number(session.metadata?.contract_value);
  return {
    mode: session.mode,
    amountTotalPence: session.amount_total ?? 0,
    metadataPlan: session.metadata?.plan,
    contractValuePence:
      Number.isFinite(stampedPence) && stampedPence > 0
        ? Math.round(stampedPence)
        : Number.isFinite(contractPounds) && contractPounds > 0
          ? Math.round(contractPounds * 100)
          : null,
  };
}

function decodeClientRef(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    // Reverse the url-safe substitutions made on the client (- -> +, _ -> /)
    // and re-add padding so Buffer can decode it.
    const padded = raw.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (padded.length % 4)) % 4;
    const decoded = Buffer.from(padded + "=".repeat(padLen), "base64").toString("utf8");

    try {
      const parsed = JSON.parse(decoded);
      if (parsed && typeof parsed === "object") return parsed as Record<string, string>;
    } catch {
      // Stripe caps client_reference_id at 200 characters, so a payload with a
      // long gym name plus attribution can arrive cut off mid-JSON. JSON.parse
      // then throws and the gym is silently lost — a real sale reached the Sheet
      // with a blank gym_referral this way on 2026-07-26. Scrape the complete
      // key/value pairs out of whatever survived instead of discarding the lot.
      const out: Record<string, string> = {};
      for (const [, k, v] of decoded.matchAll(/"([a-z_]+)"\s*:\s*"([^"]*)"/g)) out[k] = v;
      if (Object.keys(out).length) return out;
    }
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
  const touch = (k: string): string | undefined =>
    session.metadata?.[`attr_${k}`] || attribution[k] || undefined;
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
          // Durable session metadata (attr_*) wins; the client_reference_id blob
          // is the fallback for older sessions and truncated payloads.
          first_touch_source: touch("fts") ?? "(direct)",
          first_touch_medium: touch("ftm") ?? "(none)",
          first_touch_campaign: touch("ftc") ?? "(none)",
          last_touch_source: touch("lts") ?? touch("fts") ?? "(direct)",
          last_touch_medium: touch("ltm") ?? touch("ftm") ?? "(none)",
          last_touch_campaign: touch("ltc") ?? touch("ftc") ?? "(none)",
          fbclid: touch("fbclid") ?? "",
          gclid: touch("gclid") ?? "",
          gym_referral: session.metadata?.gym_referral ?? "",
          promo_code: session.metadata?.promo_code ?? "",
          funnel_promo: attribution["funnel_promo"] ?? "",
          engagement_time_msec: 1,
        },
      },
    ],
  };

  // GA4 `value` is the cash actually collected in this session: £999.99 for a
  // pay-in-full, £99.99 for the first monthly payment. GA4 is the revenue
  // record, so it reports money received, not money promised. Meta (below) is
  // sent the contract value instead, for bid optimisation.

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
  // collected in this one Stripe session. Why: an instalment plan charges only
  // the entry payment up front and the balance arrives later as Stripe Billing
  // subscription invoices (invoice.paid) which this webhook does NOT forward.
  // Without this uplift Meta learns a £99 buyer is worth £99 when they are
  // really a £1,099 course sale — starving value-based bidding and the
  // value-based lookalike of most of each instalment enrolment's worth.
  //
  //   PIF                  → amount already equals the full value
  //   £99.99 monthly       → uplift to the 10 × £99.99 contract, £999.90
  //   £599 entry (legacy)  → uplift to £1,599 (£1,399 with a funnel/PIF promo)
  //   £99 entry (Sept-26)  → uplift to £1,099
  //
  // The contract value is stamped into session metadata at checkout by
  // buildSessionParams, so this reads it rather than inferring it from the
  // amount. The previous `amountPaid === 599` gate would have valued every £99
  // enrolment at £99 — silently, on the ad account the campaign's audience came
  // from. Anything with no stamped contract value keeps its real amount, which
  // is what stops a non-course charge on this shared Stripe account (e.g. a gym
  // membership) from ever being uplifted.
  const hasFunnelPromo = !!attribution["funnel_promo"];
  const isPif = !isDepositSale(saleShape(session));
  const stampedContractValue = Number(session.metadata?.contract_value);
  const hasStampedValue = Number.isFinite(stampedContractValue) && stampedContractValue > 0;
  // Legacy fallback: sessions created before contract_value was stamped, and any
  // sale that came through the raw Payment Link fallback rather than the API.
  // £599 exactly is the only entry amount those can be, since the £99 price
  // post-dates the stamp.
  const isLegacyDeposit = !hasStampedValue && amountPaid === 599;
  const courseValue = hasStampedValue
    ? (hasFunnelPromo && stampedContractValue === 1599 ? 1399 : stampedContractValue)
    : isLegacyDeposit
      ? (hasFunnelPromo ? 1399 : 1599)
      : amountPaid;

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
      contentName: isPif
        ? "course_pif"
        : planKindForSale(saleShape(session)) === "monthly"
          ? "course_monthly"
          : "course_deposit",
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
// Filter: only PTLL course sales. USA gym-membership signups go through the
// same Stripe account but use monthly subscription pricing in a different
// range, so we cap at £1,500. Both current prices (£999.99 in full, £99.99 first
// monthly payment) sit inside it, as did every legacy price.
async function sendToGymTracker(session: StripeSession) {
  const url = process.env.GYM_TRACKER_WEBHOOK_URL;
  if (!url) return; // not configured — no-op

  const amount = (session.amount_total ?? 0) / 100;
  const currency = (session.currency ?? "gbp").toUpperCase();

  // Heuristic: PTLL course sales are £999.99 pay-in-full or a £99.99 first
  // monthly payment (legacy: £99/£599 entries, £1,399/£1,599 pay-in-full).
  // Skip USA-membership monthly subscriptions, which land here too.
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
  // Was `amount >= 1300`, which called every discounted gym pay-in-full (£1,099)
  // a deposit — 8 of the 9 gym sales in the Sheet were labelled wrong. Shares
  // the partner portal's rule now so the two records agree. Rows written before
  // 2026-07-28 still carry the old label.
  // "PIF" | "deposit" | "monthly" — the monthly plan is named as itself in the
  // Sheet rather than folded into "deposit".
  const plan_type = planKindForSale(saleShape(session));

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
      plan_type,                     // "deposit" | "PIF" | "monthly"
      stripe_session_id: session.id,
      stripe_link: `https://dashboard.stripe.com/payments/${session.id}`,
    }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Paid-but-not-enrolled safety net.
//
// The learner record is written on Praxel, when the buyer creates their account
// there. If they pay and never do, nothing on THIS side records that a paying
// customer exists — the sale silently vanishes from the inbox.
//
// (Praxel keeps its own record of the same gap: every paid sale writes an
// enrolment_invites row, and the unconsumed ones are the chase list. This email
// is the belt to that braces, and the one that reaches a human unprompted.)
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
  const sale = saleShape(session);
  const label = planLabel(sale);
  const attribution = decodeClientRef(session.client_reference_id);
  const gymReferral = session.metadata?.gym_referral || attribution.gym || "";
  const promoCode = session.metadata?.promo_code ?? "";
  const stripeLink = `https://dashboard.stripe.com/payments/${session.id}`;

  // A deposit that arrived as a one-off payment while instalments are switched
  // on means /api/checkout fell back to the raw Payment Link — so no £200/month
  // mandate was taken. The buyer was shown a page promising automatic monthly
  // collection, and there is now no mechanism to collect the balance. Silence
  // here would mean discovering it a month later, or never.
  //
  // The plan kind decides this, so it must never be derived from the amount: a
  // £1,099 partner pay-in-full read as a deposit fires this alarm at a learner
  // who owes nothing, and a false alarm is how a real one gets ignored.
  //
  // LEGACY deposits only. The monthly plan is always a subscription, and a
  // monthly sale is never a "deposit with no mandate" — if it is not a
  // subscription it is not a monthly sale at all.
  const missingMandate =
    INSTALMENTS_ENABLED && planKindForSale(sale) === "deposit" && session.mode !== "subscription";
  // Derived, not the flat "£1,000" this used to state — that figure is only
  // right for a £599 deposit and was wrong on the sale that exposed the bug.
  const uncollected = formatGbp(outstandingBalancePence(sale));

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
      <div style="font-size:17px;font-weight:700;color:#F5C518;margin-bottom:6px;">${name || "(name not captured)"} — ${formatPence(session.amount_total ?? 0)}</div>
      ${missingMandate ? `
      <div style="margin:12px 0 16px;padding:14px 16px;background:#3A0D0D;border:1px solid #C0392B;border-radius:10px;color:#FFD9D4;font-size:13px;line-height:1.6;">
        <strong style="color:#ffffff;">⚠️ NO INSTALMENT MANDATE TAKEN</strong><br><br>
        This deposit arrived as a one-off payment, so checkout fell back to the raw Payment Link and
        <strong style="color:#ffffff;">no £200/month plan was set up</strong> — but the enrol page told this buyer it would be.
        The remaining <strong style="color:#ffffff;">${uncollected} has no way of collecting itself.</strong><br><br>
        Contact them to arrange the balance, then check
        <a href="https://ptlaunchlab.co.uk/api/checkout" style="color:#F5C518;">/api/checkout</a> —
        a fallback means Stripe session creation is failing.
      </div>` : ""}
      <div style="color:#8CA3BF;font-size:13px;margin-bottom:18px;">${paidAt} &nbsp;·&nbsp; ${label}</div>

      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#4A6280;font-size:12px;padding:4px 0;width:120px;">Email</td><td style="color:#ffffff;font-size:13px;font-weight:600;padding:4px 0;">${email ? `<a href="mailto:${email}" style="color:#F5C518;">${email}</a>` : "—"}</td></tr>
        <tr><td style="color:#4A6280;font-size:12px;padding:4px 0;">Phone</td><td style="color:#ffffff;font-size:13px;font-weight:600;padding:4px 0;">${phone || "—"}</td></tr>
        <tr><td style="color:#4A6280;font-size:12px;padding:4px 0;">Plan</td><td style="color:#ffffff;font-size:13px;font-weight:600;padding:4px 0;">${label}</td></tr>
        ${gymReferral ? `<tr><td style="color:#4A6280;font-size:12px;padding:4px 0;">Gym referral</td><td style="color:#ffffff;font-size:13px;font-weight:600;padding:4px 0;">${gymReferral}</td></tr>` : ""}
        ${promoCode ? `<tr><td style="color:#4A6280;font-size:12px;padding:4px 0;">Promo code</td><td style="color:#ffffff;font-size:13px;font-weight:600;padding:4px 0;">${promoCode}</td></tr>` : ""}
        <tr><td style="color:#4A6280;font-size:12px;padding:4px 0;">Stripe</td><td style="color:#ffffff;font-size:13px;font-weight:600;padding:4px 0;"><a href="${stripeLink}" style="color:#F5C518;">${session.id}</a></td></tr>
      </table>

      <div style="margin-top:18px;padding:14px 16px;background:#061F36;border:1px solid #1A3A5C;border-radius:10px;color:#8CA3BF;font-size:12px;line-height:1.6;">
        This is the <strong style="color:#ffffff;">money-confirmed</strong> record. Praxel sends a
        <strong style="color:#ffffff;">"New enrolment"</strong> email once they create their account there.
        <br><br>
        <strong style="color:#F5C518;">If that follow-up never arrives</strong>, this learner paid but didn't finish the
        account — send them <a href="${praxelEnrolLink(session)}" style="color:#F5C518;">their enrolment link</a> to finish it. It's signed, works once, and only for their email address.
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
          ? `🚨 Deposit paid with NO instalment plan: ${name || email || session.id} — ${uncollected} uncollected`
          : `💳 Payment confirmed: ${name || email || session.id} — ${label}`,
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
          plan_type: planKindForSale(sale), // "PIF" | "deposit" | "monthly"
          gym_referral: gymReferral,
          promo_code: promoCode,
          stripe_session_id: session.id,
          stripe_link: stripeLink,
          completion_link: praxelEnrolLink(session),
        }),
      });
    } catch (err) {
      console.error("[stripe-webhook] paid-reconciliation Zapier hook failed:", err);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Praxel hand-off.
//
// The learner record lives on Praxel now, not here. A paid sale produces one
// signed description of itself, used for two things that must agree: the link
// the buyer is emailed, and the POST that records the sale in Praxel.
//
// Required env:
//   PTLL_INVITE_SECRET    — shared with Praxel, identical value
//   PRAXEL_ENROL_ORIGIN   — https://ptll.praxel.co.uk
// ─────────────────────────────────────────────────────────────────────────────
const PRAXEL_ORIGIN = process.env.PRAXEL_ENROL_ORIGIN ?? "https://ptll.praxel.co.uk";

function invitePayloadFor(session: StripeSession): InvitePayload | null {
  const email = session.customer_email || session.customer_details?.email || "";
  if (!email) return null;
  const attribution = decodeClientRef(session.client_reference_id);
  return {
    sid: session.id,
    email: email.toLowerCase(),
    name: buyerName(session),
    // Shape, never amount. A £1,099 partner pay-in-full is a PIF, and calling
    // it a deposit is a mistake this repo has already made twice.
    plan: planTypeForSale(saleShape(session)) === "deposit" ? "deposit" : "PIF",
    amount: (session.amount_total ?? 0) / 100,
    gym: session.metadata?.gym_slug || attribution.gyms || undefined,
    promo: session.metadata?.promo_code || undefined,
    ts: Date.now(),
  };
}

// The buyer's way into Praxel. Falls back to the bare enrol page only when the
// secret is missing, which is a misconfiguration rather than a runtime state —
// and which Praxel will then refuse, loudly, rather than silently enrolling
// someone who never paid.
function praxelEnrolLink(session: StripeSession): string {
  const secret = process.env.PTLL_INVITE_SECRET;
  const payload = secret ? invitePayloadFor(session) : null;
  return payload && secret ? buildInviteUrl(PRAXEL_ORIGIN, payload, secret) : `${PRAXEL_ORIGIN}/enrol`;
}

// Records the paid sale in Praxel so a buyer who never opens their email still
// shows up there as "paid, never enrolled".
//
// Best-effort by design: the emailed link carries the same signed payload, so
// enrolment keeps working even when this call fails. What is lost on failure is
// only the chase-list row — and Praxel rebuilds that from the signature the
// moment the learner clicks.
async function sendEnrolmentInvite(session: StripeSession) {
  const secret = process.env.PTLL_INVITE_SECRET;
  if (!secret) {
    console.warn("[stripe-webhook] PTLL_INVITE_SECRET not set — skipping the Praxel invite");
    return;
  }
  const payload = invitePayloadFor(session);
  if (!payload) {
    console.warn(`[stripe-webhook] no buyer email on ${session.id} — cannot create a Praxel invite`);
    return;
  }
  const { body, signature } = invitePostBody(payload, secret);
  const res = await fetch(`${PRAXEL_ORIGIN}/api/enrolment-invites`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-ptll-signature": signature },
    body,
  });
  if (!res.ok) {
    console.error(`[stripe-webhook] Praxel invite rejected (${res.status}):`, await res.text());
  } else {
    console.log(`[stripe-webhook] Praxel invite recorded for ${payload.email} (${session.id})`);
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

  const name = buyerName(session);
  const firstName = name.trim().split(/\s+/)[0] || "";
  // Buyer-facing, so the amount test that used to be here was the worst copy of
  // it: a £1,099 partner pay-in-full was told, in writing, that she had paid a
  // deposit.
  const label = planLabel(saleShape(session));
  // Points at Praxel, where the learner record now lives. The link is signed
  // and works once, so it must not be shared — the copy below says so.
  const completionLink = praxelEnrolLink(session);

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#061F36;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:#072B4A;border-radius:12px 12px 0 0;padding:26px;border-bottom:3px solid #F5C518;">
      <div style="font-size:20px;font-weight:800;color:#ffffff;">PT Launch Lab</div>
      <div style="font-size:13px;color:#8CA3BF;margin-top:4px;">Payment received — create your account</div>
    </div>
    <div style="background:#0A2A44;padding:26px;border-radius:0 0 12px 12px;color:#C7D6E8;font-size:14px;line-height:1.65;">
      <p style="margin:0 0 14px;">Hi${firstName ? ` ${firstName}` : ""},</p>
      <p style="margin:0 0 14px;">
        Your payment of <strong style="color:#ffffff;">${formatPence(session.amount_total ?? 0)}</strong> (${label}) has gone through —
        thank you, and welcome to PT Launch Lab.
      </p>
      <p style="margin:0 0 20px;">
        One more step: create your account. You'll set a password, give us your NCFE learner details and sign your
        learner agreement — about five minutes. Your course opens as soon as you're done, and we can't register you
        with NCFE until it is.
      </p>

      <div style="text-align:center;margin:26px 0;">
        <a href="${completionLink}" style="display:inline-block;background:#F5C518;color:#061F36;font-weight:800;font-size:15px;text-decoration:none;padding:15px 32px;border-radius:999px;">
          Create my account →
        </a>
      </div>

      <p style="margin:0 0 18px;font-size:13px;color:#8CA3BF;">
        If the button doesn't work, paste this into your browser:<br>
        <a href="${completionLink}" style="color:#F5C518;word-break:break-all;">${completionLink}</a>
      </p>

      <div style="padding:14px 16px;background:#061F36;border:1px solid #1A3A5C;border-radius:10px;font-size:13px;color:#8CA3BF;">
        <strong style="color:#ffffff;">This link is just for you.</strong> It's tied to your payment, works once, and
        can only enrol the email address you paid with — so there's no need to forward it on.
        <br><br>
        <strong style="color:#ffffff;">Already created your account?</strong> Then you're all set — sign in at
        <a href="${PRAXEL_ORIGIN}/login" style="color:#F5C518;">${PRAXEL_ORIGIN.replace(/^https?:\/\//, "")}</a>.
      </div>

      <p style="margin:20px 0 0;font-size:13px;color:#8CA3BF;">
        Any problems, just reply to this email or call <strong style="color:#ffffff;">${PHONE_NATIONAL}</strong>.
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
// Payment plans.
//
//   monthly (from October 2026) — 10 × £99.99, the first taken at checkout.
//   legacy                      — £599 (or £99) at checkout then 5 × £200/month
//                                 (5 × £300 on the October price). Still being
//                                 paid by learners who enrolled before October.
//
// The plan has to stop itself. A Stripe subscription runs forever unless told
// otherwise, and the failure mode here is charging a learner an 11th £99.99,
// or a 6th £200, for a course they've already paid off in full — so the
// counting is deliberately conservative: count only settled invoices on the
// plan's own recurring price, stop as soon as the target is reached, and stop
// on the way past it rather than exactly on it if the count is ever ambiguous.
//
// Counting invoices rather than computing an end date matters because Stripe's
// smart retries push billing dates around on a failed payment, and month-end
// enrolments (31 Jan → 28 Feb) break naive month arithmetic. It is also why
// cancel_at is NOT used: setting it mid-period makes Stripe prorate the final
// instalment.
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

/** Which plan this subscription is, or null if it isn't one of ours. */
function planKindOf(sub: StripeSubscription) {
  return subscriptionPlanKind(sub.metadata, subscriptionPriceIds(sub), MONTHLY_999_PRICE_ID);
}

async function handleInstalmentPaid(invoice: StripeInvoice) {
  const subId = invoiceSubscriptionId(invoice);
  if (!subId) return;

  const sub = await getSubscription(subId);
  if (!sub) return;
  const kind = planKindOf(sub);
  if (kind === "monthly") return handleMonthlyPaymentPaid(invoice, sub, subId);
  if (kind !== "legacy") return; // not our plan

  // ── Legacy deposit plan — behaviour unchanged ─────────────────────────────
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

  // Move the partner's payment progress on, and release their commission when
  // their terms say so. Reuses `paid` above rather than counting again — that
  // number is recomputed from Stripe and safe against redelivery.
  await applyInstalmentToPartnerSale({
    subscriptionId: subId,
    kind: "legacy",
    settled: paid,
    collectedPence: collectedPence("legacy", paid, sub.metadata),
  });

  if (paid < target) return;

  // Balance settled — stop the mandate before another month comes round.
  const cancelled = await cancelSubscription(subId);
  // Each instalment is (contract − entry) ÷ target: £200 on every £599 and £99
  // September plan, exactly as the old `paid * 200` said, and £300 on the
  // October price, which `paid * 200` got wrong.
  const entryPence = legacyEntryPence(sub.metadata);
  const instalment = formatPence(legacyInstalmentPence(sub.metadata));
  const total = formatPence(collectedPence("legacy", paid, sub.metadata));
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
          ? `✅ Course paid in full: ${name || email} — ${total}`
          : `🚨 ACTION NEEDED: cancel subscription for ${name || email} (${subId})`,
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;">
          <p style="font-size:15px;">${name || email} has now paid <strong>${total}</strong> in full
          (${formatPence(entryPence)} to start + ${paid} × ${instalment}).</p>
          <p style="font-size:14px;color:#4A6280;">Email: ${email}<br>Subscription: ${subId}</p>
          ${cancelled
            ? `<p style="font-size:14px;">The instalment plan has been cancelled automatically — no further payments will be taken.</p>`
            : `<p style="font-size:14px;color:#b00;"><strong>The automatic cancellation failed.</strong> Cancel
               <a href="https://dashboard.stripe.com/subscriptions/${subId}">${subId}</a> in Stripe now, or they will be
               charged ${instalment} again next month.</p>`}
        </div>`,
      });
    } catch (err) {
      console.error("[stripe-webhook] plan-complete email failed:", err);
    }
  }
}

// 10 × £99.99. The checkout payment is payment 1 (no trial), so the count of
// paid invoices on the monthly price IS the number of payments made.
async function handleMonthlyPaymentPaid(
  invoice: StripeInvoice,
  sub: StripeSubscription,
  subId: string,
) {
  const target = monthlyTarget();
  const name = sub.metadata?.buyer_name || invoice.customer_name || "";
  const email = sub.metadata?.buyer_email || invoice.customer_email || "";

  const paid = await countSettledMonthlyPayments(subId);
  if (paid === null) {
    console.error(`[stripe-webhook] could not count monthly payments for ${subId} — leaving plan running`);
    return;
  }

  await setSubscriptionMetadata(subId, { payments_paid: String(paid) });
  console.log(
    `[stripe-webhook] monthly payment ${paid}/${target} collected — ${formatPence(invoice.amount_paid ?? 0)} ${email} (${subId})`,
  );

  await applyInstalmentToPartnerSale({
    subscriptionId: subId,
    kind: "monthly",
    settled: paid,
    collectedPence: collectedPence("monthly", paid),
  });

  if (!planIsComplete(paid, target)) return;

  // A redelivered 10th invoice.paid arrives after the plan has already been
  // ended. Nothing to do, and re-cancelling would fail and raise a false alarm.
  if (sub.status === "canceled") {
    console.log(`[stripe-webhook] monthly plan ${subId} already ended — redelivery ignored`);
    return;
  }

  // Cancel now with prorate=false and invoice_now=false: no credit, no closing
  // invoice, no 11th month. Never cancel_at — see endSubscriptionWithoutProration.
  const ended = await endSubscriptionWithoutProration(subId);
  const total = formatPence(collectedPence("monthly", paid));
  console.log(
    ended
      ? `[stripe-webhook] monthly plan complete for ${email} — ended ${subId} after ${paid} payments`
      : `[stripe-webhook] MONTHLY PLAN COMPLETE BUT CANCEL FAILED for ${email} (${subId}) — cancel it by hand`,
  );

  if (process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: "PT Launch Lab Enrolments <enrolments@ptlaunchlab.co.uk>",
        to: ADMIN_EMAIL,
        subject: ended
          ? `✅ Course paid in full: ${name || email} — ${total}`
          : `🚨 ACTION NEEDED: cancel subscription for ${name || email} (${subId})`,
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;">
          <p style="font-size:15px;">${name || email} has now paid <strong>${total}</strong> in full
          (${paid} × ${MONTHLY_PRICE_LABEL}).</p>
          <p style="font-size:14px;color:#4A6280;">Email: ${email}<br>Subscription: ${subId}</p>
          ${ended
            ? `<p style="font-size:14px;">The monthly plan has been ended automatically, with no proration — no further payments will be taken.</p>`
            : `<p style="font-size:14px;color:#b00;"><strong>The automatic cancellation failed.</strong> Cancel
               <a href="https://dashboard.stripe.com/subscriptions/${subId}">${subId}</a> in Stripe now (cancel
               immediately, no proration), or they will be charged ${MONTHLY_PRICE_LABEL} again next month.</p>`}
        </div>`,
      });
    } catch (err) {
      console.error("[stripe-webhook] plan-complete email failed:", err);
    }
  }
}

async function handleInstalmentFailed(invoice: StripeInvoice) {
  const subId = invoiceSubscriptionId(invoice);

  // An invoice with no subscription attached used to return here silently, so a
  // one-off charge could fail and nobody was ever told. A £200 invoice raised on
  // 3 February 2026 sat `open` for seven months that way. It is rare enough to
  // deserve a short alert rather than the full instalment breakdown below, which
  // needs subscription metadata this invoice does not have.
  if (!subId) {
    const amount = (invoice.amount_due ?? 0) / 100;
    const who = invoice.customer_name || invoice.customer_email || "unknown customer";
    console.warn(`[stripe-webhook] invoice FAILED with no subscription — ${invoice.id} (${who})`);
    if (!process.env.RESEND_API_KEY) return;
    try {
      await resend.emails.send({
        from: "PT Launch Lab Enrolments <enrolments@ptlaunchlab.co.uk>",
        to: ADMIN_EMAIL,
        subject: `⚠️ Payment failed (not an instalment plan): ${who} — £${amount}`,
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;">
          <p style="font-size:15px;">A payment of <strong>£${amount}</strong> failed for
          <strong>${who}</strong>, on an invoice with no instalment plan attached.</p>
          <p style="font-size:14px;color:#4A6280;">Because there is no subscription, Stripe may not
          retry this on its own and none of the instalment tracking applies. It needs looking at by
          hand.</p>
          <p style="font-size:13px;">Invoice <code>${invoice.id}</code>${
            invoice.hosted_invoice_url ? ` · <a href="${invoice.hosted_invoice_url}">view invoice</a>` : ""
          }</p>
          <p style="font-size:13px;color:#4A6280;">Course access is unaffected — this is a billing alert only.</p>
        </div>`,
      });
    } catch (err) {
      console.error("[stripe-webhook] orphan-invoice-failure email failed:", err);
    }
    return;
  }

  const sub = await getSubscription(subId);
  if (!sub) return;
  const kind = planKindOf(sub);
  if (!kind) return;

  // Per-plan numbers. Legacy keeps its old meaning exactly (instalments after
  // the deposit, deposit added to the running total); monthly counts every
  // payment, the checkout one included.
  const monthly = kind === "monthly";
  const target = monthly ? MONTHLY_PAYMENTS : Number(sub.metadata?.instalments_target ?? "5");
  const paid = Number((monthly ? sub.metadata?.payments_paid : sub.metadata?.instalments_paid) ?? "0");
  const collected = formatPence(collectedPence(kind, paid, sub.metadata));
  const contract = formatPence(monthly ? MONTHLY_PLAN_TOTAL_PENCE : contractPence(kind, sub.metadata));
  const noun = monthly ? "Monthly payment" : "Instalment";
  const name = sub.metadata?.buyer_name || invoice.customer_name || "";
  const email = sub.metadata?.buyer_email || invoice.customer_email || "";
  const amount = formatPence(invoice.amount_due ?? 0);
  const attempt = invoice.attempt_count ?? 1;
  const nextAttempt = invoice.next_payment_attempt
    ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London",
      })
    : null;

  console.warn(`[stripe-webhook] ${noun.toLowerCase()} FAILED — ${email} attempt ${attempt} (${subId})`);

  if (!process.env.RESEND_API_KEY) return;
  try {
    await resend.emails.send({
      from: "PT Launch Lab Enrolments <enrolments@ptlaunchlab.co.uk>",
      to: ADMIN_EMAIL,
      subject: nextAttempt
        ? `⚠️ ${noun} failed: ${name || email} — ${amount} (retrying ${nextAttempt})`
        : `🚨 ${noun} failed — no retries left: ${name || email} — ${amount}`,
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;">
        <p style="font-size:15px;">${noun} ${paid + 1} of ${target} failed for <strong>${name || email}</strong>.</p>
        <table style="font-size:14px;color:#4A6280;">
          <tr><td style="padding:2px 12px 2px 0;">Amount</td><td>${amount}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:2px 12px 2px 0;">Attempt</td><td>${attempt}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;">Collected so far</td><td>${collected} of ${contract}</td></tr>
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
        // Records the sale in Praxel. Deliberately AFTER the learner email, so
        // a slow or down Praxel never delays the email the buyer is waiting on
        // — the link in it works with or without this call having landed.
        try {
          await sendEnrolmentInvite(session);
        } catch (err) {
          console.error("[stripe-webhook] Praxel invite dispatch failed:", err);
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

      // Partner portal's own record. Runs alongside the Sheet, not instead of
      // it — the Sheet stays the ops mirror, pp_sales is what /partners reads.
      try {
        const attribution = decodeClientRef(session.client_reference_id);
        const result = await recordPartnerSale({
          stripeSessionId: session.id,
          stripeSubscriptionId: session.subscription ?? null,
          // metadata.gym_slug exists from 2026-07-27; `gyms` in the attribution
          // ref is the same value and survives the 200-char truncation, since
          // EnrolmentFlow writes it before the display name.
          gymSlug: session.metadata?.gym_slug || attribution.gyms || null,
          gymDisplayName: session.metadata?.gym_referral || attribution.gym || null,
          learnerName: buyerName(session) || null,
          learnerEmail: session.customer_email || session.customer_details?.email || null,
          amountTotalPence: session.amount_total ?? 0,
          contractValuePence: saleShape(session).contractValuePence,
          mode: session.mode ?? null,
          metadataPlan: session.metadata?.plan ?? null,
          promoCode: session.metadata?.promo_code ?? null,
          // v4.1 ladder: what was sold, and any gym-funded member saving.
          rung: session.metadata?.rung ?? null,
          memberSavingPence: Number(session.metadata?.member_saving_pence) || 0,
        });
        if (!result.ok) {
          console.error(`[stripe-webhook] partner sale not recorded for ${session.id}: ${result.reason}`);
        }
      } catch (err) {
        console.error("[stripe-webhook] partner sale dispatch failed:", err);
      }
    }
  }

  // Payment plan lifecycle (legacy deposit plans AND the 10 × £99.99 monthly
  // plan) — see handleInstalmentPaid for why each cap is enforced by counting
  // invoices rather than by a date.
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
