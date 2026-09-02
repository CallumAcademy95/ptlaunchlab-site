// Data layer for the single-pane admin overview at /admin.
//
// PTLL's customer data lives in systems that do not talk to each other:
//   • Stripe                — every payment (this repo owns the key)
//   • LMS Supabase          — learners, enrolments, enrolment_invites
//                             (a DIFFERENT Supabase project to this site's)
//   • This site's Supabase  — partner network only (pp_*)
//   • Zapier → Google Sheets — every website lead. Not in any database.
//
// This module reads them and returns one shape. It is READ-ONLY.
//
// DESIGN RULE: every panel returns either data or an explicit `unavailable`
// reason. Nothing here may return an empty array when it actually failed —
// a blank panel that looks like "no data" while really meaning "not configured"
// is the exact failure this dashboard exists to eliminate.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type Unavailable = { unavailable: string; fix?: string };
export type Panel<T> = ({ ok: true } & T) | ({ ok: false } & Unavailable);

const fail = (unavailable: string, fix?: string): { ok: false } & Unavailable => ({
  ok: false,
  unavailable,
  fix,
});

// ─── LMS (cross-project) ────────────────────────────────────────────────────
// The site cannot read learner data from its own Supabase — it is a separate
// project. Configure a READ-ONLY key; do not reuse the LMS service-role key
// here if a narrower role is available.
let lmsCached: SupabaseClient | null = null;
function lmsClient(): SupabaseClient | null {
  if (lmsCached) return lmsCached;
  const url = process.env.LMS_SUPABASE_URL;
  const key = process.env.LMS_SUPABASE_READONLY_KEY || process.env.LMS_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  lmsCached = createClient(url, key, { auth: { persistSession: false } });
  return lmsCached;
}

const LMS_FIX =
  "Set LMS_SUPABASE_URL and LMS_SUPABASE_READONLY_KEY. The LMS is a separate " +
  "Supabase project to this site, so enrolment data cannot be read without them.";

// ─── Stripe ─────────────────────────────────────────────────────────────────
const stripeKey = () => process.env.STRIPE_SECRET_KEY;

async function stripeGet<T = unknown>(url: string): Promise<T | null> {
  const key = stripeKey();
  if (!key) return null;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  return r.ok ? ((await r.json()) as T) : null;
}

export interface Sale {
  id: string;
  created: number;
  amountPence: number;
  email: string;
  status: string;
}

export interface RevenuePanel {
  sales: Sale[];
  totalPence: number;
  count: number;
  since: string;
}

export async function getRevenue(sinceIso: string): Promise<Panel<RevenuePanel>> {
  if (!stripeKey()) {
    return fail("STRIPE_SECRET_KEY is not set", "Add it to the environment for this deployment.");
  }
  const since = Math.floor(Date.parse(sinceIso) / 1000);
  const all: any[] = [];
  let startingAfter: string | null = null;

  for (let page = 0; page < 6; page++) {
    const u = new URL("https://api.stripe.com/v1/checkout/sessions");
    u.searchParams.set("limit", "100");
    u.searchParams.set("created[gte]", String(since));
    if (startingAfter) u.searchParams.set("starting_after", startingAfter);
    const j = await stripeGet<{ data: any[]; has_more: boolean }>(u.toString());
    if (!j?.data) break;
    all.push(...j.data);
    if (!j.has_more) break;
    startingAfter = j.data[j.data.length - 1].id;
  }

  const sales: Sale[] = all
    .filter((s) => s.payment_status === "paid")
    .map((s) => ({
      id: s.id,
      created: s.created,
      amountPence: s.amount_total ?? 0,
      email: s.customer_email || s.customer_details?.email || "",
      status: s.payment_status,
    }))
    .sort((a, b) => b.created - a.created);

  return {
    ok: true,
    sales,
    totalPence: sales.reduce((t, s) => t + s.amountPence, 0),
    count: sales.length,
    since: sinceIso,
  };
}

// ─── Enrolment pipeline + reconciliation ────────────────────────────────────
// Mirrors scripts/reconcile-ptll-enrolments.mjs in albaco-lms. The flags are the
// point: a raw "unconsumed invites" list is misleading and acting on it has
// already been shown to be dangerous.

export interface InviteRow {
  email: string;
  fullName: string | null;
  plan: string;
  amountPence: number;
  paidAt: string | null;
  consumedAt: string | null;
  enrolmentId: string | null;
  tenantId: string;
  stripeSessionId: string | null;
}

export interface PipelinePanel {
  invites: InviteRow[];
  ptllTenantId: string | null;
  tenantStart: string | null; // earliest ptll profile — the Merve boundary
  ghostConsumed: InviteRow[]; // consumed_at set, enrolment_id null → invisible in ChaseList
  testRows: InviteRow[];
  wrongTenant: InviteRow[];
  methodControlPassed: boolean;
}

const TEST_RE = /(example\.com|test@|\+test)/i;

export async function getPipeline(): Promise<Panel<PipelinePanel>> {
  const sb = lmsClient();
  if (!sb) return fail("LMS Supabase is not configured", LMS_FIX);

  // Method control: prove a known profile is findable before trusting any
  // "this buyer has no account" result. Without it, a wrong column silently
  // makes every buyer look un-enrolled.
  let methodControlPassed = false;
  try {
    const { data: sample } = await sb
      .from("profiles").select("email").not("email", "is", null).limit(1);
    if (sample?.[0]?.email) {
      const { data: found } = await sb
        .from("profiles").select("id").ilike("email", sample[0].email).limit(1);
      methodControlPassed = !!found?.length;
    }
  } catch {
    /* leave false */
  }

  const { data: tenants, error: tErr } = await sb.from("tenants").select("id, slug");
  if (tErr) return fail(`Could not read tenants: ${tErr.message}`);
  const ptll = tenants?.find((t: any) => t.slug === "ptll") ?? null;

  let tenantStart: string | null = null;
  if (ptll) {
    const { data } = await sb
      .from("profiles").select("created_at").eq("tenant_id", ptll.id)
      .order("created_at", { ascending: true }).limit(1);
    tenantStart = data?.[0]?.created_at ?? null;
  }

  // Count first — PostgREST silently caps at 1000 rows with HTTP 200.
  const { count } = await sb.from("enrolment_invites").select("*", { count: "exact", head: true });
  const rows: any[] = [];
  const PAGE = 500;
  for (let from = 0; from < (count ?? 0); from += PAGE) {
    const { data, error } = await sb
      .from("enrolment_invites")
      .select("email, full_name, plan, amount_pence, paid_at, consumed_at, enrolment_id, tenant_id, stripe_session_id")
      .order("paid_at", { ascending: false, nullsFirst: false })
      .range(from, from + PAGE - 1);
    if (error) return fail(`Could not read enrolment_invites: ${error.message}`);
    rows.push(...(data ?? []));
  }

  const invites: InviteRow[] = rows.map((r) => ({
    email: r.email,
    fullName: r.full_name,
    plan: r.plan,
    amountPence: r.amount_pence ?? 0,
    paidAt: r.paid_at,
    consumedAt: r.consumed_at,
    enrolmentId: r.enrolment_id,
    tenantId: r.tenant_id,
    stripeSessionId: r.stripe_session_id,
  }));

  return {
    ok: true,
    invites,
    ptllTenantId: ptll?.id ?? null,
    tenantStart,
    // consumeInvite() writes consumed_at AND enrolment_id together, so this
    // combination means something else set the flag — and the admin ChaseList
    // filters on `consumed_at is null`, hiding these buyers entirely.
    ghostConsumed: invites.filter((i) => i.consumedAt && !i.enrolmentId),
    testRows: invites.filter((i) => TEST_RE.test(i.email ?? "")),
    wrongTenant: ptll ? invites.filter((i) => i.tenantId !== ptll.id) : [],
    methodControlPassed,
  };
}

// ─── Leads (Leads Central) ──────────────────────────────────────────────────
// PTLL's CRM already exists: the `consultations` table, which the site shares a
// Supabase project with (that project is "pt-launch-lab-pt-app"). It carries
// full UTM attribution, lead_score, stage, lost_reason and the setter's own
// state — so there is no need for a separate leads table, and adding one would
// have split the record in two.
//
// How a website lead gets here:
//   endpoint → notifySetter() → pt-app /api/setter/intake → setter_jobs queue
//   → tick processor → consultation + one warm reply-inviting email.
//
// Endpoints that do NOT call notifySetter never reach this table, so a lead can
// be captured by the site and be invisible here. The panel reports which sources
// have actually arrived so that gap is visible rather than assumed.

export interface LeadRow {
  id: string;
  createdAt: string;
  name: string | null;
  email: string;
  phone: string | null;
  channel: string | null;
  status: string | null;
  setterStatus: string | null;
  stage: string | null;
  leadScore: number | null;
  utmSource: string | null;
  landingPage: string | null;
  lastInboundAt: string | null;
}

export async function getLeads(limit = 50): Promise<Panel<{ leads: LeadRow[]; total: number }>> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return fail("Site Supabase is not configured");

  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { count, error: cErr } = await sb
    .from("consultations")
    .select("*", { count: "exact", head: true });
  if (cErr) return fail(`Could not read consultations: ${cErr.message}`);

  const { data, error } = await sb
    .from("consultations")
    .select(
      "id, created_at, name, email, phone, primary_channel, status, setter_status, stage, lead_score, utm_source, landing_page, last_inbound_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return fail(`Could not read consultations: ${error.message}`);

  return {
    ok: true,
    total: count ?? 0,
    leads: (data ?? []).map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      name: r.name,
      email: r.email,
      phone: r.phone,
      channel: r.primary_channel,
      status: r.status,
      setterStatus: r.setter_status,
      stage: r.stage,
      leadScore: r.lead_score,
      utmSource: r.utm_source,
      landingPage: r.landing_page,
      lastInboundAt: r.last_inbound_at,
    })),
  };
}

/**
 * Which website sources have actually reached the setter queue.
 *
 * Only endpoints calling notifySetter() appear here. Anything missing is a
 * capture point whose leads are going to Zapier/MailerLite only — captured, but
 * not visible in Leads Central and not in this dashboard.
 */
export async function getIntakeSources(): Promise<Panel<{ sources: Record<string, number>; total: number }>> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return fail("Site Supabase is not configured");

  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb
    .from("setter_jobs")
    .select("payload")
    .eq("kind", "intake")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return fail(`Could not read setter_jobs: ${error.message}`);

  const sources: Record<string, number> = {};
  for (const row of data ?? []) {
    const s = (row as any)?.payload?.intake?.source ?? "unknown";
    sources[s] = (sources[s] ?? 0) + 1;
  }
  return { ok: true, sources, total: (data ?? []).length };
}

// ─── Partners ───────────────────────────────────────────────────────────────
export interface PartnerRow {
  slug: string;
  gymName: string;
  status: string;
  users: number;
  neverSignedIn: number;
}

export async function getPartners(): Promise<Panel<{ partners: PartnerRow[] }>> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return fail("Site Supabase is not configured");

  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb
    .from("pp_partners")
    .select("slug, gym_name, status, is_demo, pp_partner_users(id, last_login_at)")
    .order("gym_name");
  if (error) return fail(`Could not read partners: ${error.message}`);

  return {
    ok: true,
    partners: (data ?? [])
      .filter((p: any) => !p.is_demo)
      .map((p: any) => ({
        slug: p.slug,
        gymName: p.gym_name,
        status: p.status,
        users: p.pp_partner_users?.length ?? 0,
        // Recurring issue: partners created but never onboarded.
        neverSignedIn: (p.pp_partner_users ?? []).filter((u: any) => !u.last_login_at).length,
      })),
  };
}

// ─── Cross-source reconciliation ────────────────────────────────────────────
export interface ReconcileRow {
  email: string;
  amountPence: number;
  paidAt: string | null;
  hasInvite: boolean;
  flags: { level: "MERVE" | "FIX" | "CHECK" | "INFO"; msg: string }[];
}

export function reconcile(
  revenue: Panel<RevenuePanel>,
  pipeline: Panel<PipelinePanel>,
): Panel<{ rows: ReconcileRow[]; unmatchedSales: number }> {
  if (!revenue.ok) return fail(`Revenue unavailable: ${revenue.unavailable}`);
  if (!pipeline.ok) return fail(`Pipeline unavailable: ${pipeline.unavailable}`, pipeline.fix);

  const inviteBySession = new Map(
    pipeline.invites.filter((i) => i.stripeSessionId).map((i) => [i.stripeSessionId!, i]),
  );
  const rows: ReconcileRow[] = [];

  for (const sale of revenue.sales) {
    const inv = inviteBySession.get(sale.id);
    const flags: ReconcileRow["flags"] = [];

    if (!inv) {
      flags.push({
        level: "CHECK",
        msg: "No enrolment_invites row for this payment. The invites table was backfilled once and is not a complete record of sales — check the learner is enrolled before treating this as lost.",
      });
    } else {
      if (inv.consumedAt && !inv.enrolmentId) {
        flags.push({ level: "FIX", msg: "Marked consumed with no enrolment_id — hidden from the ChaseList UI." });
      }
      if (pipeline.ptllTenantId && inv.tenantId !== pipeline.ptllTenantId) {
        flags.push({ level: "FIX", msg: "Invite filed under the wrong tenant." });
      }
      if (pipeline.tenantStart && inv.paidAt && inv.paidAt < pipeline.tenantStart) {
        flags.push({
          level: "MERVE",
          msg: `Paid before the ptll tenant existed (${pipeline.tenantStart.slice(0, 10)}). PTLL ran on Merve until end of Aug 2026 — check there before treating as un-enrolled.`,
        });
      }
    }
    if (TEST_RE.test(sale.email)) flags.push({ level: "INFO", msg: "Synthetic test record." });

    if (flags.length) {
      rows.push({
        email: sale.email,
        amountPence: sale.amountPence,
        paidAt: new Date(sale.created * 1000).toISOString(),
        hasInvite: !!inv,
        flags,
      });
    }
  }

  return { ok: true, rows, unmatchedSales: rows.filter((r) => !r.hasInvite).length };
}

export const formatPence = (p: number) =>
  `£${(p / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
