import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import StickyMobileCTA from "../components/StickyMobileCTA";
import Accreditation from "../components/Accreditation";
import Reviews from "../components/Reviews";
import FunnelPricingBlock from "../components/FunnelPricingBlock";
import HeroLeadForm from "../components/HeroLeadForm";
import PromoBar from "../components/PromoBar";

const PAGE_URL = "https://ptlaunchlab.co.uk/career-change-to-personal-trainer";
const TODAY = new Date().toISOString().split("T")[0];

export const metadata: Metadata = {
  title: "Career Change to Personal Trainer (UK) — Qualify Without Quitting Your Job | PT Launch Lab",
  description:
    "Burned out at work? Train as a UK personal trainer around your current job. NCFE Level 2 + 3, Ofqual regulated, study evenings/weekends, business mentorship included.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    title: "Career Change to Personal Trainer (UK) — Qualify Without Quitting Your Job",
    description:
      "A realistic, evidence-backed route from desk job to PT career. Study around full-time work. Business mentorship included. Transition safely.",
    url: PAGE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

// ─── COPY ─────────────────────────────────────────────────────────────────────

const forYouIf = [
  "You're burnt out in corporate, hospitality, sales, retail or shift work",
  "You're working hard for a future that isn't yours",
  "Fitness has been the one thing you keep coming back to",
  "You can't quit yet — there's a mortgage / kids / rent / both",
  "You've thought 'I should be doing this for a living' more than once",
  "You want a believable transition, not a quit-your-job-on-Monday fantasy",
];

const objections = [
  {
    q: "I can't quit my job to retrain. Is this actually doable around full-time work?",
    a: "Yes — it's how most of our career-changers do it. The course is fully online, fully self-paced, with no fixed class times. Theory units fit around evenings and lunch breaks; practical units are video-assessed at any gym, on your schedule. Average study load is 8–10 hours a week. Most career-changers finish Level 2 + Level 3 in 8–16 weeks while still earning full-time. You don't quit. You qualify, then you transition.",
  },
  {
    q: "Isn't the PT industry saturated? Will there even be space for me?",
    a: "The industry is saturated with PTs who don't know how to get clients — not with PTs who do. Roughly 80% of newly-qualified UK PTs quit inside 18 months. They didn't fail at training. They failed at marketing, pricing, and client retention — the bit nobody taught them. Our £500 Mentorship Hub is built specifically to close that gap, bundled free with your course. You don't compete with the cert-only PTs. You skip past them.",
  },
  {
    q: "I'm not 'salesy.' Will I have to do the cringe gym-floor pitch?",
    a: "No. Plenty of our most successful learners came from quiet, technical, non-sales backgrounds. The Mentorship Hub walks you through the conversations, the pricing, the messaging, the social posts — as a system, not as a personality. You don't need a sales personality. You need a sales process. We give you one.",
  },
  {
    q: "What if the income doesn't replace my current salary?",
    a: "Employed-first is the safer bridge. We make warm introductions into our partner gym network when you qualify — PureGym, JD Gyms, Nuffield Health, and independents we've personally hired into. Year one salary: £20K–£28K base plus commission. You stay in your current job long enough to overlap salaries, then transition. Self-employed PTs after 2–3 years routinely hit £35K–£50K+. The pathway is gradual, not a cliff edge.",
  },
];

const steps = [
  { n: 1, title: "Book a free 15-min call", body: "Tell us your situation honestly. Current role, hours, financial pressure, when you want to be out. We'll tell you if the maths actually works — and if it doesn't." },
  { n: 2, title: "Enrol on a plan that doesn't stress your salary", body: "£599 deposit then 5 × £200 monthly is the most popular. Payl8er finance 3–18 months. Stripe 0% over 12. Payments roughly match a single PT session per week once you qualify." },
  { n: 3, title: "Study evenings + weekends — keep earning", body: "Tutor introduced within 24 hours. Average 8–10 hours per week alongside full-time work. Level 2 done in ~4 weeks, Level 3 in another ~6–8." },
  { n: 4, title: "Qualify — NCFE, Ofqual regulated", body: "The qualification UK gym managers ask for by name. Register with CIMSPA, get insured (~£60/year), legally take paying 1-to-1 clients anywhere in the UK." },
  { n: 5, title: "Transition employed-first — warm gym introductions", body: "We've personally hired 500+ PTs through our network. Direct warm intros into salaried PT roles — no cold CV drops. Overlap salaries while you build your client base." },
  { n: 6, title: "Scale via the Mentorship Hub when ready", body: "When your client roster outgrows your old salary, leave the day job. Hub walks you through pricing, packaging, retention. Most career-changers replace their salary inside 6–12 months." },
];

const comparisonRows = [
  { other: "Built for school-leavers in classrooms",       us: "Built for working adults — online, self-paced" },
  { other: "Quit your job to study full-time",             us: "Study evenings + weekends while you keep earning" },
  { other: "Just a certificate — figure clients out alone", us: "£500 Mentorship Hub bundled free" },
  { other: "Lecturer telling you the theory",              us: "Gym owners who've personally hired 500+ PTs" },
  { other: "Cold CV drops once you qualify",               us: "Warm intros to salaried roles in our network" },
  { other: "Surprise upsell fees post-enrolment",          us: "£1,599 total. Nothing sold as a paid upgrade later" },
];

const faqs = [
  { q: "Can I really qualify as a personal trainer while working full-time in the UK?", a: "Yes. 100% online via the Merve app, fully self-paced. No fixed class times, no commute, no weekend workshops. Practical units are video-assessed at any gym — you film yourself coaching real movements, your tutor reviews. Most career-changers put in 8–10 hours per week and finish in 8–16 weeks while still earning full-time." },
  { q: "Is it too late to change careers in my 30s or 40s?", a: "No — and the UK PT market actively rewards career-changers in this age bracket. Life experience, professional sales instinct from your existing job, and the maturity to actually run a business are advantages younger PTs haven't built. Clients in their 30s–50s consistently prefer a PT who relates to them. We've put learners through in their late 50s and they're working." },
  { q: "How much can I realistically earn as a PT in year one?", a: "Employed at a commercial gym: £20K–£28K base in year one, plus session commission. Self-employed on a rent-a-space deal: £25K–£45K in year one if you actively market. Established self-employed PTs after 2–3 years regularly earn £35K–£50K+. The Mentorship Hub is built specifically to compress that timeline by teaching the business side from day one." },
  { q: "What if I don't want to be self-employed?", a: "Employed-first is a real route. We make warm introductions into our partner gym network — PureGym, JD Gyms, The Gym Group, Nuffield Health, plus independents. Plenty of career-changers stay salaried for 12–18 months, then either stay or transition. There's no requirement to go solo." },
  { q: "What does the £500 Mentorship Hub include?", a: "Your private dashboard built around one job: walking you from qualified to fully booked. Modules on niche, offer design, pricing, sales conversations, marketing, social media, and client retention. Templates, scripts, contracts, plus our private Skool community for daily peer contact. Bundled free with your course — most UK academies charge £500–£3,000 for this layer or skip it entirely." },
  { q: "When can I start?", a: "Immediately. The moment you enrol, your Merve app access opens and your tutor introduces themselves within 24 hours. No cohort start dates. Most career-changers start the evening they sign up and have their first unit done by the weekend." },
];

const founders = [
  { src: "/callum.webp", name: "Callum",  role: "Head of Education", quote: "Career-changers in their 30s & 40s outperform everyone else when they get the business side." },
  { src: "/ryan.webp",   name: "Ryan",    role: "Co-founder",        quote: "Most PTs fail because nobody taught them the business. We built the course we wish had existed." },
  { src: "/miles.webp",  name: "Miles",   role: "Business Mentor",   quote: "You don't need a sales personality. You need a sales process. We give you one." },
];

// ─── SCHEMA ───────────────────────────────────────────────────────────────────

const courseSchema = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "NCFE Level 2 & Level 3 Diploma in Gym Instructing and Personal Training (Career Change Pathway)",
  description: "Career-change-to-PT pathway for working UK adults. Study around a full-time job, qualify in 8–16 weeks, includes business mentorship and warm-introduction interviews into employed PT roles.",
  provider: { "@type": "Organization", name: "PT Launch Lab", sameAs: "https://ptlaunchlab.co.uk" },
  educationalCredentialAwarded: "NCFE Level 3 Diploma in Gym Instructing and Personal Training (Ofqual ref 603/4388/6)",
  offers: { "@type": "Offer", price: "1599", priceCurrency: "GBP", availability: "https://schema.org/InStock", url: "https://ptlaunchlab.co.uk/enrol" },
  hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: "PT12W" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  headline: "Career Change to Personal Trainer (UK) — Qualify Without Quitting Your Job",
  description: "Realistic UK route from desk job to PT. Study around work. Business mentorship included. Transition safely.",
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

export default function CareerChangeToPersonalTrainerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Breadcrumbs trail={[{ name: "Career Change to Personal Trainer", url: PAGE_URL }]} />

      <PromoBar />
      <Nav />
      <main className="pt-[72px]">

        {/* HERO — calm, credible, inline lead capture */}
        <section className="bg-base py-16 md:py-24 px-6 relative overflow-hidden">
          <div className="absolute -left-48 top-0 w-[600px] h-[600px] rounded-full bg-gold opacity-[0.06] blur-3xl pointer-events-none" />
          <div className="absolute -right-32 bottom-0 w-[500px] h-[500px] rounded-full bg-blue opacity-[0.07] blur-3xl pointer-events-none" />
          <div className="relative max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/40 bg-gold/5 mb-8">
              <span className="text-gold text-[11px] font-bold tracking-widest uppercase">For working adults · Around your job · Ofqual regulated</span>
            </div>
            <h1 className="font-display font-extrabold text-5xl md:text-8xl text-white leading-[0.95] tracking-tight mb-7">
              Sick of working a job
              <br />
              <span className="text-gold">you&apos;ve outgrown?</span>
            </h1>
            <p className="text-xl text-soft/85 leading-relaxed mb-10 max-w-2xl mx-auto">
              Train as a qualified UK PT around your current job. NCFE Level 2 + Level 3, Ofqual regulated, fully online — with the business mentorship most courses leave out. Take the 60-second quiz to see if PT is a believable next step for your situation. Honest answer either way.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Link
                href="/quiz?avatar=switcher"
                data-cta="hero-quiz"
                className="px-10 py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-gold/30 text-center"
              >
                See If PT Could Suit You →
              </Link>
              <Link
                href="/book-call"
                data-cta="hero-bookcall"
                className="px-10 py-4 rounded-full border-2 border-white/30 text-white font-semibold text-base hover:bg-white/10 transition-all text-center"
              >
                Already Sure? Book a Call
              </Link>
            </div>
            <p className="text-soft/55 text-xs">60 seconds · No email required to start · Honest result either way</p>
            <p className="text-soft/60 text-xs mt-4">
              ⭐ 5.0 · 19 Verified Google Reviews &nbsp;·&nbsp; Built around full-time work &nbsp;·&nbsp; No hard sell, no pressure
            </p>
          </div>
        </section>

        {/* VSL */}
        <section className="bg-surface py-16 px-6 border-y border-white/[0.05]">
          <div className="max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">Watch first — 4 minutes</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white text-center leading-none tracking-tight mb-3">
              Why 80% of PTs fail —
              <br />
              <span className="text-gold">and exactly how we fix it.</span>
            </h2>
            <p className="text-soft/75 text-center text-base max-w-2xl mx-auto mb-10">
              Callum, Miles and Ryan on what most courses get wrong, what gym managers actually hire for, and why this one&apos;s built differently — specifically for career-changers.
            </p>
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl aspect-video">
              <iframe
                src="https://www.youtube.com/embed/0rhp9fkBFsU"
                title="Why PT Launch Lab — from the founders"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full absolute inset-0"
              />
            </div>
          </div>
        </section>

        {/* THIS IS FOR YOU IF */}
        <section className="bg-base py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">Built for one type of person</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-10">
              This is for you <span className="text-gold">if&hellip;</span>
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
              If you ticked four or more — you&apos;re not browsing. You&apos;re stuck. The rest of this page is the route out.
            </p>
          </div>
        </section>

        {/* EMPATHY */}
        <section className="bg-surface py-20 md:py-24 px-6 border-y border-white/[0.05]">
          <div className="max-w-3xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-4">You already know</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-8">
              You&apos;re good at working hard.
              <br />
              <span className="text-gold">You&apos;re working hard for something you no longer want.</span>
            </h2>
            <p className="text-soft/85 text-lg leading-relaxed mb-5">
              The Sunday-night dread is back. The 6:45 alarm has stopped feeling normal. You&apos;re checking your phone in meetings, doing the bare minimum, and wondering when this stopped being your life.
            </p>
            <p className="text-soft/85 text-lg leading-relaxed mb-5">
              And every time it gets bad you do the same thing — you go to the gym. That hour at lunchtime, the early session before work, the late evening when the office finally goes quiet. <span className="text-white font-semibold">Fitness has been the one thing that&apos;s never let you down.</span>
            </p>
            <p className="text-soft/85 text-lg leading-relaxed">
              You&apos;re not going to wake up next year and find that the desk has gotten better. The question stops being &ldquo;should I change careers&rdquo; and starts being &ldquo;what does a realistic exit actually look like.&rdquo;
            </p>
          </div>
        </section>

        {/* SKIP-THE-QUIZ — secondary lead capture for high intent */}
        <section className="bg-gradient-to-b from-base via-card to-base py-16 px-6 border-y border-gold/15">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-3">Already decided?</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-4">
              Skip the quiz.
              <br />
              <span className="text-gold">Map your transition with the team.</span>
            </h2>
            <p className="text-soft/75 text-base mb-8 max-w-xl mx-auto">
              If you already know PT is the move, drop your details. We&apos;ll WhatsApp you a quick intro, lock in £200 off, and you can book a 15-min transition call straight after.
            </p>
            <HeroLeadForm avatar="switcher" />
          </div>
        </section>

        {/* FOUNDERS STRIP */}
        <section className="bg-base py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">Run by gym owners</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white text-center leading-none tracking-tight mb-10">
              We&apos;ve hired the PT
              <br />
              <span className="text-gold">you&apos;re about to become.</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {founders.map((f) => (
                <div key={f.name} className="bg-card border border-white/[0.06] rounded-2xl p-6 text-center hover:border-gold/30 transition-all">
                  <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-gold/50 mb-4">
                    <Image src={f.src} alt={f.name} fill className="object-cover object-top" sizes="96px" />
                  </div>
                  <p className="text-white font-bold text-lg">{f.name}</p>
                  <p className="text-gold text-xs font-bold tracking-widest uppercase mt-1 mb-4">{f.role}</p>
                  <p className="text-soft/80 text-sm italic leading-relaxed">&ldquo;{f.quote}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DESIGNED AROUND REAL LIFE */}
        <section className="bg-surface py-20 px-6 border-y border-white/[0.05]">
          <div className="max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">Designed around real life</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-6">
              No quitting on Monday.
              <br />
              <span className="text-gold">No financial freefall.</span>
            </h2>
            <p className="text-soft/80 text-lg text-center max-w-2xl mx-auto mb-12">
              Every single piece of this course is built to be done on top of a full-time job — including the way it&apos;s priced.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {[
                { tag: "Hours", title: "8–10 hours a week, on your terms", body: "100% online via the Merve app. No fixed class times, no commute, no commitments outside your control. Most learners study evenings and weekends." },
                { tag: "Cost", title: "Spread across your transition", body: "£599 deposit + 5 × £200 monthly is the most popular plan. Roughly matches a single PT session per week once you qualify. Payl8er 3–18 months and Stripe 0% over 12 also available." },
                { tag: "Support", title: "Real tutor, not a help-desk ticket", body: "Personal tutor introduced within 24 hours. Reviews your work before submission so the assessments stop being scary." },
                { tag: "Exit", title: "Employed-first, then self-employed", body: "Warm-introduction interviews into our partner gym network. Overlap salaries while you build your client base. No leap-of-faith required." },
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

        {/* COMPARISON TABLE */}
        <section className="bg-base py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">The honest comparison</p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white text-center leading-none tracking-tight mb-4">
              Most PT courses
              <br />
              <span className="text-gold">aren&apos;t built for working adults.</span>
            </h2>
            <p className="text-soft/75 text-center text-base mb-12 max-w-2xl mx-auto">
              They&apos;re built for 18-year-old college kids in classrooms. You need something different.
            </p>
            <div className="rounded-2xl overflow-hidden border border-white/[0.06]">
              <div className="grid grid-cols-2 bg-card">
                <div className="px-5 sm:px-6 py-4 border-r border-white/[0.06]">
                  <p className="text-soft/60 text-[11px] font-bold uppercase tracking-widest">Most PT Courses</p>
                </div>
                <div className="px-5 sm:px-6 py-4 bg-gold/[0.05]">
                  <p className="text-gold text-[11px] font-bold uppercase tracking-widest">PT Launch Lab</p>
                </div>
              </div>
              {comparisonRows.map((row, i) => (
                <div key={i} className={`grid grid-cols-2 border-t border-white/[0.06] ${i % 2 === 0 ? "bg-surface" : "bg-base"}`}>
                  <div className="px-5 sm:px-6 py-4 border-r border-white/[0.06] flex items-start gap-3">
                    <span className="text-red-400/80 shrink-0 mt-0.5 font-bold">✕</span>
                    <p className="text-soft/65 text-sm leading-relaxed">{row.other}</p>
                  </div>
                  <div className="px-5 sm:px-6 py-4 flex items-start gap-3 bg-gold/[0.02]">
                    <span className="text-gold shrink-0 mt-0.5 font-bold">✓</span>
                    <p className="text-white text-sm leading-relaxed font-medium">{row.us}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FUTURE IDENTITY */}
        <section className="bg-surface py-24 md:py-28 px-6 border-y border-white/[0.05] relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[800px] h-[500px] rounded-full bg-gold/[0.05] blur-3xl" />
          </div>
          <div className="relative max-w-3xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-4">18 months from now</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-10">
              The Tuesday morning
              <br />
              <span className="text-gold">that doesn&apos;t feel like a chore.</span>
            </h2>
            <ul className="space-y-5 text-lg text-soft/90">
              {[
                "Your alarm goes off and you're walking into a gym you chose — not a job you tolerate.",
                "Your 8am client just rebooked for next week. The 10am cancelled and rescheduled. You're booked-out by lunchtime.",
                "You're paying the mortgage off PT income that finally crossed your old salary.",
                "Your friends from the old job ask how you did it. You tell them honestly — qualification, the Mentorship Hub, the warm gym introductions, the slow overlap.",
                "You haven't opened that payroll software in 14 months.",
                "You're earning from work that doesn't hollow you out.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="text-gold font-bold text-lg shrink-0 mt-0.5">→</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* OBJECTIONS */}
        <section className="bg-base py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">The four things actually stopping you</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-12">
              Honest answers
              <br />
              <span className="text-gold">to honest worries.</span>
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
        <section className="bg-surface py-20 px-6 border-y border-white/[0.05]">
          <div className="max-w-6xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">Your transition plan</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-6">
              Six steps.
              <br />
              <span className="text-gold">No gamble. No cliff edge.</span>
            </h2>
            <p className="text-soft/75 text-center text-lg mb-14 max-w-2xl mx-auto">
              Most career-changers finish in 8–16 weeks while still earning full-time, then transition employed-first before going solo.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {steps.map((step, i) => (
                <div key={step.n} className={`rounded-2xl p-6 border transition-all hover:-translate-y-0.5 ${i === 5 ? "bg-card border-gold/40 shadow-xl shadow-gold/10" : "bg-card border-white/[0.06]"}`}>
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

        {/* LEARNER PHOTO STRIP */}
        <section className="bg-base py-14 overflow-hidden">
          <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-8">Real career-changers · Real PT careers</p>
          <div className="overflow-hidden">
            <div className="flex gap-3 md:gap-4 animate-scroll-x w-max px-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n, i) => (
                <div key={i} className="relative shrink-0 w-36 h-52 sm:w-44 sm:h-60 md:w-56 md:h-72 rounded-2xl overflow-hidden border border-white/[0.06] shadow-xl">
                  <Image src={`/learner-${n}.png`} alt="PT Launch Lab learner" fill className="object-cover object-center" sizes="(max-width: 640px) 144px, (max-width: 768px) 176px, 224px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-base/70 to-transparent" />
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
              Spread the cost
              <br />
              <span className="text-gold">across your exit.</span>
            </h2>
            <p className="text-soft/75 text-center text-base mb-10 max-w-xl mx-auto">
              £1,599 covers Level 2, Level 3, your tutor, the £500 Mentorship Hub, and warm gym intros. Most career-changers use the deposit plan so payments roughly match one PT session per week post-qualification.
            </p>
            <FunnelPricingBlock variant="dark" />
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
              Working-adult questions, answered.
            </h2>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <details key={faq.q} className="group bg-card border border-white/[0.06] rounded-xl overflow-hidden open:border-gold/30 transition-colors">
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

        {/* TWO-OPTION CLOSE */}
        <section className="bg-surface py-24 px-6 border-t border-white/[0.05] relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[700px] h-[400px] rounded-full bg-gold/[0.05] blur-3xl" />
          </div>
          <div className="relative max-w-5xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">Ready to make a move?</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-4">
              Two routes out.
              <br />
              <span className="text-gold">Both believable.</span>
            </h2>
            <p className="text-soft/75 text-center text-lg mb-14 max-w-xl mx-auto">
              Pick the one that matches where you actually are. We&apos;ll handle the rest.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border-2 border-gold/70 rounded-2xl p-8 flex flex-col shadow-xl shadow-gold/10">
                <div className="mb-4">
                  <span className="bg-gold text-deep text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Most popular</span>
                </div>
                <h3 className="text-white text-2xl font-bold mb-3">I&apos;ve decided. Let&apos;s start.</h3>
                <p className="text-soft/75 text-[15px] leading-relaxed mb-6">
                  Enrol today and start studying tonight. Your tutor is introduced within 24 hours — payment plans designed to never sit on top of your salary.
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {["Immediate access to the Merve app", "Tutor introduced within 24 hours", "Pay £599 + 5 × £200 monthly", "Cancel within 7 days, no questions"].map((line) => (
                    <li key={line} className="flex items-center gap-3 text-sm">
                      <span className="text-gold font-bold">✓</span>
                      <span className="text-white">{line}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/enrol" data-cta="close-enrol" className="block w-full text-center py-4 rounded-full bg-gold text-deep font-bold hover:brightness-110 transition-all shadow-lg shadow-gold/30">
                  Enrol Now →
                </Link>
              </div>
              <div className="bg-card border-2 border-white/15 rounded-2xl p-8 flex flex-col">
                <div className="mb-4">
                  <span className="bg-blue text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">No hard sell</span>
                </div>
                <h3 className="text-white text-2xl font-bold mb-3">I want to talk it through first.</h3>
                <p className="text-soft/75 text-[15px] leading-relaxed mb-6">
                  Book 15 minutes with the team. We&apos;ll map your transition based on your salary, time, and timeline — and tell you straight if it isn&apos;t a fit.
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {["15 minutes, completely free", "Honest pathway plan", "No script, no hard sell", "We'll tell you if it's not right for you"].map((line) => (
                    <li key={line} className="flex items-center gap-3 text-sm">
                      <span className="text-blue font-bold">✓</span>
                      <span className="text-white">{line}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/book-call" data-cta="close-bookcall" className="block w-full text-center py-4 rounded-full border-2 border-gold text-gold font-bold hover:bg-gold hover:text-deep transition-all">
                  Book a Free Career Call →
                </Link>
              </div>
            </div>
            <p className="text-soft/50 text-xs text-center mt-8">No commitment · Tutor introduced within 24 hours · Cancel anytime in your first 7 days</p>
          </div>
        </section>

      </main>
      <Footer />
      <StickyMobileCTA />
    </>
  );
}
