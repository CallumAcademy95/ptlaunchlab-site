import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { formatPence } from "@/app/lib/partner-data";
import CreateUserForm from "./CreateUserForm";
import MarkPaidForm from "./MarkPaidForm";
import BankReveal from "./BankReveal";
import UploadResourceForm from "./UploadResourceForm";
import ResetPasswordButton from "./ResetPasswordButton";
import AddPlaybookForm from "./AddPlaybookForm";
import SetBankForm from "./SetBankForm";
import PartnerLearners, { type SaleRow, type PayoutRow } from "./PartnerLearners";

export const metadata: Metadata = {
  title: "Partners — PT Launch Lab admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PartnerRow {
  id: string;
  slug: string;
  gym_name: string;
  status: string;
  landing_page_path: string | null;
  commission_terms: string;
  is_demo?: boolean;
  bank_account_name: string | null;
  bank_sort_code: string | null;
  bank_account_number: string | null;
  bank_details_updated_at: string | null;
  pp_partner_users: { id: string; email: string; role: string; must_change_password: boolean; last_login_at: string | null }[];
}

export default async function AdminPartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ gym?: string }>;
}) {
  const selectedSlug = ((await searchParams).gym ?? "").trim();
  const { data, error } = await getSupabaseAdmin()
    .from("pp_partners")
    .select(
      "id, slug, gym_name, status, landing_page_path, commission_terms, is_demo, " +
      "bank_account_name, bank_sort_code, bank_account_number, bank_details_updated_at, " +
      "pp_partner_users(id, email, role, must_change_password, last_login_at)"
    )
    .order("gym_name");

  const partners = (data ?? []) as unknown as PartnerRow[];

  // What each partner is owed right now: commission that has released and
  // hasn't been paid. Derived from the release date rather than a status
  // column, same rule the partner-facing pages use.
  const nowIso = new Date().toISOString();
  const { data: payableRows } = await getSupabaseAdmin()
    .from("pp_sales")
    .select("partner_id, commission_pence")
    .eq("status", "confirmed")
    .neq("commission_status", "paid")
    .neq("commission_status", "voided")
    .not("commission_release_at", "is", null)
    .lte("commission_release_at", nowIso);

  const payable = new Map<string, { total: number; count: number }>();
  for (const row of (payableRows ?? []) as { partner_id: string; commission_pence: number }[]) {
    const entry = payable.get(row.partner_id) ?? { total: 0, count: 0 };
    entry.total += row.commission_pence;
    entry.count += 1;
    payable.set(row.partner_id, entry);
  }

  // Everything a gym has produced and everything we've paid them. Both tables
  // already existed; neither was on screen, so "which learners did this gym
  // send?" could only be answered by querying the database by hand.
  const [{ data: saleRows }, { data: payoutRows }] = await Promise.all([
    getSupabaseAdmin()
      .from("pp_sales")
      .select(
        "id, partner_id, learner_name, learner_email, plan_type, amount_paid_pence, " +
        "promo_code, status, commission_pence, commission_status, commission_release_at, " +
        "enrolled_at, created_at"
      )
      .order("created_at", { ascending: false }),
    getSupabaseAdmin()
      .from("pp_payouts")
      .select("id, partner_id, period_label, total_pence, status, invoice_number, paid_at, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const sales = (saleRows ?? []) as unknown as SaleRow[];
  const payouts = (payoutRows ?? []) as unknown as PayoutRow[];

  const today = nowIso.slice(0, 10);
  // Demo accounts carry invented commission so a walkthrough looks like a going
  // concern. It must never reach a number anyone acts on.
  const demoIds = new Set(partners.filter((p) => p.is_demo).map((p) => p.id));
  // Per-gym rollups. Demo partners carry invented commission, so they are
  // excluded from every total — the same rule the owed figure already used.
  const learnersFor = new Map<string, number>();
  const earnedFor = new Map<string, number>();
  for (const s of sales) {
    if (s.status === "voided") continue;
    learnersFor.set(s.partner_id, (learnersFor.get(s.partner_id) ?? 0) + 1);
    if (s.commission_pence) earnedFor.set(s.partner_id, (earnedFor.get(s.partner_id) ?? 0) + s.commission_pence);
  }
  const paidFor = new Map<string, number>();
  for (const p of payouts) {
    if (p.status !== "paid") continue;
    paidFor.set(p.partner_id, (paidFor.get(p.partner_id) ?? 0) + p.total_pence);
  }

  const real = (id: string) => !demoIds.has(id);
  const totalLearners = [...learnersFor.entries()].filter(([id]) => real(id)).reduce((t, [, n]) => t + n, 0);
  const totalEarned = [...earnedFor.entries()].filter(([id]) => real(id)).reduce((t, [, n]) => t + n, 0);
  const totalPaid = [...paidFor.entries()].filter(([id]) => real(id)).reduce((t, [, n]) => t + n, 0);
  const producing = partners.filter((p) => !p.is_demo && (learnersFor.get(p.id) ?? 0) > 0).length;
  const realPartners = partners.filter((p) => !p.is_demo).length;
  const neverLoggedIn = partners.filter(
    (p) => !p.is_demo && !p.pp_partner_users.some((u) => u.last_login_at)
  ).length;

  const owedTotal = [...payable.entries()]
    .filter(([id]) => !demoIds.has(id))
    .reduce((t, [, e]) => t + e.total, 0);
  // Read the clock once, outside the render, so the rows stay pure.
  const recentChangeCutoff = Date.parse(nowIso) - 7 * 86400000;

  return (
    <div className="min-h-screen bg-deep">
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <div>
          <p className="text-gold text-[10px] font-bold tracking-widest uppercase mb-1">
            PT Launch Lab admin
          </p>
          <h1 className="text-white font-bold text-2xl">Gym partners</h1>
          <p className="text-soft text-sm mt-1">
            {owedTotal > 0
              ? `${formatPence(owedTotal)} in commission is released and unpaid across all partners.`
              : "All released commission has been paid."}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Partners", value: String(realPartners), note: `${producing} producing` },
            { label: "Learners", value: String(totalLearners), note: "attributed to a gym" },
            { label: "Commission earned", value: formatPence(totalEarned), note: "lifetime" },
            { label: "Paid out", value: formatPence(totalPaid), note: "left the bank" },
            { label: "Owed now", value: formatPence(owedTotal), note: "released, unpaid" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-card border border-white/10 px-4 py-3">
              <div className="text-soft text-[10px] uppercase tracking-widest font-bold">{s.label}</div>
              <div className="text-white font-bold text-xl mt-1">{s.value}</div>
              <div className="text-soft text-[11px] mt-0.5">{s.note}</div>
            </div>
          ))}
        </div>

        {neverLoggedIn > 0 && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-amber-200 text-sm">
            <strong>{neverLoggedIn}</strong> of {realPartners} partners have never logged in.
            An asset library nobody opens is not a distribution channel.
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-200 text-sm">
            Could not load partners: {error.message}
            {error.message.includes("pp_partners") && (
              <> — has <code>supabase/migrations/20260727_partner_platform.sql</code> been applied?</>
            )}
          </div>
        )}

        <CreateUserForm partners={partners.map((p) => ({ id: p.id, gym_name: p.gym_name, slug: p.slug }))} />

        <UploadResourceForm partners={partners.map((p) => ({ id: p.id, gym_name: p.gym_name }))} />

        <SetBankForm
          partners={partners.map((p) => ({
            id: p.id,
            gym_name: p.gym_name,
            hasBank: Boolean(p.bank_sort_code && p.bank_account_number),
          }))}
        />

        <AddPlaybookForm />

        <div className="rounded-xl bg-card border border-white/10 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-soft text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-4 py-3 font-bold">Gym</th>
                <th className="px-4 py-3 font-bold">Slug</th>
                <th className="px-4 py-3 font-bold">Terms</th>
                <th className="px-4 py-3 font-bold">Learners</th>
                <th className="px-4 py-3 font-bold">Earned</th>
                <th className="px-4 py-3 font-bold">Paid</th>
                <th className="px-4 py-3 font-bold">Logins</th>
                <th className="px-4 py-3 font-bold">Bank</th>
                <th className="px-4 py-3 font-bold">Owed now</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {partners.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <span className="text-white font-semibold">{p.gym_name}</span>
                    {p.is_demo && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-white/5 text-soft border border-white/15 text-[10px] font-semibold">
                        demo
                      </span>
                    )}
                    {p.status !== "active" && (
                      <span className="ml-2 text-amber-300 text-xs">({p.status})</span>
                    )}
                    {p.landing_page_path && (
                      <div className="text-soft text-xs mt-0.5">{p.landing_page_path}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-soft font-mono text-xs">{p.slug}</td>
                  <td className="px-4 py-3 text-soft text-xs">
                    {p.commission_terms === "on_enrolment"
                      ? "30d after enrolment (grandfathered)"
                      : "Held to instalment 2"}
                  </td>
                  <td className="px-4 py-3">
                    {(learnersFor.get(p.id) ?? 0) > 0 ? (
                      <a href={`/admin/partners?gym=${encodeURIComponent(p.slug)}`} className="text-gold font-semibold">
                        {learnersFor.get(p.id)}
                      </a>
                    ) : (
                      <span className="text-soft text-xs">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-soft text-xs">
                    {earnedFor.get(p.id) ? formatPence(earnedFor.get(p.id)!) : "—"}
                  </td>
                  <td className="px-4 py-3 text-soft text-xs">
                    {paidFor.get(p.id) ? formatPence(paidFor.get(p.id)!) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.pp_partner_users.length === 0 ? (
                      <span className="text-soft text-xs">No login yet</span>
                    ) : (
                      p.pp_partner_users.map((u) => (
                        <div key={u.email} className="text-soft text-xs mb-1.5">
                          <div>
                            {u.email}
                            {u.must_change_password && (
                              <span className="text-amber-300"> · not signed in yet</span>
                            )}
                          </div>
                          <div className={u.last_login_at ? "text-soft" : "text-amber-300"}>
                            {u.last_login_at
                              ? `last in ${new Date(u.last_login_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                              : "never logged in"}
                          </div>
                          <ResetPasswordButton userId={u.id} />
                        </div>
                      ))
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <BankReveal
                      partnerId={p.id}
                      masked={
                        p.bank_sort_code && p.bank_account_number
                          ? `••-••-${p.bank_sort_code.slice(4)} · ••••${p.bank_account_number.slice(-4)}`
                          : null
                      }
                      changedRecently={
                        Boolean(p.bank_details_updated_at) &&
                        Date.parse(p.bank_details_updated_at!) > recentChangeCutoff
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    {payable.has(p.id) ? (
                      <MarkPaidForm
                        partnerId={p.id}
                        amount={formatPence(payable.get(p.id)!.total)}
                        count={payable.get(p.id)!.count}
                        today={today}
                      />
                    ) : (
                      <span className="text-soft text-xs">Nothing due</span>
                    )}
                  </td>
                </tr>
              ))}
              {partners.length === 0 && !error && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-soft text-sm text-center">
                    No partners yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PartnerLearners
          partners={partners.map((p) => ({ id: p.id, slug: p.slug, gym_name: p.gym_name, is_demo: p.is_demo }))}
          sales={sales}
          payouts={payouts}
          selectedSlug={selectedSlug}
        />
      </div>
    </div>
  );
}
