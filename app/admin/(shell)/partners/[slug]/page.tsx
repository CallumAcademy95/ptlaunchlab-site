import type { Metadata } from "next";
import { commissionTermsLabel } from "@/app/lib/paymentPlans";
import { notFound } from "next/navigation";
import {
  Banknote,
  Building2,
  ExternalLink,
  LogIn,
  Mail,
  PoundSterling,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { formatPence } from "@/app/lib/partner-data";
import {
  buildPartnerTimeline,
  daysSinceTheirActivity,
  partnerHealth,
  type TimelineEvent,
} from "@/app/lib/partner-timeline";
import {
  AdminPage,
  Badge,
  Card,
  DefRow,
  EmptyState,
  Notice,
  PageHeader,
  SectionTitle,
  StatTile,
  cn,
} from "../../ui/praxel";
import { STANDING_TONE } from "../standing";
import ResetPasswordButton from "../ResetPasswordButton";

// One gym, everything about them.
//
// The list page answers "how are we doing overall". This answers "what is
// going on with THIS gym, and what should I do about it" — which is the
// question the flat list could never answer, because it showed state and no
// history.
//
// The timeline is derived from tables that already exist and were never read
// together, so this opens with a real history rather than an empty box.
//
// Laid out the way Praxel lays out a learner: a profile column that stays
// still, and a right-hand column that tells you what has happened.

export const metadata: Metadata = {
  title: "Partner — PT Launch Lab admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const dateUK = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

// Who caused the event decides its colour: the things we did are slate and
// recede, the things the gym did carry a tone and come forward.
const EVENT: Record<string, { dot: string; label: string; tone: string }> = {
  signed: { dot: "bg-emerald-400", label: "Agreement", tone: "bg-emerald-50 text-emerald-700" },
  login_created: { dot: "bg-slate-300", label: "Portal", tone: "bg-slate-100 text-slate-600" },
  first_login: { dot: "bg-sky-400", label: "Sign-in", tone: "bg-sky-50 text-sky-700" },
  sale: { dot: "bg-blue-500", label: "Enrolment", tone: "bg-blue-50 text-blue-700" },
  payout: { dot: "bg-slate-300", label: "Payment", tone: "bg-slate-100 text-slate-600" },
  note: { dot: "bg-violet-400", label: "Note", tone: "bg-violet-50 text-violet-700" },
};

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const admin = getSupabaseAdmin();

  const { data: partner } = await admin
    .from("pp_partners")
    .select(
      "id, slug, gym_name, status, is_demo, landing_page_path, promo_code, commission_terms, " +
        "payout_terms_days, fee_per_learner_pence, agreement_signed_at, agreement_version, " +
        "contact_name, contact_email, created_at, bank_sort_code, bank_account_number",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!partner) notFound();
  const p = partner as Record<string, any>;

  const [{ data: users }, { data: sales }, { data: payouts }] = await Promise.all([
    admin
      .from("pp_partner_users")
      .select("id, email, full_name, role, must_change_password, last_login_at, created_at")
      .eq("partner_id", p.id),
    admin
      .from("pp_sales")
      .select(
        "learner_name, learner_email, plan_type, amount_paid_pence, commission_pence, " +
          "commission_status, status, enrolled_at, created_at",
      )
      .eq("partner_id", p.id),
    admin
      .from("pp_payouts")
      .select("period_label, total_pence, status, invoice_number, paid_at, created_at")
      .eq("partner_id", p.id),
  ]);

  const u = (users ?? []) as any[];
  const s = (sales ?? []) as any[];
  const po = (payouts ?? []) as any[];

  const events = buildPartnerTimeline({
    partner: p as any,
    users: u as any,
    sales: s as any,
    payouts: po as any,
  });
  // Their activity, not ours. Creating their login is not them turning up.
  const idle = daysSinceTheirActivity(events);
  const learners = s.filter((x) => x.status !== "voided").length;
  const hasEverLoggedIn = u.some((x) => x.last_login_at);
  const { health, why } = partnerHealth({ events, hasEverLoggedIn, learners, logins: u.length });

  const earned = s
    .filter((x) => x.status !== "voided")
    .reduce((t, x) => t + (x.commission_pence ?? 0), 0);
  const paid = po.filter((x) => x.status === "paid").reduce((t, x) => t + x.total_pence, 0);
  const owed = Math.max(0, earned - paid);

  return (
    <AdminPage>
      <PageHeader
        backHref="/admin/partners"
        backLabel="All partners"
        title={p.gym_name}
        subtitle={why}
        badge={
          <>
            <Badge tone={STANDING_TONE[health]}>{health}</Badge>
            {p.is_demo && <Badge tone="violet">demo</Badge>}
            {p.status !== "active" && <Badge tone="amber">{p.status}</Badge>}
          </>
        }
        action={
          p.landing_page_path ? (
            <a
              href={p.landing_page_path}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Academy page
            </a>
          ) : null
        }
      />

      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          icon={<Users className="h-5 w-5" />}
          value={learners}
          label="Learners attributed"
          tone={learners > 0 ? "blue" : "slate"}
        />
        <StatTile
          icon={<PoundSterling className="h-5 w-5" />}
          value={formatPence(earned)}
          label="Commission earned"
          tone="slate"
        />
        <StatTile
          icon={<Banknote className="h-5 w-5" />}
          value={formatPence(paid)}
          label="Paid out"
          sublabel="left the bank"
          tone="green"
        />
        <StatTile
          icon={<Wallet className="h-5 w-5" />}
          value={formatPence(owed)}
          label="Owed now"
          sublabel={owed > 0 ? "outstanding" : "all settled"}
          tone={owed > 0 ? "amber" : "slate"}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[20rem_1fr]">
        {/* Profile column */}
        <div>
          <Card>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-700 text-lg font-bold text-white">
                {initials(p.gym_name)}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-slate-900">{p.gym_name}</h2>
                <p className="font-mono text-xs text-slate-500">{p.slug}</p>
              </div>
            </div>

            {(p.contact_name || p.contact_email || p.promo_code) && (
              <dl className="mt-5 space-y-2.5 text-sm">
                {p.contact_name && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate">{p.contact_name}</span>
                  </div>
                )}
                {p.contact_email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                    <a href={`mailto:${p.contact_email}`} className="truncate hover:text-slate-900">
                      {p.contact_email}
                    </a>
                  </div>
                )}
                {p.promo_code && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Ticket className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate font-mono text-xs">{p.promo_code}</span>
                  </div>
                )}
              </dl>
            )}

            <dl className="mt-4 border-t border-slate-100 pt-2">
              <DefRow
                k="Last thing they did"
                v={
                  idle === null ? (
                    <span className="text-rose-600">Nothing, ever</span>
                  ) : (
                    `${idle} days ago`
                  )
                }
              />
              <DefRow
                k="Agreement"
                v={
                  p.agreement_signed_at
                    ? `${dateUK(p.agreement_signed_at)}${p.agreement_version ? ` · v${p.agreement_version}` : ""}`
                    : "Not signed"
                }
              />
              <DefRow
                k="Fee per learner"
                v={p.fee_per_learner_pence ? formatPence(p.fee_per_learner_pence) : "—"}
              />
              <DefRow
                k="Terms"
                v={commissionTermsLabel(p.commission_terms)}
              />
              <DefRow
                k="Bank details"
                v={
                  p.bank_sort_code && p.bank_account_number ? (
                    "On file"
                  ) : (
                    <span className="text-amber-700">Not provided</span>
                  )
                }
              />
            </dl>
          </Card>
        </div>

        {/* Record column */}
        <div className="space-y-5">
          {u.length === 0 && (
            <Notice tone="rose" title="No portal login exists">
              Nothing we send this gym can be opened. They cannot see their creatives, their
              playbook, or their sales.
            </Notice>
          )}

          <Card>
            <SectionTitle hint="Who can get into the partner portal, and whether they ever have.">
              Logins
            </SectionTitle>
            {u.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={<LogIn className="h-5 w-5" />}
                  title="No login has been created"
                  hint="Create one from the partner list."
                />
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {u.map((x) => (
                  <li
                    key={x.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {x.full_name ? `${x.full_name} · ` : ""}
                        {x.email}
                      </p>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <span className="capitalize">{x.role}</span>
                        <span aria-hidden>·</span>
                        {x.last_login_at ? (
                          <span>last in {dateUK(x.last_login_at)}</span>
                        ) : (
                          <Badge tone="amber">never signed in</Badge>
                        )}
                        {x.must_change_password && (
                          <Badge tone="neutral">password not changed</Badge>
                        )}
                      </span>
                    </div>
                    <ResetPasswordButton userId={x.id} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <SectionTitle hint="Everything we already know, in order. Nobody had to type any of it.">
              History
            </SectionTitle>
            {events.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="Nothing recorded for this partner at all." />
              </div>
            ) : (
              <ol className="mt-5">
                {events.map((e: TimelineEvent, i: number) => {
                  const k = EVENT[e.kind] ?? EVENT.note;
                  return (
                    <li key={`${e.at}-${i}`} className="relative flex gap-4 pb-5 last:pb-0">
                      {i < events.length - 1 && (
                        <span
                          className="absolute left-[7px] top-4 h-full w-px bg-slate-200"
                          aria-hidden
                        />
                      )}
                      <span
                        className={cn(
                          "mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white ring-1 ring-slate-200",
                          k.dot,
                        )}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-medium",
                              k.tone,
                            )}
                          >
                            {k.label}
                          </span>
                          <span className="text-xs text-slate-500">{dateUK(e.at)}</span>
                          {e.byUs && <span className="text-xs text-slate-400">· us</span>}
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-800">{e.title}</p>
                        {(e.detail || (e.kind === "sale" && e.amountPence)) && (
                          <p className="mt-0.5 text-sm text-slate-500">
                            {e.detail}
                            {e.kind === "sale" && e.amountPence
                              ? `${e.detail ? " · " : ""}${formatPence(e.amountPence)} commission`
                              : ""}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          <p className="px-1 text-xs text-slate-500">
            Notes and a next action are not here yet — this page is the history we already had.
          </p>
        </div>
      </div>
    </AdminPage>
  );
}
