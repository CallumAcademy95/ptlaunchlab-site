import { requirePartner, partnerAcademyUrl } from "@/app/lib/partner-auth";
import { getPartnerSummary, formatPence } from "@/app/lib/partner-data";
import CopyButton from "./CopyButton";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-card border border-white/10 p-5">
      <p className="text-soft text-[10px] font-bold tracking-widest uppercase">{label}</p>
      <p className="text-white font-bold text-3xl mt-2">{value}</p>
      {hint && <p className="text-soft text-xs mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}

export default async function MyAcademyPage() {
  const { partner } = await requirePartner();
  const summary = await getPartnerSummary(partner.id);
  const academyUrl = partnerAcademyUrl(partner);

  // The two commission deals behave differently and the difference is money, so
  // say which one they are on rather than showing a bare held balance.
  const holdExplainer =
    partner.commission_terms === "instalment_2"
      ? "Held until the learner's second instalment clears, then released 30 days later."
      : "Released 30 days after enrolment, per your agreement.";

  return (
    <div className="space-y-8">
      {/* ── Academy link ───────────────────────────────────────────────── */}
      <section>
        <h2 className="text-white font-bold text-xl mb-1">Your academy link</h2>
        <p className="text-soft text-sm mb-4">
          Every enrolment through this link is tracked to {partner.gym_name}.
        </p>

        {academyUrl ? (
          <div className="rounded-xl bg-card border border-white/10 p-5 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href={academyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold font-semibold text-lg break-all hover:underline"
              >
                {academyUrl}
              </a>
              <CopyButton value={academyUrl} label="Copy link" />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/10 flex-wrap">
              <a
                href="/partners/qr"
                className="px-4 py-2 rounded-full border border-white/20 text-white text-sm font-semibold hover:border-gold hover:text-gold transition-colors"
              >
                Download QR code
              </a>
              <span className="text-soft text-xs">
                Print it for the front desk, the changing rooms, or the gym floor.
              </span>
            </div>

            {partner.promo_code && (
              <div className="flex items-center gap-3 pt-4 border-t border-white/10 flex-wrap">
                <div>
                  <p className="text-soft text-[10px] font-bold tracking-widest uppercase">
                    Member discount code
                  </p>
                  <p className="text-white font-bold text-lg tracking-wide">{partner.promo_code}</p>
                </div>
                <CopyButton value={partner.promo_code} label="Copy code" />
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-card border border-white/10 p-5 text-soft text-sm">
            Your academy page isn&rsquo;t live yet. We&rsquo;ll email you the link as soon as it is.
          </div>
        )}
      </section>

      {/* ── Counters ───────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-white font-bold text-xl mb-4">Your numbers</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Enrolments this month" value={String(summary.enrolmentsThisMonth)} />
          <Stat label="Enrolments all time" value={String(summary.enrolmentsAllTime)} />
          <Stat
            label="Commission earned"
            value={formatPence(summary.commissionAccruedPence)}
            hint={`${formatPence(summary.commissionPaidPence)} already paid`}
          />
          <Stat
            label="Ready to pay out"
            value={formatPence(summary.commissionDuePence)}
            hint={
              summary.commissionHeldPence > 0
                ? `${formatPence(summary.commissionHeldPence)} still accruing. ${holdExplainer}`
                : undefined
            }
          />
        </div>

        {summary.enrolmentsAllTime === 0 && (
          <p className="text-soft text-xs mt-4 leading-relaxed">
            Enrolment tracking starts from 28 July 2026. Sales made before then are being
            reconciled and will appear here once that&rsquo;s done — they are not lost.
          </p>
        )}
      </section>

      {/* ── Next action ────────────────────────────────────────────────── */}
      <section>
        <div className="rounded-xl border border-gold/40 bg-gold/5 p-5">
          <p className="text-gold text-[10px] font-bold tracking-widest uppercase mb-2">
            Do this next
          </p>
          <p className="text-white font-semibold">
            Put your QR code where your members already stand still.
          </p>
          <p className="text-soft text-sm mt-1.5 leading-relaxed">
            The front desk, the changing room mirror and the gym floor noticeboard convert best.
            Download the QR above and we&rsquo;ll add print-ready posters to Resources shortly.
          </p>
        </div>
      </section>
    </div>
  );
}
