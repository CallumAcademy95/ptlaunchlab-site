"use client";

import WasPrice from "@/app/components/WasPrice";
import { trackEvent } from "@/app/lib/gtag";
import {
  COURSE_PRICE_LABEL,
  MONTHLY_PRICE_LABEL,
  MONTHLY_PAYMENTS,
  MONTHLY_PLAN_TOTAL_PENCE,
  formatPence,
  type CoursePlanChoice,
} from "@/app/lib/pricing";

// FunnelPricingBlock
// ----------------------------------------------------------------------------
// Drop-in pricing card for the avatar landing pages, the quiz result screen,
// and prospectus thank-you page.
//
// From the October 2026 change-over it shows the same two options everyone
// gets — £999.99 in full, or 10 × £99.99 a month — with no promo, no
// countdown and no "window". Both CTAs go to /enrol, where the buyer chooses
// and pays. (It used to poll a 48-hour discount cookie and route through
// /api/funnel-promo/checkout; both are retired.)
//
// The value stack renders above the options by default. Set
// showValueStack={false} on call sites that already render their own stack.
// Props are unchanged so existing call sites keep compiling.

type StackRow = { label: string; sub?: string; rrp: string };

// Value stack — assigned RRPs are defensible against the UK market:
//  - Level 2 standalone at Active IQ / Focus Awards providers: £400–600
//  - Level 3 standalone at OriGym / HFE: £800–1,200
//  - Tutor support 6–12 weeks: £300–600 (mentorship hourly rates £30–60)
//  - Mentorship Hub: actually sold standalone at £500
//  - Warm gym intros: unique — not sold elsewhere, marked "priceless"
//  - Free resubmissions: most providers charge £50–100 per resubmission
const VALUE_STACK: StackRow[] = [
  { label: "NCFE Level 2 Gym Instructor",        sub: "Ofqual regulated · the legal prerequisite", rrp: "£499" },
  { label: "NCFE Level 3 Personal Trainer",      sub: "Ofqual ref 603/4388/6 · gym-manager default", rrp: "£1,099" },
  { label: "Personal tutor — introduced in 24h", sub: "Reviews every unit you submit, passes it or sends it back", rrp: "£499" },
  { label: "PT Launch Lab Mentorship Hub",       sub: "Walks you from qualified to first paying client", rrp: "£500" },
  { label: "Warm introduction to a gym",    sub: "A partner gym, or a local gym we approach for you", rrp: "Priceless" },
  { label: "Free resubmissions — no cap",        sub: "Resubmit until your tutor says it's a pass",   rrp: "£199" },
];

export default function FunnelPricingBlock({
  variant = "dark",
  showValueStack = true,
}: {
  variant?: "dark" | "light";
  showValueStack?: boolean;
}) {
  const accent = variant === "light" ? "#F5C518" : "#FFD24A";
  const cardBg = variant === "light" ? "bg-[#0D3559]" : "bg-card";
  const cardBorder = variant === "light" ? "border-[#F5C518]/40" : "border-gold/30";

  const handleCheckout = (plan: CoursePlanChoice) => {
    trackEvent("promo_checkout_clicked", { plan, has_promo: false });
    // InitiateCheckout fires on /enrol at the actual pay step, with the real
    // amount — firing it here as well would double-count.
    window.location.href = "/enrol";
  };

  return (
    <div className={`${cardBg} rounded-2xl p-6 sm:p-8 border ${cardBorder} mb-8`}>

      {/* ─── VALUE STACK (Hormozi-style perceived-value lift) ─── */}
      {showValueStack && (
        <>
          <p
            className="text-[11px] font-bold tracking-widest uppercase mb-2"
            style={{ color: accent }}
          >
            Everything that&apos;s included
          </p>
          <h3 className="font-display font-extrabold text-white text-2xl sm:text-3xl leading-tight tracking-tight mb-5">
            The full bundle —{" "}
            <span style={{ color: accent }}>not a stripped-back cert.</span>
          </h3>

          <ul className="space-y-2.5 mb-5">
            {VALUE_STACK.map((row) => (
              <li
                key={row.label}
                className="flex items-start gap-3 py-2.5 border-b border-white/[0.06] last:border-b-0"
              >
                <svg viewBox="0 0 14 14" fill="none" className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accent }}>
                  <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold leading-snug">{row.label}</p>
                  {row.sub && <p className="text-soft/55 text-xs leading-snug mt-0.5">{row.sub}</p>}
                </div>
                <span
                  className="text-xs font-bold tabular-nums shrink-0 ml-2"
                  style={{ color: row.rrp === "Priceless" ? accent : "rgba(255,255,255,0.5)" }}
                >
                  {row.rrp}
                </span>
              </li>
            ))}
          </ul>

          <div className="rounded-xl bg-deep/40 border border-white/[0.06] p-4 mb-6">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-white font-semibold text-base">You pay</span>
              <span
                className="font-display font-extrabold text-3xl tabular-nums"
                style={{ color: accent }}
              >
                {COURSE_PRICE_LABEL} <WasPrice className="ml-1 align-middle text-white" />
              </span>
            </div>
            <p className="text-faint text-[11px] mt-2">
              Or {MONTHLY_PAYMENTS} monthly payments of {MONTHLY_PRICE_LABEL}. Same price for everyone.
            </p>
          </div>
        </>
      )}

      {/* ─── THE TWO WAYS TO PAY ─── */}
      {!showValueStack && (
        <>
          <h3 className="font-display font-extrabold text-white text-xl leading-tight tracking-tight mb-2">
            Enrol on the course
          </h3>
          <p className="text-soft/60 text-sm mb-5 leading-relaxed">
            {COURSE_PRICE_LABEL} in full, or {MONTHLY_PAYMENTS} monthly payments of {MONTHLY_PRICE_LABEL}.
          </p>
        </>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/[0.08] bg-deep/40 p-5">
          <p className="text-xs font-semibold tracking-widest uppercase text-soft/50 mb-1">
            Pay in full
          </p>
          <span
            className="font-display font-extrabold text-3xl block mb-1"
            style={{ color: accent }}
          >
            {COURSE_PRICE_LABEL} <WasPrice note className="ml-1 align-middle text-white" />
          </span>
          <p className="text-faint text-xs mb-4">One payment · nothing further to pay</p>
          <button
            onClick={() => handleCheckout("pif")}
            className="w-full py-3 rounded-full font-bold text-sm hover:brightness-110 transition-all"
            style={{ background: accent, color: "#072B4A" }}
          >
            Pay {COURSE_PRICE_LABEL} →
          </button>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-deep/40 p-5">
          <p className="text-xs font-semibold tracking-widest uppercase text-soft/50 mb-1">
            Pay monthly
          </p>
          <div className="flex items-baseline gap-2 mb-1">
            <span
              className="font-display font-extrabold text-3xl"
              style={{ color: accent }}
            >
              {MONTHLY_PRICE_LABEL}
            </span>
            <span className="text-white/80 text-sm">/month × {MONTHLY_PAYMENTS}</span>
          </div>
          <p className="text-faint text-xs mb-4">
            First payment today · {formatPence(MONTHLY_PLAN_TOTAL_PENCE)} in total
          </p>
          <button
            onClick={() => handleCheckout("monthly")}
            className="w-full py-3 rounded-full font-bold text-sm border-2 hover:bg-white/5 transition-all"
            style={{ borderColor: accent, color: accent }}
          >
            Pay {MONTHLY_PRICE_LABEL} today →
          </button>
        </div>
      </div>

      {/* ─── RISK REVERSAL (Hormozi: reduce perceived risk to zero) ─── */}
      <div className="mt-6 pt-6 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { title: "Tutor in 24 hours", body: "Personally introduced — or your payment back, no questions." },
          { title: "7-day cancellation", body: "Change your mind in the first week, full refund. Simple." },
          { title: "Free resubmissions", body: "Resubmit any assessment, no extra fees, no time pressure." },
          { title: "Pass support guarantee", body: "Tutor reviews every submission first — most learners never fail." },
        ].map((g) => (
          <div key={g.title} className="flex items-start gap-2.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accent }}>
              <path d="M12 2L4 7v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V7l-8-5z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <div>
              <p className="text-white text-xs font-bold mb-0.5">{g.title}</p>
              <p className="text-soft/55 text-[11px] leading-snug">{g.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
