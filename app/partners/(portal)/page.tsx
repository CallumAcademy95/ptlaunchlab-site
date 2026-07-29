import Link from "next/link";
import { requirePartner, partnerAcademyUrl } from "@/app/lib/partner-auth";
import { getPartnerSummary, formatPence } from "@/app/lib/partner-data";
import { getMaskedBankDetails } from "@/app/lib/partner-bank";
import { getPackResources } from "@/app/lib/partner-resources";
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
  const [summary, bank, packs] = await Promise.all([
    getPartnerSummary(partner.id),
    getMaskedBankDetails(partner.id),
    getPackResources(partner.id),
  ]);

  // A launch offer only exists for gyms we've actually given one to, and it's
  // the most time-limited thing on their plate — so it outranks everything
  // except missing bank details, and disappears once it's been used.
  const launchFiles = packs.get("campaign-launch-promo") ?? [];
  const academyUrl = partnerAcademyUrl(partner);

  // Commission we still owe: payable now plus still accruing. Excludes anything
  // already paid, which is the whole point — a partner who has had their money
  // should never be told we're sitting on it.
  const unsentPence = summary.commissionDuePence + summary.commissionHeldPence;

  // The two commission deals behave differently and the difference is money, so
  // say which one they are on rather than showing a bare held balance.
  const holdExplainer =
    partner.commission_terms === "instalment_2"
      ? "Held until the learner's second instalment clears, then released 30 days later."
      : "Released 30 days after enrolment, per your agreement.";

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

      {/* ── Launch offer ───────────────────────────────────────────────── */}
      {launchFiles.length > 0 && summary.enrolmentsAllTime === 0 && (
        <section className="rounded-xl border border-gold/50 bg-gold/10 p-6">
          <p className="text-gold text-[10px] font-bold tracking-widest uppercase mb-2">
            You have a launch offer
          </p>
          <h2 className="text-white font-bold text-xl mb-2">
            £500 off for two weeks, then £300 off.
          </h2>
          <p className="text-soft text-sm leading-relaxed max-w-2xl">
            It exists to get your first enrolment while the academy is still new enough that people
            are asking about it. The drop from £500 to £300 is the bit that works — it tells members
            the offer is genuinely going.
          </p>
          <p className="text-soft text-sm leading-relaxed max-w-2xl mt-2">
            <strong className="text-white">Pick an end date before you post anything</strong>, tell
            your team what it is, and stick to it. An offer that quietly extends teaches your members
            to ignore the next one.
          </p>

          <div className="flex items-center gap-3 flex-wrap mt-4">
            <Link
              href="/partners/playbook?section=campaign"
              className="px-5 py-2 rounded-full bg-gold text-deep text-sm font-bold hover:brightness-110 transition-all"
            >
              How to run it
            </Link>
            {launchFiles.map((f) => (
              <a
                key={f.id}
                href={`/partners/download/${f.id}`}
                className="px-4 py-2 rounded-full border border-white/25 text-white text-xs font-semibold hover:border-gold hover:text-gold transition-colors"
              >
                Download the graphic
              </a>
            ))}
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
