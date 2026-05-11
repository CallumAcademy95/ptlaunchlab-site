import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import StickyMobileCTA from "../components/StickyMobileCTA";
import MidContentCTA from "../components/MidContentCTA";

const PAGE_URL = "https://ptlaunchlab.co.uk/how-to-become-a-personal-trainer-uk";
const TODAY = new Date().toISOString().split("T")[0];

export const metadata: Metadata = {
  title: "How to Become a Personal Trainer in the UK (2026 Step-by-Step) | PT Launch Lab",
  description:
    "The honest 2026 roadmap to becoming a UK personal trainer — 5 steps from decision to earning. Written by gym owners who've hired 500+ PTs. Costs, timelines, common mistakes.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "article",
    title: "How to Become a Personal Trainer in the UK (2026 Step-by-Step)",
    description:
      "The honest 5-step roadmap from decision to your first paying clients. Costs, timelines, awarding bodies, employed vs self-employed, and how to avoid the £29 PDF trap.",
    url: PAGE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

const steps = [
  {
    n: 1,
    id: "step-1",
    title: "Decide if PT is actually right for you",
    summary:
      "Before you spend £1,500+ on a qualification, work out honestly whether the day-to-day matches what you actually want. The job is people work, not gym work.",
  },
  {
    n: 2,
    id: "step-2",
    title: "Pick a regulated Level 2 + 3 qualification",
    summary:
      "Ofqual-regulated, awarded by NCFE / Focus Awards / Active IQ, recognised by CIMSPA. Everything else is a PDF that won't get you insured.",
  },
  {
    n: 3,
    id: "step-3",
    title: "Get qualified (4–8 weeks online, longer in-person)",
    summary:
      "How modern PT qualifications actually work in 2026 — fully online theory, video-assessed practicals, a tutor in your inbox. Most learners qualify in 4 to 8 weeks around a full-time job.",
  },
  {
    n: 4,
    id: "step-4",
    title: "Land your first PT role",
    summary:
      "Three real routes: employed at a commercial gym (PureGym, The Gym Group, Nuffield), self-employed on a rent-a-space deal, or hybrid online from day one.",
  },
  {
    n: 5,
    id: "step-5",
    title: "Build to your first 10 paying clients",
    summary:
      "The bit that kills careers. 80% of newly-qualified UK PTs quit inside 18 months — almost always because they qualified but couldn't get clients. Here's the system that works.",
  },
];

const faqs = [
  {
    q: "How do I become a personal trainer in the UK with no experience?",
    a: "The official route is the same whether you've been in fitness for 10 years or you're starting from a desk job: complete a Level 2 Gym Instructor qualification followed by Level 3 Personal Trainer, both Ofqual-regulated. Most decent UK courses bundle the two and you can complete the lot in 4 to 8 weeks online, around a full-time job. You don't need a sports degree, a 6-pack, or to be under 30. The bit that matters more than your starting point is what you do in the first 90 days after qualifying — that's when most people quit.",
  },
  {
    q: "What qualifications do you need to be a personal trainer in the UK?",
    a: "Level 2 Gym Instructor + Level 3 Personal Trainer, both Ofqual-regulated and ideally awarded by NCFE, Focus Awards, or Active IQ. With those two you can register with CIMSPA, get public liability insurance from places like Insure4Sport, and legally take paying 1-to-1 clients in any UK commercial gym. You don't need a sport science degree. You don't need separate first aid until your insurer requires it. Anyone selling you a 'Level 3 Diploma' from an unregulated awarding body is selling you a CPD certificate, not a qualification.",
  },
  {
    q: "How long does it take to become a personal trainer in the UK?",
    a: "The qualification itself takes 4 to 16 weeks depending on your hours and the provider. Fast-track online learners finish in 4 to 6 weeks studying evenings and weekends. Add another 4 to 12 weeks after qualifying to land your first proper role and fill an initial client book. Realistic end-to-end timeline from 'I'm thinking about it' to 'I'm earning': 3 to 6 months. Anyone telling you 'qualify Monday, full diary by Friday' is selling marketing, not a career.",
  },
  {
    q: "How much does it cost to become a personal trainer in the UK?",
    a: "The qualification itself ranges £600 to £2,800 depending on provider. The realistic total cost to actually start earning — qualification, public liability insurance (~£60/year), CIMSPA registration (~£40/year), basic kit and admin — sits between £700 and £3,000 for the first 12 months. Most learners land in the £1,500 to £1,800 bracket. Add another 6 to 12 weeks of reduced income while you fill your client diary if you're going self-employed straight away.",
  },
  {
    q: "Is 40 (or 50) too old to become a personal trainer in the UK?",
    a: "No. Career-changer PTs in their 40s and 50s often outperform 22-year-olds because they bring real-world experience — conversation, sales instinct, life context — that younger trainers haven't built yet. We've put learners through our course in their late 50s and they're working. The blocker isn't age. The blocker is whether you'll do the work to get clients in your first 90 days. See our full case for older learners.",
  },
  {
    q: "Can you become a personal trainer online from home?",
    a: "Yes. Since COVID, fully online has become the default route in the UK, not the exception. Theory units have always worked online. Practical units are now video-assessed — you film yourself coaching real movements, your tutor reviews the footage. NCFE, Focus Awards, and Active IQ all accept video assessment. Every major UK commercial gym hires online-qualified PTs every week. The qualification on the paper is what counts; whether you got it in a classroom or on Zoom doesn't.",
  },
  {
    q: "Employed vs self-employed PT — which is better to start with?",
    a: "Employed first is the lower-risk start. Salary £20,000-£28,000, you learn how a gym actually runs, you build a network of regular faces who later become your private clients if you go self-employed. Self-employed from day one means renting space at a commercial gym (£150-£500/month) or working from a private studio — higher ceiling (£35,000-£80,000+) but you have to find every client yourself from a standing start. Most successful UK PTs do 12-18 months employed then go self-employed once they have a roster.",
  },
  {
    q: "Do I need a degree to be a personal trainer in the UK?",
    a: "No. No commercial gym, insurance provider, or governing body in the UK requires a degree to work as a PT. Sport science or exercise physiology degrees are useful if you want to specialise in strength & conditioning, rehab, or elite athletes — but they're the route 5% of working UK PTs took. The Level 3 NCFE (or equivalent) is the industry standard. If you've already got a degree in something unrelated, it's irrelevant to your PT career — go straight to Level 3.",
  },
];

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Become a Personal Trainer in the UK",
  description:
    "Step-by-step UK roadmap to becoming a qualified, employed and earning personal trainer — from decision through to your first 10 paying clients.",
  image: "https://ptlaunchlab.co.uk/og-image.png",
  totalTime: "P12W",
  estimatedCost: {
    "@type": "MonetaryAmount",
    currency: "GBP",
    value: "1599",
  },
  supply: [
    { "@type": "HowToSupply", name: "Ofqual-regulated Level 2 + 3 PT qualification" },
    { "@type": "HowToSupply", name: "Public liability insurance" },
    { "@type": "HowToSupply", name: "CIMSPA registration" },
  ],
  tool: [{ "@type": "HowToTool", name: "Laptop or smartphone with camera (for video-assessed practicals)" }],
  step: steps.map((s) => ({
    "@type": "HowToStep",
    position: s.n,
    name: s.title,
    text: s.summary,
    url: `${PAGE_URL}#${s.id}`,
  })),
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How to Become a Personal Trainer in the UK (2026 Step-by-Step)",
  description:
    "The honest 2026 roadmap to becoming a UK personal trainer — 5 steps from decision to earning. Written by gym owners who've hired 500+ PTs.",
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

export default function HowToBecomePtUkPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Breadcrumbs trail={[{ name: "How to Become a Personal Trainer UK", url: PAGE_URL }]} />

      <Nav />
      <main className="pt-[72px]">

        {/* HERO */}
        <section className="bg-base py-16 md:py-24 px-6 relative overflow-hidden">
          <div className="absolute -left-48 top-0 w-[500px] h-[500px] rounded-full bg-gold opacity-[0.04] blur-3xl pointer-events-none" />
          <div className="absolute -right-32 bottom-0 w-[400px] h-[400px] rounded-full bg-blue opacity-[0.05] blur-3xl pointer-events-none" />
          <div className="relative max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-4">
              The Honest UK Roadmap · Updated 2026
            </p>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-6">
              How to become a personal trainer in the UK:{" "}
              <span className="text-gold">the 5-step 2026 roadmap.</span>
            </h1>
            <p className="text-xl text-soft/80 leading-relaxed mb-6">
              To become a personal trainer in the UK you need a Level 2 Gym Instructor qualification followed by a Level 3 Personal Trainer qualification — both Ofqual-regulated, ideally awarded by NCFE, Focus Awards or Active IQ. Total time from decision to first paying clients: 3 to 6 months. Total cost to start: £700 to £3,000.
            </p>
            <p className="text-xl text-soft/80 leading-relaxed mb-8">
              That's the answer.{" "}
              <span className="text-white font-semibold">The rest of this page is the honest version of what those 3–6 months actually look like — written by gym owners who've hired more than 500 PTs.</span>
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/quiz"
                className="px-7 py-3.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all"
              >
                Take the 60-Second Quiz →
              </Link>
              <Link
                href="/book-call"
                className="px-7 py-3.5 rounded-full border border-gold text-gold font-semibold text-sm hover:bg-gold hover:text-deep transition-all"
              >
                Talk to a Real Coach
              </Link>
            </div>
          </div>
        </section>

        {/* TABLE OF CONTENTS */}
        <section className="bg-surface border-y border-blue/15 py-8 px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-3">In this guide</p>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-soft/80 text-sm list-decimal list-inside">
              {steps.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="hover:text-gold transition-colors">{s.title}</a>
                </li>
              ))}
              <li><a href="#cost" className="hover:text-gold transition-colors">How much it actually costs</a></li>
              <li><a href="#timeline" className="hover:text-gold transition-colors">How long it really takes</a></li>
              <li><a href="#dont-need" className="hover:text-gold transition-colors">What you don&apos;t need</a></li>
              <li><a href="#faq" className="hover:text-gold transition-colors">FAQ</a></li>
            </ol>
          </div>
        </section>

        {/* STEP 1 */}
        <section id="step-1" className="bg-base py-14 md:py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">Step 1</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
              Decide if PT is actually right for you.
            </h2>
            <p className="text-soft/80 text-lg leading-relaxed mb-5">
              Before you spend £1,500 on a qualification, get honest with yourself about what the job actually looks like day-to-day. Personal training is not a fitness job. It&apos;s a people job that happens to take place in a gym.
            </p>
            <p className="text-soft/80 text-base leading-relaxed mb-5">
              You will spend more time on these things than you will lifting weights or programming sessions:
            </p>
            <ul className="space-y-2.5 text-soft/80 text-base mb-6 ml-1">
              <li className="flex gap-3"><span className="text-gold shrink-0">→</span><span>Talking to strangers on the gym floor — completely cold, often awkward — and converting two of them per week into paid clients.</span></li>
              <li className="flex gap-3"><span className="text-gold shrink-0">→</span><span>Listening to people complain about their weight, their backs, their partners, their jobs, their motivation, before any actual training starts.</span></li>
              <li className="flex gap-3"><span className="text-gold shrink-0">→</span><span>Posting on social media, writing programmes, chasing payments, rebooking sessions, and replying to messages at 9pm on a Tuesday.</span></li>
              <li className="flex gap-3"><span className="text-gold shrink-0">→</span><span>Watching someone do a goblet squat for the 4,000th time and making it feel new for them.</span></li>
            </ul>
            <p className="text-soft/80 text-base leading-relaxed mb-5">
              If you can&apos;t handle awkward conversations with strangers, this is the wrong career and no qualification will fix that. The good news: the social side is a skill, not a personality trait, and it can be learned. We&apos;ve put introverts through this who now run packed diaries.
            </p>
            <p className="text-soft/80 text-base leading-relaxed">
              The other honest filter: <span className="text-white font-semibold">do you love training, or do you love being seen training?</span> Personal trainers spend most of their week watching other people train, not training themselves. If your motivation is mostly the gym aesthetic and the lifestyle, you&apos;ll burn out fast when you realise you&apos;re working 60 hours a week to make £24,000.
            </p>
          </div>
        </section>

        {/* STEP 2 */}
        <section id="step-2" className="bg-surface py-14 md:py-20 px-6 border-y border-blue/15">
          <div className="max-w-3xl mx-auto">
            <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">Step 2</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
              Pick a regulated Level 2 + 3 qualification.
            </h2>
            <p className="text-soft/80 text-lg leading-relaxed mb-5">
              You need two qualifications, not one:
            </p>
            <ul className="space-y-2.5 text-soft/80 text-base mb-6 ml-1">
              <li className="flex gap-3"><span className="text-gold shrink-0">→</span><span><span className="text-white font-semibold">Level 2 Gym Instructor</span> — lets you run the gym floor, inductions, supervise members on equipment. Required prerequisite for Level 3.</span></li>
              <li className="flex gap-3"><span className="text-gold shrink-0">→</span><span><span className="text-white font-semibold">Level 3 Personal Trainer</span> — lets you take paying 1-to-1 clients, write programmes, do consultations.</span></li>
            </ul>
            <p className="text-soft/80 text-base leading-relaxed mb-5">
              Decent UK courses bundle both at one price. If a provider quotes &quot;Level 3&quot; on its own, ask whether Level 2 is already included or sold separately — the cheap-looking £799 Level 3 turns into £1,300 once you add the prerequisite.
            </p>
            <h3 className="text-white font-display font-extrabold text-2xl mt-10 mb-4">The bit most people get wrong: awarding bodies.</h3>
            <p className="text-soft/80 text-base leading-relaxed mb-4">
              The qualification only matters if it&apos;s on the Ofqual Register, the UK government&apos;s official list of regulated qualifications. The three awarding bodies that count in the UK PT industry:
            </p>
            <ul className="space-y-2.5 text-soft/80 text-base mb-6 ml-1">
              <li className="flex gap-3"><span className="text-gold shrink-0">✓</span><span><span className="text-white font-semibold">NCFE</span> — founded 1848, the qualification name UK gym managers ask for by default on job listings. The CV-friendly one.</span></li>
              <li className="flex gap-3"><span className="text-gold shrink-0">✓</span><span><span className="text-white font-semibold">Focus Awards</span> — Ofqual-regulated, widely accepted by commercial gyms and insurers. Common with newer online providers.</span></li>
              <li className="flex gap-3"><span className="text-gold shrink-0">✓</span><span><span className="text-white font-semibold">Active IQ</span> — Ofqual-regulated, mid-range pricing, no concerns from any UK insurer.</span></li>
            </ul>
            <p className="text-soft/80 text-base leading-relaxed mb-5">
              All three lead to <Link href="https://www.cimspa.co.uk" className="text-gold hover:underline">CIMSPA registration</Link> — the body that lists you as a working professional. With Ofqual + CIMSPA you can get insured by Insure4Sport, Markel, Towergate, and every UK provider. You can work in any UK gym.
            </p>
            <div className="bg-red-950/15 border border-red-500/25 rounded-2xl p-6 my-8">
              <h4 className="text-red-300 font-bold text-lg mb-3">⚠ The £29 PDF trap</h4>
              <p className="text-soft/80 text-base leading-relaxed">
                Online Learning College, Centre of Excellence, and the bottom-of-Google &quot;Level 3 Diploma&quot; £29-£299 courses are not Ofqual-regulated. They are CPD certificates dressed up to look like qualifications. No commercial UK gym will hire you with one. No insurer will cover you. We won&apos;t interview anyone holding only one of these. If it&apos;s under £300 and not from NCFE, Focus Awards or Active IQ — it&apos;s a PDF, not a career.
              </p>
            </div>
            <p className="text-soft/80 text-base leading-relaxed">
              Once you know the awarding body to look for, the next question is which provider to buy from. We&apos;ve compared 10 of the main UK options on price, mentorship, and earnings in our{" "}
              <Link href="/online-personal-trainer-course-uk" className="text-gold hover:underline font-semibold">full UK online PT course buyer&apos;s guide</Link>.
            </p>
          </div>
        </section>

        {/* MID-CONTENT CTA */}
        <MidContentCTA
          headline="Not sure which path fits you?"
          body="Take the 60-second career path quiz. You'll get a personalised route — on-floor, online, or hybrid — and an honest read on what to do next."
          ctaHref="/quiz"
          ctaText="Take the Quiz →"
        />

        {/* STEP 3 */}
        <section id="step-3" className="bg-base py-14 md:py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">Step 3</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
              Get qualified — 4 to 8 weeks online.
            </h2>
            <p className="text-soft/80 text-lg leading-relaxed mb-5">
              Since 2020, fully online has become the default route in the UK, not the exception. Theory units have always worked online. The change is in how practical units are now assessed:
            </p>
            <ul className="space-y-2.5 text-soft/80 text-base mb-6 ml-1">
              <li className="flex gap-3"><span className="text-gold shrink-0">→</span><span><span className="text-white font-semibold">Theory:</span> read material, watch videos, complete written assignments, multiple-choice exams. All online, self-paced, evenings and weekends.</span></li>
              <li className="flex gap-3"><span className="text-gold shrink-0">→</span><span><span className="text-white font-semibold">Practical:</span> film yourself coaching real movements — squats, deadlifts, programme delivery — and submit the footage. A qualified tutor reviews it and either passes you or sends feedback.</span></li>
              <li className="flex gap-3"><span className="text-gold shrink-0">→</span><span><span className="text-white font-semibold">Tutor support:</span> the good providers assign a tutor inside 24 hours of enrolment and you can message them throughout. The cheap providers assign tutors thinly and replies take days.</span></li>
            </ul>
            <p className="text-soft/80 text-base leading-relaxed mb-5">
              Most UK learners doing this around a full-time job finish in 4 to 8 weeks studying evenings plus weekends. Fast-trackers with more hours available qualify in 4 to 6 weeks. People who let it slide do it in 6 to 12 months — same content, just spread out.
            </p>
            <p className="text-soft/80 text-base leading-relaxed mb-5">
              <span className="text-white font-semibold">Don&apos;t believe the &quot;qualified in 2 weeks&quot; marketing.</span> That timeline assumes you study 40 hours a week with no job. The real number for a working adult is 4 to 8 weeks.
            </p>
            <p className="text-soft/80 text-base leading-relaxed">
              If you prefer in-person delivery — workshops, hands-on assessments, classroom days — providers like Train Fitness run them in major UK cities. Adds 2 to 4 weeks and £200-£500 to the cost. Worth it if you genuinely don&apos;t trust online video for practical work; not worth it for most people, since the commercial gyms hiring you don&apos;t care which route you took. See <Link href="/podcast/what-puregym-looks-for-when-hiring-personal-trainers-mac-livock" className="text-gold hover:underline">Mac Livock&apos;s episode on hiring at PureGym</Link> for what gym managers actually look for.
            </p>
          </div>
        </section>

        {/* STEP 4 */}
        <section id="step-4" className="bg-surface py-14 md:py-20 px-6 border-y border-blue/15">
          <div className="max-w-3xl mx-auto">
            <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">Step 4</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
              Land your first PT role.
            </h2>
            <p className="text-soft/80 text-lg leading-relaxed mb-6">
              Three real routes. None of them is &quot;better&quot; — they suit different starting points.
            </p>

            <div className="space-y-5 mb-8">
              <div className="rounded-2xl border border-white/[0.07] bg-card p-6">
                <h3 className="text-white font-bold text-xl mb-3">Route A — Employed at a commercial gym</h3>
                <p className="text-soft/70 text-sm leading-relaxed mb-3">
                  PureGym, The Gym Group, Nuffield Health, David Lloyd, JD Gyms, Bannatyne, Total Fitness. Salary £20,000-£28,000 starting. You run the gym floor, deliver inductions, supervise members, and earn the right to take 1-to-1 clients on your hours or in your own time.
                </p>
                <p className="text-soft/70 text-sm leading-relaxed">
                  <span className="text-white font-semibold">Best for:</span> career changers who want the lowest-risk start, a guaranteed monthly income while they learn, and a built-in pool of gym members to convert into private clients later.
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-card p-6">
                <h3 className="text-white font-bold text-xl mb-3">Route B — Self-employed, rent-a-space</h3>
                <p className="text-soft/70 text-sm leading-relaxed mb-3">
                  You rent floor time at a commercial gym (£150-£500/month) or work out of a private PT studio. Every client is yours, you set the rates (£30-£70/hour typical), gym takes no commission. Higher ceiling — £35,000-£80,000+ once you fill your book.
                </p>
                <p className="text-soft/70 text-sm leading-relaxed">
                  <span className="text-white font-semibold">Best for:</span> people who already have gym experience, a network, or the savings to weather a 3-6 month build-up to a full client book.
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-card p-6">
                <h3 className="text-white font-bold text-xl mb-3">Route C — Online from day one</h3>
                <p className="text-soft/70 text-sm leading-relaxed mb-3">
                  Coach clients remotely via Trainerize, TrueCoach, or your own platform. Programme delivery, weekly check-ins, video feedback. £80-£250 per month per client. Stacks well — 30 online clients at £150/month = £54,000/year working from home.
                </p>
                <p className="text-soft/70 text-sm leading-relaxed">
                  <span className="text-white font-semibold">Best for:</span> people with existing social media presence, a clear niche (postpartum, runners, busy parents, etc.), and the willingness to spend the first 6-12 months building an audience. <Link href="/podcast/how-i-built-an-online-pt-business-to-500k-ryans-full-story" className="text-gold hover:underline">Ryan&apos;s full story on how he built to £500K online</Link> is the honest version of how long this actually takes.
                </p>
              </div>
            </div>

            <p className="text-soft/80 text-base leading-relaxed">
              <span className="text-white font-semibold">What we recommend for most people:</span> 12-18 months employed, then transition to self-employed or hybrid once you have a roster of regular faces who would follow you. The pure self-employed-from-day-one route is faster on paper and brutal in practice.
            </p>
          </div>
        </section>

        {/* STEP 5 */}
        <section id="step-5" className="bg-base py-14 md:py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">Step 5</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
              Build your first 10 paying clients.
            </h2>
            <p className="text-soft/80 text-lg leading-relaxed mb-5">
              This is the step that kills careers. Industry estimates put first-year PT drop-out at around 80% in the UK — and almost every exit interview says the same thing: <span className="text-white font-semibold">they qualified but couldn&apos;t get clients.</span>
            </p>
            <p className="text-soft/80 text-base leading-relaxed mb-5">
              The pattern is depressingly consistent. Newly-qualified PT spends £1,500 on a course. Course ends. Tutor disappears. PT now stands on a gym floor with a polo shirt and no clue how to approach a member, how to price, how to follow up, or what to post. Three months later they&apos;re back in their old job telling everyone &quot;PT didn&apos;t work out.&quot;
            </p>
            <p className="text-soft/80 text-base leading-relaxed mb-5">
              What actually works in the first 90 days, based on every working UK PT we&apos;ve coached:
            </p>
            <ol className="space-y-3 text-soft/80 text-base mb-6 ml-1 list-decimal list-inside">
              <li><span className="text-white font-semibold">Talk to 5 strangers per shift.</span> Not pitch — just genuinely converse. Most PTs talk to zero. Five conversations a day, four days a week, gets you ~80 first-touches a month. 2-5% convert to paid sessions. There&apos;s your first 2-4 clients.</li>
              <li><span className="text-white font-semibold">Run free intro sessions, not free consultations.</span> A free chat sells nothing. A free 30-min training session in which the member feels and hears the difference sells everything.</li>
              <li><span className="text-white font-semibold">Charge less to start, raise rates fast.</span> £25/session for the first 5 clients to fill empty hours. £40 once you&apos;ve got 5. £50 once you&apos;re at 10. £60+ once you&apos;re booked solid. Ryan&apos;s public story is exactly this — undercut on price to fill empty hours, then raise rates as demand grew.</li>
              <li><span className="text-white font-semibold">Build a referral loop.</span> Every client who stays past month 3 brings 1-2 of their friends. Just ask. The single highest-ROI sentence in PT is: &quot;Do you know anyone else who&apos;d find this useful?&quot;</li>
              <li><span className="text-white font-semibold">Post consistently. 3 times a week, forever.</span> Doesn&apos;t need to be viral. Needs to exist so people who&apos;ve heard your name from a friend can find you and verify you&apos;re real.</li>
            </ol>
            <p className="text-soft/80 text-base leading-relaxed mb-5">
              This is the bit no UK qualification teaches in its core curriculum. NCFE Level 3 covers anatomy, programming, nutrition, behaviour change — none of it covers &quot;how to fill your diary&quot;. That&apos;s why <Link href="/personal-trainer-mentorship-uk" className="text-gold hover:underline font-semibold">mentorship</Link> from people who&apos;ve actually built a PT business is the single highest-leverage thing you can buy after the qualification itself.
            </p>
            <p className="text-soft/80 text-base leading-relaxed">
              For a deeper read on realistic earnings as you progress through these milestones, see our <Link href="/personal-trainer-salary-uk" className="text-gold hover:underline font-semibold">UK personal trainer salary guide</Link>.
            </p>
          </div>
        </section>

        {/* COST */}
        <section id="cost" className="bg-surface py-14 md:py-20 px-6 border-y border-blue/15">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
              How much it actually costs.
            </h2>
            <p className="text-soft/80 text-lg leading-relaxed mb-8">
              The qualification fee is just one line. Here&apos;s the honest total to get from &quot;not qualified&quot; to &quot;legally taking paying clients with insurance&quot;.
            </p>
            <div className="rounded-2xl border border-white/15 bg-card overflow-hidden">
              {[
                { item: "Level 2 + 3 qualification (Ofqual-regulated)", low: "£600", high: "£2,800" },
                { item: "Public liability insurance (annual)", low: "£60", high: "£120" },
                { item: "CIMSPA registration (annual)", low: "£40", high: "£40" },
                { item: "First aid certificate (often required by gyms)", low: "£50", high: "£100" },
                { item: "Kit, polo shirts, business cards, admin", low: "£100", high: "£300" },
                { item: "Loss-of-income runway while filling diary (3 months)", low: "£0", high: "£3,000+" },
              ].map((row, i, arr) => (
                <div key={row.item} className={`grid grid-cols-3 bg-card ${i < arr.length - 1 ? "border-b border-white/10" : ""}`}>
                  <div className="p-4 text-white text-sm font-semibold col-span-1">{row.item}</div>
                  <div className="p-4 text-white text-sm text-center">{row.low}</div>
                  <div className="p-4 text-white text-sm text-center">{row.high}</div>
                </div>
              ))}
              <div className="grid grid-cols-3 bg-deep/70 border-t-2 border-gold/40">
                <div className="p-4 text-white text-sm font-bold uppercase tracking-wide">Realistic total to start</div>
                <div className="p-4 text-gold text-base text-center font-display font-extrabold">£850</div>
                <div className="p-4 text-gold text-base text-center font-display font-extrabold">£6,360+</div>
              </div>
            </div>
            <p className="text-soft/80 text-base leading-relaxed mt-8">
              Most learners land in the <span className="text-white font-semibold">£1,500 to £1,800 bracket</span> if they take the employed-first route (no loss-of-income runway needed) and pick a mid-range Ofqual-regulated course. Spread over 6-12 months via finance, that&apos;s £150-£300 a month — less than most gym memberships plus a coffee a day. See the full breakdown on our <Link href="/courses" className="text-gold hover:underline font-semibold">courses page</Link>.
            </p>
          </div>
        </section>

        {/* TIMELINE */}
        <section id="timeline" className="bg-base py-14 md:py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
              How long it really takes.
            </h2>
            <p className="text-soft/80 text-lg leading-relaxed mb-6">
              From &quot;I&apos;m thinking about it&quot; to &quot;I&apos;m taking paying clients&quot;, realistically:
            </p>
            <div className="space-y-4">
              {[
                { phase: "Decision + research", dur: "1–4 weeks", body: "Reading guides like this one, talking to a real coach, watching podcast episodes, taking the quiz, deciding which route is right for you." },
                { phase: "Enrol + qualify", dur: "4–8 weeks", body: "Online Level 2 + 3 around a job. Tutor assigned within 24 hours of enrolling. Fast-trackers finish in 4-6, average is 6-8." },
                { phase: "Insurance + CIMSPA + first role", dur: "2–4 weeks", body: "Apply for jobs while finishing the course. Most commercial gyms hire 2-4 weeks after the qualification certificate lands." },
                { phase: "First 10 paying clients", dur: "4–12 weeks", body: "Talk to 5 strangers per shift, run free intro sessions, raise rates as you fill. 10 clients at £30-£40/session is full-time income territory." },
              ].map((row, i) => (
                <div key={row.phase} className="rounded-2xl border border-white/[0.07] bg-card p-6 flex gap-5 items-start">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-gold/20 text-gold flex items-center justify-center font-display font-extrabold text-lg">{i + 1}</div>
                  <div>
                    <div className="flex items-baseline gap-3 flex-wrap mb-2">
                      <h3 className="text-white font-bold text-lg">{row.phase}</h3>
                      <span className="text-gold text-sm font-semibold">{row.dur}</span>
                    </div>
                    <p className="text-soft/80 text-sm leading-relaxed">{row.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-soft/80 text-base leading-relaxed mt-8">
              <span className="text-white font-semibold">Realistic end-to-end: 3 to 6 months from decision to a starter income.</span> 12 months to a full-time PT income. Anyone selling you &quot;qualified Monday, full-time PT by Friday&quot; is selling a story, not a career.
            </p>
          </div>
        </section>

        {/* WHAT YOU DON'T NEED */}
        <section id="dont-need" className="bg-surface py-14 md:py-20 px-6 border-y border-blue/15">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
              What you don&apos;t need.
            </h2>
            <p className="text-soft/80 text-lg leading-relaxed mb-6">
              Most of what stops people becoming a PT is something they think they need but don&apos;t. Quick check-list of myths to disregard:
            </p>
            <ul className="space-y-3">
              {[
                { myth: "A sport science degree.", reality: "Not required by any UK commercial gym, insurer, or governing body. Useful if you want to specialise in S&C or rehab; irrelevant for general PT work." },
                { myth: "Being under 30.", reality: "Career-changer PTs in their 40s and 50s often outperform 22-year-olds because they bring life experience. See our case for older learners." },
                { myth: "A perfect physique.", reality: "Clients hire trust and competence, not aesthetics. Some of the best PTs we know don&apos;t look like the Instagram version. They look like normal people who know what they're doing." },
                { myth: "Quitting your day job first.", reality: "Almost every working PT we&apos;ve hired qualified while still in their previous job. The course is designed to be done around full-time work." },
                { myth: "A massive social media following before you start.", reality: "Useful if you go fully online, optional if you go employed or rent-a-space. The £500K PT we know best built his presence after he started, not before." },
                { myth: "A separate Level 4 specialism before you can start.", reality: "Level 3 is the legal threshold. Level 4 (older adults, low back pain, etc.) is bonus — earned after you&apos;re working, not before." },
              ].map((m) => (
                <li key={m.myth} className="rounded-2xl border border-white/[0.07] bg-card p-5">
                  <p className="text-white font-bold mb-2 flex items-start gap-2">
                    <span className="text-red-400 shrink-0">✗</span>
                    {m.myth}
                  </p>
                  <p className="text-soft/70 text-sm leading-relaxed pl-7">{m.reality}</p>
                </li>
              ))}
            </ul>
            <p className="text-soft/80 text-base leading-relaxed mt-8">
              If &quot;am I too old&quot; is the one you&apos;re wrestling with, read our full case in <Link href="/too-old-to-become-a-personal-trainer" className="text-gold hover:underline font-semibold">Too old to become a personal trainer? (The honest answer)</Link> — including case studies of learners who qualified in their late 40s and 50s and are now working.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-base py-14 md:py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-10">
              FAQ.
            </h2>
            <div className="space-y-5">
              {faqs.map((f) => (
                <div key={f.q} className="rounded-2xl border border-white/[0.07] bg-card p-6 md:p-7">
                  <h3 className="text-white font-bold text-lg md:text-xl mb-3">{f.q}</h3>
                  <p className="text-soft/80 text-base leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-surface py-14 md:py-20 px-6 text-center border-t border-white/[0.05]">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
              Ready to start?<br /><span className="text-gold">Two ways to take the next step.</span>
            </h2>
            <p className="text-soft/80 text-lg mb-10">
              Take the 60-second career quiz if you want a personalised path, or book a free 15-min call if you&apos;d rather just talk it through with a real coach.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quiz"
                className="px-8 py-4 rounded-full bg-gold text-deep font-bold hover:brightness-110 transition-all shadow-lg shadow-gold/20"
              >
                Take the Quiz →
              </Link>
              <Link
                href="/book-call"
                className="px-8 py-4 rounded-full border border-gold text-gold font-semibold hover:bg-gold hover:text-deep transition-all"
              >
                Book a Free 15-Min Call
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
      <StickyMobileCTA />
    </>
  );
}
