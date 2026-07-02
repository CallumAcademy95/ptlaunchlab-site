import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import Breadcrumbs from "../../components/Breadcrumbs";
import StickyMobileCTA from "../../components/StickyMobileCTA";
import Accreditation from "../../components/Accreditation";
import Reviews from "../../components/Reviews";
import ProofStrip from "../../components/ProofStrip";
import FunnelPricingBlock from "../../components/FunnelPricingBlock";
import HeroLeadForm from "../../components/HeroLeadForm";
import PromoBar from "../../components/PromoBar";

const PAGE_URL = "https://ptlaunchlab.co.uk/vsl/become-a-personal-trainer-uk";
const TODAY = new Date().toISOString().split("T")[0];

export const metadata: Metadata = {
  title: "Become a Personal Trainer in the UK — Level 2 & 3 Course (Online) | PT Launch Lab",
  description:
    "Turn your gym obsession into a recognised career. NCFE Level 2 & 3 Personal Trainer course, Ofqual regulated, fully online, no degree. Built for people who already live in the gym.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    title: "Become a Personal Trainer in the UK — Level 2 & 3 Course (Online)",
    description:
      "Turn your gym obsession into a recognised career. NCFE Level 2 & 3, Ofqual regulated, fully online. No degree, no guesswork, no £29 PDF scams.",
    url: PAGE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

// ─── COPY ─────────────────────────────────────────────────────────────────────

const forYouIf = [
  "You practically live in the gym already",
  "Your mates already ask you for programme advice",
  "You don't want a desk job, and university isn't the move",
  "You've thought about PT for months but Reddit keeps confusing you",
  "You want a career you'd actually talk about at a dinner party",
  "You're worried half the courses online are a scam",
];

const objections = [
  {
    q: "What if I've never coached anyone before?",
    a: "You don't need to have. The course starts at the foundations — anatomy, how a squat actually works, how to read a body, how to write a programme. We've put learners through who'd never coached a single person and watched them walk into their first session shaking and walk out with rebookings. The skill is taught. The job is just turning up to learn it.",
  },
  {
    q: "Won't the industry just spit me out — isn't it saturated?",
    a: "The UK has 11.5 million gym members across 7,200+ gyms. There's no shortage of clients. There's a shortage of PTs who know how to find them — which is why 80% of newly-qualified UK PTs quit inside 18 months. That's the gap the £500 Mentorship Hub (free with your course) is built to close. You don't compete with the cert-only PTs. You out-position them.",
  },
  {
    q: "Am I really qualified enough? I haven't got abs / a degree / a sport science background.",
    a: "None of that matters. UK gym hiring managers don't ask for abs or a degree — they ask for NCFE Level 3 by default on their job listings. That's exactly what you walk away with. Confidence comes from competence, not aesthetics. Your tutor reviews every assessment before you submit, so the qualification itself stops feeling intimidating fast.",
  },
  {
    q: "How do I know this isn't another £29 PDF scam?",
    a: "Two checks: (1) the qualification is on the Ofqual Register — the UK government's public list of regulated qualifications — under reference 603/4388/6. (2) The awarding body is NCFE, the qualification name UK gym managers list by default on hiring posts. Anything outside Ofqual is CPD, not a qualification. We're the regulated route.",
  },
];

const steps = [
  { n: 1, title: "Enrol — your tutor lands within 24 hours", body: "Immediate access to the Merve app. No cohort start dates. Your tutor is a real person, not a help desk — most learners are messaging them by day two." },
  { n: 2, title: "Smash Level 2 — Gym Instructor", body: "Anatomy, physiology, gym floor coaching, client consultations. The legal prerequisite for Level 3 — already included in your fee, not sold separately." },
  { n: 3, title: "Move into Level 3 — Personal Trainer", body: "Programming, nutrition, business planning. Video-assessed practicals — film yourself coaching real movements at any gym, tutor reviews the footage." },
  { n: 4, title: "Qualify — NCFE, Ofqual regulated", body: "The qualification UK gym managers ask for by default. Register with CIMSPA, get insured (~£60/year), become a legally practising UK PT." },
  { n: 5, title: "Get warm-introduction gym interviews", body: "We've personally hired 500+ PTs across our partner gym network. Direct introductions, not cold CV drops. No other UK course offers this." },
  { n: 6, title: "Build your client base via the Mentorship Hub", body: "Niche, pricing, marketing, first 10 clients. The £500 PT Launch Lab Mentorship Hub is bundled free — your dashboard from 'qualified' to 'fully booked.'" },
];

const comparisonRows = [
  { other: "Just a certificate — figure the rest out yourself", us: "Certificate + personal tutor + business mentorship" },
  { other: "No help getting hired",                              us: "Warm intros into our partner gym network" },
  { other: "Run by lecturers, not practitioners",                us: "Run by gym owners who've hired 500+ PTs" },
  { other: "No business training",                               us: "£500 Mentorship Hub bundled free" },
  { other: "Help-desk ticket if you get stuck",                  us: "Your tutor's a message away — answers in hours, not days" },
  { other: "Surprise upsell fees post-enrolment",                us: "£1,599 total. Nothing sold as a paid upgrade later" },
];

const faqs = [
  { q: "How do you become a personal trainer in the UK?", a: "Two qualifications: NCFE Level 2 Gym Instructor (legal prerequisite) followed by NCFE Level 3 Personal Trainer. Both Ofqual regulated, both bundled in our £1,599 course. Once you've passed Level 3 you register with CIMSPA, get public liability insurance (~£60/year), and you can legally take paying 1-to-1 clients in any UK commercial gym. No degree required. No minimum age above 16." },
  { q: "Do I need Level 2 if I just want to do Level 3?", a: "Yes — Level 2 is the legal prerequisite for Level 3 Personal Trainer. Some providers quote a 'Level 3 only' price to look cheap, then bolt Level 2 on as a £500 extra. Our £1,599 fee includes both. One fee, one tutor, one finish line." },
  { q: "Will gyms actually hire me with this qualification?", a: "Yes. NCFE is the awarding body UK gym managers ask for by default on job postings — PureGym, JD Gyms, Nuffield Health, David Lloyd, and every major independent operator. Our team has personally hired 500+ PTs across our partner gym network, so we know exactly what the hiring managers look for. We make warm introductions when you qualify." },
  { q: "Can I afford it?", a: "Most learners use a payment plan. £599 deposit then 5 × £200 monthly is the most popular. Payl8er finance over 3–18 months and Stripe 0% over 12 months are also available. Once qualified, a single PT session at £30 covers a month's payment." },
  { q: "Can I really do this online from home?", a: "Yes — 100% online. Theory via the Merve app, practicals via video assessment (you film yourself coaching at any gym, tutor reviews remotely). NCFE, Focus Awards, and Active IQ all accept video assessment. Online-qualified PTs get hired at every major UK gym every week — what matters is the certificate, not the room you got it in." },
  { q: "When can I start?", a: "Immediately. Full access to the Merve app opens the moment you enrol. Your tutor is introduced within 24 hours. There's no cohort start date — many learners are halfway through their first unit by the end of day one." },
];

const founders = [
  { src: "/callum.webp", name: "Callum",  role: "Head of Education", quote: "I built the course I wish had existed when I started." },
  { src: "/ryan.webp",   name: "Ryan",    role: "Co-founder",        quote: "We've hired 500+ PTs. We know exactly what gyms look for." },
  { src: "/miles.webp",  name: "Miles",   role: "Business Mentor",   quote: "Qualification is step one. The business is what pays you." },
];

// ─── SCHEMA ───────────────────────────────────────────────────────────────────

const courseSchema = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "NCFE Level 2 & Level 3 Diploma in Gym Instructing and Personal Training",
  description: "Become a qualified UK Personal Trainer with an Ofqual-regulated NCFE Level 2 Gym Instructor and Level 3 Personal Trainer diploma. Fully online, includes business mentorship and guaranteed gym interviews on graduation.",
  provider: { "@type": "Organization", name: "PT Launch Lab", sameAs: "https://ptlaunchlab.co.uk" },
  educationalCredentialAwarded: "NCFE Level 3 Diploma in Gym Instructing and Personal Training (Ofqual ref 603/4388/6)",
  offers: { "@type": "Offer", price: "1599", priceCurrency: "GBP", availability: "https://schema.org/InStock", url: "https://ptlaunchlab.co.uk/enrol" },
  hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: "PT8W" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  headline: "Become a Personal Trainer in the UK — Level 2 & 3 Course (Online)",
  description: "Turn your gym obsession into a recognised career. NCFE Level 2 & 3, Ofqual regulated, fully online.",
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

export default function BecomeAPersonalTrainerUkPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Breadcrumbs trail={[{ name: "Become a Personal Trainer UK", url: PAGE_URL }]} />

      <PromoBar />
      <Nav />
      <main className="pt-[72px]">

        {/* HERO — identity + inline lead capture */}
        <section className="bg-base py-16 md:py-24 px-6 relative overflow-hidden">
          <div className="absolute -left-48 top-0 w-[600px] h-[600px] rounded-full bg-gold opacity-[0.06] blur-3xl pointer-events-none" />
          <div className="absolute -right-32 bottom-0 w-[500px] h-[500px] rounded-full bg-blue opacity-[0.07] blur-3xl pointer-events-none" />
          <div className="relative max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/40 bg-gold/5 mb-8">
              <span className="text-gold text-[11px] font-bold tracking-widest uppercase">NCFE · Ofqual Regulated · 603/4388/6</span>
            </div>
            <h1 className="font-display font-extrabold text-5xl md:text-8xl text-white leading-[0.95] tracking-tight mb-7">
              Turn your gym obsession
              <br />
              into a <span className="text-gold">recognised career.</span>
            </h1>
            <p className="text-xl text-soft/85 leading-relaxed mb-10 max-w-2xl mx-auto">
              NCFE Level 2 + Level 3, fully online, no degree — taught by gym owners who&apos;ve personally hired 500+ PTs into real gyms across the UK. Take the 60-second quiz to see if PT is actually the right move for you. Honest answer either way.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Link
                href="/quiz?avatar=starter"
                data-cta="hero-quiz"
                className="px-10 py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-gold/30 text-center"
              >
                Take The PT Career Quiz →
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
              ⭐ 5.0 · 19 Verified Google Reviews &nbsp;·&nbsp; Run by gym owners, not lecturers &nbsp;·&nbsp; No hard sell on the call
            </p>
          </div>
        </section>

        {/* VSL — founders explain why */}
        <section className="bg-surface py-16 px-6 border-y border-white/[0.05]">
          <div className="max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">Watch first — 4 minutes</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white text-center leading-none tracking-tight mb-3">
              Why 80% of PTs fail —
              <br />
              <span className="text-gold">and exactly how we fix it.</span>
            </h2>
            <p className="text-soft/75 text-center text-base max-w-2xl mx-auto mb-10">
              Callum, Miles and Ryan on what most courses get wrong, what gym managers actually hire for, and why this one&apos;s built differently.
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
              If you ticked four or more, you&apos;re not browsing — you&apos;re closer than you think. The next paragraph is for you.
            </p>
          </div>
        </section>

        {/* EMPATHY */}
        <section className="bg-surface py-20 md:py-24 px-6 border-y border-white/[0.05]">
          <div className="max-w-3xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-4">You already know</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-8">
              You&apos;re going to be in a gym
              <br />
              <span className="text-gold">for the rest of your life anyway.</span>
            </h2>
            <p className="text-soft/85 text-lg leading-relaxed mb-5">
              You think about training when you&apos;re at work. You schedule your week around your sessions. Your mates already ping you about programmes, lifts they can&apos;t get right, food questions you answer off the top of your head.
            </p>
            <p className="text-soft/85 text-lg leading-relaxed mb-5">
              And somewhere in the back of your head there&apos;s a quiet voice saying: <span className="text-white font-semibold">why am I not getting paid for this?</span>
            </p>
            <p className="text-soft/85 text-lg leading-relaxed">
              The honest answer is usually the same one. You don&apos;t know which qualification is real. You don&apos;t know if you&apos;re &ldquo;expert enough.&rdquo; You don&apos;t know what happens after you qualify. The rest of this page is the straight answer to all three.
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
              <span className="text-gold">Talk to a real person.</span>
            </h2>
            <p className="text-soft/75 text-base mb-8 max-w-xl mx-auto">
              If you already know PT is for you, drop your details. We&apos;ll WhatsApp you a quick intro, lock in £200 off, and you can book your call straight after.
            </p>
            <HeroLeadForm avatar="starter" />
          </div>
        </section>

        {/* FOUNDERS STRIP — credibility, faces */}
        <section className="bg-base py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">Run by gym owners</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white text-center leading-none tracking-tight mb-10">
              Not lecturers.
              <br />
              <span className="text-gold">People who&apos;ve actually hired you.</span>
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

        {/* PATHWAY CLARITY */}
        <section className="bg-surface py-20 px-6 border-y border-white/[0.05]">
          <div className="max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">The bit Reddit gets wrong</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-6">
              You don&apos;t pick &ldquo;Level 3.&rdquo;
              <br />
              <span className="text-gold">You do Level 2, then Level 3.</span>
            </h2>
            <p className="text-soft/80 text-lg text-center max-w-2xl mx-auto mb-12">
              Half the cheap courses advertise &ldquo;Level 3&rdquo; then make you buy Level 2 separately when you&apos;re already invested. Ours doesn&apos;t. Here&apos;s the actual pathway, with no asterisks.
            </p>
            <div className="space-y-4 max-w-3xl mx-auto">
              {[
                { tag: "Step 1", title: "Level 2 Gym Instructor (legal prerequisite)", body: "Anatomy, physiology, gym floor coaching, client inductions. You can't take Level 3 without it. Included in your fee." },
                { tag: "Step 2", title: "Level 3 Personal Trainer", body: "Programming, nutrition, business planning, practical coaching. This is the one UK gym managers ask for by name." },
                { tag: "Awarded by", title: "NCFE — Ofqual reference 603/4388/6", body: "On the UK government's public register of regulated qualifications. The default name on PureGym, JD Gyms, and Nuffield Health hiring posts." },
                { tag: "Then", title: "CIMSPA + public liability insurance", body: "Register with CIMSPA, get insured (~£60/year), legally take paying 1-to-1 clients anywhere in the UK." },
              ].map((row) => (
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
          </div>
        </section>

        {/* COMPARISON TABLE — kills competitors */}
        <section className="bg-base py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">The honest comparison</p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white text-center leading-none tracking-tight mb-4">
              Most PT courses
              <br />
              <span className="text-gold">stop at the certificate.</span>
            </h2>
            <p className="text-soft/75 text-center text-base mb-12 max-w-2xl mx-auto">
              That&apos;s why 80% of UK PTs quit inside 18 months. They qualified — they just didn&apos;t learn the rest of the job.
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
            <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-4">12 months from now</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-10">
              The version of you
              <br />
              <span className="text-gold">that this is actually about.</span>
            </h2>
            <ul className="space-y-5 text-lg text-soft/90">
              {[
                "You're walking into a gym you actually want to be in — and you work there.",
                "Your first paying client just rebooked. They're texting you about their week. You're answering as a coach, not a mate.",
                "Someone at a party asks what you do, and the answer is interesting for once.",
                "You're earning from the thing you'd be doing on a Sunday anyway.",
                "Your mum has stopped asking when you'll get a 'proper job.'",
                "You're not scrolling Reddit asking if PT is worth it. You're the person Reddit is asking.",
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
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">The things you&apos;re actually worried about</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-12">
              Straight answers.
              <br />
              <span className="text-gold">No PR voice.</span>
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
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">The PT Launch Method™</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-6">
              From gym regular
              <br />
              <span className="text-gold">to qualified PT.</span>
            </h2>
            <p className="text-soft/75 text-center text-lg mb-14 max-w-2xl mx-auto">
              8–16 weeks on average. Faster if you push, slower if life gets in the way — your timeline, your call.
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

        {/* LEARNER PHOTO STRIP */}
        <section className="bg-base py-14 overflow-hidden">
          <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-8">Real learners · Real careers</p>
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
              One fee. Everything in.
              <br />
              <span className="text-gold">£200 off for serious enquiries.</span>
            </h2>
            <p className="text-soft/75 text-center text-base mb-10 max-w-xl mx-auto">
              £1,599 covers Level 2, Level 3, your tutor, the £500 Mentorship Hub, and warm-introduction interviews to our gym network. Most learners use the deposit plan — £599 then 5 × £200.
            </p>
            <FunnelPricingBlock variant="dark" />
          </div>
        </section>

        {/* AVATAR-MATCHED PROOF (Proof Engine) */}
        <ProofStrip avatar="starter" heading="People who started right where you are" />

        {/* REVIEWS */}
        <Reviews />

        {/* ACCREDITATION */}
        <Accreditation />

        {/* FAQ */}
        <section className="bg-base py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">FAQ</p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white text-center leading-none tracking-tight mb-10">
              Quick-fire questions.
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
            <p className="text-gold text-xs font-semibold tracking-widest uppercase text-center mb-4">Ready to start?</p>
            <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white text-center leading-none tracking-tight mb-4">
              Two routes in.
              <br />
              <span className="text-gold">Same destination.</span>
            </h2>
            <p className="text-soft/75 text-center text-lg mb-14 max-w-xl mx-auto">
              Pick the one that feels right. Both lead to a career you actually want.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border-2 border-gold/70 rounded-2xl p-8 flex flex-col shadow-xl shadow-gold/10">
                <div className="mb-4">
                  <span className="bg-gold text-deep text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Most popular</span>
                </div>
                <h3 className="text-white text-2xl font-bold mb-3">I&apos;m in. Let&apos;s go.</h3>
                <p className="text-soft/75 text-[15px] leading-relaxed mb-6">
                  Enrol today and get immediate the Merve app access. Your tutor is introduced within 24 hours and you can start your first module tonight.
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {["Immediate access on enrolment", "Tutor introduced within 24 hours", "Start module 1 today", "Multiple payment plans available"].map((line) => (
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
                <h3 className="text-white text-2xl font-bold mb-3">I&apos;ve got a few questions first.</h3>
                <p className="text-soft/75 text-[15px] leading-relaxed mb-6">
                  Book a free 15-min call. We&apos;ll give straight answers — and if PT isn&apos;t the right move for you, we&apos;ll tell you that too.
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {["15 minutes, completely free", "Honest answers, zero pressure", "Talk to a real coach", "We'll tell you if it's not right for you"].map((line) => (
                    <li key={line} className="flex items-center gap-3 text-sm">
                      <span className="text-blue font-bold">✓</span>
                      <span className="text-white">{line}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/book-call" data-cta="close-bookcall" className="block w-full text-center py-4 rounded-full border-2 border-gold text-gold font-bold hover:bg-gold hover:text-deep transition-all">
                  Book a Free Call →
                </Link>
              </div>
            </div>
            <p className="text-soft/50 text-xs text-center mt-8">Tutor introduced within 24 hours · No commitment · Cancel anytime in your first 7 days</p>
          </div>
        </section>

      </main>
      <Footer />
      <StickyMobileCTA />
    </>
  );
}
