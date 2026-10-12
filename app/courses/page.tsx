import Nav from "../components/Nav";
import Footer from "../components/Footer";
import ProspectusButton from "../components/ProspectusButton";
import Breadcrumbs from "../components/Breadcrumbs";
import MoneyHero from "../components/money/MoneyHero";
import TwoWayCTA from "../components/cta/TwoWayCTA";
import StickyCtaBar from "../components/cta/StickyCtaBar";
import { faqPageSchema } from "@/app/lib/faqSchema";
import { COURSE_PRICE_LABEL, MONTHLY_PRICE_LABEL, MONTHLY_PLAN_LABEL, MONTHLY_PAYMENTS, MONTHLY_PLAN_TOTAL_PENCE, COURSE_PRICE_PENCE, formatPence } from "@/app/lib/pricing";

export const metadata = {
  title: "NCFE Level 2 & 3 Personal Trainer Courses Online | PT Launch Lab",
  description: `The straightforward route from your current job into personal training. NCFE Level 2 & 3, Ofqual regulated, done around your job. ${COURSE_PRICE_LABEL} or ${MONTHLY_PLAN_LABEL} monthly, with our £500 business mentorship community included.`,
  alternates: {
    canonical: "https://ptlaunchlab.co.uk/courses",
  },
};

const courseSchema = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "NCFE Level 2 & 3 Personal Trainer Qualification",
  description:
    `100% online NCFE Level 2 & 3 PT qualification. ${COURSE_PRICE_LABEL} in full or ${MONTHLY_PAYMENTS} monthly payments of ${MONTHLY_PRICE_LABEL}. Includes our £500 business mentorship community, a personal tutor, business training, and guaranteed warm introduction to a gyms — all bundled, no paid upgrades. Qualify in 8–16 weeks.`,
  provider: {
    "@type": "Organization",
    name: "PT Launch Lab",
    sameAs: "https://ptlaunchlab.co.uk",
  },
  timeRequired: "P8W",
  educationalCredentialAwarded: "NCFE Level 3 Personal Training Certificate",
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
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5.0",
    reviewCount: "3",
    bestRating: "5",
    worstRating: "1",
  },
  review: [
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Gemma" },
      datePublished: "2025-09-12",
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody: "Left a corporate career to build her own independent PT business. Now coaching full-time on her own terms. The business training and mentorship made all the difference.",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Matty Bell" },
      datePublished: "2025-09-06",
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody: "Turned a personal journey through adversity into a running and coaching brand that's still growing. PT Launch Lab gave me the foundation and the confidence to do it.",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Mac Livock" },
      datePublished: "2025-08-08",
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody: "Started as a trainee and rose to manager at PureGym. The guaranteed gym introductions and mentorship got me in the door — I did the rest.",
    },
  ],
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
  { num: "02", title: "Mentorship", body: "The £500 Mentorship Hub plus our Skool community — included free in the course fee. Built to walk you from qualifying to your first paying client. Direct access to Callum, Miles and Ryan when you're stuck." },
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
      "This is exactly what the Mentorship Hub is built for — it walks you from qualifying to your first paying client, milestone by milestone, with Callum a message away. You also stay in the Skool community for life. The part after qualifying is where this course keeps going. We stay until you've launched.",
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
    features: ["NCFE Level 2 & 3 qualification", "Personal tutor throughout", "£500 business mentorship community — included free", "A guaranteed gym introduction", "Direct access to Callum, Miles & Ryan"],
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
    features: ["NCFE Level 2 & 3 qualification", "Personal tutor throughout", "£500 business mentorship community — included free", "A guaranteed gym introduction", "Direct access to Callum, Miles & Ryan"],
    cta: "Pay monthly →",
    ctaHref: "/enrol",
    recommended: false,
    badge: null as string | null,
  },
];

const compare = [
  { what: "NCFE Level 2 & 3 qualification", typical: "£1,200 – £2,800", us: "Included" },
  { what: "Business mentorship community", typical: "£500 – £3,000", us: "Included free" },
  { what: "Personal tutor", typical: "£200 – £600 extra", us: "Included" },
  { what: "A guaranteed gym introduction", typical: "On you to find them", us: "We introduce you" },
];

const faqs = [
  { q: "Is the qualification recognised by gyms and insurers?", a: "Yes. Your NCFE Level 2 & 3 is regulated by Ofqual and recognised by CIMSPA and REPs — the gold standard for UK fitness professionals. NCFE is the qualification name UK gym managers ask for by default — PureGym, David Lloyd, Nuffield, JD Gyms, independents. Some UK academies use Focus Awards or self-branded certifications; NCFE is the one that doesn't need explaining on a CV." },
  { q: "Do I need any prior experience?", a: "None at all. Whether you're completely new to fitness or already coaching informally, the course is designed to take you from zero to qualified." },
  { q: "How long does it take?", a: "Most students complete in 8–16 weeks. Because it's fully online and self-paced, you fit it around your job, your family, your life." },
  { q: "What is the guaranteed gym introduction?", a: "Once you qualify, we approach at least one gym on your behalf: either one in our partner network, or one local to you. It is a warm introduction rather than a job-board listing. Whether they interview you, and whether you get the job, is their call. We've hired 500+ PTs ourselves, so we know what gyms look for and we prepare you for it." },
  { q: "Can I spread the cost?", a: `Yes. You can pay ${MONTHLY_PAYMENTS} monthly payments of ${MONTHLY_PRICE_LABEL}, with no interest. The first is taken when you enrol, then one a month. Book a free call if you'd like to talk it through.` },
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
          headline="The online NCFE Level 2 & 3 PT course,"
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
              <span className="text-gold font-bold" style={{ color: '#F5C518' }}>£500 business mentorship — bundled free.</span>{" "}
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
                {["Listed on the Ofqual Register", "Recognised by CIMSPA and REPs", "Legal to work in any UK gym", "Credits transfer to Level 4 specialist courses"].map((item) => (
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
                { value: "5.0★", label: "Google review rating" },
              ].map((stat) => (
                <div key={stat.label} className="bg-card border border-white/[0.07] rounded-2xl p-6">
                  <p className="font-display font-extrabold text-gold text-4xl mb-2">{stat.value}</p>
                  <p className="text-soft/60 text-sm">{stat.label}</p>
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
              Both plans include the same qualification, mentorship community, personal tutor, and a guaranteed gym introduction. Want to talk it through first? <a href="/book-call" className="text-gold hover:underline">Book a free 15-min call</a>.
            </p>
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
