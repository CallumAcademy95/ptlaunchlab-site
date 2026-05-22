import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import StickyMobileCTA from "../components/StickyMobileCTA";
import Accreditation from "../components/Accreditation";
import Reviews from "../components/Reviews";
import FunnelPricingBlock from "../components/FunnelPricingBlock";
import ProspectusButton from "../components/ProspectusButton";

const PAGE_URL = "https://ptlaunchlab.co.uk/retrain-as-a-personal-trainer";
const TODAY = new Date().toISOString().split("T")[0];

export const metadata: Metadata = {
  title: "Retrain as a Personal Trainer (UK) — Online Course Around the Kids | PT Launch Lab",
  description:
    "It's not too late. Retrain as a UK personal trainer around school hours and family life. NCFE Level 2 + 3, Ofqual regulated, fully online from home. Supportive route for parents and returners.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    title: "Retrain as a Personal Trainer (UK) — Online Course Around the Kids",
    description:
      "Build a fitness career around school hours and family life. Online from home, supportive tutor model, built for parents and returners. NCFE Level 2 + 3, Ofqual regulated.",
    url: PAGE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

// ─── COPY (empathy, permission, women-skewed but inclusive) ───────────────────

const forYouIf = [
  "You've put everyone else first for years and fitness is the one thing you've kept",
  "You're returning to work after kids, caring, illness, or a quiet rebuild",
  "You're 35, 40, 50 and quietly wondering if it's already too late",
  "You want work that fits the school run — not the other way round",
  "You've been the woman who shows up at the gym at 6am or 9:30am consistently",
  "Other women already ask you what you eat, how you train, how you keep going",
];

const objections = [
  {
    q: "Have I left it too late? I'm in my 40s.",
    a: "No. Some of the most successful PTs we work with are women in their 30s, 40s, and 50s — and the market actively prefers them for the clients who matter most. A 45-year-old woman who's just had a baby doesn't want a 22-year-old man coaching her squat. She wants someone who's lived a body like hers. Life experience is the unfair advantage, not the obstacle. We've put learners through in their late 50s who are now running thriving local coaching businesses.",
  },
  {
    q: "Can I actually do this around the kids?",
    a: "Yes — and it's how the majority of returner students do it. The course is fully online via Google Classroom, fully self-paced. No fixed class times, no in-person workshops, no commute. You log in while they're at school, while the baby naps, after bedtime, on a Saturday morning while your partner has them. Practical units are video-assessed at any local gym (a quiet weekday slot is ideal). Most returners finish in 12–20 weeks.",
  },
  {
    q: "I haven't studied in years. What if I can't cope?",
    a: "Your tutor is introduced within 24 hours of enrolment and stays with you for the whole course. Before you submit any assessment, they review your work and tell you what to fix. Most learners never fail because the system catches issues before submission. Resubmissions are included at no extra cost. You're not relearning how to be a student alone — there's a real person walking with you.",
  },
  {
    q: "Do I have to become an Instagram influencer to make this work?",
    a: "No — and please don't try. The most sustainable returner-PT businesses are built locally on referrals, school-gate trust, and word-of-mouth. The £500 Mentorship Hub (free with your course) teaches you how to build a small, profitable, niched client base — women's strength, postnatal recovery, midlife fitness, beginner confidence — without ever doing a transition reel. You're not building a brand. You're building a practice.",
  },
];

const steps = [
  { n: 1, title: "Book a free 15-min chat — no pressure", body: "Tell us your situation: kids' ages, what time you've actually got, what's pulling you towards PT. We'll listen first, then tell you honestly if it's the right move." },
  { n: 2, title: "Enrol on a plan that fits the household", body: "£599 deposit + 5 × £200 monthly is the most popular. Payl8er finance 3–18 months. Stripe 0% over 12. Most returners spread it across school terms." },
  { n: 3, title: "Study from home, on your hours", body: "100% online via Google Classroom. Tutor introduced within 24 hours. While they're at school, after bedtime, weekend mornings — entirely your call." },
  { n: 4, title: "Smash Level 2 — Gym Instructor", body: "Anatomy, physiology, gym floor coaching, client consultations. The legal prerequisite — already included in your fee, with full tutor support." },
  { n: 5, title: "Qualify in Level 3 — NCFE, Ofqual regulated", body: "Programming, nutrition, business planning, video-assessed practicals. The qualification UK gyms and insurers both recognise by default." },
  { n: 6, title: "Launch the business YOU want, locally", body: "Mentorship Hub walks you through niching, local marketing, pricing, packaging, and your first 10 clients. Women's strength, postnatal, midlife — your call." },
];

const faqs = [
  {
    q: "Is 40 too old to retrain as a personal trainer in the UK?",
    a: "No. The UK PT market has a genuine shortage of qualified coaches who understand busy parents, midlife bodies, and women's specific goals. Clients in their 30s, 40s, and 50s consistently prefer a PT who relates to them. We've put learners through in their late 50s who are now coaching full diaries. The blocker isn't age — it's confidence, and that's exactly what the course and mentorship are built to rebuild.",
  },
  {
    q: "Can I really retrain around school hours and family life?",
    a: "Yes. The course is fully online via Google Classroom, fully self-paced. No fixed class times, no commute, no childcare requirements for study. Practical units are video-assessed at any gym. Most returners finish the full Level 2 + Level 3 in 12–20 weeks fitting study around school runs, bedtimes, and weekends.",
  },
  {
    q: "I haven't studied in years. Will I cope with the assessments?",
    a: "Yes. Your personal tutor is assigned within 24 hours of enrolment and stays with you throughout. Before you submit any assessment, they review your work and tell you what to tweak. Most learners never fail because the system catches issues before submission. Resubmissions are free if you ever need them.",
  },
  {
    q: "Can I do this without ever going to a college or classroom?",
    a: "Yes — 100%. Theory is delivered online via Google Classroom. Practical units are video-based: you film yourself coaching a real session at any local gym, and your tutor reviews the footage remotely. NCFE, Focus Awards, and Active IQ all accept video assessment. You never need to step into a classroom.",
  },
  {
    q: "I want to coach women specifically — is that realistic?",
    a: "It's one of the strongest niches in the UK market. Women-only training, postnatal recovery, midlife strength, perimenopausal fitness, and beginner confidence are all undersupplied and growing. Many female returner-PTs we work with build their entire client base on referrals from one school-gate network. The Mentorship Hub has a dedicated track on niching down, and our community has plenty of women coaching women you can learn from directly.",
  },
  {
    q: "What's the realistic income for a returner-PT in year one?",
    a: "Part-time around school hours, year one: £12K–£25K. Full-time self-employed after 2–3 years: £35K–£50K+. Group sessions (4–8 people) push hourly rates significantly higher — common with school-hall classes and postnatal groups. The Mentorship Hub teaches pricing, packaging, and how to fill a small but profitable client base rather than chasing volume.",
  },
  {
    q: "When can I start, and what's the total cost?",
    a: "Start the moment you enrol — full Google Classroom access opens immediately and your tutor introduces themselves within 24 hours. £1,599 covers NCFE Level 2 + Level 3, your tutor, the £500 Mentorship Hub, and our gym pipeline. Most returners use the £599 deposit + 5 × £200 plan so it spreads across a school term.",
  },
];

// ─── SCHEMA ───────────────────────────────────────────────────────────────────

const courseSchema = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "NCFE Level 2 & Level 3 Diploma in Gym Instructing and Personal Training (Returner Pathway)",
  description:
    "Online UK PT qualification for parents and returners. Study from home around school hours and family life. Ofqual-regulated NCFE Level 2 + 3 with business mentorship and supportive tutor model.",
  provider: { "@type": "Organization", name: "PT Launch Lab", sameAs: "https://ptlaunchlab.co.uk" },
  educationalCredentialAwarded: "NCFE Level 3 Diploma in Gym Instructing and Personal Training (Ofqual ref 603/4388/6)",
  offers: { "@type": "Offer", price: "1599", priceCurrency: "GBP", availability: "https://schema.org/InStock", url: "https://ptlaunchlab.co.uk/enrol" },
  hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: "PT16W" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  headline: "Retrain as a Personal Trainer (UK) — Online Course Around the Kids",
  description: "Build a fitness career around school hours and family. Online UK NCFE Level 2 + 3, supportive route for parents and returners.",
  url: PAGE_URL,
  datePublished: `${TODAY}T12:00:00Z`,
  dateModified: `${TODAY}T12:00:00Z`,
  inLanguage: "en-GB",
  author: [
    { "@type": "Person", name: "Callum Brown", jobTitle: "Co-founder, PT Launch Lab", url: "https://ptlaunchlab.co.uk/about" },
    { "@type": "Person", name: "Ryan Robinson", jobTitle: "Co-founder, PT Launch Lab", url: "https://ptlaunchlab.co.uk/about" },
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

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function RetrainAsAPersonalTrainerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Breadcrumbs trail={[{ name: "Retrain as a Personal Trainer", url: PAGE_URL }]} />

      <Nav />
      <main className="pt-[72px]">

        {/* HERO — empathy + permission */}
        <section className="bg-base py-20 md:py-28 px-6 relative overflow-hidden">
          <div className="absolute -left-48 top-0 w-[600px] h-[600px] rounded-full bg-gold opacity-[0.06] blur-3xl pointer-events-none" />
          <div className="absolute -right-32 bottom-0 w-[500px] h-[500px] rounded-full bg-blue opacity-[0.07] blur-3xl pointer-events-none" />
          <div className="relative max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/40 bg-gold/5 mb-8">
              <span className="text-gold text-[11px] font-bold tracking-widest uppercase">For returners · Around the kids · Online from home</span>
            </div>
            <h1 className="font-display font-extrabold text-5xl md:text-8xl text-white leading-[0.95] tracking-tight mb-7">
              It's not too late
              <br />
              to <span className="text-gold">retrain.</span>
            </h1>
            <p className="text-xl text-soft/85 leading-relaxed mb-10 max-w-2xl mx-auto">
              If fitness has been the one thing you've kept hold of — through kids, caring, burnout, or a quiet rebuild — you can turn it into a career. NCFE Level 2 + Level 3, Ofqual regulated, fully online from home. Built for parents and returners, taught with kindness.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Link
                href="/book-call"
                data-cta="hero-primary"
                className="px-10 py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-gold/30"
              >
                Book a No-Pressure Chat →
              </Link>
            </div>
            <p className="text-soft/60 text-xs">
              ⭐ 5.0 · 19 Verified Google Reviews &nbsp;·&nbsp; Supportive tutor model &nbsp;·&nbsp; Honest answers only
            </p>
          </div>
        </section>

        {/* THIS IS FOR YOU IF */}
        <section className="bg-surface py-20 px-6 border-y border-white/[0.05]">
          <div className="max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">Built for one type of person</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-10">
              This is for you <span className="text-gold">if&hairsp;…</span>
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 max-w-3xl mx-auto">
              {forYouIf.map((line) => (
                <li key={line} className="flex items-start gap-3 text-white text-base">
                  <span className="text-gold font-bold text-lg shrink-0 mt-0.5">✓</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="text-soft/75 text-center text-base mt-10 max-w-2xl mx-auto">
              If four or more of those felt like reading your own thoughts — keep reading. The rest of this page is for you, specifically.
            </p>
          </div>
        </section>

        {/* EMPATHY — the quiet rebuild */}
        <section className="bg-base py-20 md:py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-4">You already know</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-8">
              You've spent years
              <br />
              putting <span className="text-gold">everyone else first.</span>
            </h2>
            <p className="text-soft/85 text-lg leading-relaxed mb-5">
              The kids needed you, the partner needed you, the parents needed you, the job needed you. Somewhere in the middle of all that you stopped being the centre of any decision — and you got quietly good at not being it.
            </p>
            <p className="text-soft/85 text-lg leading-relaxed mb-5">
              And the one thing that didn't leave was the gym. The 6am session before they wake up. The 9:30 slot when they're at school. The Sunday morning run that's yours and yours only. <span className="text-white font-semibold">Fitness has been the place where you've quietly stayed yourself.</span>
            </p>
            <p className="text-soft/85 text-lg leading-relaxed">
              You don't need to find your identity. You've been protecting it the whole time. You just need permission to build a career around it — and someone competent walking with you while you do.
            </p>
          </div>
        </section>

        {/* REMOVE FEAR — designed around real life */}
        <section className="bg-surface py-20 px-6 border-y border-white/[0.05]">
          <div className="max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">Designed around your life</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-6">
              No commute. No classroom.
              <br />
              <span className="text-gold">No turning your life upside down.</span>
            </h2>
            <p className="text-soft/80 text-lg text-center max-w-2xl mx-auto mb-12">
              Every piece of this course was built knowing you have school runs, bedtimes, dinners to cook, and a household that doesn't pause for your study. You don't need to fit your life around the course. The course fits around your life.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {[
                { tag: "Time", title: "Whenever they're not awake or there", body: "100% online via Google Classroom. While they're at school, after bedtime, weekend mornings — your hours, your pace. Most returners finish in 12–20 weeks." },
                { tag: "Money", title: "Spread across the school term", body: "£599 deposit + 5 × £200 monthly is the most popular plan. Payl8er over 3–18 months, Stripe 0% over 12. Designed so it never sits on top of the food shop." },
                { tag: "Support", title: "A real tutor — not a help desk", body: "Personal tutor introduced within 24 hours. Reviews your work before submission so assessments stop being scary. Resubmissions are free. You're not alone in this." },
                { tag: "Confidence", title: "We rebuild it on purpose", body: "The Mentorship Hub doesn't just teach business — it teaches the version of confidence you need when you've been out of the workforce. Specifically built for returners." },
              ].map((row) => (
                <div key={row.title} className="bg-card border border-white/[0.06] rounded-2xl p-6">
                  <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-2">{row.tag}</p>
                  <h3 className="text-white font-bold text-lg mb-2">{row.title}</h3>
                  <p className="text-soft/75 text-sm leading-relaxed">{row.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FUTURE IDENTITY — 12 months from now */}
        <section className="bg-base py-24 md:py-28 px-6 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[800px] h-[500px] rounded-full bg-gold/[0.05] blur-3xl" />
          </div>
          <div className="relative max-w-3xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-4">12 months from now</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-10">
              School run, then your client,
              <br />
              <span className="text-gold">then home for the next.</span>
            </h2>
            <ul className="space-y-5 text-lg text-soft/90">
              {[
                "You drop them off and go straight to your 9:30 client — a woman the same age as you, lifting heavier than she has in a decade.",
                "Your second client texts to say she's finally sleeping again. You wrote her a programme three weeks ago. She means it.",
                "You're home in time for pickup. The bills are paid this month from work you actually believe in.",
                "Another school-gate mum asks how much you charge. You tell her the price without flinching. She books.",
                "Your partner stops asking when you're going back to your 'old job.' You don't have an old job anymore.",
                "You're not waiting for permission to be useful. You're being useful, every day, to women who needed someone exactly like you.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="text-gold font-bold text-lg shrink-0 mt-0.5">→</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="text-soft/80 text-base leading-relaxed mt-10">
              This is the realistic outcome for a returner-PT who qualifies and uses the Mentorship Hub — not the influencer fantasy. A small, profitable, deeply local practice built on trust. The version that actually works around your life.
            </p>
          </div>
        </section>

        {/* OBJECTION HANDLING */}
        <section className="bg-surface py-20 px-6 border-y border-white/[0.05]">
          <div className="max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">The things you're quietly worried about</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-12">
              Said out loud,
              <br />
              <span className="text-gold">answered kindly.</span>
            </h2>
            <div className="space-y-6">
              {objections.map((o) => (
                <div key={o.q} className="bg-card border border-white/[0.06] rounded-2xl p-7 hover:border-gold/30 transition-colors">
                  <h3 className="text-white font-bold text-xl mb-3 flex items-start gap-3">
                    <span className="text-gold shrink-0">→</span>
                    <span>{o.q}</span>
                  </h3>
                  <p className="text-soft/80 text-base leading-relaxed pl-8">{o.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="bg-base py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">Your route back</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-6">
              Six steps.
              <br />
              <span className="text-gold">No drama. Your pace.</span>
            </h2>
            <p className="text-soft/75 text-center text-lg mb-14 max-w-2xl mx-auto">
              Most returners finish in 12–20 weeks fitting study around school runs, bedtimes, and weekends. Faster if you've got the energy, slower if life gets in the way — your call entirely.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {steps.map((step, i) => (
                <div
                  key={step.n}
                  className={`rounded-2xl p-6 border transition-all hover:-translate-y-0.5 ${
                    i === 5 ? "bg-card border-gold/40 shadow-xl shadow-gold/10" : "bg-card border-white/[0.06]"
                  }`}
                >
                  <p className={`text-xs font-bold tracking-widest uppercase mb-2 ${i === 5 ? "text-gold" : "text-blue"}`}>
                    Step {String(step.n).padStart(2, "0")}
                  </p>
                  <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-soft/70 text-sm leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="bg-surface py-20 px-6 border-y border-white/[0.05]">
          <div className="max-w-3xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">Pricing — no upsells</p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white text-center leading-none tracking-tight mb-6">
              Spread it
              <br />
              <span className="text-gold">across the school term.</span>
            </h2>
            <p className="text-soft/75 text-center text-base mb-10 max-w-xl mx-auto">
              £1,599 covers Level 2, Level 3, your tutor, the £500 Mentorship Hub, and our gym pipeline. Most returners use the £599 deposit + 5 × £200 plan — designed to never sit on top of the food shop.
            </p>
            <FunnelPricingBlock variant="dark" />
            <div className="mt-8 text-center">
              <ProspectusButton />
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        <Reviews />

        {/* ACCREDITATION */}
        <Accreditation />

        {/* FAQ */}
        <section className="bg-base py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">FAQ</p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white text-center leading-none tracking-tight mb-10">
              The questions returners ask.
            </h2>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group bg-card border border-white/[0.06] rounded-xl overflow-hidden open:border-gold/30 transition-colors"
                >
                  <summary className="cursor-pointer list-none px-6 py-5 flex items-center justify-between gap-4 hover:bg-surface/40 transition-colors">
                    <span className="text-white font-semibold text-[15px] pr-4">{faq.q}</span>
                    <span className="text-gold text-xl font-bold shrink-0 transition-transform duration-300 group-open:rotate-90">›</span>
                  </summary>
                  <div className="px-6 pb-6 pt-0">
                    <p className="text-soft/75 text-[15px] leading-relaxed">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-gradient-to-br from-base via-surface to-base py-24 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[700px] h-[420px] rounded-full bg-gold/[0.07] blur-3xl" />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-5">Your move</p>
            <h2 className="font-display font-extrabold text-5xl md:text-7xl text-white leading-none tracking-tight mb-6">
              You've put everyone else first.
              <br />
              <span className="text-gold">This one's yours.</span>
            </h2>
            <p className="text-soft/80 text-lg mb-10 max-w-xl mx-auto">
              Book 15 minutes with the team. We'll listen, give you a straight answer about whether this is the right fit, and show you exactly what your first realistic step looks like — kids, time and confidence all factored in.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link
                href="/book-call"
                data-cta="final-primary"
                className="px-10 py-4 rounded-full bg-gold text-deep font-bold hover:brightness-110 transition-all shadow-lg shadow-gold/30"
              >
                Book a No-Pressure Call →
              </Link>
              <Link
                href="/enrol"
                data-cta="final-secondary"
                className="px-10 py-4 rounded-full border-2 border-white/40 text-white font-semibold hover:bg-white/10 transition-all"
              >
                I'm Ready — Enrol
              </Link>
            </div>
            <p className="text-soft/50 text-xs">No hard sell · Honest answers only · Supportive route built specifically for parents and returners</p>
          </div>
        </section>

      </main>
      <Footer />
      <StickyMobileCTA />
    </>
  );
}
