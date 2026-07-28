import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import { formatPence } from "@/app/lib/partner-data";
import CreateUserForm from "./CreateUserForm";
import MarkPaidForm from "./MarkPaidForm";

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
  pp_partner_users: { email: string; role: string; must_change_password: boolean; last_login_at: string | null }[];
}

export default async function AdminPartnersPage() {
  const { data, error } = await getSupabaseAdmin()
    .from("pp_partners")
    .select(
      "id, slug, gym_name, status, landing_page_path, commission_terms, " +
      "pp_partner_users(email, role, must_change_password, last_login_at)"
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

  const today = nowIso.slice(0, 10);
  const owedTotal = [...payable.values()].reduce((t, e) => t + e.total, 0);

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

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-200 text-sm">
            Could not load partners: {error.message}
            {error.message.includes("pp_partners") && (
              <> — has <code>supabase/migrations/20260727_partner_platform.sql</code> been applied?</>
            )}
          </div>
        )}

        <CreateUserForm partners={partners.map((p) => ({ id: p.id, gym_name: p.gym_name, slug: p.slug }))} />

        <div className="rounded-xl bg-card border border-white/10 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-soft text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-4 py-3 font-bold">Gym</th>
                <th className="px-4 py-3 font-bold">Slug</th>
                <th className="px-4 py-3 font-bold">Terms</th>
                <th className="px-4 py-3 font-bold">Logins</th>
                <th className="px-4 py-3 font-bold">Owed now</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {partners.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <span className="text-white font-semibold">{p.gym_name}</span>
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
                    {p.pp_partner_users.length === 0 ? (
                      <span className="text-soft text-xs">No login yet</span>
                    ) : (
                      p.pp_partner_users.map((u) => (
                        <div key={u.email} className="text-soft text-xs">
                          {u.email}
                          {u.must_change_password && (
                            <span className="text-amber-300"> · not signed in yet</span>
                          )}
                        </div>
                      ))
                    )}
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
                  <td colSpan={5} className="px-4 py-6 text-soft text-sm text-center">
                    No partners yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
