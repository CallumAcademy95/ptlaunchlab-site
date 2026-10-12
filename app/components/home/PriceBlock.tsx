"use client";
import WasPrice from "@/app/components/WasPrice";
import CallLink from "@/app/components/cta/CallLink";
import { trackEvent } from "@/app/lib/gtag";
import { ENROL_HREF, LEGACY_EVENTS, ctaClickEvents, type GaEvent } from "@/app/lib/homeCta";
import { COURSE_PRICE_LABEL, MONTHLY_PRICE_LABEL, MONTHLY_PAYMENTS, TYPICAL_COST_LABEL } from "@/app/lib/pricing";

const HOME_SOURCE = "home-pricing";

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

// cta_click plus the event ConversionSection used to send for the same button.
const trackCta = (source: string, action: "enrol" | "call", legacy: GaEvent) =>
  ctaClickEvents(source, action, legacy).forEach(([name, params]) => trackEvent(name, params));

/**
 * @param source  cta_click source. Defaults to the home page's "home-pricing".
 * @param legacy  Which page's legacy GA events to send alongside cta_click: "home" (default) or "conversion"
 *   (the shared ConversionSection). Today both resolve to the same LEGACY_EVENTS, because Phase 2 mapped
 *   PriceBlock's events 1:1 onto ConversionSection's old ones (enrol_click method full/deposit,
 *   book_call_click location conversion_section). The prop keeps the call sites explicit and is the one
 *   place to diverge them later.
 * @param bg  Section background: "surface" (home) or "base" (the shared ConversionSection band).
 * @param reserveWasPrice  Build-time hint: keep room for the was-price so it doesn't shift the card on mount.
 */
export default function PriceBlock({
  source = HOME_SOURCE,
  legacy = "home",
  reserveWasPrice = false,
  bg = "surface",
}: {
  source?: string;
  legacy?: "home" | "conversion";
  reserveWasPrice?: boolean;
  bg?: "surface" | "base";
}) {
  // Both modes send the same legacy events today (see @param legacy), so there is nothing to switch on yet.
  void legacy;
  const track = (action: "enrol" | "call", ev: GaEvent) => trackCta(source, action, ev);

  return (
    <section id="pricing" className={`${bg === "base" ? "bg-base" : "bg-surface"} py-14 md:py-24 relative overflow-hidden`}>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
        <div className="w-[760px] h-[460px] rounded-full bg-gold/[0.04] blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <p className="text-gold text-[11px] font-semibold tracking-widest uppercase text-center mb-4">Pricing</p>
        <h2 className="font-display font-extrabold text-5xl md:text-7xl text-white text-center leading-none tracking-tight mb-4">
          Your investment
        </h2>
        <p className="text-soft/70 text-lg text-center max-w-xl mx-auto mb-10 md:mb-14">
          Most PT qualifications cost <span className="whitespace-nowrap">{TYPICAL_COST_LABEL}</span>. Ours is <span className="text-white font-semibold">{COURSE_PRICE_LABEL}</span>, everything included.
        </p>

        {/* Pay in full: the one offer. Monthly is a quieter link to the same checkout page. */}
        <div className="max-w-xl mx-auto">
          <div className="relative bg-card rounded-2xl p-7 md:p-9 border-2 border-gold/60 shadow-2xl shadow-black/30 text-center">
            <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden="true" />
            <h3 className="font-display font-extrabold text-3xl text-white tracking-tight mb-3">Pay in full</h3>
            <div className="flex flex-wrap items-end justify-center gap-x-3 mb-2">
              <p className="font-display font-extrabold text-6xl text-gold leading-none">{COURSE_PRICE_LABEL}</p>
              <WasPrice reserve={reserveWasPrice} className="text-soft text-lg mb-0.5" />
            </div>
            <p className="text-white font-semibold">Everything included</p>
            <p className="text-soft/80 text-sm mt-1 mb-7">Flexible ways to pay at checkout</p>
            <a
              href={ENROL_HREF}
              onClick={() => track("enrol", LEGACY_EVENTS.pricingFull)}
              className="block w-full py-4 rounded-full bg-gold text-deep font-bold text-base text-center hover:brightness-110 transition-all shadow-xl shadow-gold/20"
            >
              Enrol now
            </a>
          </div>
          <p className="mt-4 text-center text-soft/80 text-sm">
            <a
              href={ENROL_HREF}
              onClick={() => track("enrol", LEGACY_EVENTS.pricingMonthly)}
              className="hover:text-white underline underline-offset-4 decoration-white/30 hover:decoration-white"
            >
              Prefer {MONTHLY_PAYMENTS} monthly payments of {MONTHLY_PRICE_LABEL}? See payment options →
            </a>
          </p>
        </div>

        {/* Value stack */}
        <div className="mt-10 bg-card/60 border border-white/[0.07] rounded-2xl p-6 md:p-8">
          <p className="text-white font-semibold mb-5">Everything included:</p>
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
          <CallLink
            source={source}
            onClick={() => track("call", LEGACY_EVENTS.pricingCall)}
            className="inline-flex items-center gap-2 text-gold font-semibold hover:underline underline-offset-4"
          >
            Not sure? Book a free call →
          </CallLink>
        </div>
      </div>
    </section>
  );
}
