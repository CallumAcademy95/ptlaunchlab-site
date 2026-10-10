import Link from "next/link";
import { requirePartner, partnerAcademyUrl } from "@/app/lib/partner-auth";
import {
  getPartnerSummary,
  getQuarterLearnerCount,
  formatPence,
  commissionReleaseRule,
} from "@/app/lib/partner-data";
import {
  ATP_LADDER,
  isAtp,
  LADDER_MONTHLY_COMMISSION_PENCE,
  LADDER_PIF_COMMISSION_PENCE,
  LADDER_TERMS,
  quarterOf,
  VOLUME_BONUS_MONTHLY_PENCE,
  VOLUME_BONUS_PIF_PENCE,
  VOLUME_THRESHOLD,
  volumeProgressMessage,
} from "@/app/lib/partnerCommission";
import { getMaskedBankDetails } from "@/app/lib/partner-bank";
import CopyButton from "./CopyButton";
import Welcome from "./Welcome";

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
  const session = await requirePartner();
  const { partner } = session;
  const [summary, bank, quarterLearners] = await Promise.all([
    getPartnerSummary(partner.id),
    getMaskedBankDetails(partner.id),
    getQuarterLearnerCount(partner.id),
  ]);
  // v4.1: the nine gyms on 'ladder' terms see their quarter's progress towards
  // the volume rate; ATP sees its own rungs (it is not on the volume rate).
  const atp = isAtp(partner.slug);
  const onLadder = partner.commission_terms === LADDER_TERMS && !atp;
  const quarter = quarterOf(new Date());
  const quarterEnds = new Date(quarter.end.getTime() - 1).toLocaleDateString("en-GB", {
    day: "numeric", month: "long",
  });

  // (The "launch offer" banner that used to sit here is retired: there are no
  // promo codes, discounts or dated offers any more — October 2026.)
  const academyUrl = partnerAcademyUrl(partner);

  // Commission we still owe: payable now plus still accruing. Excludes anything
  // already paid, which is the whole point — a partner who has had their money
  // should never be told we're sitting on it.
  const unsentPence = summary.commissionDuePence + summary.commissionHeldPence;

  // The two commission deals behave differently and the difference is money, so
  // say which one they are on rather than showing a bare held balance.
  const holdExplainer = commissionReleaseRule(partner.commission_terms);

  const firstName = session.fullName?.trim().split(/\s+/)[0] ?? null;

  return (
    <div className="space-y-8">
      {!session.onboardingDismissedAt && (
        <Welcome firstName={firstName} gymName={partner.gym_name} />
      )}
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

      {/* ── Commission rates (v4.1 ladder) ─────────────────────────────── */}
      {onLadder && (
        <section>
          <h2 className="text-white font-bold text-xl mb-1">This quarter</h2>
          <p className="text-soft text-sm mb-4">Runs to {quarterEnds}.</p>
          <div className="rounded-xl bg-card border border-white/10 p-5 space-y-4">
            <p className="text-white font-semibold">{volumeProgressMessage(quarterLearners)}</p>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden" aria-hidden>
              <div
                className="h-full bg-gold"
                style={{ width: `${Math.min(100, Math.round((quarterLearners / VOLUME_THRESHOLD) * 100))}%` }}
              />
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-soft text-[10px] uppercase tracking-widest text-left">
                  <th className="py-2 font-bold">Learner pays</th>
                  <th className="py-2 font-bold">You earn</th>
                  <th className="py-2 font-bold">Volume rate ({VOLUME_THRESHOLD}+ a quarter)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr>
                  <td className="py-2 text-white">In full</td>
                  <td className="py-2 text-white">{formatPence(LADDER_PIF_COMMISSION_PENCE)}</td>
                  <td className="py-2 text-gold font-semibold">
                    {formatPence(LADDER_PIF_COMMISSION_PENCE + VOLUME_BONUS_PIF_PENCE)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-white">Monthly</td>
                  <td className="py-2 text-white">{formatPence(LADDER_MONTHLY_COMMISSION_PENCE)}</td>
                  <td className="py-2 text-gold font-semibold">
                    {formatPence(LADDER_MONTHLY_COMMISSION_PENCE + VOLUME_BONUS_MONTHLY_PENCE)}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="text-soft text-xs leading-relaxed">
              Reach {VOLUME_THRESHOLD} learners in a calendar quarter and every learner that quarter moves to
              the volume rate, including the ones already enrolled. The top-up is paid with the payout run
              after the quarter ends. If you give your members a saving on paying in full, it comes off the
              in-full figure.
            </p>
          </div>
        </section>
      )}

      {atp && (
        <section>
          <h2 className="text-white font-bold text-xl mb-4">Your rates</h2>
          <div className="rounded-xl bg-card border border-white/10 p-5">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-white/10">
                {[
                  ["6-month plan, £1,599", ATP_LADDER.commission.six_month],
                  ["In full, £1,599", ATP_LADDER.commission.pif_1599],
                  ["In full with code ATPPT, £1,399", ATP_LADDER.commission.pif_1399],
                  [`In full with code ATP500, £1,099 (next ${ATP_LADDER.pif1099FullRateCount}, then ${formatPence(ATP_LADDER.pif1099AfterPence)})`, ATP_LADDER.commission.pif_1099],
                  ["In full, £999.99", ATP_LADDER.commission.pif],
                  ["Monthly, 10 × £99.99", ATP_LADDER.commission.monthly],
                ].map(([label, pence]) => (
                  <tr key={String(label)}>
                    <td className="py-2 text-white">{label}</td>
                    <td className="py-2 text-gold font-semibold text-right">{formatPence(Number(pence))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-soft text-xs mt-3">
              {quarterLearners} learner{quarterLearners === 1 ? "" : "s"} this quarter.
            </p>
          </div>
        </section>
      )}

      {/* ── Next action ────────────────────────────────────────────────── */}
      {/* One card, not a list. Missing bank details outrank everything else —
          without them a partner has earned money we have no way to send. */}
      <section>
        {!bank.isSet ? (
          <div className="rounded-xl border border-gold/40 bg-gold/5 p-5">
            <p className="text-gold text-[10px] font-bold tracking-widest uppercase mb-2">
              Do this next
            </p>
            <p className="text-white font-semibold">Add your bank details.</p>
            <p className="text-soft text-sm mt-1.5 leading-relaxed">
              {/* Only ever name money we actually still owe. Accrued includes
                  commission already paid, so using it told a partner we were
                  holding £1,500 we'd sent them months ago. */}
              {unsentPence > 0
                ? `You've earned ${formatPence(unsentPence)} that we don't have an account to send to yet.`
                : "Two minutes now means your first commission goes out without a chase."}
            </p>
            <Link
              href="/partners/payments"
              className="inline-block mt-3 px-5 py-2 rounded-full bg-gold text-deep text-sm font-bold hover:brightness-110 transition-all"
            >
              Add bank details
            </Link>
          </div>
        ) : (
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
        )}
      </section>
    </div>
  );
}
