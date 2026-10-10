import Image from "next/image";
import type { GymConfig } from "@/app/lib/gymPartnerConfig";
import {
  COURSE_PRICE_LABEL,
  MONTHLY_PRICE_LABEL,
  MONTHLY_PAYMENTS,
  MONTHLY_PLAN_TOTAL_PENCE,
  formatPence,
} from "@/app/lib/pricing";
import { ATP_LADDER, isAtp, memberPricePence } from "@/app/lib/partnerCommission";
import { memberSavingForGym } from "@/app/lib/gyms";
import GymCallbackForm from "@/app/components/GymCallbackForm";

// What a PT qualification typically costs elsewhere. The site's own figure —
// the "typical" column of the comparison table on /courses ("NCFE Level 2 & 3
// qualification: £1,200 – £2,800"). Change it there and here together.
const TYPICAL_COST_LABEL = "£1,200–£2,800";

const ATP_SIX_MONTH_TOTAL = formatPence(ATP_LADDER.sixMonth.contractPence); // £1,599
const ATP_DEPOSIT = formatPence(ATP_LADDER.sixMonth.depositPence); // £599
const ATP_INSTALMENT = formatPence(ATP_LADDER.sixMonth.instalmentPence); // £200

function Check({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <li className="flex items-start gap-2 text-sm text-gray-700">
      <span className="shrink-0 font-bold mt-0.5" style={{ color }}>✔</span>
      <span>{children}</span>
    </li>
  );
}

export default function GymAcademyPage({ config: c }: { config: GymConfig }) {
  const bg = c.heroBg ?? "#000000";
  const sectionBg = c.sectionBg ?? c.primaryColor;
  const dark = c.darkAccent ?? c.primaryColor;
  const enrolPath = `${c.canonicalPath}/enrol`;
  // Prices come from app/lib/pricing.ts and are the same on every gym's page
  // as everywhere else: £999.99 in full or 10 × £99.99 a month. No "was"
  // price and no countdowns.
  //
  // v4.1 ladder: a gym may fund a member saving on pay-in-full (shown only if
  // its Stripe coupon is configured — memberSavingForGym), and ATP Fitness
  // Felixstowe runs its own ladder (app/lib/partnerCommission.ts ATP_LADDER),
  // which its page leads with instead.
  const atp = isAtp(c.gymSlug);
  const savingPence = atp ? 0 : memberSavingForGym(c.gymSlug).savingPence;
  const memberPriceLabel = savingPence > 0 ? formatPence(memberPricePence(savingPence)) : null;

  return (
    <>
      <main className="bg-white">

        {/* ── HERO ── */}
        <section className="relative overflow-hidden" style={{ backgroundColor: bg }}>
          <div className="absolute inset-0 opacity-25 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 80% 50%, ${dark}, transparent 55%)` }} />

          <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 md:py-24">
            <div className="flex items-center gap-3 mb-8">
              {/* Wide wordmarks get a fixed height and auto width — squeezing
                  one into the 52×52 tile renders it as an unreadable sliver.
                  Square marks keep the original rounded-tile treatment. */}
              <Image
                src={c.logoUrl}
                alt={c.logoAlt ?? c.gymName}
                width={c.logoWidth ?? 52}
                height={c.logoHeight ?? 52}
                className={c.logoWidth && c.logoHeight ? "h-11 w-auto object-contain" : "rounded-xl"}
              />
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">Personal Training Academy</p>
                <p className="text-white font-bold text-sm">{c.gymName} PT Academy</p>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white uppercase leading-[1.0] mb-5">
              {c.heroHeadline.slice(0, -1).map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))}
              <span style={{ color: dark }}>{c.heroHeadline[c.heroHeadline.length - 1]}</span>
            </h1>

            {c.heroSubline && (
              <p className="text-white/60 text-lg font-semibold uppercase tracking-widest mb-8">{c.heroSubline}</p>
            )}

            {atp ? (
              <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl px-6 py-3 mb-8" style={{ backgroundColor: dark }}>
                <span className="font-black text-xl uppercase tracking-wide" style={{ color: bg }}>{ATP_SIX_MONTH_TOTAL} on our 6-month plan</span>
                <span className="text-sm font-semibold" style={{ color: bg }}>or pay in full with your member code</span>
              </div>
            ) : (
              <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl px-6 py-3 mb-8" style={{ backgroundColor: dark }}>
                <span className="text-white font-black text-xl uppercase tracking-wide">{COURSE_PRICE_LABEL}</span>
                <span className="text-white/80 text-sm">or {MONTHLY_PRICE_LABEL} a month for {MONTHLY_PAYMENTS} months</span>
                {memberPriceLabel && (
                  <span className="text-white text-sm font-bold">· Member price {memberPriceLabel} in full</span>
                )}
              </div>
            )}

            <ul className="flex flex-wrap gap-x-6 gap-y-2 mb-10">
              {[
                "Level 2 + Level 3 PT Qualification",
                "Study Around Your Job",
                "Mentorship Included",
                `Introductions At ${c.gymName}`,
              ].map(i => (
                <li key={i} className="flex items-center gap-2 text-white/80 text-sm font-medium">
                  <span style={{ color: dark }}>✔</span> {i}
                </li>
              ))}
            </ul>

            <a href={enrolPath}
              className="inline-block px-10 py-4 rounded-full font-black uppercase tracking-wide text-base hover:opacity-90 transition-all shadow-xl"
              style={{ backgroundColor: dark, color: bg }}>
              Enrol Now →
            </a>
          </div>
        </section>

        {/* ── HOOK ── */}
        <section className="bg-white py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-black text-black uppercase mb-6 text-center">
              You&apos;re Already In The Gym.
            </h2>
            <p className="text-center text-lg text-gray-500 mb-2">You already train.</p>
            <p className="text-center text-xl font-bold text-black mb-10">&ldquo;I could do this as a job.&rdquo;</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
              {["You don't know where to start", "Too many courses online, and no idea who to trust", "Don't want to waste money", "Don't know if you'll actually get work after"].map(i => (
                <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <span className="text-gray-300 shrink-0">—</span>
                  <span className="text-gray-500 text-sm">{i}</span>
                </div>
              ))}
            </div>

            <div className="bg-black rounded-2xl px-8 py-5 text-center">
              <p className="text-white font-black text-lg uppercase tracking-wide">
                That&apos;s exactly why <span style={{ color: dark }}>this exists.</span>
              </p>
            </div>
          </div>
        </section>

        {/* ── POSITIONING ── */}
        <section className="py-16 md:py-20" style={{ backgroundColor: sectionBg }}>
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase leading-tight mb-4">
              This Is The {c.gymName} PT Academy
            </h2>
            <p className="text-white/70 text-base mb-10">{c.positioningSubline}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[{ icon: "🎓", label: "Get Qualified" }, { icon: "👥", label: "Get Clients" }, { icon: "💰", label: "Make Money" }, { icon: "🏋️", label: "Build a Career" }].map(card => (
                <div key={card.label} className="bg-white/15 border border-white/20 rounded-2xl p-5 text-center">
                  <div className="text-3xl mb-2">{card.icon}</div>
                  <p className="text-white font-bold text-xs uppercase tracking-wide">{card.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHAT YOU GET ── */}
        <section className="bg-white py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-black text-black uppercase text-center mb-12">
              Everything You Need To Succeed
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { icon: "🎓", title: "Full PT Qualification", body: "Study 100% online around your current job.", items: ["Level 2 Gym Instructor", "Level 3 Personal Trainer", "Industry recognised & Ofqual regulated"] },
                { icon: "🧠", title: "Mentorship Included", body: "You are not left to work it out on your own.", items: ["Support throughout your qualification", "Real-world advice from industry pros", "How to actually succeed as a PT"] },
                { icon: "🏋️", title: "Gym Pathway", body: `Qualify inside ${c.gymName}, on the floor where trainers actually work. On completion we approach at least one gym on your behalf and introduce you — a gym in the partner network, or one local to you. Whether a gym interviews or hires you is its decision, and any arrangement is an independent contractor one, not a salaried position.`, items: ["An introduction to a gym on qualifying", "Learn how gyms actually work", "Build confidence on the gym floor"] },
                { icon: "💰", title: "How You Make Money", body: "Income, not just certificates.", items: ["1-1 PT sessions", "Online coaching", "Hybrid coaching models"] },
              ].map(card => (
                <div key={card.title} className="bg-gray-50 border border-gray-100 rounded-2xl p-7">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{card.icon}</span>
                    <h3 className="font-black text-black uppercase text-base">{card.title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm mb-4">{card.body}</p>
                  <ul className="space-y-2">{card.items.map(i => <Check key={i} color={c.primaryColor}>{i}</Check>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY THIS GYM ── */}
        <section className="bg-black py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase mb-3">
              {c.whyThisGymHeading}
            </h2>
            <p className="text-white/50 mb-3">Not a classroom. Not just videos.</p>
            {c.gymIntro && <p className="text-white/70 text-base mb-10">{c.gymIntro}</p>}
            {!c.gymIntro && <div className="mb-10" />}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {c.stats.map((s, i) => (
                <div key={s.label} className="bg-white/10 border border-white/10 rounded-2xl p-5 text-center">
                  <p className="font-black text-2xl" style={{ color: i === 0 ? dark : "white" }}>{s.value}</p>
                  <p className="text-white/50 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <ul className="space-y-3 text-left max-w-lg mx-auto">
              {c.gymHighlights.map(i => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                  <span style={{ color: dark }} className="shrink-0 font-bold">✔</span>{i}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── WHO IT'S FOR ── */}
        <section className="bg-gray-50 py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-black text-black uppercase text-center mb-12">Who This Is For</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <p className="font-black uppercase text-sm tracking-wide mb-4" style={{ color: c.primaryColor }}>✔ This is for you if:</p>
                <ul className="space-y-3">
                  {["You love training", "You want more freedom", "You're stuck in a job you don't enjoy", "You want to earn from fitness", "You don't want to go back to college"].map(i => <Check key={i} color={c.primaryColor}>{i}</Check>)}
                </ul>
              </div>
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="font-black uppercase text-sm tracking-wide text-gray-400 mb-4">You don&apos;t need to:</p>
                  <ul className="space-y-3">
                    {["Quit your job to start", "Have any experience", "Be perfect"].map(i => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                        <span className="text-gray-300 shrink-0 font-bold">✗</span><span>{i}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-black font-bold text-sm">You just need to start.</p>
                  <p className="text-gray-400 text-sm">We guide you through everything.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-black uppercase mb-10">How It Works</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-0">
              {[`Apply through ${c.gymName}`, "Choose how to pay", "Start your course", "Get qualified", `Introduction at ${c.gymName}`].map((step, i) => (
                <div key={step} className="flex sm:flex-col items-center gap-2 sm:gap-0 flex-1">
                  <div className="flex sm:flex-col items-center sm:mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm shrink-0" style={{ backgroundColor: c.primaryColor }}>
                      {i + 1}
                    </div>
                    {i < 4 && <div className="w-8 sm:w-px h-px sm:h-6 bg-gray-200 sm:mx-auto" />}
                  </div>
                  <p className="text-black font-bold text-xs text-center sm:mt-2 max-w-[80px]">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section className="bg-gray-50 py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className={`text-3xl md:text-4xl font-black text-black uppercase ${atp ? "mb-10" : "mb-4"}`}>Your Investment</h2>
            {!atp && (
              <p className="text-gray-600 text-base mb-10">
                Most PT qualifications cost {TYPICAL_COST_LABEL}. Through {c.gymName} PT Academy it&apos;s{" "}
                {COURSE_PRICE_LABEL}, everything included.
              </p>
            )}
            {atp ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
                <div className="bg-white rounded-2xl p-7 border-2 shadow-sm" style={{ borderColor: c.primaryColor }}>
                  <p className="font-black uppercase text-xs tracking-widest mb-2" style={{ color: c.primaryColor }}>6-Month Plan</p>
                  <p className="font-black text-4xl mb-1" style={{ color: c.primaryColor }}>{ATP_DEPOSIT} <span className="text-lg text-gray-500 font-bold">today</span></p>
                  <p className="text-gray-500 text-sm mb-4">then {ATP_LADDER.sixMonth.instalments} monthly payments of {ATP_INSTALMENT}, {ATP_SIX_MONTH_TOTAL} in total</p>
                  <a href={enrolPath} className="block w-full py-3 rounded-full font-black text-white text-sm text-center hover:opacity-90 transition-all" style={{ backgroundColor: c.primaryColor }}>
                    Start the 6-Month Plan →
                  </a>
                </div>
                <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                  <p className="font-black uppercase text-xs tracking-widest text-gray-400 mb-2">Pay in Full, Member Code</p>
                  <p className="font-black text-4xl text-black mb-1">{ATP_SIX_MONTH_TOTAL}</p>
                  <p className="text-gray-500 text-sm mb-4">Have an ATP member code? Enter it when you enrol and it comes off here.</p>
                  <a href={enrolPath} className="block w-full py-3 rounded-full font-black text-sm text-center border-2 hover:opacity-80 transition-all" style={{ borderColor: c.primaryColor, color: c.primaryColor }}>
                    Enrol With My Code →
                  </a>
                </div>
                <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                  <p className="font-black uppercase text-xs tracking-widest text-gray-400 mb-2">Pay in Full</p>
                  <p className="font-black text-4xl text-black mb-1">{COURSE_PRICE_LABEL}</p>
                  <p className="text-gray-500 text-sm mb-4">One payment, nothing further to pay</p>
                  <a href={enrolPath} className="block w-full py-3 rounded-full font-black text-sm text-center border-2 hover:opacity-80 transition-all" style={{ borderColor: c.primaryColor, color: c.primaryColor }}>
                    Enrol Now →
                  </a>
                </div>
                <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                  <p className="font-black uppercase text-xs tracking-widest text-gray-400 mb-2">Pay Monthly</p>
                  <p className="font-black text-4xl text-black mb-1">{MONTHLY_PRICE_LABEL}<span className="text-lg text-gray-400 font-bold"> /month</span></p>
                  <p className="text-gray-500 text-sm mb-4">{MONTHLY_PAYMENTS} monthly payments, the first today, {formatPence(MONTHLY_PLAN_TOTAL_PENCE)} total</p>
                  <a href={enrolPath} className="block w-full py-3 rounded-full font-black text-sm text-center border-2 hover:opacity-80 transition-all" style={{ borderColor: c.primaryColor, color: c.primaryColor }}>
                    Pay Monthly →
                  </a>
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl p-8 border-2 shadow-sm" style={{ borderColor: c.primaryColor }}>
                <p className="font-black uppercase text-xs tracking-widest mb-2" style={{ color: c.primaryColor }}>One Payment</p>
                <p className="text-black font-black text-2xl mb-1">Pay in Full</p>
                <p className="font-black text-4xl mb-1" style={{ color: c.primaryColor }}>{COURSE_PRICE_LABEL}</p>
                {memberPriceLabel && (
                  <p className="font-black text-base text-black mb-1">Member price {memberPriceLabel}</p>
                )}
                <p className="text-gray-400 text-sm mb-4">Nothing further to pay</p>
                <a href={enrolPath} className="block w-full py-3 rounded-full font-black text-white text-sm text-center hover:opacity-90 transition-all" style={{ backgroundColor: c.primaryColor }}>
                  Enrol Now →
                </a>
              </div>
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <p className="font-black uppercase text-xs tracking-widest text-gray-400 mb-2">Spread the Cost</p>
                <p className="text-black font-black text-2xl mb-1">Pay Monthly</p>
                <p className="font-black text-4xl text-black mb-1">{MONTHLY_PRICE_LABEL}<span className="text-lg text-gray-400 font-bold"> /month</span></p>
                <p className="text-gray-400 text-sm mb-4">{MONTHLY_PAYMENTS} monthly payments, the first today, {formatPence(MONTHLY_PLAN_TOTAL_PENCE)} total</p>
                <a href={enrolPath} className="block w-full py-3 rounded-full font-black text-sm text-center border-2 hover:opacity-80 transition-all" style={{ borderColor: c.primaryColor, color: c.primaryColor }}>
                  Pay Monthly →
                </a>
              </div>
            </div>
            )}
          </div>
        </section>

        {/* ── RING ME ── */}
        <GymCallbackForm gymSlug={c.gymSlug} gymName={c.gymName} accent={c.primaryColor} />

        {/* ── FINAL CTA ── */}
        <section className="py-16 md:py-20" style={{ backgroundColor: sectionBg }}>
          <div className="max-w-2xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase leading-tight mb-3">
              Start Your PT Journey Today
            </h2>
            <p className="text-white/70 font-bold uppercase tracking-wide mb-8">
              {atp
                ? `${ATP_SIX_MONTH_TOTAL} on our 6-month plan, or pay in full with your member code`
                : `${COURSE_PRICE_LABEL} in full, or ${MONTHLY_PAYMENTS} × ${MONTHLY_PRICE_LABEL} a month`}
            </p>
            <a href={enrolPath}
              className="inline-block bg-white font-black uppercase tracking-wide text-base px-12 py-5 rounded-full hover:opacity-90 transition-all shadow-xl mb-5"
              style={{ color: c.primaryColor }}>
              Apply Now →
            </a>
          </div>
        </section>

      </main>

      <footer className="bg-black border-t border-white/10 py-6 px-6 text-center">
        <p className="text-white/30 text-xs mb-2">
          {c.gymName} is a gym partner of PT Launch Lab. All training, qualifications, and learning are delivered solely by PT Launch Lab, not by {c.gymName}. Any gym pathway or interview opportunity is subject to availability and is not a guarantee of employment. Self-employed PT arrangements involve independent contractor status, not PAYE employment.
        </p>
        <p className="text-white/30 text-xs">
          Powered by PT Launch Lab · NCFE Accredited Centre No. 9002788 ·{" "}
          <a href="/terms" className="hover:text-white/50 transition-colors">Terms</a>
          {" "}·{" "}
          <a href="/privacy" className="hover:text-white/50 transition-colors">Privacy</a>
        </p>
      </footer>
    </>
  );
}
