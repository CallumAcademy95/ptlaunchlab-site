// ─────────────────────────────────────────────────────────────────────────────
// Checkout follow-up: people who started paying and didn't finish.
//
// Vercel Cron hits this once a day (see vercel.json). It lists Checkout
// Sessions that EXPIRED in the last 24 hours (Stripe expires an unpaid session
// 24h after it is created) and drops anyone with a completed purchase. These
// are the warmest leads PTLL has: people who got as far as paying.
//
// What it does with them:
//
//   1. ALERT (CHECKOUT_FOLLOWUP_ALERT === "true"): one email to the owner
//      listing name + email of each, and a phone push. An internal
//      notification, so no marketing consent is needed. A human decides
//      whether and how to follow up.
//
//   2. EMAIL AUTOMATION (CHECKOUT_FOLLOWUP_ENABLED === "true" and
//      CHECKOUT_FOLLOWUP_GROUP_ID set): people who are ALREADY active MailerLite
//      subscribers (they opted in via the planner, quiz, prospectus...) are
//      added to a group whose automation sends a helpful follow-up. The enrol
//      form asks for no marketing consent, so nobody else is ever added, and the
//      group-assign call never creates or resubscribes anyone.
//
// With neither flag set it is a dry run that reports counts and does nothing.
// Measured 14 Oct 2026: 5 abandons with an email in 60 days, 1 of them an
// active subscriber, so the alert is the part that matters.
//
// Env: CRON_SECRET, STRIPE_SECRET_KEY, RESEND_API_KEY, MAILERLITE_TOKEN,
//      CHECKOUT_FOLLOWUP_ALERT, CHECKOUT_FOLLOWUP_ENABLED, CHECKOUT_FOLLOWUP_GROUP_ID
// Manual: GET /api/checkout-followup?hours=72  (Authorization: Bearer CRON_SECRET)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { selectAbandoned, type Abandoned, type SessionLite } from "@/app/lib/checkoutFollowup";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { sendOwnerPush, type OwnerPushDb } from "@/app/lib/owner-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ML = "https://connect.mailerlite.com/api";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "info@ptlaunchlab.co.uk";

async function stripeSessions(key: string, createdGte: number, status: string): Promise<SessionLite[]> {
  const out: SessionLite[] = [];
  let after: string | undefined;
  for (let page = 0; page < 20; page++) {
    const qs = new URLSearchParams({ limit: "100", status, "created[gte]": String(createdGte) });
    if (after) qs.set("starting_after", after);
    const r = await fetch(`https://api.stripe.com/v1/checkout/sessions?${qs}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!r.ok) throw new Error(`stripe ${status} ${r.status}`);
    type StripeSession = {
      id: string; status: string; created: number; expires_at: number; amount_total: number | null;
      customer_email: string | null;
      customer_details: { email: string | null; name: string | null } | null;
      metadata: Record<string, string> | null;
    };
    const j = (await r.json()) as { data: StripeSession[]; has_more: boolean };
    for (const s of j.data) {
      out.push({
        id: s.id,
        status: s.status,
        created: s.created,
        expiresAt: s.expires_at,
        email: (s.customer_details?.email ?? s.customer_email ?? null) as string | null,
        name: (s.customer_details?.name ?? s.metadata?.name ?? null) as string | null,
        amountTotal: (s.amount_total ?? null) as number | null,
      });
    }
    if (!j.has_more || !j.data.length) break;
    after = j.data[j.data.length - 1].id;
  }
  return out;
}

async function mlStatus(token: string, email: string): Promise<{ id: string; status: string } | null> {
  const r = await fetch(`${ML}/subscribers/${encodeURIComponent(email)}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`mailerlite lookup ${r.status}`);
  const j = (await r.json()) as { data: { id: string; status: string } };
  return { id: j.data.id, status: j.data.status };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const pounds = (p: number | null) => (p == null ? "" : `£${(p / 100).toFixed(2)}`);

async function alertOwner(list: Abandoned[], subscribed: Set<string>) {
  const rows = list.map((a) =>
    `<tr><td style="padding:6px 10px;">${esc(a.name ?? "(no name)")}</td><td style="padding:6px 10px;"><a href="mailto:${esc(a.email)}">${esc(a.email)}</a></td><td style="padding:6px 10px;">${pounds(a.amountTotal)}</td><td style="padding:6px 10px;">${subscribed.has(a.email) ? "on the email list" : "not on the list"}</td></tr>`,
  ).join("");
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;">
<p><strong>${list.length} ${list.length === 1 ? "person" : "people"} started checkout yesterday and didn't finish.</strong> None has paid since.</p>
<table style="border-collapse:collapse;border:1px solid #ddd;">${rows}</table>
<p style="color:#555;">A personal "anything I can help with?" is usually the right touch. Their checkout link has expired, so point them back to <a href="https://ptlaunchlab.co.uk/enrol">ptlaunchlab.co.uk/enrol</a>.</p>
</div>`;
  if (process.env.RESEND_API_KEY) {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: "PT Launch Lab Alerts <info@ptlaunchlab.co.uk>",
      to: ADMIN_EMAIL,
      subject: `${list.length} unfinished checkout${list.length === 1 ? "" : "s"} yesterday`,
      html,
    });
  }
  try {
    await sendOwnerPush(getSupabaseAdmin() as unknown as OwnerPushDb, {
      title: `${list.length} unfinished checkout${list.length === 1 ? "" : "s"}`,
      body: list.map((a) => a.name ?? a.email).join(", ").slice(0, 140),
      url: "/admin/crm",
      tag: "checkout-followup",
    });
  } catch (err) {
    console.error("[checkout-followup] push failed", err instanceof Error ? err.message : err);
  }
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const mlToken = process.env.MAILERLITE_TOKEN;
  const groupId = process.env.CHECKOUT_FOLLOWUP_GROUP_ID;
  const alert = process.env.CHECKOUT_FOLLOWUP_ALERT === "true";
  const automate = process.env.CHECKOUT_FOLLOWUP_ENABLED === "true" && Boolean(groupId);
  if (!stripeKey) return NextResponse.json({ error: "missing STRIPE_SECRET_KEY" }, { status: 500 });

  const hours = Math.min(Math.max(Number(req.nextUrl.searchParams.get("hours") ?? 24), 1), 24 * 14);
  const now = Math.floor(Date.now() / 1000);
  const since = now - hours * 3600;

  const [expired, complete] = await Promise.all([
    // Sessions expire 24h after creation, so creation is up to 24h before expiry.
    stripeSessions(stripeKey, since - 25 * 3600, "expired"),
    // Wider window: someone who abandoned and then paid days later is never chased.
    stripeSessions(stripeKey, now - 60 * 86400, "complete"),
  ]);

  const list = selectAbandoned(expired, complete, since, now);
  const counts = { abandoned: list.length, activeSubscribers: 0, addedToGroup: 0, alerted: false, errors: 0 };
  const subscribed = new Set<string>();

  if (mlToken) {
    for (const a of list) {
      try {
        const sub = await mlStatus(mlToken, a.email);
        if (sub?.status !== "active") continue;
        subscribed.add(a.email);
        counts.activeSubscribers++;
        if (automate) {
          const r = await fetch(`${ML}/subscribers/${sub.id}/groups/${groupId}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${mlToken}`, Accept: "application/json" },
          });
          if (!r.ok) throw new Error(`mailerlite assign ${r.status}`);
          counts.addedToGroup++;
        }
      } catch (err) {
        counts.errors++;
        console.error("[checkout-followup]", err instanceof Error ? err.message : err);
      }
    }
  }

  if (alert && list.length) {
    try {
      await alertOwner(list, subscribed);
      counts.alerted = true;
    } catch (err) {
      counts.errors++;
      console.error("[checkout-followup] alert failed", err instanceof Error ? err.message : err);
    }
  }

  // Counts only: no email addresses in the response or the logs.
  return NextResponse.json({ ok: true, alert, automate, hours, ...counts });
}
