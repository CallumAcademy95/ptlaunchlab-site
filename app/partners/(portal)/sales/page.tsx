import Link from "next/link";
import { requirePartner } from "@/app/lib/partner-auth";
import {
  getPartnerSales,
  commissionState,
  formatPence,
  type PartnerSale,
} from "@/app/lib/partner-data";

const STATE_STYLES: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  payable: "bg-gold/10 text-gold border-gold/40",
  held: "bg-white/5 text-soft border-white/15",
  voided: "bg-red-500/10 text-red-300 border-red-500/30",
};

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function Progress({ sale }: { sale: PartnerSale }) {
  const pct = Math.min(100, Math.round((sale.amount_paid_pence / Math.max(1, sale.amount_due_pence)) * 100));
  const complete = pct >= 100;
  return (
    <div className="min-w-[120px]">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-white text-xs font-semibold">{formatPence(sale.amount_paid_pence)}</span>
        {!complete && <span className="text-soft text-[10px]">of {formatPence(sale.amount_due_pence)}</span>}
      </div>
      {!complete && (
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { partner } = await requirePartner();
  const { month } = await searchParams;

  const all = await getPartnerSales(partner.id);
  const months = [...new Set(all.map((s) => monthKey(s.enrolled_at)))].sort().reverse();
  const active = month && months.includes(month) ? month : null;
  const sales = active ? all.filter((s) => monthKey(s.enrolled_at) === active) : all;

  // Totals follow the filter, so the numbers always describe what is on screen.
  // "Earned" is everything not voided, paid or otherwise — the split between
  // settled and outstanding lives on the Payments page.
  let earned = 0, payable = 0, held = 0;
  for (const s of sales) {
    const state = commissionState(s);
    if (state.key === "voided") continue;
    earned += s.commission_pence;
    if (state.key === "payable") payable += s.commission_pence;
    else if (state.key === "held") held += s.commission_pence;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white font-bold text-xl mb-1">Enrolments</h2>
        <p className="text-soft text-sm">
          Every learner who enrolled through {partner.gym_name}, as it happens.
        </p>
      </div>

      {all.length === 0 ? (
        <div className="rounded-xl bg-card border border-white/10 p-6">
          <p className="text-white font-semibold mb-1">No enrolments yet.</p>
          <p className="text-soft text-sm leading-relaxed">
            As soon as a member enrols through your academy link, they&rsquo;ll appear here — name,
            date, and the commission you&rsquo;ve earned.{" "}
            <Link href="/partners" className="text-gold hover:underline">
              Get your link and QR code
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Enrolments", value: String(sales.length) },
              { label: "Commission earned", value: formatPence(earned) },
              { label: "Ready to pay", value: formatPence(payable) },
              { label: "Still accruing", value: formatPence(held) },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-card border border-white/10 p-4">
                <p className="text-soft text-[10px] font-bold tracking-widest uppercase">{s.label}</p>
                <p className="text-white font-bold text-2xl mt-1.5">{s.value}</p>
              </div>
            ))}
          </div>

          {months.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/partners/sales"
                aria-current={!active ? "page" : undefined}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  !active ? "border-gold text-gold bg-gold/10" : "border-white/15 text-soft hover:text-white"
                }`}
              >
                All time
              </Link>
              {months.map((m) => (
                <Link
                  key={m}
                  href={`/partners/sales?month=${m}`}
                  aria-current={active === m ? "page" : undefined}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    active === m ? "border-gold text-gold bg-gold/10" : "border-white/15 text-soft hover:text-white"
                  }`}
                >
                  {monthLabel(m)}
                </Link>
              ))}
            </div>
          )}

          <div className="rounded-xl bg-card border border-white/10 overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[640px]">
              <thead className="bg-white/5 text-soft text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-3 font-bold">Enrolled</th>
                  <th className="px-4 py-3 font-bold">Learner</th>
                  <th className="px-4 py-3 font-bold">Plan</th>
                  <th className="px-4 py-3 font-bold">Paid so far</th>
                  <th className="px-4 py-3 font-bold">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {sales.map((s) => {
                  const state = commissionState(s);
                  return (
                    <tr key={s.id} className={s.status !== "confirmed" ? "opacity-60" : undefined}>
                      <td className="px-4 py-3 text-soft whitespace-nowrap">
                        {new Date(s.enrolled_at).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white font-semibold">{s.learner_name || "—"}</span>
                        {s.status !== "confirmed" && (
                          <span className="ml-2 text-red-300 text-xs capitalize">{s.status}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-soft whitespace-nowrap">
                        {s.plan_type === "PIF" ? "Paid in full" : "Instalments"}
                      </td>
                      <td className="px-4 py-3"><Progress sale={s} /></td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-white font-semibold">{formatPence(s.commission_pence)}</span>
                        <span
                          className={`ml-2 inline-block px-2 py-0.5 rounded-full border text-[10px] font-semibold ${STATE_STYLES[state.key]}`}
                        >
                          {state.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-soft text-xs leading-relaxed">
            {partner.commission_terms === "instalment_2"
              ? "Commission on an instalment plan is released once the learner's second instalment clears, then paid 30 days later. Pay-in-full enrolments are paid 30 days after enrolment."
              : "Commission is paid 30 days after enrolment, per your partnership agreement."}{" "}
            Anything that looks wrong?{" "}
            <a href="mailto:info@ptlaunchlab.co.uk" className="text-gold hover:underline">
              Tell us
            </a>{" "}
            and we&rsquo;ll check it.
          </p>
        </>
      )}
    </div>
  );
}
