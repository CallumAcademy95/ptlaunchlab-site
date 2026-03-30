import type { Metadata } from "next";
import Image from "next/image";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";

export const metadata: Metadata = {
  title: "6fit PT Academy | Become a Qualified Personal Trainer at 6fit Gyms",
  description:
    "Train, qualify, and earn at Bradford's best gym. Get £200 off your Level 2 & 3 PT qualification exclusively through 6fit Gyms. Mentorship included. Interview opportunities at 6fit.",
  alternates: {
    canonical: "https://ptlaunchlab.co.uk/6fit-academy",
  },
};

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const R = "#ed0000";   // 6fit red

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm text-gray-700">
      <span className="shrink-0 mt-0.5 font-bold" style={{ color: R }}>✔</span>
      <span>{children}</span>
    </li>
  );
}
function Cross({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm text-gray-500">
      <span className="shrink-0 mt-0.5 text-gray-400 font-bold">✗</span>
      <span>{children}</span>
    </li>
  );
}

export default function SixFitAcademyPage() {
  return (
    <>
      <Nav />
      <main className="pt-[72px] bg-white">

        {/* ── HERO ──────────────────────────────────── */}
        <section className="relative bg-black overflow-hidden">
          <div className="absolute inset-0 opacity-20"
            style={{ background: `radial-gradient(ellipse at 70% 50%, ${R}, transparent 60%)` }} />

          <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 md:py-28">
            <div className="flex flex-col md:flex-row md:items-center gap-10">
              <div className="flex-1">
                {/* Logo area */}
                <div className="flex items-center gap-4 mb-8">
                  <Image
                    src="https://6fitgyms.co.uk/wp-content/uploads/2022/12/6fit_FF-02.png"
                    alt="6fit Gyms"
                    width={64}
                    height={64}
                    className="rounded-xl"
                    unoptimized
                  />
                  <div>
                    <p className="text-white/50 text-xs uppercase tracking-widest font-semibold">Powered by PT Launch Lab</p>
                    <p className="text-white font-bold text-lg leading-tight">6fit PT Academy</p>
                  </div>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white uppercase leading-[1.0] mb-4">
                  Become a Qualified<br />
                  Personal Trainer<br />
                  <span style={{ color: R }}>Inside The Best<br />Gym In The North</span>
                </h1>

                <p className="text-white/70 text-xl font-semibold mb-8 uppercase tracking-wide">
                  Train. Qualify. Earn.
                </p>

                {/* Discount badge */}
                <div className="inline-block bg-[#ed0000] text-white rounded-2xl px-6 py-4 mb-8">
                  <p className="font-black text-2xl uppercase tracking-wide">£200 OFF Your PT Course</p>
                  <p className="text-white/80 text-sm mt-1">Exclusively for 6fit members &amp; applicants</p>
                </div>

                {/* Trust list */}
                <ul className="space-y-2 mb-10">
                  {[
                    "Level 2 + Level 3 PT Qualification",
                    "Study Around Your Job",
                    "Mentorship Included",
                    "Interview Opportunities At 6fit",
                  ].map((i) => (
                    <li key={i} className="flex items-center gap-2 text-white/90 text-sm font-medium">
                      <span style={{ color: R }}>✔</span> {i}
                    </li>
                  ))}
                </ul>

                <a
                  href="/6fit-academy/enrol"
                  className="inline-block px-10 py-4 rounded-full font-black text-white uppercase tracking-wide text-base hover:opacity-90 transition-all shadow-lg"
                  style={{ backgroundColor: R }}
                >
                  Claim Your £200 Discount →
                </a>
              </div>

              {/* Right side — stat cards */}
              <div className="grid grid-cols-2 gap-4 md:w-64 shrink-0">
                {[
                  { value: "£200", label: "Exclusive Discount" },
                  { value: "L2+L3", label: "PT Qualification" },
                  { value: "8–16", label: "Weeks to Qualify" },
                  { value: "100%", label: "Online & Flexible" },
                ].map((s) => (
                  <div key={s.label} className="bg-white/10 border border-white/15 rounded-2xl p-4 text-center">
                    <p className="font-black text-2xl text-white">{s.value}</p>
                    <p className="text-white/60 text-xs mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── HOOK ──────────────────────────────────── */}
        <section className="bg-white py-20 md:py-28">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-black uppercase mb-6">
              You&apos;re Already In The Gym.
            </h2>
            <p className="text-xl text-gray-600 mb-4">You already train.</p>
            <p className="text-xl font-bold text-black mb-10">&ldquo;I could do this as a job.&rdquo;</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-12">
              {[
                "You don't know where to start",
                "Too many courses online",
                "Not sure who to trust",
                "Don't want to waste money",
                "Don't know if you'll actually get work",
              ].map((i) => (
                <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <span className="text-gray-400 shrink-0 mt-0.5">—</span>
                  <span className="text-gray-600 text-sm">{i}</span>
                </div>
              ))}
            </div>

            <div className="bg-black rounded-2xl px-8 py-6 inline-block">
              <p className="text-white font-black text-xl uppercase tracking-wide">
                That&apos;s exactly why <span style={{ color: R }}>this exists.</span>
              </p>
            </div>
          </div>
        </section>

        {/* ── POSITIONING ───────────────────────────── */}
        <section className="py-20 md:py-28" style={{ backgroundColor: R }}>
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-3">Not just a course</p>
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase leading-tight mb-6">
              This Is The 6fit PT Academy
            </h2>
            <p className="text-white/80 text-lg mb-4">Built inside an award-winning gym.</p>
            <p className="text-white/80 text-lg mb-10">By people who actually hire personal trainers.</p>
            <p className="text-white font-bold text-xl mb-8">We don&apos;t just teach you theory. We show you how to:</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[
                { icon: "🎓", label: "Get qualified" },
                { icon: "👥", label: "Get clients" },
                { icon: "💰", label: "Make money" },
                { icon: "🏋️", label: "Build a career" },
              ].map((c) => (
                <div key={c.label} className="bg-white/15 border border-white/20 rounded-2xl p-5 text-center">
                  <div className="text-3xl mb-2">{c.icon}</div>
                  <p className="text-white font-bold text-sm uppercase tracking-wide">{c.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHAT YOU GET ──────────────────────────── */}
        <section className="bg-white py-20 md:py-28">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest text-center mb-3">What&apos;s Included</p>
            <h2 className="text-3xl md:text-4xl font-black text-black uppercase text-center mb-14">
              Everything You Need To Succeed
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: "🎓",
                  title: "Full PT Qualification",
                  body: "Study online, fit it around your job.",
                  items: ["Level 2 Gym Instructor", "Level 3 Personal Trainer", "Industry recognised qualification"],
                },
                {
                  icon: "🧠",
                  title: "Mentorship Included",
                  body: "This is where most courses fail. We don't leave you on your own.",
                  items: ["Support throughout your qualification", "Real-world advice from industry pros", "How to actually succeed as a PT"],
                },
                {
                  icon: "🏋️",
                  title: "Gym Pathway",
                  body: "You're not just getting qualified — you're getting a pathway into a gym.",
                  items: ["Interview opportunities at 6fit", "Learn how gyms actually work", "Build confidence on the gym floor"],
                },
                {
                  icon: "💰",
                  title: "How You Make Money",
                  body: "We show you how to earn — not just how to qualify.",
                  items: ["1-1 PT sessions", "Online coaching", "Hybrid coaching models"],
                },
              ].map((card) => (
                <div key={card.title} className="bg-gray-50 border border-gray-100 rounded-2xl p-8">
                  <div className="text-3xl mb-4">{card.icon}</div>
                  <h3 className="font-black text-black text-xl uppercase mb-2">{card.title}</h3>
                  <p className="text-gray-500 text-sm mb-5">{card.body}</p>
                  <ul className="space-y-2">
                    {card.items.map((i) => <Check key={i}>{i}</Check>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY 6FIT ──────────────────────────────── */}
        <section className="bg-black py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">The Gym</p>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase mb-4">
              Learn Inside An Award-Winning Gym
            </h2>
            <p className="text-white/60 text-lg mb-12">Not a classroom. Not just videos.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[
                { value: "#1", label: "Best Gym In The North" },
                { value: "2×", label: "Best Gym In Bradford" },
                { value: "5★", label: "Member Rated" },
                { value: "Pro", label: "Gymleco · Cybex · Rogue" },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 border border-white/10 rounded-2xl p-5 text-center">
                  <p className="font-black text-2xl text-white" style={{ color: s.value === "#1" ? R : "white" }}>{s.value}</p>
                  <p className="text-white/50 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-left">
              <ul className="space-y-3">
                {[
                  "Best Gym In The North",
                  "Best Gym In Bradford — 2 years running",
                  "Premium equipment: Gymleco, Cybex, Nautilus, Rogue",
                  "Real coaching environment — you're learning where standards are set",
                ].map((i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                    <span style={{ color: R }} className="shrink-0 font-bold">✔</span>
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── £200 OFF ──────────────────────────────── */}
        <section className="bg-white py-20 md:py-28">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="bg-black rounded-3xl p-10 md:p-14">
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">Exclusive 6fit Offer</p>
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase leading-tight mb-4">
                £200 OFF<br />
                <span style={{ color: R }}>Your Course</span>
              </h2>
              <p className="text-white/70 mb-8">When you join through 6fit — this offer is only available through the gym.</p>

              <div className="grid grid-cols-3 gap-4 mb-10">
                {[
                  "Save £200 instantly",
                  "Secure your place",
                  "Start immediately",
                ].map((i) => (
                  <div key={i} className="bg-white/10 rounded-xl p-3 text-center">
                    <span style={{ color: R }} className="block font-bold text-lg mb-1">✔</span>
                    <span className="text-white/80 text-xs">{i}</span>
                  </div>
                ))}
              </div>

              <a
                href="/6fit-academy/enrol"
                className="inline-block px-10 py-4 rounded-full font-black text-white uppercase tracking-wide text-base hover:opacity-90 transition-all"
                style={{ backgroundColor: R }}
              >
                Claim Your £200 Discount Now →
              </a>
            </div>
          </div>
        </section>

        {/* ── WHO IT'S FOR ──────────────────────────── */}
        <section className="bg-gray-50 py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-6">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest text-center mb-3">Is This For You?</p>
            <h2 className="text-3xl md:text-4xl font-black text-black uppercase text-center mb-12">
              Who This Is For
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <p className="font-black text-black uppercase mb-4 text-sm tracking-wide" style={{ color: R }}>✔ This is for you if:</p>
                <ul className="space-y-3">
                  {[
                    "You love training",
                    "You want more freedom",
                    "You're stuck in a job you don't enjoy",
                    "You want to earn from fitness",
                    "You don't want to go back to college",
                  ].map((i) => <Check key={i}>{i}</Check>)}
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <p className="font-black text-gray-500 uppercase mb-4 text-sm tracking-wide">You don&apos;t need to:</p>
                <ul className="space-y-3">
                  {[
                    "Quit your job to start",
                    "Have any experience",
                    'Be "perfect" — just ready',
                  ].map((i) => <Cross key={i}>{i}</Cross>)}
                </ul>
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-black font-bold text-sm">You just need to start.</p>
                  <p className="text-gray-500 text-sm">We guide you through everything.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FUTURE VISION ─────────────────────────── */}
        <section className="bg-black py-20 md:py-24">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-6">Your Future</p>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase mb-10">
              Imagine This…
            </h2>
            <div className="space-y-4 mb-12">
              {[
                "You're working in a gym",
                "You're coaching clients",
                "You're earning doing something you enjoy",
                "You've got control over your time",
                "You're building your own income",
              ].map((i, idx) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 flex items-center gap-4">
                  <span className="text-2xl font-black" style={{ color: R }}>{idx + 1}</span>
                  <p className="text-white font-semibold text-sm">{i}</p>
                </div>
              ))}
            </div>
            <p className="text-white font-bold text-xl">This is the start of that.</p>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────── */}
        <section className="bg-white py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-black text-black uppercase mb-12">How It Works</h2>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
              {[
                "Apply through 6fit",
                "Get your £200 discount",
                "Start your course",
                "Get qualified",
                "Get support into the gym",
              ].map((step, i) => (
                <div key={step}>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-lg mb-3" style={{ backgroundColor: R }}>
                      {i + 1}
                    </div>
                    <p className="text-black font-bold text-sm text-center">{step}</p>
                  </div>
                  {i < 4 && <div className="hidden sm:block" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────── */}
        <section className="py-20 md:py-24" style={{ backgroundColor: R }}>
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase leading-tight mb-4">
              Start Your PT Journey Today
            </h2>
            <p className="text-white/80 text-xl font-bold mb-10 uppercase tracking-wide">
              Claim Your £200 Discount Now
            </p>

            <a
              href="/6fit-academy/enrol"
              className="inline-block bg-white text-black font-black uppercase tracking-wide text-base px-12 py-5 rounded-full hover:opacity-90 transition-all shadow-2xl mb-6"
            >
              Apply Now →
            </a>

            <p className="text-white/60 text-sm">
              Use code <span className="text-white font-bold">6FITPTDISCOUNT</span> at checkout for your £200 off
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
