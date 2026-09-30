import Link from "next/link";
import { formatPence } from "@/app/lib/partner-data";

// Who each gym actually sent us, and what we paid them for it.
//
// The admin page could previously only do things TO a partner — create a
// login, upload a resource, mark a payout. It could not answer the first
// question anyone asks: "which learners did this gym send, and have we paid
// them?" Both answers were already in pp_sales and pp_payouts and neither was
// on screen.
//
// Filtering is by URL (?gym=slug) rather than client state, so a filtered view
// is a link you can send someone, and the page stays a server component.

export interface SaleRow {
  id: string;
  partner_id: string;
  learner_name: string | null;
  learner_email: string | null;
  plan_type: string | null;
  amount_paid_pence: number | null;
  promo_code: string | null;
  status: string;
  commission_pence: number | null;
  commission_status: string | null;
  commission_release_at: string | null;
  enrolled_at: string | null;
  created_at: string;
}

export interface PayoutRow {
  id: string;
  partner_id: string;
  period_label: string | null;
  total_pence: number;
  status: string;
  invoice_number: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface PartnerLite {
  id: string;
  slug: string;
  gym_name: string;
  is_demo?: boolean;
}

const dateUK = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

/** Commission wording that matches how the money actually behaves. */
function commissionLabel(s: SaleRow, now: number): { text: string; tone: string } {
  if (s.commission_status === "paid") return { text: "Paid", tone: "text-emerald-300" };
  if (s.commission_status === "voided") return { text: "Voided", tone: "text-soft" };
  if (!s.commission_release_at) return { text: "Not released", tone: "text-soft" };
  const rel = Date.parse(s.commission_release_at);
  return rel <= now
    ? { text: "Due now", tone: "text-amber-300" }
    : { text: `Releases ${dateUK(s.commission_release_at)}`, tone: "text-soft" };
}

export default function PartnerLearners({
  partners,
  sales,
  payouts,
  selectedSlug,
}: {
  partners: PartnerLite[];
  sales: SaleRow[];
  payouts: PayoutRow[];
  selectedSlug: string;
}) {
  const bySlug = new Map(partners.map((p) => [p.slug, p]));
  const byId = new Map(partners.map((p) => [p.id, p]));
  const selected = selectedSlug ? bySlug.get(selectedSlug) : undefined;

  const now = Date.now();
  const visibleSales = (selected ? sales.filter((s) => s.partner_id === selected.id) : sales)
    .slice()
    .sort((a, b) => Date.parse(b.enrolled_at ?? b.created_at) - Date.parse(a.enrolled_at ?? a.created_at));

  const visiblePayouts = (selected ? payouts.filter((p) => p.partner_id === selected.id) : payouts)
    .slice()
    .sort((a, b) => Date.parse(b.paid_at ?? b.created_at) - Date.parse(a.paid_at ?? a.created_at));

  // Counts next to each option describe what clicking would actually show.
  const countFor = (id: string) => sales.filter((s) => s.partner_id === id).length;

  const tab = (href: string, label: string, active: boolean, n?: number) => (
    <Link
      key={href}
      href={href}
      className={
        "px-3 py-1.5 rounded-full text-xs font-semibold border transition " +
        (active
          ? "bg-gold text-deep border-gold"
          : "bg-white/5 text-soft border-white/15 hover:border-white/30")
      }
    >
      {label}
      {typeof n === "number" && <span className="opacity-70"> · {n}</span>}
    </Link>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-white font-bold text-lg">Learners by gym</h2>
        <p className="text-soft text-sm mt-1">
          Every enrolment attributed to a partner, newest first.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tab("/admin/partners", "All gyms", !selected, sales.length)}
        {partners
          .filter((p) => countFor(p.id) > 0 || p.slug === selectedSlug)
          .map((p) =>
            tab(`/admin/partners?gym=${encodeURIComponent(p.slug)}`, p.gym_name, p.slug === selectedSlug, countFor(p.id))
          )}
      </div>

      <div className="rounded-xl bg-card border border-white/10 overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[820px]">
          <thead className="bg-white/5 text-soft text-[10px] uppercase tracking-widest">
            <tr>
              <th className="px-4 py-3 font-bold">Learner</th>
              {!selected && <th className="px-4 py-3 font-bold">Gym</th>}
              <th className="px-4 py-3 font-bold">Enrolled</th>
              <th className="px-4 py-3 font-bold">Plan</th>
              <th className="px-4 py-3 font-bold">Paid</th>
              <th className="px-4 py-3 font-bold">Code</th>
              <th className="px-4 py-3 font-bold">Commission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {visibleSales.map((s) => {
              const gym = byId.get(s.partner_id);
              const c = commissionLabel(s, now);
              return (
                <tr key={s.id} className={gym?.is_demo ? "opacity-60" : undefined}>
                  <td className="px-4 py-3">
                    <div className="text-white font-semibold">{s.learner_name || "—"}</div>
                    {s.learner_email && <div className="text-soft text-xs">{s.learner_email}</div>}
                  </td>
                  {!selected && (
                    <td className="px-4 py-3 text-soft text-xs">
                      {gym?.gym_name ?? "—"}
                      {gym?.is_demo && <span className="ml-1 text-[10px]">(demo)</span>}
                    </td>
                  )}
                  <td className="px-4 py-3 text-soft text-xs">{dateUK(s.enrolled_at ?? s.created_at)}</td>
                  <td className="px-4 py-3 text-soft text-xs">{s.plan_type ?? "—"}</td>
                  <td className="px-4 py-3 text-white text-xs">
                    {s.amount_paid_pence != null ? formatPence(s.amount_paid_pence) : "—"}
                    {s.status !== "confirmed" && (
                      <span className="ml-1 text-amber-300">({s.status})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-soft font-mono text-[11px]">{s.promo_code ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="text-white">
                      {s.commission_pence != null ? formatPence(s.commission_pence) : "—"}
                    </span>
                    <div className={c.tone}>{c.text}</div>
                  </td>
                </tr>
              );
            })}
            {visibleSales.length === 0 && (
              <tr>
                <td colSpan={selected ? 6 : 7} className="px-4 py-6 text-soft text-sm text-center">
                  {selected
                    ? `${selected.gym_name} has not produced a learner yet.`
                    : "No sales recorded against any partner yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-white font-bold text-lg mt-8">
          Payout history{selected ? ` — ${selected.gym_name}` : ""}
        </h2>
        <p className="text-soft text-sm mt-1">What has actually left the bank.</p>
      </div>

      <div className="rounded-xl bg-card border border-white/10 overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[620px]">
          <thead className="bg-white/5 text-soft text-[10px] uppercase tracking-widest">
            <tr>
              {!selected && <th className="px-4 py-3 font-bold">Gym</th>}
              <th className="px-4 py-3 font-bold">Period</th>
              <th className="px-4 py-3 font-bold">Amount</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Invoice</th>
              <th className="px-4 py-3 font-bold">Paid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {visiblePayouts.map((p) => {
              const gym = byId.get(p.partner_id);
              return (
                <tr key={p.id} className={gym?.is_demo ? "opacity-60" : undefined}>
                  {!selected && <td className="px-4 py-3 text-soft text-xs">{gym?.gym_name ?? "—"}</td>}
                  <td className="px-4 py-3 text-white text-xs">{p.period_label ?? "—"}</td>
                  <td className="px-4 py-3 text-white text-xs">{formatPence(p.total_pence)}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={p.status === "paid" ? "text-emerald-300" : "text-amber-300"}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-soft font-mono text-[11px]">{p.invoice_number ?? "—"}</td>
                  <td className="px-4 py-3 text-soft text-xs">{dateUK(p.paid_at)}</td>
                </tr>
              );
            })}
            {visiblePayouts.length === 0 && (
              <tr>
                <td colSpan={selected ? 5 : 6} className="px-4 py-6 text-soft text-sm text-center">
                  No payouts recorded{selected ? ` for ${selected.gym_name}` : ""} yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
