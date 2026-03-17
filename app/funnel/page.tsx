"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import HeroSlideshow from "../components/HeroSlideshow";

// ─── DATA ────────────────────────────────────────────────────────────────────

const painCards = [
  { icon: "😩", title: "You hate Mondays", body: "You dread Sunday evenings because you know what's coming. Another week doing work that drains you — not something that energises you." },
  { icon: "🔒", title: "You feel stuck", body: "You want out, but there are bills to pay. So you stay put, watching the months turn into years — waiting for the right moment that never comes." },
  { icon: "💡", title: "You know you're capable of more", body: "You're not lazy. You're not unmotivated. You're just in the wrong place. You just need someone to show you there's a real way out." },
];

const futures = [
  "Make money from something you actually enjoy",
  "Work in a gym, coach online, or build both",
  "Keep your job until you're ready — qualify around it first",
  "Have freedom over your hours and who you work with",
  "Know the path is clear before you leave anything behind",
];

const steps = [
  { num: "01", icon: "📚", title: "Learn", body: "Study online at your own pace, around your current job. Anatomy, nutrition, exercise science, client consultations, and behaviour change.", bullets: ["Anatomy, nutrition & exercise science", "Client consultations & goal setting", "Behaviour change & motivation strategies"], highlight: false },
  { num: "02", icon: "🏅", title: "Qualify", body: "Earn an NCFE Level 3 qualification every UK gym recognises. Ofqual regulated, with continuous tutor support throughout.", bullets: ["NCFE & Ofqual-regulated certification", "Online and practical assessments", "Continuous tutor feedback & support"], highlight: true },
  { num: "03", icon: "🚀", title: "Launch", body: "Other courses stop once you pass. We stay until you've built something real — your first clients, your brand, proven systems to reach £5K/month.", bullets: ["Find & convert your first clients", "Build your online & in-person PT brand", "Proven systems to reach £5K/month"], highlight: false },
];

const features = [
  { icon: "📱", title: "Learn on your phone", body: "Everything's in the Merve app. Study whenever you've got a spare moment — track your progress, no classrooms or fixed hours.", badge: null },
  { icon: "📚", title: "12 focused modules", body: "Nutrition, anatomy, programming, client coaching — just what you need to do the job, nothing you don't. Built to get you qualified and confident fast.", badge: null },
  { icon: "💼", title: "Business training built in", body: "How to get clients. Marketing, sales, content creation — the stuff most courses don't bother teaching. This isn't optional. It's the whole point.", badge: null },
  { icon: "👤", title: "Your own personal tutor", body: "They know your name, where you're stuck, and what you need next. Direct support whenever you need it — not a help desk ticket system.", badge: "Included" },
  { icon: "🏋️", title: "Guaranteed gym interviews", body: "Once you qualify, we guarantee interviews with our partner gyms. We've hired 500+ PTs ourselves — we know exactly what gyms look for.", badge: "Guaranteed" },
  { icon: "🎯", title: "Mentorship from Ryan & the team", body: "Direct access to the people who built Ultimate Shred to £500k+ in revenue. They keep you on track and tell you what's working right now.", badge: "Exclusive" },
];

const founders = [
  { src: "/callum.jpg", name: "Callum", role: "Head of Education & Tutor" },
  { src: "/miles.jpg",  name: "Miles",  role: "Business Mentor & Co-Founder" },
  { src: "/ryan.jpg",   name: "Ryan",   role: "Operations & Co-Founder" },
];

const founderStats = [
  { value: "500+", label: "PTs hired\nby our team" },
  { value: "30+",  label: "Years industry\nexperience" },
  { value: "£500K+", label: "Revenue built\nas independent PTs" },
  { value: "100s", label: "Students\nqualified" },
];

const reviews = [
  { name: "Rachel Waldock",        label: "Level 2 & Level 3 PT",     quote: "From start to finish, the course was structured, supportive, and everything I needed to make the career change I'd been putting off for years. Couldn't be happier." },
  { name: "Rebecca Davies",        label: "Level 3 Personal Training", quote: "The support I received was second to none. After having my baby, I thought I'd struggle to find the time — but Callum and the team were so supportive every step of the way." },
  { name: "Matthew Bell",          label: "Level 3 Personal Training", quote: "Fantastic from start to finish. The support didn't stop once I qualified — they've continued to offer guidance that's been invaluable as I build my business." },
  { name: "Annie Chomba-Kilbride", label: "Level 3 Personal Training", quote: "My training experience with PT Launch Lab has been amazing. I've gained new skills, knowledge and confidence. I was able to learn at my own pace and was well supported throughout." },
  { name: "Jordan Wills",          label: "Level 3 Personal Training", quote: "I got qualified through PT Launch Lab who were really helpful throughout the process and have continued to help me get my PT business up and running. Highly recommended." },
  { name: "Sam Brown",             label: "PT Launch Lab Student",     quote: "Callum and Ryan helped me so much — not only with the course but with any other challenges I was unsure on. Nothing was too much to ask. Could not recommend enough." },
  { name: "Rebecca Sykes",         label: "Level 3 Personal Training", quote: "Absolutely amazing place to train and learn to become a qualified PT! I honestly wouldn't have been able to do it without the support from Callum Brown all throughout. 100% recommend!" },
  { name: "Terri Altilar",         label: "Level 3 Personal Training", quote: "Highly recommend PT Launch Lab, especially if you want flexible learning. I work full time but PT Launch Lab allowed me to learn at my own rate while still having support every step of the way." },
  { name: "Declan Marsden",        label: "Level 3 Personal Training", quote: "Officially passed my Level 3 today. Want to give a shout-out to Cal, Chris and Craig for all the support. If you're thinking about becoming a PT — do not hesitate to go to PT Launch Lab." },
];

const faqs = [
  { q: "Will I actually get a job after qualifying?",              a: "Yes — and we back that up. We guarantee gym interviews once you're qualified. Our team has personally hired over 500 PTs, so we know exactly what gyms look for and we prepare you for it." },
  { q: "How long does it take to qualify?",                        a: "Most students complete their Level 2 & 3 qualification in 8–16 weeks, studying around their current job. The course is fully self-paced so you're in control of your timeline." },
  { q: "Do I need any prior experience?",                          a: "None at all. Whether you're completely new to fitness or you've been training for years, the course starts from the foundations and builds up. All you need is a passion for fitness and the drive to make it your career." },
  { q: "What does it cost?",                                       a: "We have options to suit different budgets — including payment plans, deposit options, and zero-finance plans. The course is currently priced at £1,599 (down from £2,500). View all options on our enrolment page." },
  { q: "Will my qualification be recognised?",                     a: "Yes. Your NCFE Level 2 & 3 PT qualification is regulated by Ofqual and recognised by CIMSPA and REPs — the gold standard for UK fitness professionals. Every gym and insurance provider will accept it." },
  { q: "When can I start?",                                        a: "Immediately. As soon as you enrol you get full access to the course, your learning platform, and your personal tutor. There's no waiting around." },
  { q: "I have a full-time job and a family. Is this realistic?",  a: "Absolutely. The course is designed around real life. Study in the morning, evenings, weekends — whenever works for you. Most of our students qualify while working full-time." },
];

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function FunnelPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const startX = useRef(0);
  const isDragging = useRef(false);

  // Prospectus modal
  const [prospectusOpen, setProspectusOpen] = useState(false);
  const [prospectusForm, setProspectusForm] = useState({ name: "", phone: "", email: "" });
  const [prospectusSubmitting, setProspectusSubmitting] = useState(false);
  const [prospectusError, setProspectusError] = useState("");

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

  // Lock body scroll when modal is open
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
        body: JSON.stringify(prospectusForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Something went wrong.");
      window.open("/prospectus.pdf", "_blank");
      setProspectusOpen(false);
      setProspectusForm({ name: "", phone: "", email: "" });
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

      {/* ── PROSPECTUS MODAL ─────────────────────────────────── */}
      {prospectusOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setProspectusOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#0D3559] border border-[#3B82F6]/30 rounded-2xl p-8 shadow-2xl">
            <button onClick={() => setProspectusOpen(false)} className="absolute top-4 right-4 text-[#8CA3BF] hover:text-white transition-colors text-xl font-bold" aria-label="Close">✕</button>
            <div className="mb-6">
              <span className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase">Free Download</span>
              <h2 className="text-2xl font-bold text-white mt-2 mb-1">PT Launch Lab Course Prospectus</h2>
              <p className="text-[#8CA3BF] text-sm leading-relaxed">Enter your details and we&apos;ll take you straight to the prospectus — full course overview, pricing, and what to expect.</p>
            </div>
            <form onSubmit={handleProspectusSubmit} className="space-y-4">
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

      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-[#051D33]/95 backdrop-blur-md border-b border-[#3B82F6]/15 px-4 py-3 grid grid-cols-3 items-center">
        <Image src="/logo.png" alt="PT Launch Lab" width={140} height={36} className="h-8 w-auto shrink-0" />
        <nav className="flex items-center justify-center gap-2 sm:gap-3">
          <a href="/enrol" className="px-5 py-2 rounded-full bg-[#F5C518] text-[#072B4A] text-sm font-bold hover:brightness-110 transition-all shadow-md shadow-[#F5C518]/20">
            Start Today →
          </a>
          <a href="/book-call" className="hidden sm:block px-4 py-2 rounded-full border border-white/20 text-sm font-semibold text-white hover:bg-white/10 transition-all">
            Book a Call
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
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#F5C518]/40 bg-white/10 backdrop-blur-sm mb-8">
                <span className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase">Level 2 &amp; 3 PT · NCFE · Ofqual · CIMSPA</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] mb-6 animate-fade-in-up">
                Quit the job you hate.
                <br />
                <span className="text-[#F5C518]">Train for the life</span>
                <br />
                <span className="text-[#F5C518]">you want.</span>
              </h1>

              <p className="text-lg md:text-xl text-white font-semibold leading-snug mb-3 animate-fade-in-up animate-delay-100">
                We qualify you as a Personal Trainer and guide you as you turn it into a real business.
              </p>
              <p className="text-base text-blue-100/80 leading-relaxed mb-8 animate-fade-in-up animate-delay-100">
                Not just theory — real mentorship, from people who&apos;ve built it themselves. From your first lesson right through to your first paying client.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-fade-in-up animate-delay-200">
                <a href="/enrol" className="px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/30 text-center">
                  Enrol Now — Start Today →
                </a>
                <a href="/book-call" className="px-8 py-4 rounded-full border-2 border-white/60 text-white font-semibold text-base hover:bg-white/10 transition-all text-center">
                  Not sure? Book a free call
                </a>
              </div>

              {/* Quiz prompt */}
              <a href="/quiz" className="inline-flex items-center gap-2 text-[#F5C518]/80 text-sm font-medium hover:text-[#F5C518] transition-all mb-8 animate-fade-in-up animate-delay-200">
                🎯 Not sure if PT is right for you? Take the free 2-min quiz →
              </a>

              <div className="flex flex-wrap gap-3 md:gap-5 text-blue-200/70 text-xs animate-fade-in-up animate-delay-300">
                <span>⭐ 5-Star Rated</span>
                <span className="hidden sm:inline opacity-40">·</span>
                <span>Guaranteed Gym Interviews</span>
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

      {/* ── STATS STRIP ──────────────────────────────────────── */}
      <section className="bg-[#051D33] py-8 border-y border-[#3B82F6]/15">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {founderStats.map((s) => (
            <div key={s.value}>
              <p className="text-[#F5C518] text-3xl md:text-4xl font-bold">{s.value}</p>
              <p className="text-[#8CA3BF] text-xs mt-1 leading-relaxed whitespace-pre-line">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── VIDEO — FOUNDERS ─────────────────────────────────── */}
      <section className="bg-[#0D3559] py-20">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">From the founders</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center leading-tight mb-3">
            Why 80% of PTs fail —
            <br />
            <span className="text-[#F5C518]">and how we fix it.</span>
          </h2>
          <p className="text-[#8CA3BF] text-center text-base mb-10 max-w-2xl mx-auto">
            Callum, Miles, and Ryan explain what most courses get wrong — and why PT Launch Lab is built differently. Watch before you decide.
          </p>

          {/* Video embed */}
          <div className="relative rounded-2xl overflow-hidden border border-[#3B82F6]/25 shadow-2xl shadow-[#3B82F6]/10 aspect-video mb-8">
            <iframe
              src="https://www.youtube.com/embed/0rhp9fkBFsU"
              title="Why PT Launch Lab — from the founders"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full absolute inset-0"
            />
          </div>

          {/* Key quotes from transcript */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { quote: "80% of PTs leave the industry within their first year.", highlight: true },
              { quote: "We've hired over 500 PTs. We know exactly what gyms look for.", highlight: false },
              { quote: "We give you the path — not just the qualification.", highlight: false },
            ].map((q) => (
              <div key={q.quote} className={`rounded-xl p-5 border text-sm leading-relaxed text-center ${q.highlight ? "bg-[#F5C518]/10 border-[#F5C518]/40 text-white font-semibold" : "bg-[#072B4A] border-[#3B82F6]/20 text-[#8CA3BF]"}`}>
                &ldquo;{q.quote}&rdquo;
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/enrol" className="px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20 text-center">
              Ready? Enrol Now →
            </a>
            <a href="/book-call" className="px-8 py-4 rounded-full border-2 border-white/40 text-white font-semibold text-base hover:bg-white/10 transition-all text-center">
              Book a Free Call First
            </a>
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ──────────────────────────────────────── */}
      <section className="bg-[#072B4A] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">Does this sound familiar?</p>
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-4 leading-tight">
            You&apos;re good at your job.
            <br />
            You&apos;re just in the wrong one.
          </h2>
          <p className="text-[#8CA3BF] text-center text-base mb-14 max-w-xl mx-auto">
            Most people who come to us aren&apos;t career changers by accident. They&apos;re passionate, capable, and stuck in the wrong place.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {painCards.map((card) => (
              <div key={card.title} className="bg-[#0D3559] border border-[#3B82F6]/25 rounded-2xl p-8 hover:border-[#F5C518]/60 transition-all duration-300 hover:-translate-y-1 group">
                <span className="text-5xl mb-6 block">{card.icon}</span>
                <h3 className="text-white font-bold text-xl mb-3 group-hover:text-[#F5C518] transition-colors">{card.title}</h3>
                <p className="text-[#8CA3BF] text-[15px] leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <a href="/quiz" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold hover:brightness-110 transition-all">
              🎯 Take the free quiz — find out if PT is right for you →
            </a>
          </div>
        </div>
      </section>

      {/* ── LEARNER PHOTO STRIP ──────────────────────────────── */}
      <section className="bg-[#051D33] py-14 overflow-hidden">
        <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-8">Real learners. Real results.</p>
        <div className="overflow-hidden">
          <div className="flex gap-4 animate-scroll-x w-max px-4">
            {/* Duplicate set for seamless loop */}
            {[1, 2, 3, 4, 1, 2, 3, 4].map((n, i) => (
              <div key={i} className="relative shrink-0 w-44 h-60 md:w-56 md:h-72 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                <Image
                  src={`/learner-${n}.png`}
                  alt="PT Launch Lab learner"
                  fill
                  className="object-cover object-center"
                />
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

      {/* ── REFRAME ──────────────────────────────────────────── */}
      <section className="bg-[#072B4A] py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="w-16 h-1 bg-[#F5C518] rounded mx-auto mb-14" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                You&apos;re not broken.
                <br />
                <span className="text-[#F5C518]">You&apos;re just in the wrong place.</span>
              </h2>
              <p className="text-lg text-[#8CA3BF] leading-relaxed mb-8">
                Most people who come to us aren&apos;t career changers by accident. They&apos;re driven, passionate, and sick of wasting their potential. They just need the right qualification, the right support, and someone who&apos;s actually done it — to show them the way. That&apos;s exactly what PT Launch Lab was built for.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="/enrol" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold hover:brightness-110 transition-all">
                  Start your journey today →
                </a>
                <a href="/quiz" className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-[#F5C518]/40 text-[#F5C518] font-semibold text-sm hover:bg-[#F5C518]/10 transition-all">
                  Take the free quiz →
                </a>
              </div>
            </div>
            <div className="bg-[#0D3559] border border-[#3B82F6]/25 rounded-2xl p-8">
              <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-5">What you actually want</p>
              <ul className="space-y-4">
                {futures.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-white text-[15px]">
                    <span className="text-[#F5C518] mt-0.5 shrink-0 font-bold">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="bg-[#051D33] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">How it works</p>
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-3">
            Three steps to a career
            <br />
            <span className="text-[#F5C518]">you actually want.</span>
          </h2>
          <p className="text-[#8CA3BF] text-center text-lg mb-16 max-w-xl mx-auto">
            We don&apos;t just get you qualified. We get you hired, earning, and building.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-14">
            {steps.map((step) => (
              <div key={step.num} className={`rounded-2xl p-8 border transition-all ${step.highlight ? "bg-[#0D3559] border-[#F5C518]/60 shadow-xl shadow-[#F5C518]/10 scale-[1.02]" : "bg-[#0D3559] border-[#3B82F6]/25 hover:border-[#3B82F6]/50"}`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${step.highlight ? "bg-[#F5C518]/15 border border-[#F5C518]/40" : "bg-[#072B4A] border border-[#3B82F6]/25"}`}>
                    {step.icon}
                  </div>
                  <div>
                    <p className={`text-xs font-bold tracking-widest uppercase ${step.highlight ? "text-[#F5C518]" : "text-[#3B82F6]"}`}>Step {step.num}</p>
                    <h3 className="text-white font-bold text-2xl leading-none">{step.title}</h3>
                  </div>
                  {step.highlight && (
                    <span className="ml-auto text-[10px] bg-[#F5C518] text-[#072B4A] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide shrink-0">Key Step</span>
                  )}
                </div>
                <p className="text-[#8CA3BF] text-sm leading-relaxed mb-5">{step.body}</p>
                <ul className="space-y-2">
                  {step.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-[#8CA3BF] text-sm">
                      <span className="text-[#F5C518] mt-0.5 shrink-0">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="text-center">
            <a href="/enrol" className="inline-block px-10 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20">
              Start Today →
            </a>
          </div>
        </div>
      </section>

      {/* ── QUIZ CTA ─────────────────────────────────────────── */}
      <section className="bg-[#0D3559] py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="relative bg-gradient-to-br from-[#072B4A] to-[#0D3559] border-2 border-[#F5C518]/40 rounded-3xl p-10 md:p-14 text-center overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-96 h-64 rounded-full bg-[#F5C518] opacity-[0.06] blur-3xl" />
            </div>
            <div className="relative z-10">
              <span className="text-5xl mb-6 block">🎯</span>
              <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-3">Free · Takes 2 minutes</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Is a career in PT right for you?
              </h2>
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
      <section id="course-info" className="bg-[#072B4A] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">What&apos;s inside the system</p>
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center leading-tight mb-4">
            We&apos;re not selling you a course.
            <br />
            <span className="text-[#F5C518]">We&apos;re building you a career.</span>
          </h2>
          <p className="text-[#8CA3BF] text-lg text-center mb-16">
            Everything inside The PT Launch Method™ — built by gym owners who&apos;ve hired 500+ trainers.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            {features.map((feat) => (
              <div key={feat.title} className="bg-[#0D3559] border border-[#3B82F6]/25 rounded-2xl p-7 hover:border-[#F5C518]/40 transition-all duration-300 hover:-translate-y-0.5 group">
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

      {/* ── PROSPECTUS CTA ───────────────────────────────────── */}
      <section className="bg-[#051D33] py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-[#0D3559] border border-[#F5C518]/30 rounded-2xl p-10 md:p-14 text-center">
            <span className="text-4xl mb-6 block">📄</span>
            <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-3">Free Download</p>
            <h3 className="text-white text-3xl font-bold mb-4">Want the full course breakdown?</h3>
            <p className="text-[#8CA3BF] text-base max-w-md mx-auto mb-8 leading-relaxed">
              Download our free course prospectus — full module list, pricing options, payment plans, and exactly what to expect from day one.
            </p>
            <button
              onClick={() => setProspectusOpen(true)}
              className="px-12 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20"
            >
              Download Free Prospectus →
            </button>
            <p className="text-[#4A6280] text-xs mt-4">No spam. We&apos;ll only reach out if you&apos;d like us to.</p>
          </div>
        </div>
      </section>

      {/* ── FOUNDER CREDIBILITY ──────────────────────────────── */}
      <section className="bg-[#072B4A] py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-4">Why we built this</p>
              <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-6">
                We&apos;ve been in jobs
                <br />
                we hated too.
              </h2>
              <p className="text-white text-lg font-semibold mb-4">
                We don&apos;t just run PT courses. We run gyms. We hire trainers. We know what works.
              </p>
              <p className="text-[#8CA3BF] text-[17px] leading-relaxed mb-4">
                Callum, Miles and Ryan built this from lived experience — not a textbook. We scaled Ultimate Shred to over £500K in revenue as independent personal trainers, and we&apos;ve personally hired over 500 PTs across our gyms and partnerships.
              </p>
              <p className="text-[#8CA3BF] text-[17px] leading-relaxed mb-8">
                When we teach you what gyms look for, it&apos;s because we&apos;re the ones doing the hiring. When we talk about building income, it&apos;s because we&apos;ve done it — and we hand you the exact playbook.
              </p>

              {/* Founder photos */}
              <div className="flex gap-5 mb-8">
                {founders.map((f) => (
                  <div key={f.name} className="flex flex-col items-center gap-2">
                    <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-[#F5C518]/50 shadow-xl shadow-[#F5C518]/10">
                      <Image src={f.src} alt={f.name} fill className="object-cover object-top" />
                    </div>
                    <div className="text-center">
                      <p className="text-white text-sm font-bold">{f.name}</p>
                      <p className="text-[#8CA3BF] text-[10px] leading-tight max-w-[80px]">{f.role}</p>
                    </div>
                  </div>
                ))}
              </div>

              <a href="/enrol" className="px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-sm hover:brightness-110 transition-all">
                Get the playbook →
              </a>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {founderStats.map((stat) => (
                  <div key={stat.value} className="bg-[#0D3559] border border-[#3B82F6]/25 rounded-2xl p-6">
                    <p className="text-[#F5C518] text-4xl font-bold mb-2">{stat.value}</p>
                    <p className="text-[#8CA3BF] text-sm leading-relaxed whitespace-pre-line">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[#0D3559] border border-[#F5C518]/30 rounded-2xl p-6">
                <p className="text-[#F5C518] text-[10px] font-bold tracking-widest uppercase mb-3">Student Success Story</p>
                <h4 className="text-white font-bold text-lg mb-2">Gemma&apos;s Journey: Corporate to Coaching</h4>
                <p className="text-[#8CA3BF] text-sm leading-relaxed">
                  Gemma left corporate life behind and retrained through PT Launch Lab. Personal tutor from day one, qualified in 12 weeks around her job, and walked straight into guaranteed gym interviews. Now she runs her own PT business, earns more than she ever did in the office, and hasn&apos;t dreaded a Monday since.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── REVIEWS ──────────────────────────────────────────── */}
      <section className="bg-[#0D3559] py-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Don&apos;t just take our word for it.</h2>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[#F5C518] text-base">★★★★★</span>
                <span className="text-white text-sm font-semibold">5.0</span>
                <span className="text-[#8CA3BF] text-sm">· 17 Verified Reviews</span>
                <a href="https://www.google.com/search?q=pt+launch+lab+pontefract+reviews" target="_blank" rel="noopener noreferrer" className="text-[#F5C518] text-sm font-medium hover:underline ml-1">See all →</a>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={prevReview} disabled={reviewIndex === 0} aria-label="Previous review" className="w-11 h-11 rounded-full border border-[#3B82F6]/40 flex items-center justify-center text-white hover:border-[#F5C518] hover:text-[#F5C518] transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xl">‹</button>
              <button onClick={nextReview} disabled={reviewIndex >= maxReviewIndex} aria-label="Next review" className="w-11 h-11 rounded-full border border-[#3B82F6]/40 flex items-center justify-center text-white hover:border-[#F5C518] hover:text-[#F5C518] transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xl">›</button>
            </div>
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
                  <div className="bg-[#072B4A] border border-[#3B82F6]/20 rounded-2xl p-6 h-full flex flex-col gap-4 hover:border-[#F5C518]/30 transition-colors">
                    <div className="text-[#F5C518] text-base">★★★★★</div>
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
              <button key={i} onClick={() => setReviewIndex(i)} aria-label={`Go to review ${i + 1}`} className={`h-2 rounded-full transition-all duration-300 ${i === reviewIndex ? "bg-[#F5C518] w-6" : "bg-[#3B82F6]/30 w-2 hover:bg-[#3B82F6]/60"}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── ACCREDITATION ────────────────────────────────────── */}
      <section className="bg-[#072B4A] py-16 border-t border-[#3B82F6]/15">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-4">Fully accredited</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Industry recognised. Accepted everywhere.</h2>
          <p className="text-[#8CA3BF] text-base mb-10 max-w-xl mx-auto">Regulated by Ofqual and accepted by every gym and insurance provider in the UK.</p>
          <div className="flex flex-wrap justify-center gap-4">
            {["NCFE", "Ofqual Regulated", "CIMSPA", "REPs"].map((logo) => (
              <div key={logo} className="px-6 py-4 rounded-xl border border-[#3B82F6]/20 bg-white/5 text-white font-semibold text-sm min-w-[130px] text-center hover:border-[#F5C518]/40 transition-colors">
                {logo}
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
              <p className="text-[#8CA3BF] text-[15px] leading-relaxed mb-7">Enrol today and get immediate access to the full course — your login, your tutor, and everything you need to start your journey.</p>
              <ul className="space-y-3 mb-8 flex-1">
                {["Immediate access on enrolment", "Start your first module today", "Your personal tutor from day one", "Study at your own pace", "Multiple payment plan options"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-medium">
                    <span className="text-[#F5C518] font-bold">✓</span>
                    <span className="text-white">{item}</span>
                  </li>
                ))}
              </ul>
              <a href="/enrol" className="block w-full text-center py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20 mb-3">
                Enrol Now — Start Today →
              </a>
              <p className="text-[#4A6280] text-xs text-center">Immediate access. Start within minutes.</p>
            </div>
            <div className="bg-[#0D3559] border-2 border-[#3B82F6]/70 rounded-2xl p-8 text-left flex flex-col shadow-xl shadow-[#3B82F6]/10">
              <div className="inline-block mb-6">
                <span className="bg-[#3B82F6] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">No hard sell</span>
              </div>
              <h3 className="text-white text-2xl font-bold mb-4">I have a few questions first.</h3>
              <p className="text-[#8CA3BF] text-[15px] leading-relaxed mb-7">Book a free 15-minute call with our team. We&apos;ll answer every question honestly — and if the course isn&apos;t right for you, we&apos;ll tell you that too.</p>
              <ul className="space-y-3 mb-8 flex-1">
                {["15 minutes, completely free", "Honest answers, no pressure", "Talk to a real person", "We'll tell you if it's not right for you"].map((item) => (
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
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-6">The only question left</p>
          <h2 className="text-4xl md:text-6xl font-bold text-white leading-[1.05] mb-6">
            What are you
            <br />
            <span className="text-[#F5C518]">waiting for?</span>
          </h2>
          <p className="text-blue-100/80 text-lg mb-10 max-w-xl mx-auto">
            Every week you wait is another week in a job you don&apos;t want. Your qualification, your clients, and your freedom are on the other side of one decision.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a href="/enrol" className="px-10 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/30">
              Enrol Now — Start Today →
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
