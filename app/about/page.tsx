import Image from "next/image";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import FounderTabs from "../components/FounderTabs";
import Breadcrumbs from "../components/Breadcrumbs";

export const metadata = {
  title: "About PT Launch Lab — PT Academy Founded by Gym Owners",
  description: "PT Launch Lab is a gym-owner run PT academy based in Pontefract, Yorkshire. We don't just run courses — we run gyms, we hire trainers, and we know what works.",
  alternates: {
    canonical: "https://ptlaunchlab.co.uk/about",
  },
};

const values = [
  {
    icon: "target",
    title: "Mentorship as standard",
    body: "Every student gets real mentorship — not a helpdesk. Direct access to Callum, Miles and Ryan from day one through to your first paying clients.",
  },
  {
    icon: "barbell",
    title: "Built by gym owners",
    body: "We don't just teach theory. We run gyms, we hire trainers, and we built this course from what we've actually seen work — and what we've seen fail.",
  },
  {
    icon: "briefcase",
    title: "Business first",
    body: "Getting qualified is step one. Building a career that pays you is the point. That's why business training isn't an add-on — it's in the core.",
  },
  {
    icon: "users",
    title: "Nobody left behind",
    body: "The biggest reason PTs fail in their first six months is isolation. We stay with you through qualification and into your career. That's the commitment.",
  },
  {
    icon: "pin",
    title: "Yorkshire roots",
    body: "Founded in Pontefract. Direct, honest, no-nonsense. We say what we mean and we mean what we say — and we think that's exactly what this industry needs more of.",
  },
  {
    icon: "network",
    title: "Real industry connections",
    body: "Gym partnerships, 500+ PTs hired, white-label academies. We're embedded in the UK fitness industry — not watching it from the outside.",
  },
];

const stats = [
  { value: "500+", label: "PTs hired by our team" },
  { value: "30+", label: "Years combined experience" },
  { value: "£500K+", label: "Revenue as independent PTs" },
  { value: "100s", label: "Students qualified" },
];

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "PT Launch Lab",
  url: "https://ptlaunchlab.co.uk",
  logo: "https://ptlaunchlab.co.uk/logo.png",
  description: "UK personal trainer qualification academy offering NCFE Level 2 & 3 PT courses online. Ofqual regulated, CIMSPA recognised, founded by gym owners.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Pontefract",
    addressRegion: "West Yorkshire",
    postalCode: "WF8",
    addressCountry: "GB",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 53.6917,
    longitude: -1.3127,
  },
  telephone: "",
  sameAs: [
    "https://www.youtube.com/@ptlaunchlab",
    "https://www.instagram.com/ptlaunchlab",
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5.0",
    reviewCount: "17",
    bestRating: "5",
  },
};

const foundersSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      name: "Callum Brown",
      jobTitle: "Co-Founder & Educator",
      worksFor: { "@type": "Organization", name: "PT Launch Lab", url: "https://ptlaunchlab.co.uk" },
      url: "https://ptlaunchlab.co.uk/about",
      sameAs: ["https://www.youtube.com/@ptlaunchlab", "https://www.instagram.com/ptlaunchlab"],
      description: "Co-founder of PT Launch Lab and experienced personal trainer and gym owner. Has hired 500+ personal trainers and built a fitness business generating over £500K in revenue.",
    },
    {
      "@type": "Person",
      name: "Ryan Robinson",
      jobTitle: "Co-Founder",
      worksFor: { "@type": "Organization", name: "PT Launch Lab", url: "https://ptlaunchlab.co.uk" },
      url: "https://ptlaunchlab.co.uk/about",
      description: "Co-founder of PT Launch Lab with 30+ years combined experience in the UK fitness industry as a gym owner and personal trainer.",
    },
  ],
};

function ValueIcon({ type }: { type: string }) {
  const cls = "w-6 h-6 text-gold";
  if (type === "target") return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={cls}>
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
  if (type === "barbell") return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={cls}>
      <path d="M6 12h12M4 8v8M20 8v8M2 9v6M22 9v6" />
    </svg>
  );
  if (type === "briefcase") return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
  if (type === "users") return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
  if (type === "pin") return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
  if (type === "network") return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
      <path d="M12 7v4m0 0-5.5 6M12 11l5.5 6" />
    </svg>
  );
  return null;
}

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(foundersSchema) }}
      />
      <Breadcrumbs trail={[{ name: "About", url: "https://ptlaunchlab.co.uk/about" }]} />
      <Nav />
      <main className="pt-[72px]">

        {/* HERO */}
        <section className="bg-base py-24 px-6 relative overflow-hidden">
          <div className="absolute -left-48 top-0 w-[500px] h-[500px] rounded-full bg-gold opacity-[0.05] blur-3xl pointer-events-none" />
          <div className="absolute -right-32 top-20 w-[400px] h-[400px] rounded-full bg-blue opacity-[0.06] blur-3xl pointer-events-none" />
          <div className="relative max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-gold text-[11px] font-semibold tracking-widest uppercase mb-4">Who we are</p>
              <h1 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-6">
                We don&apos;t just run<br />PT courses.
              </h1>
              <p className="text-xl text-gold font-semibold mb-6">
                We run gyms. We hire trainers. We know what works.
              </p>
              <p className="text-lg text-soft/70 leading-relaxed mb-8">
                PT Launch Lab was built by Callum, Miles and Ryan — three personal trainers who scaled a fitness business to over £500K in revenue, hired hundreds of PTs, and then built the academy they wished had existed when they were starting out.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="/courses"
                  className="px-7 py-3.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all">
                  View the Course →
                </a>
                <a href="/book-call"
                  className="px-7 py-3.5 rounded-full border border-gold text-gold font-semibold text-sm hover:bg-gold hover:text-deep transition-all">
                  Discover Your Pathway
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-card border border-white/[0.07] rounded-2xl p-6">
                  <p className="font-display font-extrabold text-gold text-4xl mb-2">{stat.value}</p>
                  <p className="text-soft/60 text-sm leading-relaxed">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MISSION */}
        <section className="bg-surface py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-1 bg-gold rounded mx-auto mb-10" />
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-8">
              Everyone deserves mentorship<br />
              <span className="text-gold">as standard.</span>
            </h2>
            <p className="text-xl text-soft/70 leading-relaxed mb-6">
              The biggest reason PTs fail in their first six months isn&apos;t lack of knowledge — it&apos;s lack of direction. They qualify, step out alone, and have no idea how to get clients, what to charge, or how to build something that actually pays them.
            </p>
            <p className="text-xl text-soft/70 leading-relaxed">
              We built PT Launch Lab to fix that. Not just a qualification — a complete pathway from career change to career built.
            </p>
          </div>
        </section>

        {/* THE STORY */}
        <section id="our-story" className="bg-base py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase text-center mb-4">Our story</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white text-center leading-none tracking-tight mb-16">
              Built from experience.<br /><span className="text-gold">Not a textbook.</span>
            </h2>
            <FounderTabs />
          </div>
        </section>

        {/* VALUES */}
        <section className="bg-surface py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase text-center mb-4">What drives us</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white text-center leading-none tracking-tight mb-16">
              How we operate.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {values.map((v) => (
                <div key={v.title} className="bg-card border border-white/[0.07] rounded-2xl p-7 hover:border-gold/30 transition-all">
                  <div className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                    <ValueIcon type={v.icon} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-3">{v.title}</h3>
                  <p className="text-soft/60 text-sm leading-relaxed">{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PODCAST */}
        <section className="bg-base py-24 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-gold text-[11px] font-semibold tracking-widest uppercase mb-4">The podcast</p>
              <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white leading-none tracking-tight mb-6">
                Real stories. Real<br /><span className="text-gold">Yorkshire honesty.</span>
              </h2>
              <p className="text-soft/70 text-lg leading-relaxed mb-6">
                The PT Launch Lab Podcast covers what nobody else talks about — how PTs actually build careers, make money, and navigate the reality of working in fitness.
              </p>
              <ul className="space-y-3 mb-8">
                {["Real transformation stories from working PTs", "Step-by-step business building from scratch", "How to go from qualification to full-time income", "Honest takes on the fitness industry"].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-soft/70">
                    <span className="text-gold font-bold shrink-0">→</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a href="https://www.youtube.com/@ptlaunchlab" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gold text-gold font-semibold text-sm hover:bg-gold hover:text-deep transition-all">
                Watch on YouTube →
              </a>
            </div>
            <div className="flex flex-col items-center gap-5">
              <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
                <Image
                  src="/podcast-thumbnail.jpg"
                  alt="PT Launch Lab Podcast — Callum Brown & Ryan Robinson"
                  width={480}
                  height={480}
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="w-full max-w-sm space-y-3">
                <a href="https://www.youtube.com/@ptlaunchlab" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  YouTube
                </a>
                <a href="https://www.instagram.com/ptlaunchlab" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-white/[0.1] text-soft/60 font-bold text-sm hover:border-gold/40 hover:text-white transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                  </svg>
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-surface py-24 px-6 text-center border-t border-white/[0.05]">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-6">
              Want to know if this is<br /><span className="text-gold">right for you?</span>
            </h2>
            <p className="text-soft/60 text-lg mb-10">
              Book a free 15-minute call with Callum, Miles or Ryan. No pressure, no script — just an honest conversation about your situation and what the right next step looks like.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/book-call"
                className="px-8 py-4 rounded-full bg-gold text-deep font-bold hover:brightness-110 transition-all shadow-lg shadow-gold/20">
                Discover Your Pathway →
              </a>
              <a href="/courses"
                className="px-8 py-4 rounded-full border border-gold text-gold font-semibold hover:bg-gold hover:text-deep transition-all">
                View the Course
              </a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
