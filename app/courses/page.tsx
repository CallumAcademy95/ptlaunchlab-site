import Nav from "../components/Nav";
import Footer from "../components/Footer";
import ProspectusButton from "../components/ProspectusButton";
import Breadcrumbs from "../components/Breadcrumbs";
import MoneyHero from "../components/money/MoneyHero";
import TwoWayCTA from "../components/cta/TwoWayCTA";
import StickyCtaBar from "../components/cta/StickyCtaBar";
import { faqPageSchema } from "@/app/lib/faqSchema";
import { COURSE_PRICE_LABEL, MONTHLY_PRICE_LABEL, MONTHLY_PLAN_LABEL, MONTHLY_PAYMENTS, MONTHLY_PLAN_TOTAL_PENCE, COURSE_PRICE_PENCE, TYPICAL_COST_LABEL, formatPence } from "@/app/lib/pricing";

// The title leads with the phrase people search ("personal trainer course",
// 2,900 a month UK); the description stays under ~155 chars so Google shows it whole.
export const metadata = {
  title: "Personal Trainer Course Online | NCFE Level 2 & 3 | PT Launch Lab",
  description: `Online NCFE Level 2 & 3 personal trainer course, Ofqual regulated. Qualify around your job in 8–16 weeks. ${COURSE_PRICE_LABEL}, everything included.`,
  alternates: {
    canonical: "https://ptlaunchlab.co.uk/courses",
  },
};

const courseSchema = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "NCFE Level 2 & 3 Personal Trainer Qualification",
  description:
    `100% online NCFE Level 2 & 3 PT qualification. ${COURSE_PRICE_LABEL} in full or ${MONTHLY_PAYMENTS} monthly payments of ${MONTHLY_PRICE_LABEL}. Includes our Mentorship Hub, a personal tutor, business training, and a guaranteed warm introduction to gyms — all bundled, no paid upgrades. Qualify in 8–16 weeks.`,
  provider: {
    "@type": "Organization",
    name: "PT Launch Lab",
    sameAs: "https://ptlaunchlab.co.uk",
  },
  timeRequired: "P8W",
  educationalCredentialAwarded: "NCFE Level 3 Diploma in Gym Instructing and Personal Training (Ofqual ref 603/4388/6)",
  offers: [
    {
      "@type": "Offer",
      name: "Pay In Full",
      price: (COURSE_PRICE_PENCE / 100).toFixed(2),
      priceCurrency: "GBP",
      url: "https://ptlaunchlab.co.uk/enrol",
      description: `One payment of ${COURSE_PRICE_LABEL}.`,
    },
    {
      "@type": "Offer",
      name: "10 Monthly Payments",
      price: (MONTHLY_PLAN_TOTAL_PENCE / 100).toFixed(2),
      priceCurrency: "GBP",
      url: "https://ptlaunchlab.co.uk/enrol",
      description: `${MONTHLY_PAYMENTS} monthly payments of ${MONTHLY_PRICE_LABEL}, no interest. First payment at checkout, then monthly. ${formatPence(MONTHLY_PLAN_TOTAL_PENCE)} in total.`,
    },
  ],
  hasCourseInstance: {
    "@type": "CourseInstance",
    courseMode: "online",
    courseSchedule: {
      "@type": "Schedule",
      duration: "P4W",
      repeatFrequency: "P1W",
    },
  },
};

const curriculum = [
  {
    num: "01",
    title: "Anatomy & Exercise Science",
    body: "How the body works, moves, and adapts to training. You'll learn the muscles, joints, energy systems, and principles behind every session you'll ever programme. The foundation everything else is built on.",
    tag: "Core",
  },
  {
    num: "02",
    title: "Nutrition Fundamentals",
    body: "Macros, energy balance, practical nutrition coaching. Not fad diets — the evidence-based knowledge clients actually ask about, and the ability to give them real, useful answers.",
    tag: "Core",
  },
  {
    num: "03",
    title: "Programme Design & Exercise Technique",
    body: "Build training programmes that get results. Technique cues, progressions, periodisation, loading principles — the practical skills that separate good trainers from great ones.",
    tag: "Core",
  },
  {
    num: "04",
    title: "Client Consultations & Behaviour Change",
    body: "How to run a proper initial consultation, set realistic goals, and keep clients motivated long-term. The psychology behind why people change — and how to use it in every session.",
    tag: "Core",
  },
  {
    num: "05",
    title: "Health Conditions & Safe Practice",
    body: "How to safely coach clients with common medical conditions — diabetes, hypertension, obesity, musculoskeletal issues. The knowledge that makes you hireable in any professional gym environment.",
    tag: "Core",
  },
  {
    num: "06",
    title: "Business Launch & Client Acquisition",
    body: "Pricing, sales, social media, and systems. How to find your first clients, set your rates, build your brand, and start earning as a PT. This isn't an optional extra — it's the whole point.",
    tag: "Unique to us",
  },
];

const method = [
  { num: "01", title: "Qualification", body: "NCFE Level 2 & 3, Ofqual regulated, fast-track. Done around your job in 8–16 weeks." },
  { num: "02", title: "Mentorship", body: "The Mentorship Hub, included in the course fee. Built to walk you from qualifying to your first paying client. Direct access to Callum, Miles and Ryan when you're stuck." },
  { num: "03", title: "Gym Introduction", body: "A guaranteed introduction when you qualify: either with a gym in our partner network, or with a gym local to you that we approach on your behalf. We've hired 500+ PTs, so we prepare you properly.", highlight: true },
  { num: "04", title: "Income Building", body: "Pricing, first clients, rates, brand. How to make money from day one as a qualified PT." },
  { num: "05", title: "Online Coaching", body: "Expand beyond the gym. Build an income stream that scales without a ceiling." },
];

const stories = [
  { name: "Gemma", body: "Left a corporate career to build her own independent PT business. Now coaching full-time on her own terms." },
  { name: "Matty", body: "Turned a personal journey through adversity into a running and coaching brand that's still growing." },
  { name: "Mac", body: "Started as a trainee and rose to manager at PureGym. Exactly the kind of outcome we build towards." },
];

const objections = [
  {
    quote: "I'm probably too old to start over.",
    answer:
      "We've put learners through this in their late 40s and 50s. Clients want a coach who actually understands what it's like to be in their body — that's something you have more of at 40+ than at 22.",
    link: { href: "/too-old-to-become-a-personal-trainer", label: "Read the full case for older learners →" },
  },
  {
    quote: "What if I qualify and still can't get clients?",
    answer:
      "This is exactly what the Mentorship Hub is built for — it walks you from qualifying to your first paying client, milestone by milestone, with Callum a message away. The part after qualifying is where this course keeps going. We stay until you've launched.",
    link: null,
  },
  {
    quote: "I'm worried I won't finish an online course.",
    answer:
      "You get a personal tutor introduced within 24 hours of enrolling. They check in, keep you accountable, and most learners finish in 8–16 weeks. The course is built to be done around a full-time job, not on top of it.",
    link: null,
  },
  {
    quote: `${COURSE_PRICE_LABEL} is still a lot of money.`,
    answer:
      `${COURSE_PRICE_LABEL} paid in full, everything included. If you'd rather pay monthly, it's ${MONTHLY_PAYMENTS} payments of ${MONTHLY_PRICE_LABEL}. A working PT in the UK charges £30–50 a session.`,
    link: null,
  },
  {
    quote: "What if it's not the right fit for me?",
    answer:
      "Book a 15-minute call before you commit to anything. We'd rather tell you it isn't a fit than push you into something that doesn't work. No pressure, no script — just a real conversation.",
    link: { href: "/book-call", label: "Book a free 15-min call →" },
  },
];

// Two payment options — identical product, different cadence. Pay in full is
// the lead offer (first, featured); monthly is the secondary option. Prices come
// from app/lib/pricing.ts. The monthly plan totals 9p less than paying in
// full, so never call pay-in-full "best value".
const pricing = [
  {
    title: "Pay In Full",
    headlineFigure: COURSE_PRICE_LABEL,
    headlineSuffix: "one-off",
    subPrice: "Flexible ways to pay at checkout",
    saving: "Everything included, one price",
    features: ["NCFE Level 2 & 3 qualification", "Personal tutor throughout", "Mentorship Hub — included", "A guaranteed gym introduction", "Direct access to Callum, Miles & Ryan"],
    cta: "Pay in full →",
    ctaHref: "/enrol",
    recommended: true,
    badge: "Recommended" as string | null,
  },
  {
    title: "10 Monthly Payments",
    headlineFigure: MONTHLY_PRICE_LABEL,
    headlineSuffix: "/month",
    subPrice: `${MONTHLY_PLAN_LABEL} · first payment at checkout · ${formatPence(MONTHLY_PLAN_TOTAL_PENCE)} total`,
    saving: `${MONTHLY_PAYMENTS} monthly payments`,
    features: ["NCFE Level 2 & 3 qualification", "Personal tutor throughout", "Mentorship Hub — included", "A guaranteed gym introduction", "Direct access to Callum, Miles & Ryan"],
    cta: "Pay monthly →",
    ctaHref: "/enrol",
    recommended: false,
    badge: null as string | null,
  },
];

const compare = [
  { what: "NCFE Level 2 & 3 qualification", typical: "£1,200 – £2,800", us: "Included" },
  { what: "Business mentorship", typical: "£500 – £3,000", us: "Included" },
  { what: "Personal tutor", typical: "£200 – £600 extra", us: "Included" },
  { what: "A guaranteed gym introduction", typical: "On you to find them", us: "We introduce you" },
];

// Level 2 vs Level 3. What each qualifies you to do, in plain terms. Matches
// the wording on /online-personal-trainer-course-uk.
const levels = [
  {
    level: "Level 2",
    title: "Gym Instructor",
    body: "The entry qualification. It lets you work on the gym floor: running inductions, showing members how to use equipment safely and supervising them while they train. On its own it does not make you a personal trainer, and it is not enough to take one-to-one paying clients.",
  },
  {
    level: "Level 3",
    title: "Personal Trainer",
    body: "The qualification that lets you work one to one with paying clients. You learn to run a consultation, assess a new client, design and adapt programmes over weeks and months, give nutrition guidance within your scope, and train people with common health conditions safely.",
  },
];

// How the fully online course runs, enrolment to sign-off. Practicals are
// video-assessed; nothing here may suggest classroom or centre attendance.
const studySteps = [
  {
    num: "01",
    title: "Enrol and meet your tutor",
    body: "You get access to the course as soon as you enrol, and your personal tutor is introduced within 24 hours. They are your point of contact for questions, feedback and keeping to a steady pace.",
  },
  {
    num: "02",
    title: "Study the theory online",
    body: "Anatomy, nutrition, programme design and the rest are taught in online modules you work through at your own pace, on a laptop or phone. You complete written assignments as you go, and your tutor marks them and gives you feedback.",
  },
  {
    num: "03",
    title: "Film your practical sessions",
    body: "The practical units are assessed by video. You coach a friend or family member through real sessions, such as an induction, a programme and technique work, at any gym you can train in. You film it and upload it. There is no training centre to travel to.",
  },
  {
    num: "04",
    title: "Get signed off",
    body: "Your tutor watches the footage and either signs it off or tells you what to fix. Not everyone passes every unit first time, and that is normal: you resubmit using the feedback. Once every unit is passed, you are qualified.",
  },
];

// Recognition. Claims here are about the qualification (NCFE, Ofqual,
// CIMSPA), never about where it was studied.
const recognition = [
  {
    title: "Ofqual regulated",
    body: "Every legitimate Level 2 and Level 3 fitness qualification is on the Ofqual register. You can check ours yourself: Ofqual reference 603/4388/6.",
  },
  {
    title: "CIMSPA recognised",
    body: "CIMSPA is the professional body for the UK fitness sector. Once you qualify, you can join the CIMSPA register as a personal trainer.",
  },
  {
    title: "Insurable",
    body: "Insurers cover personal trainers on the qualification standard. An NCFE Level 3 studied online sits in the same insurance band as one studied in a classroom.",
  },
];

// After qualifying. The gym introduction is an introduction only: the
// interview and any job are the gym's decision.
const afterSteps = [
  {
    num: "01",
    title: "Register and get insured",
    body: "Join the CIMSPA register and take out public liability insurance. Both are yours to arrange, and together they let you take paying clients. Many gyms also ask for a first aid certificate, so check what yours wants.",
  },
  {
    num: "02",
    title: "Your gym introduction",
    body: "We introduce you to at least one gym: one in our partner network, or one local to you that we approach on your behalf. Whether they interview you and offer you work is their decision. We have hired 500+ PTs ourselves, so we help you prepare.",
  },
  {
    num: "03",
    title: "Keep going in the Mentorship Hub",
    body: "The Mentorship Hub is included in your fee. It is built to walk you from qualifying to your first paying client, with Callum, Miles and Ryan a message away when you are stuck. Finding clients is still your work; the Hub shows you how to go about it.",
  },
  {
    num: "04",
    title: "Specialise when you are ready",
    body: "With your Level 3 you can go on to Level 4 specialist courses, such as lower back pain or exercise for older adults. Your credits transfer, so you build on what you have rather than starting again.",
  },
];

// What the fee covers, and the costs that sit outside it. Prices come from
// app/lib/pricing.ts only.
const included = [
  "Level 2 Gym Instructor and Level 3 Personal Trainer, both in one NCFE course",
  "Every module, online, from the day you enrol",
  "A personal tutor from enrolment to sign-off, marking your work and reviewing your videos",
  "The business module: pricing, sales, social media and systems",
  "The Mentorship Hub after you qualify",
  "A guaranteed introduction to a gym when you qualify",
];

const notIncluded = [
  "Access to a gym to film your practical sessions (one you already use is fine)",
  "CIMSPA membership, once you are qualified",
  "Public liability insurance, once you take paying clients",
  "A first aid certificate, if your gym asks for one",
];

const faqs = [
  { q: "Is the qualification recognised by gyms and insurers?", a: "Yes. Your NCFE Level 2 & 3 is regulated by Ofqual and recognised by CIMSPA. NCFE is the qualification name UK gym managers ask for by default — PureGym, David Lloyd, Nuffield, JD Gyms, independents. Some UK academies use Focus Awards or self-branded certifications; NCFE is the one that doesn't need explaining on a CV." },
  { q: "Do I need any prior experience?", a: "None at all. Whether you're completely new to fitness or already coaching informally, the course is designed to take you from zero to qualified." },
  { q: "It's fully online, so how is the practical side assessed?", a: "By video. You practise in a gym you already use, coaching a friend or family member through real sessions: inductions, programmes, technique. You film it, and your tutor watches the footage and either signs it off or tells you what to fix. NCFE accepts video-assessed practical work, and gyms hire PTs assessed this way." },
  { q: "How long does it take?", a: "Most students complete in 8–16 weeks. Because it's fully online and self-paced, you fit it around your job, your family, your life." },
  { q: "What is the guaranteed gym introduction?", a: "Once you qualify, we approach at least one gym on your behalf: either one in our partner network, or one local to you. It is a warm introduction rather than a job-board listing. Whether they interview you, and whether you get the job, is their call. We've hired 500+ PTs ourselves, so we know what gyms look for and we prepare you for it." },
  { q: "Can I spread the cost?", a: `Yes. You can pay ${MONTHLY_PAYMENTS} monthly payments of ${MONTHLY_PRICE_LABEL}, with no interest. The first is taken when you enrol, then one a month. Book a free call if you'd like to talk it through.` },
  { q: "How much does a personal trainer course cost?", a: `Ours is ${COURSE_PRICE_LABEL} paid in full, or ${MONTHLY_PAYMENTS} monthly payments of ${MONTHLY_PRICE_LABEL}. That covers Level 2 and Level 3 together, your personal tutor and the Mentorship Hub. Across UK providers, a Level 2 and 3 qualification on its own typically costs ${TYPICAL_COST_LABEL}. When you compare, check whether Level 2, tutor support and mentorship are in the headline price or added later.` },
  { q: "Do I need a Level 2 before I can do Level 3?", a: "Yes. Level 2 Gym Instructor comes before Level 3 Personal Trainer, and you need both to work as a personal trainer. Our course includes both, so you don't need to find or finish a separate Level 2 course first." },
  { q: "Is this a CIMSPA personal trainer course?", a: "The qualification is awarded by NCFE, regulated by Ofqual and recognised by CIMSPA, the professional body for UK fitness. Once you qualify you can join the CIMSPA register as a personal trainer." },
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5">
      <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CoursesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema(faqs)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      <Breadcrumbs trail={[{ name: "Courses", url: "https://ptlaunchlab.co.uk/courses" }]} />
      <Nav />
      <main>

        {/* HERO: what it is, what it costs, how to start */}
        <MoneyHero
          eyebrow="NCFE LEVEL 2 & 3 · OFQUAL · CIMSPA"
          headline="The online Level 2 & 3 Personal Trainer Course,"
          goldTail="around your job."
          subline="Qualify in 8–16 weeks, with business training and a guaranteed gym introduction."
          source="courses-hero"
          image={{ src: "/learner-2.webp", alt: "PT Launch Lab graduate qualified through the NCFE Level 3 personal trainer course" }}
        />

        {/* Mentorship moat (moved from the old hero): the single biggest
            differentiator. Most UK PT academies sell the qualification then
            upsell mentorship for £500-£3,000. We bundle it. */}
        <section className="bg-base pt-10 pb-4 md:pt-14 md:pb-6 px-6 text-center">
          <div className="max-w-2xl mx-auto px-5 py-4 rounded-2xl border border-gold/30 bg-card/40">
            <p
              className="text-white text-sm md:text-base leading-relaxed"
              style={{ color: '#FFFFFF' }}
            >
              <span className="text-gold font-bold" style={{ color: '#F5C518' }}>Business mentorship, included in the fee.</span>{" "}
              The Mentorship Hub walks you from qualifying to your first paying client, with Callum, Miles &amp; Ryan a message away. Not an upsell. Not an upgrade.
            </p>
          </div>
          <p className="text-sm text-soft/60 max-w-2xl mx-auto mt-6">
            New to UK PT courses?{" "}
            <a href="/online-personal-trainer-course-uk" className="text-gold hover:underline font-semibold">
              Read our honest comparison of 10 UK providers →
            </a>
          </p>
        </section>

        {/* THE PT LAUNCH METHOD */}
        <section className="bg-surface py-14 md:py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase text-center mb-4">A system, not just a course</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white text-center leading-none tracking-tight mb-3">The PT Launch Method™</h2>
            <p className="text-soft/60 text-center text-lg mb-16 max-w-xl mx-auto">
              Five stages. One outcome — a PT career that actually works.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {method.map((step) => (
                <div key={step.num} className={`rounded-2xl p-7 border ${step.highlight ? "bg-card border-gold/50 shadow-lg shadow-gold/10" : "bg-card border-white/[0.07]"}`}>
                  <p className={`font-display font-extrabold text-3xl mb-5 ${step.highlight ? "text-gold" : "text-blue"}`}>{step.num}</p>
                  <h3 className="text-white font-bold text-lg mb-3">{step.title}</h3>
                  <p className="text-soft/60 text-sm leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COURSE CURRICULUM */}
        <section className="bg-base py-14 md:py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase text-center mb-4">What you&apos;ll study</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white text-center leading-none tracking-tight mb-4">
              6 core modules. Built to get<br />you qualified <span className="text-gold">and employed.</span>
            </h2>
            <p className="text-soft/60 text-center text-lg mb-16 max-w-xl mx-auto">
              12 modules total. These are the ones that matter most — the knowledge and skills the qualification is assessed against.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {curriculum.map((mod) => (
                <div key={mod.num} className={`rounded-2xl p-7 border transition-all hover:-translate-y-1 duration-300 ${mod.tag === "Unique to us" ? "bg-card border-gold/40 shadow-lg shadow-gold/[0.08]" : "bg-card border-white/[0.07] hover:border-gold/30"}`}>
                  <div className="flex items-start justify-between mb-4">
                    <p className={`font-display font-extrabold text-3xl ${mod.tag === "Unique to us" ? "text-gold" : "text-blue"}`}>{mod.num}</p>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${mod.tag === "Unique to us" ? "bg-gold text-deep" : "bg-blue/20 text-blue"}`}>
                      {mod.tag}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-3">{mod.title}</h3>
                  <p className="text-soft/60 text-sm leading-relaxed">{mod.body}</p>
                </div>
              ))}
            </div>
            <ProspectusButton />
          </div>
        </section>

        {/* LEVEL 2 VS LEVEL 3: answers "level 2 gym instructor course" and
            "level 3 personal trainer course" searches on this page. */}
        <section className="bg-surface py-14 md:py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase text-center mb-4">Level 2 and Level 3</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white text-center leading-none tracking-tight mb-4">
              What Level 2 and Level 3<br /><span className="text-gold">each qualify you to do.</span>
            </h2>
            <p className="text-soft/60 text-center text-lg mb-12 max-w-2xl mx-auto">
              Every UK personal trainer qualification is built on two levels. Our course covers both, Level 2 gym instructing and Level 3 personal training, in one NCFE course at one price.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
              {levels.map((l) => (
                <div key={l.level} className="bg-card border border-white/[0.07] rounded-2xl p-7">
                  <p className="font-display font-extrabold text-3xl text-blue mb-2">{l.level}</p>
                  <h3 className="text-white font-bold text-lg mb-3">{l.title}</h3>
                  <p className="text-soft/70 leading-relaxed">{l.body}</p>
                </div>
              ))}
            </div>
            <div className="max-w-3xl mx-auto space-y-4 text-soft/70 text-base md:text-lg leading-relaxed">
              <p>
                <span className="text-white font-semibold">Why you need both.</span> Level 2 comes before Level 3, and you need the pair to work as a personal trainer, get insured and take paying clients. That is why a cheap &ldquo;Level 3 course&rdquo; is not always the full route: if a provider quotes a Level 3 price on its own, ask whether Level 2 is included or sold separately. With ours, both are in the fee.
              </p>
              <p>
                For the whole route, from no experience to your first job in a gym, read our guide on{" "}
                <a href="/how-to-become-a-personal-trainer-uk" className="text-gold hover:underline font-semibold">how to become a personal trainer in the UK</a>.
              </p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS ONLINE + HOW LONG IT TAKES. Fully online: theory in
            modules, practicals filmed at any gym and assessed by video. */}
        <section className="bg-base py-14 md:py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase text-center mb-4">How it works</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white text-center leading-none tracking-tight mb-4">
              How the online course works,<br /><span className="text-gold">and how long it really takes.</span>
            </h2>
            <p className="text-soft/60 text-center text-lg mb-14 max-w-2xl mx-auto">
              The whole course is online, including the practical assessments. Here is what studying it actually looks like.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
              {studySteps.map((step) => (
                <div key={step.num} className="bg-card border border-white/[0.07] rounded-2xl p-7">
                  <p className="font-display font-extrabold text-3xl text-blue mb-5">{step.num}</p>
                  <h3 className="text-white font-bold text-lg mb-3">{step.title}</h3>
                  <p className="text-soft/60 text-sm leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
            <div className="max-w-3xl mx-auto bg-card border border-gold/30 rounded-2xl p-7 md:p-9">
              <h3 className="text-white font-bold text-xl md:text-2xl mb-4">How long does a personal trainer course take?</h3>
              <div className="space-y-4 text-soft/70 text-base leading-relaxed">
                <p>
                  The official figure for our course is 8 to 16 weeks, studying part-time around a job. Where you land in that range comes down to three things: how many hours a week you can give it, how soon you get your practical sessions filmed, and how much of your work needs resubmitting.
                </p>
                <p>
                  A fixed weekly routine is what keeps people inside the range. Two evenings and a weekend morning, every week, beats a long weekend once a month. Book your filming sessions with your practice client early, because waiting on someone else&apos;s diary is an easy way to lose a fortnight.
                </p>
                <p>
                  There are no intakes or start dates. Enrolment is rolling, so you start the day you enrol.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WHY NCFE */}
        <section className="bg-surface py-14 md:py-24 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-gold text-[11px] font-semibold tracking-widest uppercase mb-4">The qualification</p>
              <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white leading-none tracking-tight mb-6">
                Why NCFE sets<br />the standard.
              </h2>
              <p className="text-soft/70 text-lg leading-relaxed mb-6">
                The awarding body matters. NCFE (founded 1848) is listed on the Ofqual Register — the official UK government standard for qualifications. It&apos;s the qualification name UK gym managers ask for by default on their job listings — not a self-branded cert, not Focus Awards, not an in-house badge. When a gym scans 50 CVs, they look for NCFE Level 3 first.
              </p>
              <ul className="space-y-3">
                {["Listed on the Ofqual Register", "Recognised by CIMSPA", "Legal to work in any UK gym", "Credits transfer to Level 4 specialist courses"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-soft/70">
                    <span className="text-gold font-bold shrink-0">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "4–8 wks", label: "Fast-track completion" },
                { value: "100%", label: "Online delivery" },
                { value: "500+", label: "PTs hired by our team" },
                { value: "5.0★", label: "Google rating" },
              ].map((stat) => (
                <div key={stat.label} className="bg-card border border-white/[0.07] rounded-2xl p-6">
                  <p className="font-display font-extrabold text-gold text-4xl mb-2">{stat.value}</p>
                  <p className="text-soft/60 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* IS AN ONLINE QUALIFICATION RECOGNISED? */}
        <section className="bg-base py-14 md:py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase text-center mb-4">Online vs classroom</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white text-center leading-none tracking-tight mb-4">
              Is an online personal trainer<br />qualification <span className="text-gold">recognised?</span>
            </h2>
            <p className="text-soft/60 text-center text-lg mb-12 max-w-2xl mx-auto">
              Yes. Gyms and insurers look at the qualification, not at how you studied for it. An NCFE Level 3 earned online is the same regulated qualification as one earned in a classroom.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
              {recognition.map((r) => (
                <div key={r.title} className="bg-card border border-white/[0.07] rounded-2xl p-7">
                  <h3 className="text-white font-bold text-lg mb-3">{r.title}</h3>
                  <p className="text-soft/70 text-sm leading-relaxed">{r.body}</p>
                </div>
              ))}
            </div>
            <div className="max-w-3xl mx-auto space-y-4 text-soft/70 text-base md:text-lg leading-relaxed">
              <p>
                What to check is the qualification itself, not the delivery. A certificate that isn&apos;t on the Ofqual register, or a short course that skips Level 2, is the kind gyms turn away. When a gym manager reads your CV, they are looking for a regulated Level 3 from a recognised awarding body.
              </p>
              <p>
                More detail:{" "}
                <a href="/are-online-pt-qualifications-recognised-by-uk-gyms" className="text-gold hover:underline font-semibold">are online PT qualifications recognised by UK gyms?</a>{" "}
                and our{" "}
                <a href="/online-personal-trainer-course-uk" className="text-gold hover:underline font-semibold">comparison of 10 UK online personal trainer courses</a>, including how they are assessed and what they cost.
              </p>
            </div>
          </div>
        </section>

        {/* AFTER YOU QUALIFY. Introduction only, never an interview or a job. */}
        <section className="bg-surface py-14 md:py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase text-center mb-4">After you qualify</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white text-center leading-none tracking-tight mb-4">
              What happens <span className="text-gold">after you qualify.</span>
            </h2>
            <p className="text-soft/60 text-center text-lg mb-14 max-w-2xl mx-auto">
              The certificate is the start. Once every unit is signed off, these are the next steps, and where we stay involved.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {afterSteps.map((step) => (
                <div key={step.num} className="bg-card border border-white/[0.07] rounded-2xl p-7">
                  <p className="font-display font-extrabold text-3xl text-blue mb-5">{step.num}</p>
                  <h3 className="text-white font-bold text-lg mb-3">{step.title}</h3>
                  <p className="text-soft/60 text-sm leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GRADUATE STORIES */}
        <section className="bg-base py-14 md:py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase text-center mb-4">Graduate stories</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white text-center leading-none tracking-tight mb-16">
              Real people. <span className="text-gold">Real careers.</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stories.map((s) => (
                <div key={s.name} className="bg-card border border-white/[0.07] rounded-2xl p-8 hover:border-gold/30 transition-all">
                  <p className="text-gold text-xl font-bold mb-4">{s.name}</p>
                  <p className="text-soft/70 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* OBJECTION DISARMER */}
        <section className="bg-surface py-14 md:py-24 px-6 border-t border-white/[0.04]">
          <div className="max-w-5xl mx-auto">
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase text-center mb-4">Honest answers</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white text-center leading-none tracking-tight mb-4">
              The 5 things people say to us<br />
              <span className="text-gold">before they enrol.</span>
            </h2>
            <p className="text-soft/60 text-center text-base md:text-lg mb-14 max-w-2xl mx-auto">
              No script, no spin. The real worries people raise on their first call — and what we actually say back.
            </p>
            <div className="space-y-4">
              {objections.map((o, i) => (
                <div key={i} className="bg-card border border-white/[0.07] rounded-2xl p-6 md:p-8 hover:border-gold/30 transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    <span className="font-display font-extrabold text-gold/40 text-3xl md:text-4xl leading-none shrink-0">&ldquo;</span>
                    <p className="text-white text-lg md:text-xl font-semibold leading-snug pt-1">{o.quote}</p>
                  </div>
                  <p className="text-soft/70 text-base leading-relaxed pl-0 md:pl-12">{o.answer}</p>
                  {o.link && (
                    <p className="pl-0 md:pl-12 mt-3">
                      <a href={o.link.href} className="text-gold text-sm font-semibold hover:underline">
                        {o.link.label}
                      </a>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHO IT'S NOT FOR: saying plainly who should not buy makes the
            "yes, this is for you" believable. Every line must stay true:
            fully online, video-assessed practicals, an introduction not a job. */}
        <section className="bg-base py-14 md:py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase text-center mb-4">Is it right for you?</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white text-center leading-none tracking-tight mb-12">
              Who it&apos;s for, <span className="text-gold">and who it isn&apos;t.</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-card border border-gold/30 rounded-2xl p-7">
                <h3 className="text-white font-bold text-lg mb-4">It&apos;s a good fit if…</h3>
                <ul className="space-y-3">
                  {[
                    "You want a recognised NCFE Level 2 & 3 qualification without quitting your job.",
                    "You'd rather study online at your own pace, with a tutor checking in.",
                    "You're happy to film your practical sessions at a gym for assessment.",
                    "You want help with the business side, not just the certificate.",
                  ].map((t) => (
                    <li key={t} style={{ color: "rgba(255,255,255,0.88)" }} className="flex items-start gap-2.5 text-sm md:text-base leading-snug">
                      <CheckIcon />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-card border border-white/[0.07] rounded-2xl p-7">
                <h3 className="text-white font-bold text-lg mb-4">It&apos;s not for you if…</h3>
                <ul className="space-y-3">
                  {[
                    "You want classroom teaching. The course is fully online, with no in-person sessions.",
                    "You want a certificate without the work. Every unit is assessed to NCFE standards, and not everyone passes first time.",
                    "You need a guaranteed job. We introduce you to a gym when you qualify; whether they take you on is their decision.",
                    "You can't set aside regular time each week. Most learners finish in 8–16 weeks because they keep a steady pace.",
                  ].map((t) => (
                    <li key={t} style={{ color: "rgba(255,255,255,0.78)" }} className="flex items-start gap-2.5 text-sm md:text-base leading-snug">
                      <span className="text-white/40 font-bold shrink-0 mt-0.5">✕</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="text-center text-soft/60 text-sm mt-8">
              Not sure which side you&apos;re on? <a href="/book-call" className="text-gold hover:underline">Book a free 15-min call</a> and we&apos;ll tell you honestly.
            </p>
          </div>
        </section>

        {/* PRICING */}
        <section className="bg-surface py-14 md:py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase text-center mb-4">Investment</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white text-center leading-none tracking-tight mb-4">One fee. Everything bundled.</h2>
            <p className="text-soft/60 text-center text-lg mb-12 max-w-2xl mx-auto">
              Most UK PT academies sell the qualification, then upsell the mentorship. We bundle the lot — at a price that&apos;s lower than many charge for the qualification alone.
            </p>

            {/* COMPETITOR COST ANCHOR */}
            <div className="max-w-4xl mx-auto mb-16 rounded-2xl border border-white/15 bg-card overflow-hidden shadow-xl shadow-black/20">
              <div className="grid grid-cols-3 bg-deep/70 border-b border-white/15">
                <div className="p-4 md:p-5 text-white/90 text-[11px] font-bold tracking-widest uppercase">What you actually need</div>
                <div className="p-4 md:p-5 text-white/90 text-[11px] font-bold tracking-widest uppercase text-center">Typical UK PT academy</div>
                <div className="p-4 md:p-5 text-gold text-[11px] font-bold tracking-widest uppercase text-center">PT Launch Lab</div>
              </div>
              {compare.map((row, i) => (
                <div key={row.what} className={`grid grid-cols-3 bg-card ${i < compare.length - 1 ? "border-b border-white/10" : ""}`}>
                  <div style={{ color: "#ffffff" }} className="p-4 md:p-5 text-sm md:text-base font-semibold">{row.what}</div>
                  <div style={{ color: "#ffffff" }} className="p-4 md:p-5 text-sm md:text-base text-center font-medium">{row.typical}</div>
                  <div style={{ color: "#F5C518" }} className="p-4 md:p-5 text-sm md:text-base text-center font-semibold">{row.us}</div>
                </div>
              ))}
              <div className="grid grid-cols-3 bg-deep/70 border-t-2 border-gold/40">
                <div className="p-4 md:p-5 text-white text-sm md:text-base font-bold uppercase tracking-wide">Total</div>
                <div className="p-4 md:p-5 text-white/85 text-base md:text-lg text-center font-bold">£1,900 – £6,400</div>
                <div className="p-4 md:p-5 text-gold text-base md:text-xl text-center font-display font-extrabold">{COURSE_PRICE_LABEL}</div>
              </div>
            </div>

            {/* Pratfall — explicitly position above the £29-weekend-course
                segment. Disarms the "isn't this expensive?" objection by
                owning the premium positioning. */}
            <div className="max-w-3xl mx-auto mb-10 px-6 py-5 rounded-2xl border border-white/10 bg-deep/40 text-center">
              <p className="text-white text-base md:text-lg leading-relaxed">
                <span className="text-gold font-bold">We&apos;re not the £29 weekend course</span> — and we&apos;re proud of it.
                If a £29 cert was enough to be hired by a UK gym, we&apos;d sell that. It isn&apos;t. Here&apos;s what {COURSE_PRICE_LABEL} actually buys you.
              </p>
            </div>

            <p className="text-center text-gold text-[11px] font-semibold tracking-widest uppercase mb-3">Pricing</p>
            <h3 className="font-display font-extrabold text-2xl md:text-3xl text-white text-center leading-none tracking-tight mb-3">
              One price. <span className="text-gold">Everything included.</span>
            </h3>
            <p className="text-soft/60 text-center text-base mb-12 max-w-2xl mx-auto">
              {COURSE_PRICE_LABEL} for the full NCFE Level 2 &amp; 3 course, mentorship and gym introduction. Flexible ways to pay at checkout, or pay monthly.
            </p>

            <div className="flex flex-col gap-6 max-w-xl mx-auto">
              {pricing.map((plan) => (
                <div key={plan.title} className={`rounded-2xl p-7 border flex flex-col ${plan.recommended ? "bg-card border-2 border-gold/60 shadow-xl shadow-gold/10 relative" : "bg-card/60 border-white/[0.07] relative"}`}>
                  {plan.badge && (
                    <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${plan.recommended ? "bg-gold text-deep" : "bg-blue/20 text-blue border border-blue/40"}`}>
                      {plan.badge}
                    </div>
                  )}
                  <h3 className="text-white text-lg font-bold mb-4 mt-1">{plan.title}</h3>
                  <div className="mb-2 flex items-baseline gap-1.5">
                    <span className={`font-display font-extrabold leading-none ${plan.recommended ? "text-gold text-5xl md:text-6xl" : "text-white text-3xl md:text-4xl"}`}>{plan.headlineFigure}</span>
                    <span className="text-soft/80 text-sm font-semibold">{plan.headlineSuffix}</span>
                  </div>
                  <p className={`text-xs font-semibold mb-2 leading-snug ${plan.recommended ? "text-soft/80 text-sm" : "text-blue"}`}>{plan.subPrice}</p>
                  <p className="text-soft/60 text-sm mb-6 leading-snug">{plan.saving}</p>
                  <ul className="space-y-2.5 mb-7 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-soft/70 text-sm leading-snug">
                        <CheckIcon />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a href={plan.ctaHref}
                    className={`text-center px-5 py-3 rounded-full font-bold text-sm transition-all ${plan.recommended ? "bg-gold text-deep hover:brightness-110 shadow-md shadow-gold/20" : "border border-white/30 text-white hover:bg-white/10"}`}>
                    {plan.cta}
                  </a>
                </div>
              ))}
            </div>
            <p className="text-center text-faint text-xs md:text-sm mt-10 max-w-2xl mx-auto leading-relaxed">
              Both plans include the same qualification, Mentorship Hub, personal tutor, and a guaranteed gym introduction. Want to talk it through first? <a href="/book-call" className="text-gold hover:underline">Book a free 15-min call</a>.
            </p>

            {/* WHAT THE FEE COVERS, AND WHAT IT DOESN'T */}
            <div className="max-w-4xl mx-auto mt-16">
              <h3 className="font-display font-extrabold text-2xl md:text-3xl text-white text-center leading-none tracking-tight mb-3">
                What {COURSE_PRICE_LABEL} covers, <span className="text-gold">and what it doesn&apos;t.</span>
              </h3>
              <p className="text-soft/60 text-center text-base mb-10 max-w-2xl mx-auto">
                No paid upgrades or add-ons from us. The costs under &ldquo;Your own costs&rdquo; are paid to other people, so budget for them.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-card border border-gold/30 rounded-2xl p-7">
                  <h4 className="text-white font-bold text-lg mb-4">Included in the fee</h4>
                  <ul className="space-y-3">
                    {included.map((t) => (
                      <li key={t} className="flex items-start gap-2.5 text-soft/70 text-sm md:text-base leading-snug">
                        <CheckIcon />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-card border border-white/[0.07] rounded-2xl p-7">
                  <h4 className="text-white font-bold text-lg mb-4">Your own costs</h4>
                  <ul className="space-y-3">
                    {notIncluded.map((t) => (
                      <li key={t} className="flex items-start gap-2.5 text-soft/70 text-sm md:text-base leading-snug">
                        <span className="text-white/40 font-bold shrink-0">→</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-base py-14 md:py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase text-center mb-4">FAQ</p>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white text-center leading-none tracking-tight mb-16">Common questions.</h2>
            <div className="space-y-5">
              {faqs.map((faq) => (
                <div key={faq.q} className="bg-card border border-white/[0.07] rounded-2xl p-7">
                  <h3 className="text-white font-bold text-lg mb-3">{faq.q}</h3>
                  <p className="text-soft/70 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-surface py-14 md:py-24 px-6 text-center border-t border-white/[0.05]">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
              Ready to start?<br /><span className="text-gold">Let&apos;s build your career.</span>
            </h2>
            <p className="text-soft/60 text-lg mb-10">
              Enrol today and start your Level 2 &amp; 3 qualification immediately — or book a free call if you want to talk it through first.
            </p>
            <TwoWayCTA source="courses-final" className="justify-center" />
          </div>
        </section>

      </main>
      <StickyCtaBar watchSelector="[data-cta-source='courses-hero']" source="courses-sticky" />
      <Footer />
    </>
  );
}
