import Image from "next/image";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import StickyMobileCTA from "../components/StickyMobileCTA";
import Accreditation from "../components/Accreditation";
import Reviews from "../components/Reviews";
import ProofStrip from "../components/ProofStrip";
import FunnelPricingBlock from "../components/FunnelPricingBlock";
import HeroLeadForm from "../components/HeroLeadForm";
import PromoBar from "../components/PromoBar";
import MoneyHero from "../components/money/MoneyHero";
import TwoWayCTA from "../components/cta/TwoWayCTA";
import { COURSE_PRICE_PENCE } from "@/app/lib/pricing";
import type { Heading, VslContent } from "./content";

// The /vsl ad landing pages' one layout (Phase 3b, 12 Oct 2026). The copy is
// per avatar in ./content.ts; each page.tsx keeps its own metadata.
//
// Hero: what it is, what it costs and both actions in the first phone screen,
// with the founders' video below the buttons (tap to play). The quiz is a calm
// band straight after the for-you-if list.

// Static dates. Previously computed with new Date() at build time, which told
// Google the article was published and modified afresh on every deploy.
const PUBLISHED = "2026-05-31";
const UPDATED = "2026-07-27";

const FOUNDERS = [
  { key: "callum", src: "/callum.webp", name: "Callum", role: "Head of Education" },
  { key: "ryan", src: "/ryan.webp", name: "Ryan", role: "Co-founder" },
  { key: "miles", src: "/miles.webp", name: "Miles", role: "Business Mentor" },
] as const;

const LEARNER_PHOTOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function H({ h }: { h: Heading }) {
  return (
    <>
      {h.lead}
      <br />
      {h.pre}
      <span className="text-gold">{h.gold}</span>
    </>
  );
}

function schemas(c: VslContent) {
  const course = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: c.schema.courseName,
    description: c.schema.courseDescription,
    provider: { "@type": "Organization", name: "PT Launch Lab", sameAs: "https://ptlaunchlab.co.uk" },
    educationalCredentialAwarded: "NCFE Level 3 Diploma in Gym Instructing and Personal Training (Ofqual ref 603/4388/6)",
    offers: { "@type": "Offer", price: (COURSE_PRICE_PENCE / 100).toFixed(2), priceCurrency: "GBP", availability: "https://schema.org/InStock", url: "https://ptlaunchlab.co.uk/enrol" },
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: c.schema.courseWorkload },
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const article = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    headline: c.schema.articleHeadline,
    description: c.schema.articleDescription,
    url: c.pageUrl,
    datePublished: `${PUBLISHED}T12:00:00Z`,
    dateModified: `${UPDATED}T12:00:00Z`,
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
    mainEntityOfPage: { "@type": "WebPage", "@id": c.pageUrl },
    image: { "@type": "ImageObject", url: "https://ptlaunchlab.co.uk/og-image.png", width: 1200, height: 630 },
  };
  return [article, course, faq];
}

export default function VslPage({ content: c }: { content: VslContent }) {
  return (
    <>
      {schemas(c).map((s) => (
        <script key={s["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      <Breadcrumbs trail={[{ name: c.breadcrumbName, url: c.pageUrl }]} />

      <PromoBar />
      <Nav />
      <main>

        {/* HERO: what it is, the price, both actions, then the video */}
        <MoneyHero
          eyebrow="NCFE LEVEL 2 & 3 · OFQUAL · CIMSPA"
          headline={c.hero.headline}
          goldTail={c.hero.goldTail}
          subline={c.hero.subline}
          source={`vsl-${c.avatar}-hero`}
          video={{
            kind: "youtube",
            src: c.youtubeId,
            poster: `https://i.ytimg.com/vi/${c.youtubeId}/hqdefault.jpg`,
            trackAs: `vsl_${c.avatar}`,
            metaEvent: "VSLPlay",
            title: "Watch: why PT Launch Lab, from the founders",
          }}
        />

        {/* THIS IS FOR YOU IF */}
        <section className="bg-base py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">Built for one type of person</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-10">
              This is for you <span className="text-gold">if&hellip;</span>
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 max-w-3xl mx-auto">
              {c.forYouIf.map((line) => (
                <li key={line} className="flex items-start gap-3 text-white text-base">
                  <span className="text-gold font-bold text-lg shrink-0 mt-0.5">✓</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="text-soft/75 text-center text-base mt-10 max-w-2xl mx-auto">{c.forYouOutro}</p>
          </div>
        </section>

        {/* QUIZ BAND: the soft option for the undecided */}
        <section className="bg-base px-6 pb-16">
          <h2 className="sr-only">Not sure yet?</h2>
          <div className="max-w-3xl mx-auto rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-5 text-center">
            <Link
              href={c.quizHref}
              data-cta="quiz-band"
              className="text-soft/85 text-base font-medium hover:text-gold underline-offset-4 hover:underline transition-colors"
            >
              Not sure yet? Take the 60-second PT career quiz →
            </Link>
          </div>
        </section>

        {/* EMPATHY */}
        <section className="bg-surface py-20 md:py-24 px-6 border-y border-white/[0.05]">
          <div className="max-w-3xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-4">You already know</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-8">
              <H h={c.empathy.heading} />
            </h2>
            {c.empathy.paras.map((p, i) => (
              <p key={i} className={`text-soft/85 text-lg leading-relaxed ${i < c.empathy.paras.length - 1 ? "mb-5" : ""}`}>
                {p.text}
                {p.strong && <span className="text-white font-semibold">{p.strong}</span>}
              </p>
            ))}
          </div>
        </section>

        {/* SKIP-THE-QUIZ — secondary lead capture for high intent */}
        <section className="bg-gradient-to-b from-base via-card to-base py-16 px-6 border-y border-gold/15">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-3">{c.skipQuiz.eyebrow}</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-4">
              Skip the quiz.
              <br />
              <span className="text-gold">{c.skipQuiz.gold}</span>
            </h2>
            <p className="text-soft/75 text-base mb-8 max-w-xl mx-auto">{c.skipQuiz.body}</p>
            <HeroLeadForm avatar={c.avatar} />
          </div>
        </section>

        {/* FOUNDERS STRIP — credibility, faces */}
        <section className="bg-base py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">{c.founders.eyebrow}</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white text-center leading-none tracking-tight mb-10">
              <H h={c.founders.heading} />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {FOUNDERS.map((f) => (
                <div key={f.name} className="bg-card border border-white/[0.06] rounded-2xl p-6 text-center hover:border-gold/30 transition-all">
                  <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-gold/50 mb-4">
                    <Image src={f.src} alt={f.name} fill className="object-cover object-top" sizes="96px" />
                  </div>
                  <p className="text-white font-bold text-lg">{f.name}</p>
                  <p className="text-gold text-xs font-bold tracking-widest uppercase mt-1 mb-4">{f.role}</p>
                  <p className="text-soft/80 text-sm italic leading-relaxed">&ldquo;{c.founders.quotes[f.key]}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PATHWAY (starter) / DESIGNED AROUND REAL LIFE (switcher, returner) */}
        <section className="bg-surface py-20 px-6 border-y border-white/[0.05]">
          <div className="max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">{c.pathway.eyebrow}</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-6">
              <H h={c.pathway.heading} />
            </h2>
            <p className="text-soft/80 text-lg text-center max-w-2xl mx-auto mb-12">{c.pathway.intro}</p>
            {c.pathway.layout === "rows" ? (
              <div className="space-y-4 max-w-3xl mx-auto">
                {c.pathway.items.map((row) => (
                  <div key={row.title} className="bg-card border border-white/[0.06] rounded-2xl p-6 flex flex-col sm:flex-row gap-5">
                    <div className="sm:w-32 shrink-0">
                      <p className="text-gold text-[11px] font-bold tracking-widest uppercase">{row.tag}</p>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">{row.title}</h3>
                      <p className="text-soft/75 text-sm leading-relaxed">{row.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {c.pathway.items.map((row) => (
                  <div key={row.title} className="bg-card border border-white/[0.06] rounded-2xl p-6">
                    <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-2">{row.tag}</p>
                    <h3 className="text-white font-bold text-lg mb-2">{row.title}</h3>
                    <p className="text-soft/75 text-sm leading-relaxed">{row.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section className="bg-base py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">The honest comparison</p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white text-center leading-none tracking-tight mb-4">
              <H h={c.comparison.heading} />
            </h2>
            <p className="text-soft/75 text-center text-base mb-12 max-w-2xl mx-auto">{c.comparison.intro}</p>
            <div className="rounded-2xl overflow-hidden border border-white/[0.06]">
              <div className="grid grid-cols-2 bg-card">
                <div className="px-5 sm:px-6 py-4 border-r border-white/[0.06]">
                  <p className="text-soft/60 text-[11px] font-bold uppercase tracking-widest">Most PT Courses</p>
                </div>
                <div className="px-5 sm:px-6 py-4 bg-gold/[0.05]">
                  <p className="text-gold text-[11px] font-bold uppercase tracking-widest">PT Launch Lab</p>
                </div>
              </div>
              {c.comparison.rows.map((row, i) => (
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
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-4">{c.future.eyebrow}</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-10">
              <H h={c.future.heading} />
            </h2>
            <ul className="space-y-5 text-lg text-soft/90">
              {c.future.lines.map((line) => (
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
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">{c.objections.eyebrow}</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-12">
              <H h={c.objections.heading} />
            </h2>
            <div className="space-y-6">
              {c.objections.items.map((o) => (
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
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">{c.steps.eyebrow}</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-6">
              <H h={c.steps.heading} />
            </h2>
            <p className="text-soft/75 text-center text-lg mb-14 max-w-2xl mx-auto">{c.steps.intro}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {c.steps.items.map((step, i) => (
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

        {/* LEARNER PHOTO STRIP */}
        <section className="bg-base py-14 overflow-hidden">
          <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-8">{c.learnerStripLabel}</p>
          <div className="overflow-hidden">
            <div className="flex gap-3 md:gap-4 animate-scroll-x w-max px-4">
              {LEARNER_PHOTOS.map((n, i) => (
                <div key={i} className="relative shrink-0 w-36 h-52 sm:w-44 sm:h-60 md:w-56 md:h-72 rounded-2xl overflow-hidden border border-white/[0.06] shadow-xl">
                  <Image src={`/learner-${n}.png`} alt="PT Launch Lab learner" fill className="object-cover object-center" sizes="(max-width: 640px) 144px, (max-width: 768px) 176px, 224px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-base/70 to-transparent" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING: pay in full first, then the monthly plan as a plain fact */}
        <section className="bg-surface py-20 px-6 border-y border-white/[0.05]">
          <div className="max-w-3xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">Pricing · no upsells</p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white text-center leading-none tracking-tight mb-6">
              One fee. Everything in.
              <br />
              <span className="text-gold">Pay in full or monthly.</span>
            </h2>
            <p className="text-soft/75 text-center text-base mb-10 max-w-xl mx-auto">{c.pricingIntro}</p>
            <FunnelPricingBlock variant="dark" source={`vsl-${c.avatar}-pricing`} />
          </div>
        </section>

        {/* AVATAR-MATCHED PROOF (Proof Engine) */}
        <ProofStrip avatar={c.avatar} heading={c.proofHeading} />

        {/* REVIEWS */}
        <Reviews />

        {/* ACCREDITATION */}
        <Accreditation />

        {/* FAQ */}
        <section className="bg-base py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">FAQ</p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white text-center leading-none tracking-tight mb-10">
              {c.faqHeading}
            </h2>
            <div className="space-y-3">
              {c.faqs.map((faq) => (
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

        {/* CLOSE: the page's own headline, then the shared two buttons.
            FinalCTA has fixed copy, so this uses TwoWayCTA as the spec allows. */}
        <section className="bg-surface py-24 px-6 border-t border-white/[0.05] relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[700px] h-[400px] rounded-full bg-gold/[0.05] blur-3xl" />
          </div>
          <div className="relative max-w-5xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">{c.close.eyebrow}</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-4">
              <H h={c.close.heading} />
            </h2>
            <p className="text-soft/75 text-center text-lg mb-10 max-w-xl mx-auto">{c.close.intro}</p>
            <TwoWayCTA source="vsl-final" className="justify-center" />
            <p className="text-soft/50 text-xs text-center mt-8">{c.close.footnote}</p>
          </div>
        </section>

      </main>
      <Footer />
      {/* Appears once this page's hero buttons have scrolled away. */}
      <StickyMobileCTA watchSelector={`[data-cta-source='vsl-${c.avatar}-hero']`} />
    </>
  );
}
