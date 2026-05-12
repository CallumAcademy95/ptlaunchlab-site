import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

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
//   5. For each Payment Link, set success_url to:
//      https://ptlaunchlab.co.uk/enrol/success?session_id={CHECKOUT_SESSION_ID}
//
// Attribution: the enrolment flow stashes UTMs + a generated client_reference_id
// against the learner record before redirecting to Stripe (TODO — see
// follow-up note). The webhook reads `client_reference_id` from the Stripe
// session and looks the UTMs back up.

export const runtime = "nodejs"; // need crypto + raw body

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

  // Funnel-promo deposit flag — when a quiz/prospectus lead pays the deposit,
  // admin needs to cancel the 5th instalment in Stripe Billing to honour the
  // £200 off. The discounted PIF link is self-handling; deposits aren't.
  // Log loudly so admin sees it in Vercel logs, and fire a Zapier hook if set.
  if (attribution["funnel_promo"]) {
    const isPif = amount >= 1300; // discounted PIF is £1,399; deposit is £599
    console.warn(
      `[stripe-webhook] FUNNEL PROMO ${isPif ? "PIF" : "DEPOSIT"} — ` +
        `source=${attribution["funnel_promo"]} ` +
        `email=${session.customer_email || session.customer_details?.email || "?"} ` +
        `session=${session.id} ` +
        `amount=£${amount}` +
        (isPif ? "" : " — ADMIN: cancel 5th instalment in Stripe Billing"),
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
          name: session.customer_details?.name || "",
          stripe_session_id: session.id,
          amount,
          currency,
          action_required: "Cancel the 5th instalment in Stripe Billing to honour £200 off",
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
      try {
        await sendToGa4(session);
      } catch (err) {
        console.error("[stripe-webhook] GA4 dispatch failed:", err);
      }
    }
  }

  // Always 200 unless we couldn't authenticate — Stripe retries on non-2xx
  return NextResponse.json({ received: true });
}
