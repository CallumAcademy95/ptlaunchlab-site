import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/app/lib/supabase-admin";
import CreateUserForm from "./CreateUserForm";

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

  return (
    <div className="min-h-screen bg-deep">
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <div>
          <p className="text-gold text-[10px] font-bold tracking-widest uppercase mb-1">
            PT Launch Lab admin
          </p>
          <h1 className="text-white font-bold text-2xl">Gym partners</h1>
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
                </tr>
              ))}
              {partners.length === 0 && !error && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-soft text-sm text-center">
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
