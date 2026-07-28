import Link from "next/link";
import { requirePartner } from "@/app/lib/partner-auth";
import { getPartnerSales, commissionState, formatPence } from "@/app/lib/partner-data";

export default async function PaymentsPage() {
  const { partner } = await requirePartner();
  const sales = await getPartnerSales(partner.id);

  const payable = sales.filter((s) => commissionState(s).key === "payable");
  const held = sales.filter((s) => commissionState(s).key === "held");
  const paid = sales.filter((s) => commissionState(s).key === "paid");

  const sum = (rows: typeof sales) => rows.reduce((t, s) => t + s.commission_pence, 0);
  const outstanding = sum(payable);

  // Soonest release first — this is the "when do I get the rest" question.
  const upcoming = [...held].sort(
    (a, b) =>
      (a.commission_release_at ? Date.parse(a.commission_release_at) : Infinity) -
      (b.commission_release_at ? Date.parse(b.commission_release_at) : Infinity)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white font-bold text-xl mb-1">Payments</h2>
        <p className="text-soft text-sm">
          What you&rsquo;re owed now, and when the rest becomes payable.
        </p>
      </div>

      {sales.length === 0 ? (
        <div className="rounded-xl bg-card border border-white/10 p-6 text-soft text-sm">
          Nothing to pay yet — commission appears here as soon as your first member enrols.{" "}
          <Link href="/partners" className="text-gold hover:underline">
            Get your academy link
          </Link>
          .
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-gold/40 bg-gold/5 p-6">
            <p className="text-gold text-[10px] font-bold tracking-widest uppercase mb-1">
              Outstanding — due to you now
            </p>
            <p className="text-white font-bold text-4xl">{formatPence(outstanding)}</p>
            <p className="text-soft text-sm mt-2 leading-relaxed">
              {outstanding > 0
                ? `Across ${payable.length} enrolment${payable.length === 1 ? "" : "s"}. Paid by bank transfer to the account on your partnership agreement. If your bank details have changed, email us before the next run.`
                : "Nothing is payable at this moment. Anything still accruing is listed below."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-card border border-white/10 p-5">
              <p className="text-soft text-[10px] font-bold tracking-widest uppercase">Still accruing</p>
              <p className="text-white font-bold text-2xl mt-1.5">{formatPence(sum(held))}</p>
              <p className="text-soft text-xs mt-1">
                {held.length} enrolment{held.length === 1 ? "" : "s"} not yet released
              </p>
            </div>
            <div className="rounded-xl bg-card border border-white/10 p-5">
              <p className="text-soft text-[10px] font-bold tracking-widest uppercase">Already paid</p>
              <p className="text-white font-bold text-2xl mt-1.5">{formatPence(sum(paid))}</p>
              <p className="text-soft text-xs mt-1">
                {paid.length} enrolment{paid.length === 1 ? "" : "s"} settled
              </p>
            </div>
          </div>

          {upcoming.length > 0 && (
            <div>
              <h3 className="text-white font-bold text-base mb-3">Coming up</h3>
              <div className="rounded-xl bg-card border border-white/10 divide-y divide-white/10">
                {upcoming.map((s) => (
                  <div key={s.id} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">{s.learner_name || "—"}</p>
                      <p className="text-soft text-xs">{commissionState(s).label}</p>
                    </div>
                    <span className="text-white font-semibold shrink-0">
                      {formatPence(s.commission_pence)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-soft text-xs leading-relaxed">
            Invoices aren&rsquo;t generated here yet — payments are made by bank transfer and confirmed
            by email, exactly as they are today. Questions about a specific amount?{" "}
            <a href="mailto:info@ptlaunchlab.co.uk" className="text-gold hover:underline">
              info@ptlaunchlab.co.uk
            </a>
          </p>
        </>
      )}
    </div>
  );
}
