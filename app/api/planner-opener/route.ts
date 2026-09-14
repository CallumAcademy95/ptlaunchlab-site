// ─────────────────────────────────────────────────────────────────────────────
// The opener for new career-planner leads.
//
// Vercel Cron hits this a few times a day. It finds leads who filled in the
// planner, have not had the opener yet, and are past the settling delay, then
// sends each a short plain-text note asking a question. Replies go to info@,
// which the setter polls, so a conversation can start while nobody is watching.
//
// This runs ALONGSIDE the MailerLite 7-day sequence, not instead of it. The
// sequence keeps teaching; this asks for a reply.
//
// DRY RUN IS THE DEFAULT. A send needs ?send=1 or a Vercel Cron user-agent.
//
// Both GET and POST are exported. Vercel Cron issues GET — on the sister repo a
// POST-only cron route returned 405 for two days and nothing ever ran, silently,
// because a 405 happens at the router before any handler or log.
//
// Env required: CRON_SECRET, MAILERLITE_TOKEN, RESEND_API_KEY
// Manual use:   POST /api/planner-opener            dry run, sends nothing
//               POST /api/planner-opener?send=1     sends, capped
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import {
  compose,
  eligibility,
  ukHour,
  MAX_PER_RUN,
  MIN_AGE_MINUTES,
  MAX_AGE_DAYS,
  SUBJECT,
  type PlannerLead,
} from "@/lib/planner-opener";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GROUP_ID = "193045414277022964"; // PTLL Career Planner
const FROM = "Callum Brown <info@ptlaunchlab.co.uk>";
// Reply-to is info@ on purpose: that is the mailbox the setter polls, so a reply
// is picked up within a couple of minutes instead of sitting unread.
const REPLY_TO = "info@ptlaunchlab.co.uk";
const SENDING_HOURS = { from: 9, to: 18 };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toLead(s: any): PlannerLead {
  const f = s.fields ?? {};
  return {
    email: String(s.email ?? ""),
    name: f.name ?? null,
    score: f.plan_readiness_score ?? null,
    months: f.plan_quit_months ?? null,
    job: f.plan_current_job ?? null,
    route: f.plan_recommended_route ?? null,
    subscribedAt: s.subscribed_at ?? null,
    openerSent: f.plan_opener_sent ?? null,
    status: String(s.status ?? "unknown"),
  };
}

async function fetchGroup(token: string): Promise<PlannerLead[]> {
  const out: PlannerLead[] = [];
  let cursor: string | null = null;
  // Paged deliberately: the group only grows, and a silent first-page-only read
  // would quietly stop opening to anyone once it passed 100.
  for (let page = 0; page < 20; page++) {
    const u = new URL("https://connect.mailerlite.com/api/subscribers");
    u.searchParams.set("filter[group]", GROUP_ID);
    u.searchParams.set("limit", "100");
    if (cursor) u.searchParams.set("cursor", cursor);
    const res = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`MailerLite ${res.status}`);
    const j = await res.json();
    const rows = j.data ?? [];
    for (const r of rows) out.push(toLead(r));
    cursor = j.meta?.next_cursor ?? null;
    if (!cursor || rows.length === 0) break;
  }
  return out;
}

/** Stamp the lead as opened BEFORE the send is considered done elsewhere. See the call site. */
async function markSent(token: string, email: string, stamp: string): Promise<boolean> {
  const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, fields: { plan_opener_sent: stamp } }),
  });
  if (!res.ok) return false;
  const j = await res.json();
  return j?.data?.fields?.plan_opener_sent === stamp;
}

/**
 * One row per invocation, in the same `setter_events` table the gym cron writes
 * to — the site and the setter app share a Supabase project.
 *
 * Never throws. Instrumentation that can break the thing it measures is worse
 * than no instrumentation.
 */
async function logInvocation(req: NextRequest, now: Date, trigger: string, willSend: boolean) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    const res = await fetch(`${url}/rest/v1/setter_events`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        provider: "cron",
        external_event_id: `planner-opener:${now.toISOString()}`,
        signature_ok: true,
        payload: {
          route: "planner-opener",
          verb: req.method,
          userAgent: (req.headers.get("user-agent") ?? "").slice(0, 120),
          trigger,
          willSend,
        },
      }),
    });
    if (!res.ok) console.error("[planner-opener] invocation log failed", res.status);
  } catch (err) {
    console.error("[planner-opener] invocation log threw", err);
  }
}

async function run(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mlToken = process.env.MAILERLITE_TOKEN;
  const resendKey = process.env.RESEND_API_KEY;
  if (!mlToken || !resendKey) {
    return NextResponse.json({ ok: false, error: "missing MAILERLITE_TOKEN or RESEND_API_KEY" }, { status: 500 });
  }

  const url = new URL(req.url);
  // Two ways to mean "send", because a query string surviving a scheduler is
  // fragile and a dry run that silently does nothing looks exactly like success.
  const fromVercelCron = /vercel-cron/i.test(req.headers.get("user-agent") ?? "");
  const send = url.searchParams.get("send") === "1" || fromVercelCron;
  const trigger = fromVercelCron ? "vercel-cron" : send ? "manual-send" : "manual-dry-run";

  const now = new Date();

  // Record that this route was REACHED, before any decision about sending.
  //
  // Without this, "the scheduler never fired" and "it fired and nobody was
  // eligible" are the same observation: nothing happens and nothing is written.
  // That ambiguity cost two days on the sister repo, where a cron had been
  // returning 405 to every run in silence. It matters more here, because this
  // project had NO CRON_SECRET at all until 14 Sept — meaning gbp-cron had been
  // 401ing since the day it was written, and nobody could tell.
  //
  // Awaited, never fire-and-forget: the early returns below (outside hours,
  // MailerLite unreachable) are exactly the cases this needs to explain, and a
  // dangling promise is dropped when the handler returns. Wrapped so the log can
  // never take the send down with it.
  await logInvocation(req, now, trigger, send);

  const hour = ukHour(now);
  if (send && (hour < SENDING_HOURS.from || hour >= SENDING_HOURS.to)) {
    return NextResponse.json({ ok: true, trigger, sent: 0, skipped: `outside sending hours (UK ${hour}:00)` });
  }

  let leads: PlannerLead[];
  try {
    leads = await fetchGroup(mlToken);
  } catch (err) {
    console.error("[planner-opener] could not read the group", err);
    return NextResponse.json({ ok: false, trigger, error: "MailerLite read failed" }, { status: 502 });
  }

  const eligible: PlannerLead[] = [];
  const rejected: Array<{ email: string; reason: string }> = [];
  for (const lead of leads) {
    const verdict = eligibility(lead, now);
    if (verdict.ok) eligible.push(lead);
    else rejected.push({ email: lead.email, reason: verdict.reason });
  }
  // Oldest first, so nobody is left behind by a busy day.
  eligible.sort((a, b) => String(a.subscribedAt).localeCompare(String(b.subscribedAt)));
  const queue = eligible.slice(0, MAX_PER_RUN);

  const base = {
    ok: true,
    trigger,
    mode: send ? "SENT" : "dry-run",
    considered: leads.length,
    eligible: eligible.length,
    queued: queue.length,
    minAgeMinutes: MIN_AGE_MINUTES,
    maxAgeDays: MAX_AGE_DAYS,
    from: FROM,
    replyTo: REPLY_TO,
  };

  if (!send) {
    return NextResponse.json({
      ...base,
      sent: 0,
      preview: queue.map((l) => ({ to: l.email, subject: SUBJECT, body: compose(l) })),
      // Capped: a dry run should explain itself without returning the whole list.
      rejectedSample: rejected.slice(0, 15),
    });
  }

  const stamp = now.toISOString().slice(0, 10);
  const results: Array<{ to: string; ok: boolean; detail?: string }> = [];
  for (const lead of queue) {
    // Mark BEFORE sending. If the stamp fails we skip rather than send, because
    // the failure we cannot tolerate is emailing the same person twice — an
    // unsent opener is recoverable on the next run, a duplicate is not.
    const marked = await markSent(mlToken, lead.email, stamp);
    if (!marked) {
      results.push({ to: lead.email, ok: false, detail: "could not mark as sent, so not sent" });
      continue;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: lead.email,
        reply_to: REPLY_TO,
        subject: SUBJECT,
        text: compose(lead),
      }),
    });
    const j = await res.json().catch(() => ({}));
    const ok = res.ok && !!j?.id;
    if (!ok) console.error("[planner-opener] send failed", lead.email, JSON.stringify(j).slice(0, 200));
    results.push({ to: lead.email, ok, detail: ok ? j.id : "send failed after marking" });
  }

  const sent = results.filter((r) => r.ok).length;
  return NextResponse.json({ ...base, sent, failed: results.length - sent, results });
}

export async function POST(req: NextRequest) {
  return run(req);
}

// Vercel Cron sends GET.
export const GET = run;
