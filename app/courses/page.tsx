import Nav from "../components/Nav";
import Footer from "../components/Footer";
import ProspectusButton from "../components/ProspectusButton";
import Breadcrumbs from "../components/Breadcrumbs";

export const metadata = {
  title: "NCFE Level 2 & 3 Personal Trainer Courses Online | PT Launch Lab",
  description: "NCFE Level 2 & 3 PT qualification — the one UK gym managers ask for by name. £1,599 includes our £500 business mentorship community at no extra cost. Fast-track, Ofqual regulated, done around your job.",
  alternates: {
    canonical: "https://ptlaunchlab.co.uk/courses",
  },
};

const courseSchema = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "NCFE Level 2 & 3 Personal Trainer Qualification",
  description:
    "100% online NCFE Level 2 & 3 PT qualification at £1,599. Includes our £500 business mentorship community, a personal tutor, business training, and guaranteed warm-introduction gym interviews — all bundled, no paid upgrades. Qualify in 4–8 weeks.",
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
      name: "Full Payment",
      price: "1599",
      priceCurrency: "GBP",
      url: "https://ptlaunchlab.co.uk/enrol",
    },
    {
      "@type": "Offer",
      name: "Deposit Plan",
      price: "599",
      priceCurrency: "GBP",
      url: "https://ptlaunchlab.co.uk/enrol",
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
      reviewBody: "Started as a trainee and rose to manager at PureGym. The guaranteed gym interviews and mentorship got me in the door — I did the rest.",
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
  { num: "01", title: "Qualification", body: "NCFE Level 2 & 3, Ofqual regulated, fast-track. Done around your job in 4–8 weeks." },
  { num: "02", title: "Mentorship", body: "Our £500 business mentorship Skool community — included free with the £1,599 fee. Direct access to Callum, Miles and Ryan. Not a helpdesk — the people who've actually done it." },
  { num: "03", title: "Gym Placement", body: "Guaranteed interviews with our partner gyms. We've hired 500+ PTs — we prepare you properly.", highlight: true },
  { num: "04", title: "Income Building", body: "Pricing, first clients, rates, brand. How to make money from day one as a qualified PT." },
  { num: "05", title: "Online Coaching", body: "Expand beyond the gym. Build an income stream that scales without a ceiling." },
];

const stories = [
  { name: "Gemma", body: "Left a corporate career to build her own independent PT business. Now coaching full-time on her own terms." },
  { name: "Matty", body: "Turned a personal journey through adversity into a running and coaching brand that's still growing." },
  { name: "Mac", body: "Started as a trainee and rose to manager at PureGym. Exactly the kind of outcome we build towards." },
];

const pricing = [
  {
    title: "Full Payment",
    price: "£1,599",
    saving: "Most popular",
    features: ["NCFE Level 2 & 3 qualification", "Personal tutor throughout", "£500 business mentorship community — included free", "Guaranteed gym interviews", "Direct access to Callum, Miles & Ryan"],
    recommended: true,
  },
  {
    title: "Deposit Plan",
    price: "£599",
    saving: "then £200 × 5 months",
    features: ["NCFE Level 2 & 3 qualification", "Personal tutor throughout", "£500 business mentorship community — included free", "Guaranteed gym interviews", "Direct access to Callum, Miles & Ryan"],
    recommended: false,
  },
];

const faqs = [
  { q: "Is the qualification recognised by gyms and insurers?", a: "Yes. Your NCFE Level 2 & 3 is regulated by Ofqual and recognised by CIMSPA and REPs — the gold standard for UK fitness professionals. NCFE is the qualification name UK gym managers ask for by default — PureGym, David Lloyd, Nuffield, JD Gyms, independents. Some UK academies use Focus Awards or self-branded certifications; NCFE is the one that doesn't need explaining on a CV." },
  { q: "Do I need any prior experience?", a: "None at all. Whether you're completely new to fitness or already coaching informally, the course is designed to take you from zero to qualified." },
  { q: "How long does it take?", a: "Most students complete in 4–8 weeks. Because it's fully online and self-paced, you fit it around your job, your family, your life." },
  { q: "What is the guaranteed gym interview?", a: "Once you qualify, we actively connect you with our partner gyms for interviews. This isn't a vague promise — it's built into the course. We've hired 500+ PTs ourselves and we know exactly what gyms look for." },
  { q: "Is finance available?", a: "Yes. We offer Payl8r finance over 12–18 months. Book a free call and we'll walk you through the options." },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      <Breadcrumbs trail={[{ name: "Courses", url: "https://ptlaunchlab.co.uk/courses" }]} />
      <Nav />
      <main className="pt-[72px]">

        {/* HERO */}
        <section className="bg-base py-14 md:py-24 px-6 text-center relative overflow-hidden">
          <div className="absolute -left-48 top-0 w-[500px] h-[500px] rounded-full bg-gold opacity-[0.05] blur-3xl pointer-events-none" />
          <div className="absolute -right-32 top-20 w-[400px] h-[400px] rounded-full bg-blue opacity-[0.06] blur-3xl pointer-events-none" />
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <line x1="0" y1="0" x2="40%" y2="100%" stroke="#F5C518" strokeWidth="1" />
            <line x1="20%" y1="0" x2="65%" y2="100%" stroke="#F5C518" strokeWidth="0.5" />
          </svg>
          <div className="relative max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-gold/30 bg-surface mb-8">
              <span className="text-gold text-xs font-semibold tracking-widest uppercase">
                Level 2 &amp; 3 PT · NCFE · Ofqual · CIMSPA
              </span>
            </div>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-6">
              The PT course built by<br />
              <span className="text-gold">gym owners who hire trainers.</span>
            </h1>
            <p className="text-xl text-white font-semibold mb-4">
              Most PT courses teach theory. We build personal trainers gyms actually want to hire.
            </p>
            <p className="text-lg text-soft/70 max-w-2xl mx-auto mb-10">
              NCFE Level 2 &amp; 3, fast-track, fully online — done around your current job. Mentorship, guaranteed gym interviews, and a complete business launchpad included.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/enrol"
                className="px-8 py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-gold/20">
                Start Application →
              </a>
              <a href="/book-call"
                className="px-8 py-4 rounded-full border border-gold text-gold font-semibold text-base hover:bg-gold hover:text-deep transition-all">
                Discover Your Pathway
              </a>
            </div>
          </div>
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
              12 modules total. These are the ones that matter most — the knowledge and skills every gym, insurer, and client expects from a qualified PT.
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

        {/* PRICING */}
        <section className="bg-surface py-14 md:py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase text-center mb-4">Investment</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white text-center leading-none tracking-tight mb-4">Simple, transparent pricing.</h2>
            <p className="text-soft/60 text-center text-lg mb-16 max-w-xl mx-auto">
              No hidden fees. Finance available. Pay in a way that works for you.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {pricing.map((plan) => (
                <div key={plan.title} className={`rounded-2xl p-8 border flex flex-col ${plan.recommended ? "bg-card border-gold/50 shadow-lg shadow-gold/10 relative" : "bg-card border-white/[0.07]"}`}>
                  {plan.recommended && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold text-deep px-5 py-1.5 rounded-full text-xs font-bold">
                      Best Value
                    </div>
                  )}
                  <h3 className="text-white text-xl font-bold mb-2">{plan.title}</h3>
                  <p className="font-display font-extrabold text-gold text-4xl mb-1">{plan.price}</p>
                  {plan.saving && <p className="text-soft/60 text-sm mb-6">{plan.saving}</p>}
                  {!plan.saving && <div className="mb-6" />}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-soft/70 text-sm">
                        <CheckIcon />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a href="/enrol"
                    className={`text-center px-6 py-3 rounded-full font-bold text-sm transition-all ${plan.recommended ? "bg-gold text-deep hover:brightness-110" : "border border-gold text-gold hover:bg-gold hover:text-deep"}`}>
                    Get Started →
                  </a>
                </div>
              ))}
            </div>
            <p className="text-center text-faint text-sm mt-8">
              Finance available via Payl8r over 12–18 months. <a href="/book-call" className="text-gold hover:underline">Book a free call</a> to discuss options.
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/enrol"
                className="px-8 py-4 rounded-full bg-gold text-deep font-bold hover:brightness-110 transition-all shadow-lg shadow-gold/20">
                Enrol Now →
              </a>
              <a href="/book-call"
                className="px-8 py-4 rounded-full border border-gold text-gold font-semibold hover:bg-gold hover:text-deep transition-all">
                Discover Your Pathway
              </a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
