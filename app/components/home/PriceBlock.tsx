"use client";
import WasPrice from "@/app/components/WasPrice";
import { useCallModal } from "@/app/components/cta/CallModal";
import { trackEvent } from "@/app/lib/gtag";
import { ENROL_HREF } from "@/app/lib/homeCta";
import { COURSE_PRICE_LABEL, MONTHLY_PRICE_LABEL, MONTHLY_PAYMENTS, MONTHLY_PLAN_TOTAL_PENCE, formatPence } from "@/app/lib/pricing";

const SOURCE = "home-pricing";

// Titles follow WhatYouGet.tsx so the two sections name things the same way,
// except "Business Training", which WhatYouGet has no card for; it comes from
// the about page (app/about/page.tsx: "business training isn't an add-on").
const VALUE_STACK = [
  { title: "NCFE Level 3 PT Qualification", detail: "Ofqual-regulated, CIMSPA-recognised" },
  { title: "Your Own Personal Tutor", detail: "Assigned within 24 hours of enrolling" },
  { title: "£500 Business Mentorship, Included", detail: "In the fee, not sold as an upgrade" },
  { title: "Business Training", detail: "Finding and keeping paying clients" },
  { title: "Guaranteed Gym Introduction", detail: "A warm introduction when you qualify" },
];

const Check = () => (
  <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center" aria-hidden="true">
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-gold">
      <path d="M2 6l3 3 5-5" />
    </svg>
  </span>
);

export default function PriceBlock() {
  const modal = useCallModal();
  const enrolClick = () => trackEvent("cta_click", { source: SOURCE, action: "enrol" });

  return (
    <section id="pricing" className="bg-surface py-14 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
        <div className="w-[760px] h-[460px] rounded-full bg-gold/[0.04] blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <p className="text-gold text-[11px] font-semibold tracking-widest uppercase text-center mb-4">Pricing</p>
        <h2 className="font-display font-extrabold text-5xl md:text-7xl text-white text-center leading-none tracking-tight mb-4">
          Your investment
        </h2>
        <p className="text-soft/70 text-lg text-center max-w-xl mx-auto mb-10 md:mb-14">
          Most PT qualifications cost <span className="whitespace-nowrap">£1,200–£2,800</span>. Ours is <span className="text-white font-semibold">{COURSE_PRICE_LABEL}</span>, everything included.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Pay in full */}
          <div className="relative bg-card rounded-2xl p-7 md:p-8 border-2 border-gold/60 shadow-2xl shadow-black/30 flex flex-col">
            <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden="true" />
            <p className="text-gold font-semibold uppercase text-[11px] tracking-widest mb-2">One payment</p>
            <h3 className="font-display font-extrabold text-3xl text-white tracking-tight mb-3">Pay in full</h3>
            <div className="flex flex-wrap items-end gap-x-3 mb-1">
              <p className="font-display font-extrabold text-5xl text-gold leading-none">{COURSE_PRICE_LABEL}</p>
              <WasPrice className="text-soft text-lg mb-0.5" />
            </div>
            <p className="text-soft/80 text-sm mb-7 flex-1">One payment, nothing further to pay</p>
            <a
              href={ENROL_HREF}
              onClick={enrolClick}
              className="block w-full py-4 rounded-full bg-gold text-deep font-bold text-base text-center hover:brightness-110 transition-all shadow-xl shadow-gold/20"
            >
              Enrol now
            </a>
          </div>

          {/* Pay monthly */}
          <div className="bg-card rounded-2xl p-7 md:p-8 border border-white/[0.09] shadow-2xl shadow-black/20 flex flex-col">
            <p className="text-faint font-semibold uppercase text-[11px] tracking-widest mb-2">Spread the cost</p>
            <h3 className="font-display font-extrabold text-3xl text-white tracking-tight mb-3">Pay monthly</h3>
            <p className="font-display font-extrabold text-5xl text-white leading-none mb-1">
              {MONTHLY_PRICE_LABEL}
              <span className="font-sans text-lg text-soft/70 font-semibold">/month</span>
            </p>
            <p className="text-soft/80 text-sm mb-7 flex-1">
              {`${MONTHLY_PAYMENTS} payments, the first today, ${formatPence(MONTHLY_PLAN_TOTAL_PENCE)} total`}
            </p>
            <a
              href={ENROL_HREF}
              onClick={enrolClick}
              className="block w-full py-4 rounded-full border-2 border-gold/50 text-gold font-bold text-base text-center hover:bg-gold hover:text-deep transition-all"
            >
              Pay monthly
            </a>
          </div>
        </div>

        {/* Value stack: the same in both options */}
        <div className="mt-5 bg-card/60 border border-white/[0.07] rounded-2xl p-6 md:p-8">
          <p className="text-white font-semibold mb-5">Both options include:</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {VALUE_STACK.map((v) => (
              <li key={v.title} className="flex items-start gap-3">
                <Check />
                <span className="leading-snug">
                  <span className="block text-white text-[15px] font-semibold">{v.title}</span>
                  <span className="block text-soft/80 text-sm">{v.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              trackEvent("cta_click", { source: SOURCE, action: "call" });
              modal.open(SOURCE);
            }}
            className="inline-flex items-center gap-2 text-gold font-semibold hover:underline underline-offset-4"
          >
            Not sure? Book a free call →
          </button>
        </div>
      </div>
    </section>
  );
}
