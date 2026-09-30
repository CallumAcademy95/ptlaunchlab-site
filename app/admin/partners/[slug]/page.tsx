import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { formatPence } from "@/app/lib/partner-data";
import {
  buildPartnerTimeline,
  daysSinceTheirActivity,
  partnerHealth,
  type TimelineEvent,
} from "@/app/lib/partner-timeline";
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

export const metadata: Metadata = {
  title: "Partner — PT Launch Lab admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const dateUK = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

const HEALTH_STYLE: Record<string, string> = {
  producing: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  engaged: "bg-sky-500/15 text-sky-300 border-sky-500/40",
  quiet: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  "never started": "bg-red-500/15 text-red-300 border-red-500/40",
};

const KIND_STYLE: Record<string, { dot: string; label: string }> = {
  signed: { dot: "bg-emerald-400", label: "Agreement" },
  login_created: { dot: "bg-sky-400", label: "Portal" },
  first_login: { dot: "bg-sky-300", label: "Sign-in" },
  sale: { dot: "bg-gold", label: "Enrolment" },
  payout: { dot: "bg-emerald-300", label: "Payment" },
  note: { dot: "bg-white/50", label: "Note" },
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
      "contact_name, contact_email, created_at, bank_sort_code, bank_account_number"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!partner) notFound();
  const p = partner as Record<string, any>;

  const [{ data: users }, { data: sales }, { data: payouts }] = await Promise.all([
    admin.from("pp_partner_users")
      .select("id, email, full_name, role, must_change_password, last_login_at, created_at")
      .eq("partner_id", p.id),
    admin.from("pp_sales")
      .select("learner_name, learner_email, plan_type, amount_paid_pence, commission_pence, commission_status, status, enrolled_at, created_at")
      .eq("partner_id", p.id),
    admin.from("pp_payouts")
      .select("period_label, total_pence, status, invoice_number, paid_at, created_at")
      .eq("partner_id", p.id),
  ]);

  const u = (users ?? []) as any[];
  const s = (sales ?? []) as any[];
  const po = (payouts ?? []) as any[];

  const events = buildPartnerTimeline({ partner: p as any, users: u as any, sales: s as any, payouts: po as any });
  // Their activity, not ours. Creating their login is not them turning up.
  const idle = daysSinceTheirActivity(events);
  const learners = s.filter((x) => x.status !== "voided").length;
  const hasEverLoggedIn = u.some((x) => x.last_login_at);
  const { health, why } = partnerHealth({ events, hasEverLoggedIn, learners, logins: u.length });

  const earned = s.filter((x) => x.status !== "voided").reduce((t, x) => t + (x.commission_pence ?? 0), 0);
  const paid = po.filter((x) => x.status === "paid").reduce((t, x) => t + x.total_pence, 0);
  const owed = earned - paid;

  const Stat = ({ k, v, note }: { k: string; v: string; note?: string }) => (
    <div className="rounded-xl bg-card border border-white/10 px-4 py-3">
      <div className="text-soft text-[10px] uppercase tracking-widest font-bold">{k}</div>
      <div className="text-white font-bold text-xl mt-1">{v}</div>
      {note && <div className="text-soft text-[11px] mt-0.5">{note}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-deep">
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-7">
        <div>
          <Link href="/admin/partners" className="text-soft text-xs hover:text-gold">← All partners</Link>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <h1 className="text-white font-bold text-2xl">{p.gym_name}</h1>
            <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${HEALTH_STYLE[health]}`}>
              {health}
            </span>
            {p.is_demo && (
              <span className="px-2 py-0.5 rounded-full bg-white/5 text-soft border border-white/15 text-[10px] font-semibold">demo</span>
            )}
            {p.status !== "active" && <span className="text-amber-300 text-xs">({p.status})</span>}
          </div>
          <p className="text-soft text-sm mt-1">{why}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat k="Learners" v={String(learners)} note="attributed" />
          <Stat k="Earned" v={formatPence(earned)} note="commission" />
          <Stat k="Paid" v={formatPence(paid)} note="left the bank" />
          <Stat k="Owed" v={formatPence(Math.max(0, owed))} note={owed > 0 ? "outstanding" : "all settled"} />
        </div>

        {/* THE ANSWER TO "WHAT DO I DO ABOUT THIS ONE" */}
        <div className="rounded-xl bg-card border border-white/10 p-5">
          <h2 className="text-white font-bold mb-3">Where they stand</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {[
              ["Last thing they did", idle === null ? "Nothing, ever" : `${idle} days ago`],
              ["Agreement", p.agreement_signed_at ? `Signed ${dateUK(p.agreement_signed_at)}${p.agreement_version ? ` (v${p.agreement_version})` : ""}` : "Not signed"],
              ["Contact", p.contact_name || p.contact_email || "—"],
              ["Academy page", p.landing_page_path ?? "—"],
              ["Promo code", p.promo_code ?? "none"],
              ["Fee per learner", p.fee_per_learner_pence ? formatPence(p.fee_per_learner_pence) : "—"],
              ["Commission terms", p.commission_terms === "on_enrolment" ? "30d after enrolment (grandfathered)" : "Held to instalment 2"],
              ["Bank details", p.bank_sort_code && p.bank_account_number ? "On file" : "Not provided"],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between gap-4 border-b border-white/5 py-1.5">
                <dt className="text-soft">{k}</dt>
                <dd className="text-white text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* LOGINS */}
        <div className="rounded-xl bg-card border border-white/10 p-5">
          <h2 className="text-white font-bold mb-3">Logins</h2>
          {u.length === 0 ? (
            <p className="text-amber-300 text-sm">No portal login exists. They cannot see anything we send them.</p>
          ) : (
            <div className="space-y-3">
              {u.map((x) => (
                <div key={x.id} className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-white text-sm">{x.full_name ? `${x.full_name} · ` : ""}{x.email}</div>
                    <div className={`text-xs ${x.last_login_at ? "text-soft" : "text-amber-300"}`}>
                      {x.role}
                      {" · "}
                      {x.last_login_at ? `last in ${dateUK(x.last_login_at)}` : "never signed in"}
                      {x.must_change_password && " · password not changed"}
                    </div>
                  </div>
                  <ResetPasswordButton userId={x.id} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TIMELINE */}
        <div className="rounded-xl bg-card border border-white/10 p-5">
          <h2 className="text-white font-bold mb-1">History</h2>
          <p className="text-soft text-xs mb-4">
            Everything we already know, in order. Nobody had to type any of it.
          </p>
          {events.length === 0 ? (
            <p className="text-soft text-sm">Nothing recorded for this partner at all.</p>
          ) : (
            <ol className="space-y-0">
              {events.map((e: TimelineEvent, i: number) => {
                const k = KIND_STYLE[e.kind] ?? KIND_STYLE.note;
                return (
                  <li key={`${e.at}-${i}`} className="flex gap-4 pb-4 last:pb-0">
                    <div className="flex flex-col items-center pt-1.5">
                      <span className={`w-2 h-2 rounded-full ${k.dot} shrink-0`} />
                      {i < events.length - 1 && <span className="w-px flex-1 bg-white/10 mt-1" />}
                    </div>
                    <div className="min-w-0 flex-1 -mt-0.5">
                      <div className="flex items-baseline justify-between gap-3 flex-wrap">
                        <span className="text-white text-sm">{e.title}</span>
                        <span className="text-soft text-xs whitespace-nowrap">{dateUK(e.at)}</span>
                      </div>
                      <div className="text-soft text-xs mt-0.5">
                        <span className="opacity-70">{k.label}</span>
                        {e.detail && <> · {e.detail}</>}
                        {e.kind === "sale" && e.amountPence ? <> · {formatPence(e.amountPence)} commission</> : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <p className="text-soft text-xs">
          Notes and a next action are not here yet — this page is the history we already had.
          Adding them is the next step.
        </p>
      </div>
    </div>
  );
}
