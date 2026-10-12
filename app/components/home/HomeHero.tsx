import Image from "next/image";
import TwoWayCTA from "@/app/components/cta/TwoWayCTA";
import WasPrice from "@/app/components/WasPrice";
import { COURSE_PRICE_LABEL, MONTHLY_PRICE_LABEL, MONTHLY_PAYMENTS } from "@/app/lib/pricing";

// The five-second hero: what it is, what it costs, how to start.
// No geo lookup (keeps the home page static) and no min-h-screen: on a
// 390×844 phone the H1, the price and both buttons sit above the chat
// bubble, with the photo pushed below the buttons.
const HEADLINE = "Become a qualified Personal Trainer, around your job.";
const HEADLINE_GOLD = "around your job."; // the tail of HEADLINE, set in gold

export default function HomeHero() {
  return (
    <section
      className="relative overflow-hidden pt-[72px]"
      style={{ background: "linear-gradient(150deg, #0B2D52 0%, #091F3D 45%, #070D1B 100%)" }}
    >
      <div className="absolute left-[-10%] top-1/4 w-[640px] h-[460px] rounded-full bg-gold/[0.05] blur-[140px] pointer-events-none" />
      <div className="absolute right-[-5%] bottom-0 w-[520px] h-[420px] rounded-full bg-blue/[0.07] blur-[120px] pointer-events-none" />
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line x1="100%" y1="0" x2="55%" y2="100%" stroke="#F5C518" strokeWidth="1" />
        <line x1="85%" y1="0" x2="40%" y2="100%" stroke="#F5C518" strokeWidth="0.6" />
      </svg>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-5 pb-12 md:pt-14 md:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
          {/* Left: the five seconds */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/30 bg-white/[0.06] backdrop-blur-sm mb-4 md:mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_8px_#F5C518]" aria-hidden="true" />
              <span className="text-gold text-[10px] sm:text-[11px] font-semibold tracking-widest leading-none">
                NCFE LEVEL 2 &amp; 3 · OFQUAL · CIMSPA
              </span>
            </div>

            <h1 className="font-display font-extrabold text-[44px] leading-[1.02] sm:text-6xl md:text-7xl text-white tracking-tight mb-3 md:mb-5">
              {HEADLINE.slice(0, -HEADLINE_GOLD.length)}
              <span className="text-gold">{HEADLINE_GOLD}</span>
            </h1>

            <p className="text-base text-soft leading-relaxed mb-4 md:mb-6 max-w-xl">
              Online NCFE Level 3. Qualify in 8–16 weeks. Built by gym owners who&apos;ve hired 500+ PTs.
            </p>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 mb-4 md:mb-6">
              <p className="leading-tight">
                <span className="text-gold font-bold text-3xl lg:text-4xl">{COURSE_PRICE_LABEL}</span>{" "}
                <span className="text-soft">or</span>{" "}
                <span className="text-white font-bold text-xl max-[389px]:text-lg whitespace-nowrap">{MONTHLY_PRICE_LABEL}/month × {MONTHLY_PAYMENTS}</span>
              </p>
              <WasPrice className="text-soft text-base" />
            </div>

            <TwoWayCTA source="home-hero" />

            <p className="text-soft/70 text-xs mt-4">
              ★ 5.0 Google · 500+ PTs hired · Study around your job
            </p>
          </div>

          {/* Right: proof photo. Below the buttons on mobile. */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -inset-3 rounded-[28px] bg-gradient-to-br from-gold/25 via-gold/5 to-transparent blur-xl pointer-events-none" aria-hidden="true" />
            <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-gold/60 via-white/10 to-white/5 shadow-2xl shadow-black/40">
              <Image
                src="/learner-1.webp"
                alt="PT Launch Lab graduate holding their NCFE Level 3 personal trainer certificate"
                width={1200}
                height={1200}
                priority
                sizes="(min-width:1024px) 40vw, 100vw"
                className="rounded-2xl w-full h-auto"
              />
            </div>
            <div className="absolute left-4 bottom-4 sm:left-5 sm:bottom-5 flex items-center gap-3 rounded-xl bg-deep/85 backdrop-blur-md border border-white/10 px-4 py-3 shadow-xl">
              <span className="w-9 h-9 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold font-display font-extrabold text-sm" aria-hidden="true">
                L3
              </span>
              <span className="leading-tight">
                <span className="block text-white text-sm font-semibold">Qualified, certificate in hand</span>
                <span className="block text-soft/80 text-xs">NCFE Level 3 · Ofqual regulated</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
