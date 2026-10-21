"use client";

import WasPrice from "@/app/components/WasPrice";
import { trackEvent } from "@/app/lib/gtag";
import { ENROL_HREF, ctaClickEvents } from "@/app/lib/homeCta";
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
// Pay in full leads (Phase 3b, 12 Oct 2026): one featured card, pay in full,
// everything included, then a quieter link for the monthly plan. Same price
// for everyone, no promo, no countdown. Both go to /enrol, where the buyer
// chooses and pays. (It used to poll a 48-hour discount cookie and route
// through /api/funnel-promo/checkout; both are retired.)
//
// Tracking: each click sends cta_click {source, action: "enrol"} plus the
// event this block always sent, promo_checkout_clicked {plan: "pif" |
// "monthly", has_promo: false}, so existing GA reports keep counting.
//
// The value stack renders above the card by default. Set
// showValueStack={false} on call sites that already render their own stack.
// Existing props are unchanged; `source` is optional.

type StackRow = { label: string; sub?: string; rrp: string };

// Value stack — assigned RRPs are defensible against the UK market:
//  - Level 2 standalone at Active IQ / Focus Awards providers: £400–600
//  - Level 3 standalone at OriGym / HFE: £800–1,200
//  - Tutor support 6–12 weeks: £300–600 (mentorship hourly rates £30–60)
//  - Mentorship Hub: never sold standalone, so it carries no price (CAP Code:
//    a value claim needs a genuine price it was sold at). Shown as "Included".
//  - Warm gym intros: unique — not sold elsewhere, marked "priceless"
//  - Free resubmissions: most providers charge £50–100 per resubmission
const VALUE_STACK: StackRow[] = [
  { label: "NCFE Level 2 Gym Instructor",        sub: "Ofqual regulated · the legal prerequisite", rrp: "£499" },
  { label: "NCFE Level 3 Personal Trainer",      sub: "Ofqual ref 603/4388/6 · gym-manager default", rrp: "£1,099" },
  { label: "Personal tutor — introduced in 24h", sub: "Reviews every unit you submit, passes it or sends it back", rrp: "£499" },
  { label: "PT Launch Lab Mentorship Hub",       sub: "Walks you from qualified to first paying client", rrp: "Included" },
  { label: "Warm introduction to a gym",    sub: "A partner gym, or a local gym we approach for you", rrp: "Priceless" },
  { label: "Free resubmissions — no cap",        sub: "Resubmit until your tutor says it's a pass",   rrp: "£199" },
];

export default function FunnelPricingBlock({
  variant = "dark",
  showValueStack = true,
  source = "funnel-pricing-block",
}: {
  variant?: "dark" | "light";
  showValueStack?: boolean;
  /** cta_click source. */
  source?: string;
}) {
  const accent = variant === "light" ? "#F5C518" : "#FFD24A";
  const cardBg = variant === "light" ? "bg-[#0D3559]" : "bg-card";
  const cardBorder = variant === "light" ? "border-[#F5C518]/40" : "border-gold/30";

  // Both are plain links to /enrol (they work without JS); the click only tracks.
  // InitiateCheckout fires on /enrol at the actual pay step, with the real
  // amount — firing it here as well would double-count.
  const track = (plan: CoursePlanChoice) => {
    ctaClickEvents(source, "enrol").forEach(([name, params]) => trackEvent(name, params));
    trackEvent("promo_checkout_clicked", { plan, has_promo: false });
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
                  style={{ color: row.rrp === "Priceless" || row.rrp === "Included" ? accent : "rgba(255,255,255,0.5)" }}
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
              Everything included. Same price for everyone.
            </p>
          </div>
        </>
      )}

      {/* ─── PAY IN FULL: the one featured offer. Monthly is a quieter link to the same /enrol page. ─── */}
      {!showValueStack && (
        <h3 className="font-display font-extrabold text-white text-xl leading-tight tracking-tight mb-4">
          Enrol on the course
        </h3>
      )}
      <div
        data-featured
        className="relative rounded-xl border-2 bg-deep/40 p-6 sm:p-7 text-center"
        style={{ borderColor: accent }}
      >
        <p className="text-xs font-semibold tracking-widest uppercase text-white/80 mb-2">
          Pay in full
        </p>
        <div className="flex flex-wrap items-end justify-center gap-x-3 mb-1">
          <span
            className="font-display font-extrabold text-5xl leading-none"
            style={{ color: accent }}
          >
            {COURSE_PRICE_LABEL}
          </span>
          <WasPrice note className="text-white text-base mb-0.5" />
        </div>
        <p className="text-white font-semibold mt-2">Everything included</p>
        <p className="text-soft/80 text-sm mt-1 mb-5">Flexible ways to pay at checkout</p>
        <a
          href={ENROL_HREF}
          onClick={() => track("pif")}
          className="block w-full py-3.5 rounded-full font-bold text-base text-center hover:brightness-110 transition-all"
          style={{ background: accent, color: "#072B4A" }}
        >
          Enrol now
        </a>
      </div>
      <p className="mt-4 text-center text-soft/80 text-sm">
        <a
          href={ENROL_HREF}
          onClick={() => track("monthly")}
          className="hover:text-white underline underline-offset-4 decoration-white/30 hover:decoration-white"
        >
          Prefer {MONTHLY_PAYMENTS} monthly payments of {MONTHLY_PRICE_LABEL}? See payment options →
        </a>
      </p>
      <p className="mt-1 text-center text-faint text-xs">
        First payment today · {formatPence(MONTHLY_PLAN_TOTAL_PENCE)} in total
      </p>

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
