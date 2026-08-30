"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import HeroSlideshow from "../components/HeroSlideshow";
import { useFormSecurity } from "@/app/lib/security/client";
import { faqPageSchema } from "@/app/lib/faqSchema";

// ─── DATA ────────────────────────────────────────────────────────────────────

const painPoints = [
  { icon: "😩", title: "Too many PT courses online — don't know who to trust",  body: "The internet is full of courses promising the world. You don't know which ones gyms actually respect. That's a valid fear." },
  { icon: "💸", title: "Don't want to waste money on the wrong one",            body: "You've got bills, responsibilities, a life to maintain. You can't afford to gamble everything on a certificate that leads nowhere." },
  { icon: "🏫", title: "Don't want to sit in a classroom for months",           body: "You've got a job. A life. You need something that fits around reality — not a course that demands you turn up somewhere for weeks on end." },
  { icon: "🏋️", title: "Don't know if you'll even get a job after qualifying",  body: "Qualifying is one thing. Getting hired is another. That part is included here. You've probably seen it happen to others." },
  { icon: "⏳", title: "Can't quit your job yet",                               body: "You need a route in that doesn't mean walking out before you're ready. You just need the first step — not a life overhaul." },
  { icon: "🤷", title: "Not sure if PT is even right for you",                  body: "Maybe you love fitness but wonder if you've got what it takes to make it a career. That uncertainty is normal — and we can help you work it out." },
];

const comparisonRows = [
  { other: "No mentoring — you're on your own",             us: "Personal tutor assigned from day one" },
  { other: "No job help — just a certificate",              us: "A guaranteed gym interview on graduation" },
  { other: "No gym connections",                            us: "Active gym partnership network across the UK" },
  { other: "No business training",                          us: "Business, marketing & income systems built in" },
  { other: "Taught by lecturers, not practitioners",        us: "Taught by gym owners who've hired 500+ PTs" },
  { other: "You figure out clients on your own",            us: "Mentored by Ryan & team — £500K revenue built" },
];

const howItWorksSteps = [
  { num: "01", icon: "📱", title: "Enrol online today",         body: "Immediate access. No waiting around. Your course, your tutor, and your learning platform are ready the moment you sign up." },
  { num: "02", icon: "📚", title: "Study around your job",      body: "Everything is in the learning app. Study mornings, evenings, weekends — whenever fits your life. No classrooms. No fixed schedule." },
  { num: "03", icon: "🎯", title: "Get mentored",               body: "Ryan and the team work with you throughout. Not a help-desk — real mentorship from people who've built the business themselves." },
  { num: "04", icon: "🏅", title: "Qualify — NCFE Level 3",     body: "Earn your Ofqual-regulated, CIMSPA-recognised Level 3 PT qualification, on the public Ofqual register under reference 603/4388/6." },
  { num: "05", icon: "🤝", title: "Get your gym interview",     body: "We arrange at least one interview for you: either with a gym in our partner network, or with a gym local to you that we approach on your behalf. We're the ones who do the hiring, so we know what gets you through the door." },
  { num: "06", icon: "🚀", title: "Start your PT career",       body: "Walk into the gym floor qualified, confident, and with a real business plan. Not just a certificate — a career you can build on." },
];

const features = [
  { icon: "📱", title: "Learn on your phone",               body: "Everything in the learning app. Study at your own pace, track your progress — no classrooms or fixed hours.",                                           badge: null },
  { icon: "📚", title: "12 focused modules",                body: "Anatomy, nutrition, programming, client coaching — exactly what you need, nothing you don't. Built to qualify you fast and confidently.",             badge: null },
  { icon: "💼", title: "Business training built in",        body: "How to get clients, price yourself, market your services, and build recurring income. The part that decides whether you actually earn from it.",                          badge: null },
  { icon: "👤", title: "Your own personal tutor",           body: "They know your name, where you're at, and what you need next. Direct support whenever you need it — not a ticket system.",                            badge: "Included" },
  { icon: "🏋️", title: "Guaranteed gym interview",          body: "Once you qualify, we arrange at least one interview for you: either with a gym in our partner network, or with a gym local to you that we approach on your behalf. We've hired 500+ PTs ourselves, so we know what gets you through the door.",           badge: "Guaranteed" },
  { icon: "🎯", title: "Mentorship from Ryan & the team",   body: "Direct access to the people who built Ultimate Shred to £500K+ revenue. Real mentorship on getting clients, pricing, and staying profitable.",        badge: "Exclusive" },
];

const founderStats = [
  { value: "500+",   label: "PTs personally\nhired by our team" },
  { value: "£500K+", label: "Revenue built as\nindependent PTs" },
  { value: "30+",    label: "Years combined\nindustry experience" },
  { value: "100s",   label: "Students\nsuccessfully qualified" },
];

const founders = [
  { src: "/callum.webp", name: "Callum", role: "Head of Education & Tutor" },
  { src: "/miles.webp",  name: "Miles",  role: "Business Mentor & Co-Founder" },
  { src: "/ryan.webp",   name: "Ryan",   role: "Operations & Co-Founder" },
];

const reviews = [
  { name: "Rachel Waldock",        label: "Level 2 & Level 3 PT",     quote: "From start to finish, the course was structured, supportive, and everything I needed to make the career change I'd been putting off for years. Couldn't be happier." },
  { name: "Rebecca Davies",        label: "Level 3 Personal Training", quote: "The support I received was second to none. After having my baby, I thought I'd struggle — but Callum and the team were so supportive every step of the way." },
  { name: "Matthew Bell",          label: "Level 3 Personal Training", quote: "Fantastic from start to finish. The support didn't stop once I qualified — they've continued to offer guidance that's been invaluable as I build my business." },
  { name: "Annie Chomba-Kilbride", label: "Level 3 Personal Training", quote: "I've gained new skills, knowledge and confidence. I was able to learn at my own pace and was well supported throughout. Genuinely life-changing." },
  { name: "Jordan Wills",          label: "Level 3 Personal Training", quote: "PT Launch Lab were really helpful throughout the process and have continued to help me get my PT business up and running. Highly recommended." },
  { name: "Sam Brown",             label: "PT Launch Lab Student",     quote: "Callum and Ryan helped me so much — not only with the course but with any other challenges too. Nothing was too much to ask. Could not recommend enough." },
  { name: "Rebecca Sykes",         label: "Level 3 Personal Training", quote: "Absolutely amazing. I honestly wouldn't have been able to do it without the support from Callum all throughout. 100% recommend!" },
  { name: "Terri Altilar",         label: "Level 3 Personal Training", quote: "I work full time but PT Launch Lab allowed me to learn at my own rate while still having support every step of the way. The flexibility was incredible." },
  { name: "Declan Marsden",        label: "Level 3 Personal Training", quote: "Officially passed my Level 3 today. If you're thinking about becoming a PT — do not hesitate to go to PT Launch Lab." },
];

const faqs = [
  { q: "Can I do this around my job?",          a: "Yes — most students study in the evenings or at weekends. The course is fully online and self-paced, so you fit it around your life. No classrooms, no fixed hours." },
  { q: "Do I need any experience?",             a: "No. We teach everything step by step, from the foundations up. All you need is a genuine passion for fitness and the drive to make it your career." },
  { q: "Is the qualification recognised?",      a: "Yes. You earn an industry-recognised Level 2 & Level 3 PT qualification — NCFE accredited, Ofqual regulated, and on the public Ofqual regider in the UK." },
  { q: "Will I get help getting work?",         a: "Yes — mentoring and gym interview opportunities are included. We've personally hired over 500 PTs across our gym network, so we know exactly what gets you through the door." },
  { q: "Do I need to pay in full?",             a: "No. You can pay in full, or spread it with our deposit plan — £599 deposit then 5 × £200 monthly. We work hard to make sure the cost isn't the barrier." },
  { q: "How long does it take?",                a: "Most students complete in 8–16 weeks, studying around their job. You set the pace — qualify faster if you want, or take your time if life gets busy." },
  { q: "When can I start?",                     a: "Immediately. From the moment you enrol, you have full access to the course, your learning platform, and your personal tutor. No waiting around." },
];

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function FunnelPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const startX = useRef(0);
  const isDragging = useRef(false);

  const [prospectusOpen, setProspectusOpen] = useState(false);
  const [prospectusForm, setProspectusForm] = useState({ name: "", phone: "", email: "" });
  const [prospectusSubmitting, setProspectusSubmitting] = useState(false);
  const [prospectusError, setProspectusError] = useState("");
  const sec = useFormSecurity();

  useEffect(() => {
    function update() {
      if (window.innerWidth < 640) setVisibleCount(1);
      else if (window.innerWidth < 1024) setVisibleCount(2);
      else setVisibleCount(3);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    document.body.style.overflow = prospectusOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [prospectusOpen]);

  async function handleProspectusSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProspectusError("");
    setProspectusSubmitting(true);
    try {
      const res = await fetch("/api/prospectus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...prospectusForm, [sec.SEC_KEY]: sec.payload() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Something went wrong.");
      setProspectusOpen(false);
      setProspectusForm({ name: "", phone: "", email: "" });
      try { sessionStorage.removeItem("ptll_prospectus_opened"); } catch {}
      window.location.href = "/prospectus/thank-you";
    } catch (err: unknown) {
      setProspectusError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setProspectusSubmitting(false);
    }
  }

  const maxReviewIndex = reviews.length - visibleCount;
  const prevReview = () => setReviewIndex((c) => Math.max(c - 1, 0));
  const nextReview = () => setReviewIndex((c) => Math.min(c + 1, maxReviewIndex));
  const cardWidthPct = 100 / visibleCount;

  return (
    <div className="bg-[#072B4A] font-[Poppins,sans-serif]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema(faqs)) }} />

      {/* ── PROSPECTUS MODAL ─────────────────────────────────── */}
      {prospectusOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setProspectusOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#0D3559] border border-[#3B82F6]/30 rounded-2xl p-8 shadow-2xl">
            <button onClick={() => setProspectusOpen(false)} className="absolute top-4 right-4 text-[#8CA3BF] hover:text-white transition-colors text-xl font-bold" aria-label="Close">✕</button>
            <div className="mb-6">
              <span className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase">Free Download</span>
              <h2 className="text-2xl font-bold text-white mt-2 mb-1">PT Launch Lab Course Prospectus</h2>
              <p className="text-[#8CA3BF] text-sm leading-relaxed">Enter your details and we&apos;ll open the prospectus — full course overview, modules, pricing, and payment options.</p>
            </div>
            <form onSubmit={handleProspectusSubmit} className="space-y-4">
              <sec.Honeypot />
              <div>
                <label className="block text-white text-sm font-medium mb-1.5">Full name</label>
                <input type="text" required placeholder="e.g. Jordan Smith" value={prospectusForm.name} onChange={(e) => setProspectusForm((f) => ({ ...f, name: e.target.value }))} className="w-full bg-[#072B4A] border border-[#3B82F6]/30 rounded-xl px-4 py-3 text-white placeholder-[#4A6280] text-sm focus:outline-none focus:border-[#F5C518]/60 transition-colors" />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-1.5">Phone number</label>
                <input type="tel" required placeholder="e.g. 07700 900123" value={prospectusForm.phone} onChange={(e) => setProspectusForm((f) => ({ ...f, phone: e.target.value }))} className="w-full bg-[#072B4A] border border-[#3B82F6]/30 rounded-xl px-4 py-3 text-white placeholder-[#4A6280] text-sm focus:outline-none focus:border-[#F5C518]/60 transition-colors" />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-1.5">Email address</label>
                <input type="email" required placeholder="e.g. jordan@email.com" value={prospectusForm.email} onChange={(e) => setProspectusForm((f) => ({ ...f, email: e.target.value }))} className="w-full bg-[#072B4A] border border-[#3B82F6]/30 rounded-xl px-4 py-3 text-white placeholder-[#4A6280] text-sm focus:outline-none focus:border-[#F5C518]/60 transition-colors" />
              </div>
              {prospectusError && <p className="text-red-400 text-sm">{prospectusError}</p>}
              <button type="submit" disabled={prospectusSubmitting} className="w-full py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2">
                {prospectusSubmitting ? "Opening..." : "View & Download Prospectus →"}
              </button>
              <p className="text-[#4A6280] text-xs text-center">No spam. We&apos;ll only use this to follow up if you&apos;d like.</p>
            </form>
          </div>
        </div>
      )}

      {/* ── STICKY TOP BAR ───────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-[#051D33]/95 backdrop-blur-md border-b border-[#3B82F6]/15 px-4 py-3 grid grid-cols-3 items-center">
        <Image src="/logo.png" alt="PT Launch Lab" width={140} height={36} className="h-8 w-auto shrink-0" />
        <nav className="flex items-center justify-center gap-2 sm:gap-3">
          <a href="/enrol" className="px-5 py-2 rounded-full bg-[#F5C518] text-[#072B4A] text-sm font-bold hover:brightness-110 transition-all shadow-md shadow-[#F5C518]/20">
            Enrol Now →
          </a>
          <a href="/book-call" className="hidden sm:block px-4 py-2 rounded-full border border-white/20 text-sm font-semibold text-white hover:bg-white/10 transition-all">
            Free Call
          </a>
        </nav>
        <div className="flex justify-end">
          <a href="/" className="text-xs text-[#4A6280] hover:text-[#8CA3BF] transition-colors font-medium">← Main site</a>
        </div>
      </div>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-[#0E5FA0] via-[#0A4A80] to-[#072B4A] overflow-hidden">
        <div className="absolute -left-48 top-20 w-[600px] h-[600px] rounded-full bg-[#F5C518] opacity-[0.08] blur-3xl pointer-events-none" />
        <div className="absolute -right-32 top-40 w-[500px] h-[500px] rounded-full bg-[#60A5FA] opacity-[0.12] blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[700px] h-[300px] rounded-full bg-[#072B4A] opacity-[0.5] blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              {/* Authority pill */}
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#F5C518]/40 bg-white/10 backdrop-blur-sm mb-8 animate-fade-in-up">
                <span className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase">
                  Online Level 2 &amp; Level 3 · NCFE · Ofqual Regulated · Fast-Track Available
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] mb-6 animate-fade-in-up">
                Become a Qualified
                <br />
                Personal Trainer —
                <br />
                <span className="text-[#F5C518]">With The Only PT Course</span>
                <br />
                <span className="text-[#F5C518]">Run By Gym Owners</span>
                <br />
                <span className="text-[#F5C518]">Who Actually Hire Trainers.</span>
              </h1>

              <p className="text-base text-blue-100/80 leading-relaxed mb-6 animate-fade-in-up animate-delay-100">
                Fast-Track &bull; Study Around Your Job &bull; Mentorship Included &bull; Gym Interview Pathway
              </p>

              {/* Checklist */}
              <ul className="space-y-2 mb-8 animate-fade-in-up animate-delay-100">
                {[
                  "Industry recognised qualification",
                  "Payment plans available",
                  "No classroom required",
                  "Real gym opportunities after qualifying",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white text-sm font-medium">
                    <span className="text-[#F5C518] font-bold text-base shrink-0">✅</span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-4 mb-5 animate-fade-in-up animate-delay-200">
                <a href="/enrol" className="px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/30 text-center">
                  Apply Now →
                </a>
                <a href="/book-call" className="px-8 py-4 rounded-full border-2 border-white/60 text-white font-semibold text-base hover:bg-white/10 transition-all text-center">
                  Book a Free Call
                </a>
              </div>

              <a href="/quiz" className="inline-flex items-center gap-2 text-[#F5C518]/80 text-sm font-medium hover:text-[#F5C518] transition-all mb-8 animate-fade-in-up animate-delay-200">
                🎯 Not sure if PT is right for you? Take the free quiz →
              </a>

              <div className="flex flex-wrap gap-3 md:gap-5 text-blue-200/70 text-xs animate-fade-in-up animate-delay-300">
                <span>⭐ 5-Star Rated · 17 Reviews</span>
                <span className="hidden sm:inline opacity-40">·</span>
                <span>Guaranteed Gym Interview</span>
                <span className="hidden sm:inline opacity-40">·</span>
                <span>500+ PTs Hired</span>
                <span className="hidden sm:inline opacity-40">·</span>
                <span>NCFE &amp; Ofqual Regulated</span>
              </div>
            </div>
            <HeroSlideshow />
          </div>
        </div>
      </section>

      {/* ── STATS / AUTHORITY STRIP ───────────────────────────── */}
      <section className="bg-[#051D33] py-10 border-y border-[#3B82F6]/15">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {founderStats.map((s) => (
            <div key={s.value}>
              <p className="text-[#F5C518] text-3xl md:text-4xl font-bold">{s.value}</p>
              <p className="text-[#8CA3BF] text-xs mt-1 leading-relaxed whitespace-pre-line">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PAIN — EMOTIONAL HOOK ─────────────────────────────── */}
      <section className="bg-[#072B4A] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">Sound familiar?</p>
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-4 leading-tight">
            Love fitness…
            <br />
            <span className="text-[#F5C518]">but stuck in a job you don&apos;t enjoy?</span>
          </h2>
          <p className="text-[#8CA3BF] text-center text-lg mb-6 max-w-2xl mx-auto">
            You&apos;ve thought about becoming a Personal Trainer. But…
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {painPoints.map((p) => (
              <div key={p.title} className="flex items-start gap-4 bg-[#0D3559] border border-[#3B82F6]/20 rounded-2xl p-5 hover:border-[#F5C518]/40 transition-all duration-300 group">
                <span className="text-2xl shrink-0 mt-0.5">{p.icon}</span>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-[#F5C518] transition-colors leading-snug">{p.title}</h3>
                  <p className="text-[#8CA3BF] text-xs leading-relaxed">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-[#0D3559] border border-[#F5C518]/30 rounded-2xl p-8 md:p-10 text-center max-w-3xl mx-auto">
            <p className="text-[#F5C518] text-sm font-bold tracking-wide uppercase mb-3">Most people never start because they don&apos;t trust the path.</p>
            <p className="text-white text-xl md:text-2xl font-bold mb-3 leading-snug">
              That&apos;s exactly why PT Launch Lab exists.
            </p>
            <p className="text-[#8CA3BF] text-base leading-relaxed mb-6">
              We built this because we couldn&apos;t find anything that actually prepared trainers for real gym careers — so we created it ourselves. From lived experience, not a textbook.
            </p>
            <a href="/quiz" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold hover:brightness-110 transition-all">
              🎯 Take the free quiz — find out if PT is right for you →
            </a>
          </div>
        </div>
      </section>

      {/* ── AUTHORITY BLOCK ───────────────────────────────────── */}
      <section className="bg-[#0D3559] py-24">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">Our positioning</p>
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center leading-tight mb-4">
            We don&apos;t just run PT courses.
            <br />
            <span className="text-[#F5C518]">We run gyms. We hire trainers.</span>
            <br />
            <span className="text-white">We know what actually works.</span>
          </h2>
          <p className="text-[#8CA3BF] text-center text-lg mb-8 max-w-2xl mx-auto">
            Most course providers teach theory. We build Personal Trainers that gyms actually want to hire.
          </p>
          {/* USP tick list */}
          <div className="flex flex-wrap justify-center gap-3 mb-14">
            {["Run by gym owners", "Hired 500+ PTs in the industry", "Real gym partnerships", "Mentorship included", "Interview opportunities after qualifying"].map((item) => (
              <span key={item} className="flex items-center gap-2 bg-[#072B4A] border border-[#F5C518]/30 rounded-full px-4 py-2 text-white text-sm font-medium">
                <span className="text-[#F5C518] font-bold">✔</span> {item}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-16">
            <div className="space-y-6">
              {[
                { icon: "🏋️", title: "We run real gyms", body: "Ultimate Shred is a gym we built from the ground up. We know what a gym floor looks like, what a PT shift feels like, and what gym owners actually need from their trainers." },
                { icon: "👥", title: "We hire real PTs", body: "Over 500 personal trainers have been hired through our network. We've seen every CV, every interview, every first session. We've seen what works and what doesn't — and we've built the course around it." },
                { icon: "🤝", title: "We have real gym partnerships", body: "When you graduate, we don't just give you a certificate and wish you luck. We arrange at least one interview for you: either with a gym in our partner network, or with a gym local to you that we approach on your behalf." },
                { icon: "💰", title: "We've built the income ourselves", body: "Callum, Miles, and Ryan built Ultimate Shred to £500K+ in revenue as independent personal trainers. The business training we give you isn't theory — it's the exact playbook we used." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F5C518]/10 border border-[#F5C518]/30 flex items-center justify-center text-xl shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base mb-1">{item.title}</h3>
                    <p className="text-[#8CA3BF] text-sm leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Founder photos */}
            <div className="bg-[#072B4A] border border-[#3B82F6]/20 rounded-2xl p-8 text-center">
              <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-6">The founders</p>
              <div className="flex justify-center gap-6 mb-6">
                {founders.map((f) => (
                  <div key={f.name} className="flex flex-col items-center gap-3">
                    <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-[#F5C518]/50 shadow-xl shadow-[#F5C518]/10">
                      <Image src={f.src} alt={f.name} fill className="object-cover object-top" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">{f.name}</p>
                      <p className="text-[#8CA3BF] text-[10px] leading-tight max-w-[90px] mx-auto">{f.role}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#3B82F6]/20 pt-6">
                <p className="text-white text-base font-semibold mb-2">
                  &ldquo;We built the course we wish had existed when we started.&rdquo;
                </p>
                <p className="text-[#8CA3BF] text-sm leading-relaxed">
                  Every module, every piece of business training, the guaranteed interview was designed by people who&apos;ve been on the hiring side of the desk.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-white text-xl font-bold mb-2">You&apos;re not just buying a course.</p>
            <p className="text-[#8CA3BF] text-base mb-6">You&apos;re getting a pathway into the fitness industry.</p>
            <a href="/enrol" className="inline-block px-10 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20">
              Apply Now — See If This Is Right For You →
            </a>
          </div>
        </div>
      </section>

      {/* ── VIDEO ─────────────────────────────────────────────── */}
      <section className="bg-[#072B4A] py-20">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">Hear it from us</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center leading-tight mb-3">
            Why 80% of PTs fail —
            <br />
            <span className="text-[#F5C518]">and exactly how we fix it.</span>
          </h2>
          <p className="text-[#8CA3BF] text-center text-base mb-10 max-w-2xl mx-auto">
            Callum, Miles, and Ryan explain what gyms actually look for, and how this course is built around it. Watch this before you decide.
          </p>
          <div className="relative rounded-2xl overflow-hidden border border-[#3B82F6]/25 shadow-2xl shadow-[#3B82F6]/10 aspect-video mb-8">
            <iframe
              src="https://www.youtube.com/embed/0rhp9fkBFsU"
              title="Why PT Launch Lab — from the founders"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full absolute inset-0"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { quote: "80% of PTs leave the industry within their first year.", highlight: true },
              { quote: "We've hired over 500 PTs. We know exactly what gyms want.", highlight: false },
              { quote: "We give you the playbook — not just the qualification.", highlight: false },
            ].map((q) => (
              <div key={q.quote} className={`rounded-xl p-5 border text-sm leading-relaxed text-center ${q.highlight ? "bg-[#F5C518]/10 border-[#F5C518]/40 text-white font-semibold" : "bg-[#0D3559] border-[#3B82F6]/20 text-[#8CA3BF]"}`}>
                &ldquo;{q.quote}&rdquo;
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/enrol" className="px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20 text-center">
              I&apos;m Ready — Enrol Now →
            </a>
            <a href="/book-call" className="px-8 py-4 rounded-full border-2 border-white/40 text-white font-semibold text-base hover:bg-white/10 transition-all text-center">
              Book a Free Call First
            </a>
          </div>
        </div>
      </section>

      {/* ── WHY MOST COURSES FAIL — COMPARISON ───────────────── */}
      <section className="bg-[#051D33] py-24">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">The honest comparison</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center leading-tight mb-4">
            Why most PT courses fail people.
            <br />
            <span className="text-[#F5C518]">And why PT Launch Lab is different.</span>
          </h2>
          <p className="text-[#8CA3BF] text-center text-base mb-4 max-w-2xl mx-auto">
            A certificate on its own is where most of the risk sits. Then leave you on your own.
          </p>
          <p className="text-white/60 text-center text-sm mb-12 max-w-xl mx-auto">
            No help getting work. No mentoring. No real gym connections. No business guidance. That&apos;s why most people never make it as a PT. We built PT Launch Lab to fix that.
          </p>

          {/* Comparison table */}
          <div className="rounded-2xl overflow-hidden border border-[#3B82F6]/20 mb-12">
            {/* Header */}
            <div className="grid grid-cols-2 bg-[#0D3559]">
              <div className="px-6 py-4 border-r border-[#3B82F6]/20">
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Most PT Courses</p>
              </div>
              <div className="px-6 py-4 bg-[#F5C518]/5">
                <p className="text-[#F5C518] text-xs font-bold uppercase tracking-widest">PT Launch Lab</p>
              </div>
            </div>
            {/* Rows */}
            {comparisonRows.map((row, i) => (
              <div key={i} className={`grid grid-cols-2 border-t border-[#3B82F6]/15 ${i % 2 === 0 ? "bg-[#072B4A]" : "bg-[#0A2238]"}`}>
                <div className="px-6 py-4 border-r border-[#3B82F6]/15 flex items-start gap-3">
                  <span className="text-red-400 shrink-0 mt-0.5 font-bold">✕</span>
                  <p className="text-white/50 text-sm leading-relaxed">{row.other}</p>
                </div>
                <div className="px-6 py-4 flex items-start gap-3">
                  <span className="text-[#F5C518] shrink-0 mt-0.5 font-bold">✓</span>
                  <p className="text-white text-sm leading-relaxed font-medium">{row.us}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <a href="/enrol" className="inline-block px-10 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20">
              Start With PT Launch Lab →
            </a>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — 6 STEPS ────────────────────────────── */}
      <section className="bg-[#0D3559] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">The PT Launch Method™</p>
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-3">
            Simple. Clear. Proven.
          </h2>
          <p className="text-[#8CA3BF] text-center text-lg mb-16 max-w-xl mx-auto">
            Six steps from where you are now to a career you actually want — fully online, built around your life.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            {howItWorksSteps.map((step, i) => (
              <div key={step.num} className={`rounded-2xl p-7 border transition-all hover:-translate-y-0.5 ${i === 4 ? "bg-[#072B4A] border-[#F5C518]/60 shadow-xl shadow-[#F5C518]/10" : "bg-[#072B4A] border-[#3B82F6]/25 hover:border-[#3B82F6]/50"}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${i === 4 ? "bg-[#F5C518]/15 border border-[#F5C518]/40" : "bg-[#0D3559] border border-[#3B82F6]/25"}`}>
                    {step.icon}
                  </div>
                  <p className={`text-xs font-bold tracking-widest uppercase ${i === 4 ? "text-[#F5C518]" : "text-[#3B82F6]"}`}>Step {step.num}</p>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-[#8CA3BF] text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <a href="/enrol" className="inline-block px-10 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20">
              Start Step 1 Today →
            </a>
          </div>
        </div>
      </section>

      {/* ── LEARNER PHOTO STRIP ──────────────────────────────── */}
      <section className="bg-[#051D33] py-14 overflow-hidden">
        <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-8">Real learners. Real results.</p>
        <div className="overflow-hidden">
          <div className="flex gap-3 md:gap-4 animate-scroll-x w-max px-4">
            {[1,2,3,4,5,6,7,8,9,10,11,12,1,2,3,4,5,6,7,8,9,10,11,12].map((n, i) => (
              <div key={i} className="relative shrink-0 w-36 h-52 sm:w-44 sm:h-60 md:w-56 md:h-72 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                <Image src={`/learner-${n}.png`} alt="PT Launch Lab learner" fill className="object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#051D33]/70 to-transparent" />
              </div>
            ))}
          </div>
        </div>
        <div className="text-center mt-8">
          <a href="/enrol" className="inline-flex items-center gap-2 text-[#8CA3BF] text-sm font-medium hover:text-white transition-all">
            Join them — enrol today →
          </a>
        </div>
      </section>

      {/* ── QUIZ CTA ─────────────────────────────────────────── */}
      <section className="bg-[#072B4A] py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="relative bg-gradient-to-br from-[#0D3559] to-[#072B4A] border-2 border-[#F5C518]/40 rounded-3xl p-10 md:p-14 text-center overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-96 h-64 rounded-full bg-[#F5C518] opacity-[0.06] blur-3xl" />
            </div>
            <div className="relative z-10">
              <span className="text-5xl mb-6 block">🎯</span>
              <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-3">Free · Takes 2 minutes</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Is a career in PT right for you?</h2>
              <p className="text-[#8CA3BF] text-base max-w-md mx-auto mb-8 leading-relaxed">
                Answer 8 quick questions and we&apos;ll tell you honestly if you&apos;re a good fit — and what your best first step is.
              </p>
              <a href="/quiz" className="inline-block px-12 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20">
                Take the Free Quiz →
              </a>
              <p className="text-[#4A6280] text-xs mt-4">No email required. Completely free.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT YOU GET ─────────────────────────────────────── */}
      <section id="course-info" className="bg-[#0D3559] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">What you get</p>
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center leading-tight mb-4">
            We&apos;re not selling you a course.
            <br />
            <span className="text-[#F5C518]">We&apos;re building you a career.</span>
          </h2>
          <p className="text-[#8CA3BF] text-lg text-center mb-10">
            Everything inside The PT Launch Method™ — designed by gym owners who&apos;ve hired 500+ trainers.
          </p>
          {/* Quick-scan checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto mb-14">
            {[
              "Online Level 2 & Level 3 PT qualification",
              "Fast-track option available",
              "Study at home in your own time",
              "Mentorship included",
              "Industry recognised certification",
              "Gym interview opportunities",
              "Business & coaching guidance",
              "Payment plans available",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 bg-[#072B4A] border border-[#3B82F6]/20 rounded-xl px-5 py-3">
                <span className="text-[#F5C518] font-bold shrink-0">✔</span>
                <span className="text-white text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-white/60 text-sm font-medium mb-14">
            No classroom. &nbsp;No guesswork. &nbsp;No wasting money on the wrong course.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            {features.map((feat) => (
              <div key={feat.title} className="bg-[#072B4A] border border-[#3B82F6]/25 rounded-2xl p-7 hover:border-[#F5C518]/40 transition-all duration-300 hover:-translate-y-0.5 group">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{feat.icon}</span>
                  {feat.badge && (
                    <span className="text-[10px] font-bold bg-[#F5C518] text-[#072B4A] px-2.5 py-1 rounded-full uppercase tracking-wide">{feat.badge}</span>
                  )}
                </div>
                <h3 className="text-white font-bold text-[17px] mb-3 group-hover:text-[#F5C518] transition-colors">{feat.title}</h3>
                <p className="text-[#8CA3BF] text-sm leading-relaxed">{feat.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS / PROOF ──────────────────────────────────── */}
      <section className="bg-[#072B4A] py-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">Real results</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">
            Don&apos;t just take our word for it.
          </h2>
          <p className="text-[#8CA3BF] text-center text-base mb-8 max-w-xl mx-auto">Our students are now:</p>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {["Working as Personal Trainers", "Running online coaching businesses", "Coaching in partner gyms", "Earning from fitness — not just training for fun"].map((item) => (
              <span key={item} className="flex items-center gap-2 bg-[#0D3559] border border-[#F5C518]/20 rounded-full px-4 py-2 text-white text-sm font-medium">
                <span className="text-[#F5C518]">✓</span> {item}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mb-12">
            <span className="text-[#F5C518] text-lg">★★★★★</span>
            <span className="text-white text-sm font-semibold">5.0</span>
            <span className="text-[#8CA3BF] text-sm">· 17 Verified Google Reviews</span>
            <a href="https://www.google.com/search?q=pt+launch+lab+pontefract+reviews" target="_blank" rel="noopener noreferrer" className="text-[#F5C518] text-sm font-medium hover:underline ml-1">See all →</a>
          </div>

          {/* Carousel nav */}
          <div className="flex justify-end gap-3 mb-6">
            <button onClick={prevReview} disabled={reviewIndex === 0} aria-label="Previous" className="w-11 h-11 rounded-full border border-[#3B82F6]/40 flex items-center justify-center text-white text-xl hover:border-[#F5C518] hover:text-[#F5C518] transition-all disabled:opacity-30 disabled:cursor-not-allowed">‹</button>
            <button onClick={nextReview} disabled={reviewIndex >= maxReviewIndex} aria-label="Next" className="w-11 h-11 rounded-full border border-[#3B82F6]/40 flex items-center justify-center text-white text-xl hover:border-[#F5C518] hover:text-[#F5C518] transition-all disabled:opacity-30 disabled:cursor-not-allowed">›</button>
          </div>
          <div
            className="cursor-grab active:cursor-grabbing select-none"
            onTouchStart={(e) => { startX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => { const diff = startX.current - e.changedTouches[0].clientX; if (diff > 50) nextReview(); else if (diff < -50) prevReview(); }}
            onMouseDown={(e) => { isDragging.current = true; startX.current = e.clientX; }}
            onMouseUp={(e) => { if (!isDragging.current) return; isDragging.current = false; const diff = startX.current - e.clientX; if (diff > 50) nextReview(); else if (diff < -50) prevReview(); }}
          >
            <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${reviewIndex * cardWidthPct}%)` }}>
              {reviews.map((rev) => (
                <div key={rev.name} className="shrink-0 px-3" style={{ width: `${cardWidthPct}%` }}>
                  <div className="bg-[#0D3559] border border-[#3B82F6]/20 rounded-2xl p-6 h-full flex flex-col gap-4 hover:border-[#F5C518]/30 transition-colors">
                    <div className="text-[#F5C518]">★★★★★</div>
                    <p className="text-white text-sm leading-relaxed flex-1">&ldquo;{rev.quote}&rdquo;</p>
                    <div>
                      <p className="text-[#F5C518] text-sm font-bold">{rev.name}</p>
                      <p className="text-[#8CA3BF] text-xs">{rev.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: maxReviewIndex + 1 }).map((_, i) => (
              <button key={i} onClick={() => setReviewIndex(i)} aria-label={`Review ${i + 1}`} className={`h-2 rounded-full transition-all duration-300 ${i === reviewIndex ? "bg-[#F5C518] w-6" : "bg-[#3B82F6]/30 w-2 hover:bg-[#3B82F6]/60"}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── PROSPECTUS CTA ───────────────────────────────────── */}
      <section className="bg-[#051D33] py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-[#0D3559] border border-[#F5C518]/30 rounded-2xl p-10 md:p-14 text-center">
            <span className="text-4xl mb-6 block">📄</span>
            <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-3">Free Download</p>
            <h3 className="text-white text-3xl font-bold mb-4">Want the full course breakdown?</h3>
            <p className="text-[#8CA3BF] text-base max-w-md mx-auto mb-8 leading-relaxed">
              Download our free course prospectus — full module list, pricing, payment plan options, and exactly what to expect from day one.
            </p>
            <button onClick={() => setProspectusOpen(true)} className="px-12 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20">
              Download Free Prospectus →
            </button>
            <p className="text-[#4A6280] text-xs mt-4">No spam. We&apos;ll only reach out if you&apos;d like us to.</p>
          </div>
        </div>
      </section>

      {/* ── ACCREDITATION ────────────────────────────────────── */}
      <section className="bg-[#072B4A] py-16 border-t border-[#3B82F6]/15">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-4">Fully accredited</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Industry recognised. Accepted everywhere.</h2>
          <p className="text-[#8CA3BF] text-base mb-10 max-w-xl mx-auto">Regulated by Ofqual under reference 603/4388/6, and listed on the public register.</p>
          <div className="flex flex-wrap justify-center gap-4">
            {["NCFE", "Ofqual Regulated", "CIMSPA", "REPs"].map((logo) => (
              <div key={logo} className="px-6 py-4 rounded-xl border border-[#3B82F6]/20 bg-white/5 text-white font-semibold text-sm min-w-[130px] text-center hover:border-[#F5C518]/40 transition-colors">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GYM PARTNERS ─────────────────────────────────────── */}
      <section className="bg-[#051D33] py-14 border-t border-[#3B82F6]/15">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-8">Just a few of our partners</p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {[
              { src: "/logos/ultimate-shred.png",  alt: "Ultimate Shred" },
              { src: "/logos/1079-fitness.png",    alt: "1079 Fitness" },
              { src: "/logos/6fit-gym.png",        alt: "6Fit Gym" },
              { src: "/logos/iron-wolf-gym.png",   alt: "Iron Wolf Gym" },
              { src: "/logos/leodis-gym.png",      alt: "Leodis Gym" },
            ].map((logo) => (
              <div key={logo.alt} className="relative h-12 w-32 opacity-60 hover:opacity-100 transition-opacity">
                <Image src={logo.src} alt={logo.alt} fill className="object-contain" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONVERSION ───────────────────────────────────────── */}
      <section className="bg-[#072B4A] py-28 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[700px] h-[400px] rounded-full bg-[#F5C518] opacity-[0.05] blur-3xl" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to start your new career?</h2>
          <p className="text-[#8CA3BF] text-lg max-w-xl mx-auto mb-16">
            You&apos;ve got two options. Both lead to the same place — a career you actually want.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0D3559] border-2 border-[#F5C518]/80 rounded-2xl p-8 text-left flex flex-col shadow-xl shadow-[#F5C518]/10">
              <div className="inline-block mb-6">
                <span className="bg-[#F5C518] text-[#072B4A] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">Most Popular</span>
              </div>
              <h3 className="text-white text-2xl font-bold mb-4">I&apos;m ready. Let&apos;s go.</h3>
              <p className="text-[#8CA3BF] text-[15px] leading-relaxed mb-7">Enrol today and get immediate access — your login, your tutor, and your career pathway starts the moment you sign up.</p>
              <ul className="space-y-3 mb-8 flex-1">
                {["Immediate access on enrolment", "Start your first module today", "Personal tutor assigned from day one", "Multiple payment plan options available"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-medium">
                    <span className="text-[#F5C518] font-bold">✓</span>
                    <span className="text-white">{item}</span>
                  </li>
                ))}
              </ul>
              <a href="/enrol" className="block w-full text-center py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20 mb-3">
                Enrol Now — Start Today →
              </a>
              <p className="text-[#4A6280] text-xs text-center">Start within minutes of enrolling.</p>
            </div>
            <div className="bg-[#0D3559] border-2 border-[#3B82F6]/70 rounded-2xl p-8 text-left flex flex-col shadow-xl shadow-[#3B82F6]/10">
              <div className="inline-block mb-6">
                <span className="bg-[#3B82F6] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">No hard sell</span>
              </div>
              <h3 className="text-white text-2xl font-bold mb-4">I have a few questions first.</h3>
              <p className="text-[#8CA3BF] text-[15px] leading-relaxed mb-7">Book a free 15-minute call. We&apos;ll answer every question honestly — and if the course isn&apos;t right for you, we&apos;ll tell you that too.</p>
              <ul className="space-y-3 mb-8 flex-1">
                {["15 minutes, completely free", "Honest answers, zero pressure", "Talk to a real person", "We'll tell you if it's not right for you"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-medium">
                    <span className="text-[#3B82F6] font-bold">✓</span>
                    <span className="text-white">{item}</span>
                  </li>
                ))}
              </ul>
              <a href="/book-call" className="block w-full text-center py-4 rounded-full border-2 border-[#F5C518] text-[#F5C518] font-bold text-base hover:bg-[#F5C518] hover:text-[#072B4A] transition-all mb-3">
                Book a Free Call →
              </a>
              <p className="text-[#4A6280] text-xs text-center">Usually available within 24 hours</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="bg-[#0D3559] py-24">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">Common questions</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">Got questions? We&apos;ve got answers.</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#072B4A] border border-[#3B82F6]/20 rounded-xl overflow-hidden">
                <button className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-[#0D3559] transition-colors" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                  <span className="text-white font-semibold text-[15px] pr-4">{faq.q}</span>
                  <span className={`text-[#F5C518] text-xl font-bold shrink-0 transition-transform duration-300 ${faqOpen === i ? "rotate-90" : ""}`}>›</span>
                </button>
                {faqOpen === i && (
                  <div className="px-6 pb-6">
                    <p className="text-[#8CA3BF] text-[15px] leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <p className="text-[#8CA3BF] text-sm mb-4">Still got questions?</p>
            <a href="/book-call" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-[#3B82F6]/40 text-white font-semibold text-sm hover:border-[#F5C518] hover:text-[#F5C518] transition-all">
              Book a free call and ask us directly →
            </a>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#0E5FA0] via-[#0A4A80] to-[#072B4A] py-28 text-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[400px] rounded-full bg-[#F5C518] opacity-[0.07] blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-6">Your next step</p>
          <h2 className="text-4xl md:text-6xl font-bold text-white leading-[1.05] mb-6">
            If you&apos;ve been thinking about
            <br />
            becoming a PT for a while…
            <br />
            <span className="text-[#F5C518]">this is your sign to start.</span>
          </h2>
          <p className="text-blue-100/80 text-lg mb-4 max-w-xl mx-auto">
            You don&apos;t need to change your life today.
          </p>
          <p className="text-blue-100/80 text-lg mb-10 max-w-xl mx-auto">
            You just need to take the first step. Apply now and we&apos;ll see if this is right for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a href="/enrol" className="px-10 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/30">
              Apply Now →
            </a>
            <a href="/book-call" className="px-10 py-4 rounded-full border-2 border-white/60 text-white font-semibold text-base hover:bg-white/10 transition-all">
              Book a Free Call First
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-blue-200/50 text-xs">
            <button onClick={() => setProspectusOpen(true)} className="hover:text-[#F5C518] transition-colors">📄 Download Free Prospectus</button>
            <a href="/quiz" className="hover:text-[#F5C518] transition-colors">🎯 Take the Free Quiz</a>
          </div>
          <p className="text-blue-200/40 text-xs mt-6">No commitment required. Start within minutes of enrolling.</p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <div className="bg-[#051D33] border-t border-[#3B82F6]/15 px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Image src="/logo.png" alt="PT Launch Lab" width={120} height={30} className="h-7 w-auto opacity-70" />
        <div className="flex items-center gap-6 text-[#4A6280] text-xs">
          <a href="/privacy" className="hover:text-[#8CA3BF] transition-colors">Privacy Policy</a>
          <a href="/terms" className="hover:text-[#8CA3BF] transition-colors">Terms</a>
          <span>© {new Date().getFullYear()} PT Launch Lab</span>
        </div>
        <a href="/" className="text-sm text-[#8CA3BF] hover:text-white transition-colors font-medium">← Visit main site</a>
      </div>

    </div>
  );
}
