import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import StickyMobileCTA from "../components/StickyMobileCTA";
import Accreditation from "../components/Accreditation";
import Reviews from "../components/Reviews";
import ProofStrip from "../components/ProofStrip";
import FunnelPricingBlock from "../components/FunnelPricingBlock";
import PromoBar from "../components/PromoBar";
import { faqPageSchema } from "@/app/lib/faqSchema";

const PAGE_URL = "https://ptlaunchlab.co.uk/career-blueprint";

export const metadata: Metadata = {
  title: "The PT Career Blueprint — Not Just a Qualification, a Career | PT Launch Lab",
  description:
    "Become a qualified UK personal trainer and build a career that lasts. NCFE Level 2 + 3, Ofqual regulated, business mentorship, hiring partners and community, the parts that decide the first yet.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    title: "The PT Career Blueprint — Not Just a Qualification, a Career",
    description:
      "This does not stop at the certificate. We help you qualify, get clients, and build a career in fitness. NCFE Level 2 + 3, business mentorship, hiring partners, community.",
    url: PAGE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

// ─── COPY ─────────────────────────────────────────────────────────────────────

const whoFor = [
  { icon: "🔁", title: "The career changer", body: "Stuck in a job you've outgrown, ready to build something that's actually yours — without quitting on Monday." },
  { icon: "🏋️", title: "The gym enthusiast", body: "Fitness is already your life. Now you want to get paid for the thing you'd do anyway." },
  { icon: "👨‍👧", title: "The returning parent", body: "You want flexible, meaningful work that fits around the family — and pays properly." },
  { icon: "💪", title: "Already in fitness", body: "Gym staff, class instructor or coach who wants the full qualification and a real business behind it." },
];

const comparison = [
  ["Qualification only", "Qualification + business mentoring"],
  ["Finish and leave", "Ongoing community"],
  ["Generic help desk", "Live coaching with real coaches"],
  ["Learn the theory", "Build your actual career"],
  ["You find your own clients", "Warm introductions to hiring partners"],
  ["Hope it works out", "A step-by-step roadmap to earning"],
];

const roadmap = [
  { step: "01", title: "Join", body: "Enrol in minutes. Personal tutor introduced within 24 hours." },
  { step: "02", title: "Study", body: "100% online, around your job. Most finish in 8–16 weeks." },
  { step: "03", title: "Qualify", body: "NCFE Level 2 + Level 3, Ofqual regulated. Free resubmissions until you pass." },
  { step: "04", title: "Business mentoring", body: "The Mentorship Hub teaches pricing, clients and marketing — as a system." },
  { step: "05", title: "First client", body: "Warm introductions into our partner gym network. Start earning while you build." },
  { step: "06", title: "Career", body: "Employed first, then self-employed. £20–28k to start, £35–50k+ as you grow." },
];

const included = [
  "NCFE Level 2 Gym Instructor",
  "NCFE Level 3 Personal Trainer",
  "Business & marketing mentorship",
  "Private community",
  "Live coaching sessions",
  "Career & hiring-partner support",
  "Client & programme templates",
  "Personal tutor (24h)",
  "Free resubmissions — no cap",
  "Student learning app",
];

const faqs = [
  { q: "Can I do this while working full-time?", a: "Yes — it's how most of our learners do it. It's fully online and self-paced with no fixed class times. Average study load is 8–10 hours a week; most people finish Level 2 + Level 3 in 8–16 weeks while still earning. You qualify first, then transition." },
  { q: "How long does it take?", a: "Typically 8–16 weeks at 8–10 hours a week, but it's self-paced — faster or slower is fine. There's no deadline pressure and resubmissions are free until your tutor passes you." },
  { q: "I have no gym or fitness-industry experience. Is that a problem?", a: "No. The course starts from the ground up, and plenty of our most successful graduates came from completely different careers. Life experience and work ethic count for a lot in this industry." },
  { q: "Am I too old to start?", a: "No. Career-changers in their 30s, 40s and 50s often do better — clients trust maturity, and you bring real-world people skills the 19-year-olds don't have yet." },
  { q: "Will you actually help me get clients?", a: "Yes — that's the whole point. The Mentorship Hub walks you through pricing, marketing and client conversations as a system, and we make warm introductions into our partner gym network when you qualify." },
  { q: "Will employers recognise the qualification?", a: "Yes. It's NCFE, Ofqual regulated (Level 3 ref 603/4388/6) — the qualification gym managers hire against as standard across the UK." },
  { q: "What are the payment options?", a: "Two simple options: pay in full (£1,599), or spread it with our deposit plan — £599 deposit then 5 × £200 monthly. No third-party finance. Once qualified, a single PT session covers roughly a month's payment." },
];

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function CareerBlueprintPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema(faqs)) }} />
      <PromoBar />
      <Nav />
      <main className="pt-[72px]">
        <Breadcrumbs trail={[{ name: "Career Blueprint", url: PAGE_URL }]} />

        {/* HERO */}
        <section className="bg-base py-16 md:py-24 px-6 relative overflow-hidden">
          <div className="absolute -left-48 top-0 w-[600px] h-[600px] rounded-full bg-gold opacity-[0.06] blur-3xl pointer-events-none" />
          <div className="absolute -right-32 bottom-0 w-[500px] h-[500px] rounded-full bg-blue opacity-[0.07] blur-3xl pointer-events-none" />
          <div className="relative max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/40 bg-gold/5 mb-8">
              <span className="text-gold text-[11px] font-bold tracking-widest uppercase">The complete roadmap · NCFE Level 2 + 3 · Ofqual regulated</span>
            </div>
            <h1 className="font-display font-extrabold text-5xl md:text-8xl text-white leading-[0.95] tracking-tight mb-7">
              Become a qualified PT.
              <br />
              <span className="text-gold">And build a career that lasts.</span>
            </h1>
            <p className="text-xl text-soft/85 leading-relaxed mb-10 max-w-2xl mx-auto">
              Not just a certificate — a complete roadmap into the fitness industry. The qualification, the business skills, the mentorship, the hiring partners and the community. Everything a new PT actually needs to earn.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Link href="#included" data-cta="hero-included" className="px-10 py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-gold/30 text-center">
                See What&apos;s Included →
              </Link>
              <Link href="/book-call" data-cta="hero-bookcall" className="px-10 py-4 rounded-full border-2 border-white/30 text-white font-semibold text-base hover:bg-white/10 transition-all text-center">
                Book a Free Call
              </Link>
            </div>
            <p className="text-soft/60 text-xs mt-4">
              ⭐ 5.0 · 19 Verified Google Reviews &nbsp;·&nbsp; 500+ trainers trained &nbsp;·&nbsp; Run by gym owners who actually hire PTs
            </p>
          </div>
        </section>

        {/* SOCIAL PROOF STRIP */}
        <section className="bg-surface py-6 px-6 border-y border-white/[0.05]">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center">
            {["★★★★★ 5.0 rated", "500+ trained", "Hiring partners", "Flexible payment plans", "NCFE · Ofqual regulated"].map((item) => (
              <span key={item} className="text-soft/80 text-sm font-semibold">{item}</span>
            ))}
          </div>
        </section>

        {/* THE OPPORTUNITY */}
        <section className="bg-base py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-4">The opportunity</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-8">
              There&apos;s never been a better time
              <br />
              <span className="text-gold">to build a career in fitness.</span>
            </h2>
            <p className="text-soft/85 text-lg leading-relaxed">
              More people are investing in their health than ever — in gyms, online, and one-to-one. The demand for good personal trainers is real. What&apos;s missing isn&apos;t opportunity. It&apos;s trainers who know how to turn a qualification into an actual income. That&apos;s the gap this fills.
            </p>
          </div>
        </section>

        {/* THE PROBLEM */}
        <section className="bg-surface py-20 md:py-24 px-6 border-y border-white/[0.05]">
          <div className="max-w-3xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-4">The problem nobody warns you about</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-8">
              Most new PTs qualify&hellip;
              <br />
              <span className="text-gold">then quietly quit.</span>
            </h2>
            <p className="text-soft/85 text-lg leading-relaxed mb-5">
              Roughly <span className="text-white font-semibold">80% of newly-qualified UK PTs leave the industry within 18 months.</span> Not because they failed the exams. Because nobody taught them the part that actually matters — how to get clients, price their time, and build a business.
            </p>
            <p className="text-soft/85 text-lg leading-relaxed">
              A certificate on its own leaves the hardest part undone. You leave qualified, but with no plan, no clients, and no idea what to do on Monday morning. <span className="text-white font-semibold">A qualification is a door. It isn&apos;t a career.</span>
            </p>
          </div>
        </section>

        {/* WHO THIS IS FOR */}
        <section className="bg-base py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">Who this is for</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-12">
              You might see <span className="text-gold">yourself here.</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {whoFor.map((p) => (
                <div key={p.title} className="bg-card border border-white/[0.06] rounded-2xl p-6 hover:border-gold/30 transition-all">
                  <div className="text-3xl mb-3">{p.icon}</div>
                  <h3 className="text-white font-bold text-lg mb-2">{p.title}</h3>
                  <p className="text-soft/75 text-sm leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT MAKES US DIFFERENT — comparison */}
        <section className="bg-surface py-20 md:py-24 px-6 border-y border-white/[0.05]">
          <div className="max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">The difference</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-4">
              We don&apos;t sell qualifications.
              <br />
              <span className="text-gold">We build careers.</span>
            </h2>
            <p className="text-soft/75 text-center text-base max-w-2xl mx-auto mb-12">
              Same certificate at the end. A completely different outcome.
            </p>
            <div className="rounded-2xl border border-white/[0.12] overflow-hidden bg-card">
              <div className="grid grid-cols-2">
                <div className="p-4 md:p-5 text-center border-r border-white/[0.12] bg-white/[0.03]">
                  <p className="text-soft text-[11px] md:text-xs font-bold tracking-widest uppercase">A certificate alone</p>
                </div>
                <div className="p-4 md:p-5 text-center bg-gold/[0.10]">
                  <p className="text-gold text-[11px] md:text-xs font-bold tracking-widest uppercase">PT Launch Lab</p>
                </div>
              </div>
              {comparison.map(([left, right]) => (
                <div key={left} className="grid grid-cols-2 border-t border-white/[0.12]">
                  <div className="p-4 md:p-5 border-r border-white/[0.12] bg-white/[0.03] flex items-start gap-2.5">
                    <span className="text-red-400 shrink-0 font-bold">✕</span>
                    <span className="text-white text-sm md:text-base">{left}</span>
                  </div>
                  <div className="p-4 md:p-5 bg-gold/[0.06] flex items-start gap-2.5">
                    <span className="text-gold shrink-0 font-bold">✓</span>
                    <span className="text-white text-sm md:text-base font-semibold">{right}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* THE ROADMAP */}
        <section className="bg-base py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">The roadmap</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-12">
              From &ldquo;thinking about it&rdquo;
              <br />
              <span className="text-gold">to earning as a PT.</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roadmap.map((r) => (
                <div key={r.step} className="bg-card border border-white/[0.06] rounded-2xl p-6 flex gap-4">
                  <span className="font-display font-extrabold text-3xl text-gold/70 leading-none shrink-0">{r.step}</span>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">{r.title}</h3>
                    <p className="text-soft/75 text-sm leading-relaxed">{r.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GRADUATE STORIES */}
        <section className="bg-surface py-20 px-6 border-y border-white/[0.05]">
          <div className="max-w-5xl mx-auto">
            <ProofStrip avatar="switcher" count={3} eyebrow="Real graduates" heading="People who were exactly where you are." />
          </div>
        </section>

        {/* EVERYTHING INCLUDED + PRICING */}
        <section id="included" className="bg-base py-20 md:py-24 px-6 scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">Everything included</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-10">
              One enrolment. <span className="text-gold">The whole career.</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-14 max-w-4xl mx-auto">
              {included.map((item) => (
                <div key={item} className="bg-card border border-white/[0.06] rounded-xl p-4 text-center">
                  <span className="text-gold text-lg">✓</span>
                  <p className="text-white text-xs font-medium leading-snug mt-1">{item}</p>
                </div>
              ))}
            </div>
            <FunnelPricingBlock />
          </div>
        </section>

        {/* INVESTMENT FRAMING (payment, not finance) */}
        <section className="bg-surface py-20 px-6 border-y border-white/[0.05]">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-4">The investment</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-8">
              This isn&apos;t a cost.
              <br />
              <span className="text-gold">It&apos;s the cheapest bet on your own income.</span>
            </h2>
            <p className="text-soft/85 text-lg leading-relaxed mb-8">
              On the deposit plan it&apos;s <span className="text-white font-semibold">£200 a month</span> — roughly a daily coffee habit, a mid-tier gym membership, or a couple of streaming subscriptions. Once you qualify, <span className="text-white font-semibold">a single PT session at ~£30 covers most of a week of it.</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { big: "£1,599", label: "Pay in full", note: "one payment, nothing to manage" },
                { big: "£599", label: "Deposit plan", note: "then 5 × £200 monthly" },
                { big: "£20–50k+", label: "PT earning range", note: "employed to self-employed" },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-white/[0.06] rounded-2xl p-6">
                  <p className="font-display font-extrabold text-3xl text-gold leading-none mb-2">{s.big}</p>
                  <p className="text-white font-bold text-sm">{s.label}</p>
                  <p className="text-soft/70 text-xs mt-1">{s.note}</p>
                </div>
              ))}
            </div>
            <p className="text-soft/60 text-sm">Two options only — pay in full or the deposit plan. No third-party finance.</p>
          </div>
        </section>

        {/* REVIEWS */}
        <Reviews />

        {/* FAQ — objections */}
        <section className="bg-base py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">Honest answers</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-12">
              The real questions <span className="text-gold">you&apos;re asking.</span>
            </h2>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="group bg-card border border-white/[0.06] rounded-2xl p-5 open:border-gold/30">
                  <summary className="flex items-center justify-between cursor-pointer list-none text-white font-semibold text-base md:text-lg">
                    {f.q}
                    <span className="text-gold text-xl shrink-0 ml-4 group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="text-soft/80 text-sm md:text-base leading-relaxed mt-3">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <Accreditation />

        {/* FINAL CTA */}
        <section className="bg-gradient-to-b from-surface via-card to-surface py-20 md:py-28 px-6 border-t border-gold/15">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display font-extrabold text-4xl md:text-7xl text-white leading-none tracking-tight mb-6">
              Ready to build a
              <br />
              <span className="text-gold">fitness career?</span>
            </h2>
            <p className="text-soft/85 text-lg mb-10 max-w-xl mx-auto">
              Book a free 15-minute call and we&apos;ll walk through your plan honestly — or enrol today and get started. No pressure, no hard sell.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/book-call" data-cta="final-bookcall" className="px-10 py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-gold/30 text-center">
                Book a Free Call →
              </Link>
              <Link href="#included" data-cta="final-included" className="px-10 py-4 rounded-full border-2 border-white/30 text-white font-semibold text-base hover:bg-white/10 transition-all text-center">
                View What&apos;s Included
              </Link>
            </div>
          </div>
        </section>
      </main>
      <StickyMobileCTA />
      <Footer />
    </>
  );
}
