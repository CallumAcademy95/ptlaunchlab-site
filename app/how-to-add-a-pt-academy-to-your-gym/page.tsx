import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import MidContentCTA from "../components/MidContentCTA";
import { COURSE_PRICE_LABEL, MONTHLY_PLAN_LABEL, PARTNER_FEE_RELEASE_PAYMENT, formatPence } from "@/app/lib/pricing";
import {
  LADDER_MONTHLY_COMMISSION_PENCE,
  LADDER_PIF_COMMISSION_PENCE,
  VOLUME_BONUS_MONTHLY_PENCE,
  VOLUME_BONUS_PIF_PENCE,
  VOLUME_THRESHOLD,
} from "@/app/lib/partnerCommission";

// Gym-owner guide. Targets the searches a gym owner makes before they know our
// name ("add a PT academy to my gym", "gym partnership PT course", "run a PT
// course in my gym"), none of which we ranked for in Oct 2026. Every money
// figure comes from the pricing/commission constants. No earnings forecasts:
// the worked example is arithmetic on the contract rates, labelled as such.
const PAGE_URL = "https://ptlaunchlab.co.uk/how-to-add-a-pt-academy-to-your-gym";
const PUBLISHED = "2026-10-19";
const UPDATED = "2026-10-19";

const PIF_FEE = formatPence(LADDER_PIF_COMMISSION_PENCE);
const MONTHLY_FEE = formatPence(LADDER_MONTHLY_COMMISSION_PENCE);
const PIF_FEE_VOLUME = formatPence(LADDER_PIF_COMMISSION_PENCE + VOLUME_BONUS_PIF_PENCE);
const MONTHLY_FEE_VOLUME = formatPence(LADDER_MONTHLY_COMMISSION_PENCE + VOLUME_BONUS_MONTHLY_PENCE);
// Worked example: 5 pay-in-full learners in one quarter. The first
// VOLUME_THRESHOLD - 1 earn the base rate, the rest the Accelerator rate.
const EXAMPLE_LEARNERS = 5;
const EXAMPLE_BASE = VOLUME_THRESHOLD - 1;
const EXAMPLE_TOTAL = formatPence(
  EXAMPLE_BASE * LADDER_PIF_COMMISSION_PENCE +
    (EXAMPLE_LEARNERS - EXAMPLE_BASE) * (LADDER_PIF_COMMISSION_PENCE + VOLUME_BONUS_PIF_PENCE),
);

export const metadata: Metadata = {
  title: "How to Add a PT Academy to Your Gym: A UK Guide for Gym Owners | PT Launch Lab",
  description:
    "Three ways to run a personal trainer course from your gym: become an approved centre, license a course, or partner with a provider. What each costs you, who does the teaching, and what to check before you sign.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "article",
    title: "How to Add a PT Academy to Your Gym",
    description: "Approved centre, licence or partnership: the three routes to a PT academy in your gym, compared for UK gym owners.",
    url: PAGE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How to Add a PT Academy to Your Gym: A UK Guide for Gym Owners",
  description: "The three routes to running a personal trainer course from a UK gym, compared on cost, workload and revenue.",
  url: PAGE_URL,
  datePublished: `${PUBLISHED}T12:00:00Z`,
  dateModified: `${UPDATED}T12:00:00Z`,
  inLanguage: "en-GB",
  author: [
    { "@type": "Person", name: "Callum Brown", jobTitle: "Co-founder, PT Launch Lab", url: "https://ptlaunchlab.co.uk/about" },
  ],
  publisher: {
    "@type": "Organization",
    name: "PT Launch Lab",
    url: "https://ptlaunchlab.co.uk",
    logo: { "@type": "ImageObject", url: "https://ptlaunchlab.co.uk/logo.png", width: 512, height: 512 },
  },
  mainEntityOfPage: { "@type": "WebPage", "@id": PAGE_URL },
  image: { "@type": "ImageObject", url: "https://ptlaunchlab.co.uk/og-image.png", width: 1200, height: 630 },
};

const FAQ = [
  {
    q: "Can a gym run its own personal trainer course?",
    a: "Yes. A gym can become an approved centre with an awarding body such as NCFE or Active IQ and deliver the qualification itself, license a course from a training provider, or partner with a provider that delivers the course under the gym's brand. The difference is who does the teaching and assessing, and who carries the cost.",
  },
  {
    q: "Do I need qualified assessors to run a PT course in my gym?",
    a: "Only if you deliver the course yourself. Approved centres need qualified tutors, assessors and internal quality assurers, and must meet the awarding body's quality checks. With a fully managed partnership, the provider supplies all of these.",
  },
  {
    q: "How much can a gym earn from a PT academy?",
    a: `It depends on the model and on how many members enrol. On the PT Launch Lab partnership, the gym is paid ${PIF_FEE} per learner who pays in full and ${MONTHLY_FEE} per learner on the monthly plan, rising to ${PIF_FEE_VOLUME} and ${MONTHLY_FEE_VOLUME} from the ${VOLUME_THRESHOLD}th learner in a calendar quarter (all inc. VAT).`,
  },
  {
    q: "Does a PT academy help gyms recruit personal trainers?",
    a: "It can. Learners who qualify through your academy already know your gym, your members and your standards, so you get the first conversation with them when they qualify, instead of waiting for the right PT to apply.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

const ROUTES = [
  {
    name: "1. Become an approved centre",
    who: "You teach and assess",
    body: "You apply to an awarding body (NCFE, Active IQ, Focus Awards and others) for centre approval, then deliver the Level 2 and Level 3 qualifications yourself. You need qualified tutors and assessors, an internal quality assurer, learning materials and a learner-support process, and you are inspected against the awarding body's standards.",
    good: "Full control over the course and the price.",
    hard: "The most work and the biggest upfront cost. It suits training businesses more than gyms.",
  },
  {
    name: "2. License or white-label a course you deliver",
    who: "You teach; they supply the materials",
    body: "A provider supplies the curriculum, platform or brand, and your staff deliver the teaching on-site, often in quiet hours. You usually pay a licence or per-learner fee, and your team carries the teaching load.",
    good: "Your gym, your classroom, your learners.",
    hard: "Someone on your team has to teach, and quiet hours aren't always quiet.",
  },
  {
    name: "3. Partner with a provider that delivers everything",
    who: "They teach and assess; you promote",
    body: "The provider builds an academy under your gym's name, then teaches, assesses and certifies every learner. Your job is to promote it to your members. You are paid a fee per learner instead of paying one.",
    good: "No teaching, no admin, no upfront cost.",
    hard: "You don't set the course price, and learners study mostly online rather than in your classroom.",
  },
];

const CHECKLIST = [
  { title: "Is the qualification Ofqual-regulated?", body: "Ask for the awarding body and the qualification title, then look it up on the Ofqual register. If it isn't there, your members won't be able to get insured or hired with it, and it's your gym's name on it." },
  { title: "Who teaches, assesses and supports learners?", body: "Get a straight answer on who your members will deal with when they're stuck, and how quickly they get feedback." },
  { title: "What exactly are you paid, and when?", body: "Ask for the fee per learner in writing, when it is paid, and whether it can ever be clawed back if a learner pauses or drops out." },
  { title: "Is your area protected?", body: "If the provider will sign the gym down the road on the same terms, your academy is competing with theirs for the same people." },
  { title: "What do you get to promote it?", body: "A branded page, QR code, posters, screen content and ads make the difference between an academy that sells and one that sits on a page nobody visits." },
  { title: "What does the learner pay?", body: "Your members will compare. Check the full price, any monthly option, and what's included after they qualify." },
];

export default function AddPtAcademyGuidePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Breadcrumbs trail={[
        { name: "Gym Partnership", url: "https://ptlaunchlab.co.uk/gym-partnership" },
        { name: "How to Add a PT Academy to Your Gym", url: PAGE_URL },
      ]} />
      <Nav />
      <main className="pt-[72px]">

        <section className="bg-base py-16 md:py-24 px-6 relative overflow-hidden">
          <div className="absolute -left-48 top-0 w-[500px] h-[500px] rounded-full bg-gold opacity-[0.04] blur-3xl pointer-events-none" />
          <div className="relative max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-4">For Gym Owners · Guide</p>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-6">
              How to add a{" "}
              <span className="text-gold">PT academy to your gym.</span>
            </h1>
            <p className="text-xl text-soft/80 leading-relaxed mb-6">
              Running a personal trainer course from your gym can bring in revenue from members who already want to train others, and give you first pick of the trainers who qualify. There are <strong className="text-white">three ways</strong> to do it, and they differ mainly on one thing: <strong className="text-white">who does the teaching, and who pays for it.</strong>
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/gym-partnership" className="px-7 py-3.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all">See the Gym Partnership →</Link>
              <a href="/gym-partner-prospectus.pdf" target="_blank" rel="noopener noreferrer" className="px-7 py-3.5 rounded-full border border-gold text-gold font-semibold text-sm hover:bg-gold hover:text-deep transition-all">↓ Download the Prospectus</a>
            </div>
          </div>
        </section>

        <article className="bg-base px-6 pb-14">
          <div className="max-w-3xl mx-auto space-y-14 md:space-y-20">

            <section>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">The three routes, compared.</h2>
              <div className="space-y-4">
                {ROUTES.map((r) => (
                  <div key={r.name} className="rounded-2xl border border-white/[0.07] bg-card p-6">
                    <h3 className="text-white font-bold text-lg mb-1">{r.name}</h3>
                    <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-3">{r.who}</p>
                    <p className="text-soft/80 text-sm leading-relaxed mb-4">{r.body}</p>
                    <p className="text-soft/70 text-sm leading-relaxed"><strong className="text-white">Upside:</strong> {r.good}</p>
                    <p className="text-soft/70 text-sm leading-relaxed"><strong className="text-white">Catch:</strong> {r.hard}</p>
                  </div>
                ))}
              </div>
              <p className="text-soft/80 text-base leading-relaxed mt-6">Most independent and commercial gyms don&apos;t want to become a training provider. They want the revenue and the trainers without the teaching. That&apos;s the gap the partnership route fills.</p>
            </section>

            <section>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">Why gyms add a PT academy.</h2>
              <div className="space-y-5 text-soft/80 text-base leading-relaxed">
                <p><strong className="text-white">Revenue from people already in your building.</strong> Every gym has members who have thought about becoming a PT. An academy with your name on it gives them a reason to do it with you rather than with a national provider they found online.</p>
                <p><strong className="text-white">A pipeline of trainers.</strong> Finding good PTs is one of the hardest jobs in running a gym. Learners who qualify through your academy already know your floor, your members and your standards, and you get the first conversation with them.</p>
                <p><strong className="text-white">A reason for members to stay.</strong> A member working towards a qualification in your gym has a goal tied to your gym.</p>
              </div>
            </section>

            <MidContentCTA
              headline="Want the partnership route without the teaching?"
              body="PT Launch Lab builds a white-label PT academy under your gym's name, teaches and assesses every learner, and pays your gym per learner. One partner gym per area."
              ctaText="See the Gym Partnership →"
              ctaHref="/gym-partnership"
              secondary={{ text: "Apply to become a partner", href: "/gym-partnership#apply" }}
            />

            <section>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">What to check before you sign.</h2>
              <p className="text-soft/80 text-lg leading-relaxed mb-6">Whichever provider you talk to, get clear answers to these six questions.</p>
              <div className="space-y-3">
                {CHECKLIST.map((c, i) => (
                  <div key={c.title} className="flex gap-4 rounded-2xl border border-white/[0.07] bg-card p-5">
                    <span className="font-display font-extrabold text-gold text-3xl leading-none shrink-0 w-8">{i + 1}.</span>
                    <div>
                      <h3 className="text-white font-bold text-lg mb-2">{c.title}</h3>
                      <p className="text-soft/80 text-sm leading-relaxed">{c.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">How the PT Launch Lab partnership works.</h2>
              <div className="space-y-5 text-soft/80 text-base leading-relaxed">
                <p>Your members get <strong className="text-white">NCFE Level 2 Gym Instructing and Level 3 Personal Training</strong>, Ofqual-regulated, for {COURSE_PRICE_LABEL} in full or {MONTHLY_PLAN_LABEL}, with our Mentorship Hub included. To them it is your gym&apos;s academy: your name, logo and colours on the landing page, poster, handout, screen video and ads.</p>
                <p>We do the teaching, tutor support, assessment, quality assurance and certification. Your gym pays nothing to join.</p>
                <p>Your gym is paid <strong className="text-white">{PIF_FEE}</strong> for each learner who pays in full and <strong className="text-white">{MONTHLY_FEE}</strong> for each on the monthly plan. From your {VOLUME_THRESHOLD}th learner in a calendar quarter, that rises to <strong className="text-white">{PIF_FEE_VOLUME}</strong> and <strong className="text-white">{MONTHLY_FEE_VOLUME}</strong>. All fees include VAT. Pay-in-full fees are paid 30 days after enrolment; monthly-plan fees when the learner&apos;s {PARTNER_FEE_RELEASE_PAYMENT}th payment clears. Nothing is clawed back once paid.</p>
                <p className="border-l-2 border-gold pl-4">
                  <strong className="text-white">The arithmetic, not a forecast:</strong> if {EXAMPLE_LEARNERS} members paid in full in one quarter, the first {EXAMPLE_BASE} would earn {PIF_FEE} each and the next {EXAMPLE_LEARNERS - EXAMPLE_BASE} would earn {PIF_FEE_VOLUME} each, {EXAMPLE_TOTAL} in total. How many members enrol depends on your gym and how you promote it.
                </p>
                <p>We take one partner gym per area, so your academy isn&apos;t competing with the gym down the road.</p>
              </div>
            </section>

            <section>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">Common questions.</h2>
              <div className="space-y-3">
                {FAQ.map(({ q, a }) => (
                  <div key={q} className="rounded-2xl border border-white/[0.07] bg-card p-5">
                    <h3 className="text-white font-bold text-base mb-2">{q}</h3>
                    <p className="text-soft/80 text-sm leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </article>

        <section className="bg-surface py-16 md:py-20 px-6 border-t border-blue/15">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white leading-none tracking-tight mb-4">Check if your area is free.</h2>
            <p className="text-soft/70 text-lg mb-6">One partner gym per area. Apply in two minutes, or read the full prospectus first.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/gym-partnership#apply" className="px-7 py-3.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all">Apply to Become a Partner Gym →</Link>
              <a href="/gym-partner-prospectus.pdf" target="_blank" rel="noopener noreferrer" className="px-7 py-3.5 rounded-full border border-gold text-gold font-semibold text-sm hover:bg-gold hover:text-deep transition-all">↓ Download the Prospectus</a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
