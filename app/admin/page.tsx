import type { Metadata } from "next";
import Link from "next/link";
import {
  getRevenue,
  getPipeline,
  getLeads,
  getIntakeSources,
  getPartners,
  reconcile,
  formatPence,
  type Panel,
  type Unavailable,
} from "@/app/lib/admin-overview";

export const metadata: Metadata = {
  title: "Overview — PT Launch Lab admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const NAVY = "#070D1B";
const CARD = "#102342";
const GOLD = "#F5C518";
const MUTED = "#8b9bb4";
const LINE = "#1d2f4f";

const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "—");

/** A panel that could not load says why, and how to fix it. It never renders blank. */
function Unavail({ p }: { p: { ok: false } & Unavailable }) {
  return (
    <div style={{ padding: "14px 16px", background: "#1a1206", border: "1px solid #4a3a10", borderRadius: 6 }}>
      <p style={{ margin: 0, color: "#f0c96a", fontWeight: 600, fontSize: 14 }}>Not available — {p.unavailable}</p>
      {p.fix && <p style={{ margin: "6px 0 0", color: MUTED, fontSize: 13, lineHeight: 1.5 }}>{p.fix}</p>}
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 34 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 17, color: "#fff", letterSpacing: 0.2 }}>{title}</h2>
      {sub && <p style={{ margin: "0 0 12px", color: MUTED, fontSize: 13 }}>{sub}</p>}
      <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 8, padding: 16 }}>{children}</div>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" | "bad" }) {
  const color = tone === "bad" ? "#ff8a8a" : tone === "warn" ? GOLD : "#fff";
  return (
    <div style={{ minWidth: 150 }}>
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{label}</div>
    </div>
  );
}

const FLAG_COLOUR: Record<string, string> = {
  FIX: "#ff8a8a",
  MERVE: GOLD,
  CHECK: "#7cc4ff",
  INFO: MUTED,
};

export default async function AdminOverviewPage() {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString().slice(0, 10);

  const [revenue, pipeline, leads, intake, partners] = await Promise.all([
    getRevenue(since),
    getPipeline(),
    getLeads(50),
    getIntakeSources(),
    getPartners(),
  ]);

  // Every site endpoint that hands a lead to the setter. Anything absent from
  // `intake.sources` has never actually arrived — either it is not wired, or it
  // is wired and has had no submissions yet. Both are worth seeing.
  const WIRED_SOURCES = [
    "quiz",
    "contact",
    "prospectus",
    "career-planner",
    "salary-calculator",
    "live-register",
    "gym-partnership",
  ];
  const recon = reconcile(revenue, pipeline);

  return (
    <main style={{ background: NAVY, minHeight: "100vh", color: "#e8eef7", padding: "28px 22px 60px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <header style={{ marginBottom: 26 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, color: "#fff" }}>Overview</h1>
          <p style={{ margin: 0, color: MUTED, fontSize: 14, lineHeight: 1.6 }}>
            One view across Stripe, the LMS and the partner network. Read-only — nothing here writes to any system.
            Each source stays where it lives; this page just reads them together.
          </p>
          <nav style={{ marginTop: 12, display: "flex", gap: 14, flexWrap: "wrap", fontSize: 14 }}>
            {[
              ["Ads", "/admin/ads"],
              ["Partners", "/admin/partners"],
              ["Live questions", "/admin/live-questions"],
              ["WhatsApp", "/admin/whatsapp"],
            ].map(([label, href]) => (
              <Link key={href} href={href} style={{ color: GOLD, textDecoration: "none" }}>
                {label} →
              </Link>
            ))}
          </nav>
        </header>

        {/* ── Headline numbers ─────────────────────────────────────────── */}
        <Section title="Last 180 days" sub={`Paid Stripe checkout sessions since ${since}`}>
          {!revenue.ok ? (
            <Unavail p={revenue} />
          ) : (
            <div style={{ display: "flex", gap: 34, flexWrap: "wrap" }}>
              <Stat label="collected" value={formatPence(revenue.totalPence)} />
              <Stat label="paid sales" value={String(revenue.count)} />
              {pipeline.ok && <Stat label="invite records" value={String(pipeline.invites.length)} />}
              {pipeline.ok && pipeline.ghostConsumed.length > 0 && (
                <Stat label="hidden from chase list" value={String(pipeline.ghostConsumed.length)} tone="bad" />
              )}
              {recon.ok && recon.unmatchedSales > 0 && (
                <Stat label="sales with no invite row" value={String(recon.unmatchedSales)} tone="warn" />
              )}
            </div>
          )}
        </Section>

        {/* ── Needs attention ──────────────────────────────────────────── */}
        <Section
          title="Needs attention"
          sub="Cross-referenced Stripe against the LMS. Resolve MERVE and CHECK flags before contacting anyone."
        >
          {!recon.ok ? (
            <Unavail p={recon} />
          ) : recon.rows.length === 0 ? (
            <p style={{ margin: 0, color: MUTED, fontSize: 14 }}>Nothing flagged. Every paid sale reconciles cleanly.</p>
          ) : (
            <>
              <div
                style={{
                  padding: "10px 12px",
                  background: "#2a1c06",
                  border: `1px solid #4a3a10`,
                  borderRadius: 6,
                  marginBottom: 14,
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: "#f0c96a",
                }}
              >
                <strong>Do not mass-contact this list.</strong> PTLL delivery ran on the Merve app until it was retired
                at the end of Aug 2026. Anyone flagged <strong>MERVE</strong> paid before the Praxel tenant existed and
                may have been studying for months — check Merve first.
              </div>
              {recon.rows.map((r) => (
                <div key={r.email + r.paidAt} style={{ padding: "10px 0", borderTop: `1px solid ${LINE}` }}>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
                    <span style={{ color: "#fff", fontSize: 14 }}>{r.email || "(no email)"}</span>
                    <span style={{ color: MUTED, fontSize: 13 }}>{formatPence(r.amountPence)}</span>
                    <span style={{ color: MUTED, fontSize: 13 }}>{day(r.paidAt)}</span>
                  </div>
                  {r.flags.map((f, i) => (
                    <div key={i} style={{ marginTop: 5, fontSize: 13, lineHeight: 1.5 }}>
                      <span style={{ color: FLAG_COLOUR[f.level], fontWeight: 600, marginRight: 8 }}>{f.level}</span>
                      <span style={{ color: MUTED }}>{f.msg}</span>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </Section>

        {/* ── Website leads ────────────────────────────────────────────── */}
        <Section
          title="Leads Central"
          sub="Every enquiry the setter has picked up — website forms, WhatsApp, Instagram, Messenger"
        >
          {!leads.ok ? (
            <Unavail p={leads} />
          ) : (
            <>
              <p style={{ margin: "0 0 12px", color: MUTED, fontSize: 13 }}>
                {leads.total} total · showing {leads.leads.length} most recent
              </p>
              {leads.leads.map((l) => (
                <div
                  key={l.id}
                  style={{ display: "flex", gap: 12, padding: "7px 0", borderTop: `1px solid ${LINE}`, fontSize: 14, flexWrap: "wrap" }}
                >
                  <span style={{ color: MUTED, minWidth: 88 }}>{day(l.createdAt)}</span>
                  <span style={{ color: GOLD, minWidth: 84 }}>{l.channel || "—"}</span>
                  <span style={{ color: "#fff", minWidth: 150 }}>{l.name || "—"}</span>
                  <span style={{ color: MUTED, minWidth: 210 }}>{l.email}</span>
                  <span style={{ color: MUTED, minWidth: 84 }}>{l.setterStatus || l.status || "—"}</span>
                  {typeof l.leadScore === "number" && (
                    <span style={{ color: l.leadScore >= 7 ? "#7ddc9a" : MUTED }}>score {l.leadScore}</span>
                  )}
                </div>
              ))}
            </>
          )}
        </Section>

        {/* ── Which capture points actually reach the CRM ──────────────── */}
        <Section
          title="Lead sources reaching the setter"
          sub="A capture point missing here is sending leads to Zapier/MailerLite only — they never appear in Leads Central"
        >
          {!intake.ok ? (
            <Unavail p={intake} />
          ) : (
            <>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                {WIRED_SOURCES.map((s) => {
                  const n = intake.sources[s] ?? 0;
                  return (
                    <span
                      key={s}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 5,
                        fontSize: 13,
                        border: `1px solid ${n > 0 ? "#2c5c3c" : LINE}`,
                        background: n > 0 ? "#0e2417" : "transparent",
                        color: n > 0 ? "#7ddc9a" : MUTED,
                      }}
                    >
                      {s} · {n}
                    </span>
                  );
                })}
              </div>
              <p style={{ margin: 0, color: MUTED, fontSize: 13, lineHeight: 1.6 }}>
                {intake.total} intake job{intake.total === 1 ? "" : "s"} queued in total. A source showing{" "}
                <strong style={{ color: "#f0c96a" }}>0</strong> is either newly wired and awaiting its first submission,
                or not wired at all — those leads exist only in Zapier/MailerLite and are invisible here.
                <br />
                <em>
                  Deliberately excluded: <code>/api/objection</code>, which is anonymous by design (the value is the
                  aggregate trend, not the individual), and <code>/api/graduate-story</code>, which is an existing
                  learner rather than a lead.
                </em>
              </p>
            </>
          )}
        </Section>

        {/* ── Enrolment pipeline ───────────────────────────────────────── */}
        <Section title="Enrolment pipeline" sub="From the LMS — who paid and who actually has an account">
          {!pipeline.ok ? (
            <Unavail p={pipeline} />
          ) : (
            <>
              {!pipeline.methodControlPassed && (
                <div
                  style={{
                    padding: "10px 12px",
                    background: "#2a0d0d",
                    border: "1px solid #5a2020",
                    borderRadius: 6,
                    marginBottom: 14,
                    fontSize: 13,
                    color: "#ff8a8a",
                    lineHeight: 1.5,
                  }}
                >
                  <strong>Method control failed.</strong> A known profile could not be found by the same lookup used for
                  every buyer, so any &ldquo;no account&rdquo; conclusion below would be meaningless. Fix the query
                  before acting on this panel.
                </div>
              )}
              <div style={{ display: "flex", gap: 30, flexWrap: "wrap", marginBottom: 14 }}>
                <Stat label="invite records" value={String(pipeline.invites.length)} />
                <Stat
                  label="ghost-consumed"
                  value={String(pipeline.ghostConsumed.length)}
                  tone={pipeline.ghostConsumed.length ? "bad" : undefined}
                />
                <Stat
                  label="test rows in prod"
                  value={String(pipeline.testRows.length)}
                  tone={pipeline.testRows.length ? "warn" : undefined}
                />
                <Stat
                  label="wrong tenant"
                  value={String(pipeline.wrongTenant.length)}
                  tone={pipeline.wrongTenant.length ? "warn" : undefined}
                />
              </div>
              {pipeline.tenantStart && (
                <p style={{ margin: "0 0 12px", color: MUTED, fontSize: 13, lineHeight: 1.55 }}>
                  Earliest Praxel profile: <strong style={{ color: "#fff" }}>{day(pipeline.tenantStart)}</strong>. Anyone
                  who paid before that predates the tenant and belongs to the Merve era.
                </p>
              )}
              {pipeline.invites.slice(0, 25).map((i) => {
                const ghost = i.consumedAt && !i.enrolmentId;
                return (
                  <div
                    key={i.email + (i.paidAt ?? "")}
                    style={{ display: "flex", gap: 12, padding: "7px 0", borderTop: `1px solid ${LINE}`, fontSize: 14 }}
                  >
                    <span style={{ color: MUTED, minWidth: 88 }}>{day(i.paidAt)}</span>
                    <span style={{ color: "#fff", minWidth: 78 }}>{formatPence(i.amountPence)}</span>
                    <span style={{ color: MUTED, minWidth: 62 }}>{i.plan}</span>
                    <span style={{ color: ghost ? "#ff8a8a" : i.consumedAt ? "#7ddc9a" : MUTED, minWidth: 96 }}>
                      {ghost ? "ghost" : i.consumedAt ? "enrolled" : "open"}
                    </span>
                    <span style={{ color: MUTED }}>{i.email}</span>
                  </div>
                );
              })}
            </>
          )}
        </Section>

        {/* ── Partners ─────────────────────────────────────────────────── */}
        <Section title="Partner network" sub="Gyms and their portal users">
          {!partners.ok ? (
            <Unavail p={partners} />
          ) : (
            partners.partners.map((p) => (
              <div
                key={p.slug}
                style={{ display: "flex", gap: 12, padding: "7px 0", borderTop: `1px solid ${LINE}`, fontSize: 14 }}
              >
                <span style={{ color: "#fff", minWidth: 220 }}>{p.gymName}</span>
                <span style={{ color: MUTED, minWidth: 88 }}>{p.status}</span>
                <span style={{ color: MUTED, minWidth: 70 }}>
                  {p.users} user{p.users === 1 ? "" : "s"}
                </span>
                {p.neverSignedIn > 0 && (
                  <span style={{ color: GOLD }}>{p.neverSignedIn} never signed in</span>
                )}
              </div>
            ))
          )}
        </Section>

        <p style={{ color: MUTED, fontSize: 12, lineHeight: 1.6, marginTop: 30 }}>
          Sources: Stripe (payments) · LMS Supabase (enrolments — a separate project to this site) · this site&rsquo;s
          Supabase (partners). Website leads have no database yet. Nothing on this page writes to any system.
        </p>
      </div>
    </main>
  );
}
