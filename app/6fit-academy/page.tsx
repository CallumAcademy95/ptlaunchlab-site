import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "6fit PT Academy | Become a Qualified Personal Trainer at 6fit Gyms",
  description:
    "Train, qualify, and earn at Bradford's best gym. Get £200 off your Level 2 & 3 PT qualification exclusively through 6fit Gyms. Mentorship included. Interview opportunities at 6fit.",
  alternates: { canonical: "https://ptlaunchlab.co.uk/6fit-academy" },
};

const R = "#ed0000";

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-gray-700">
      <span className="shrink-0 font-bold mt-0.5" style={{ color: R }}>✔</span>
      <span>{children}</span>
    </li>
  );
}

export default function SixFitAcademyPage() {
  return (
    <>
      <main className="bg-white">

        {/* ── HERO ── */}
        <section className="relative bg-black overflow-hidden">
          <div className="absolute inset-0 opacity-25 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 80% 50%, ${R}, transparent 55%)` }} />

          <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 md:py-24">
            <div className="flex items-center gap-3 mb-8">
              <Image
                src="https://6fitgyms.co.uk/wp-content/uploads/2022/12/6fit_FF-02.png"
                alt="6fit Gyms" width={52} height={52}
                className="rounded-xl" unoptimized
              />
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">Powered by PT Launch Lab</p>
                <p className="text-white font-bold text-sm">6fit PT Academy</p>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white uppercase leading-[1.0] mb-5">
              Become a Qualified<br />Personal Trainer<br />
              <span style={{ color: R }}>Inside The Best<br />Gym In The North</span>
            </h1>

            <p className="text-white/60 text-lg font-semibold uppercase tracking-widest mb-8">Train. Qualify. Earn.</p>

            {/* Discount pill */}
            <div className="inline-flex items-center gap-3 rounded-2xl px-6 py-3 mb-8" style={{ backgroundColor: R }}>
              <span className="text-white font-black text-xl uppercase tracking-wide">£200 OFF</span>
              <span className="text-white/80 text-sm">exclusively for 6fit members</span>
            </div>

            <ul className="flex flex-wrap gap-x-6 gap-y-2 mb-10">
              {["Level 2 + Level 3 PT Qualification", "Study Around Your Job", "Mentorship Included", "Interview Opportunities At 6fit"].map(i => (
                <li key={i} className="flex items-center gap-2 text-white/80 text-sm font-medium">
                  <span style={{ color: R }}>✔</span> {i}
                </li>
              ))}
            </ul>

            <a href="/6fit-academy/enrol"
              className="inline-block px-10 py-4 rounded-full font-black text-white uppercase tracking-wide text-base hover:opacity-90 transition-all shadow-xl"
              style={{ backgroundColor: R }}>
              Claim Your £200 Discount →
            </a>
          </div>
        </section>

        {/* ── HOOK ── */}
        <section className="bg-white py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-black text-black uppercase mb-6 text-center">
              You&apos;re Already In The Gym.
            </h2>
            <p className="text-center text-lg text-gray-500 mb-2">You already train.</p>
            <p className="text-center text-xl font-bold text-black mb-10">&ldquo;I could do this as a job.&rdquo;</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
              {["You don't know where to start", "Too many courses online — not sure who to trust", "Don't want to waste money", "Don't know if you'll actually get work after"].map(i => (
                <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <span className="text-gray-300 shrink-0">—</span>
                  <span className="text-gray-500 text-sm">{i}</span>
                </div>
              ))}
            </div>

            <div className="bg-black rounded-2xl px-8 py-5 text-center">
              <p className="text-white font-black text-lg uppercase tracking-wide">
                That&apos;s exactly why <span style={{ color: R }}>this exists.</span>
              </p>
            </div>
          </div>
        </section>

        {/* ── NOT JUST A COURSE ── */}
        <section className="py-16 md:py-20" style={{ backgroundColor: R }}>
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase leading-tight mb-4">
              This Is The 6fit PT Academy
            </h2>
            <p className="text-white/70 text-base mb-10">Built inside an award-winning gym, by people who actually hire PTs.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[{ icon: "🎓", label: "Get Qualified" }, { icon: "👥", label: "Get Clients" }, { icon: "💰", label: "Make Money" }, { icon: "🏋️", label: "Build a Career" }].map(c => (
                <div key={c.label} className="bg-white/15 border border-white/20 rounded-2xl p-5 text-center">
                  <div className="text-3xl mb-2">{c.icon}</div>
                  <p className="text-white font-bold text-xs uppercase tracking-wide">{c.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHAT YOU GET ── */}
        <section className="bg-white py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-black text-black uppercase text-center mb-12">
              Everything You Need To Succeed
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { icon: "🎓", title: "Full PT Qualification", body: "Study 100% online around your current job.", items: ["Level 2 Gym Instructor", "Level 3 Personal Trainer", "Industry recognised & Ofqual regulated"] },
                { icon: "🧠", title: "Mentorship Included", body: "This is where most courses fail — we don't leave you on your own.", items: ["Support throughout your qualification", "Real-world advice from industry pros", "How to actually succeed as a PT"] },
                { icon: "🏋️", title: "Gym Pathway", body: "Not just qualified — given a pathway into a gym.", items: ["Interview opportunities at 6fit", "Learn how gyms actually work", "Build confidence on the gym floor"] },
                { icon: "💰", title: "How You Make Money", body: "Income, not just certificates.", items: ["1-1 PT sessions", "Online coaching", "Hybrid coaching models"] },
              ].map(card => (
                <div key={card.title} className="bg-gray-50 border border-gray-100 rounded-2xl p-7">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{card.icon}</span>
                    <h3 className="font-black text-black uppercase text-base">{card.title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm mb-4">{card.body}</p>
                  <ul className="space-y-2">{card.items.map(i => <Check key={i}>{i}</Check>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY 6FIT ── */}
        <section className="bg-black py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase mb-3">
              Learn Inside An Award-Winning Gym
            </h2>
            <p className="text-white/50 mb-10">Not a classroom. Not just videos.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[{ value: "#1", label: "Best Gym In The North" }, { value: "2×", label: "Best Gym In Bradford" }, { value: "5★", label: "Member Rated" }, { value: "Pro", label: "Gymleco · Cybex · Rogue" }].map(s => (
                <div key={s.label} className="bg-white/10 border border-white/10 rounded-2xl p-5 text-center">
                  <p className="font-black text-2xl" style={{ color: s.value === "#1" ? R : "white" }}>{s.value}</p>
                  <p className="text-white/50 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <ul className="space-y-3 text-left max-w-lg mx-auto">
              {["Best Gym In The North", "Best Gym In Bradford — 2 years running", "Premium equipment: Gymleco, Cybex, Nautilus, Rogue", "A real coaching environment — you learn where standards are set"].map(i => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                  <span style={{ color: R }} className="shrink-0 font-bold">✔</span>{i}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── £200 OFF ── */}
        <section className="bg-white py-16 md:py-24">
          <div className="max-w-2xl mx-auto px-6">
            <div className="bg-black rounded-3xl p-10 md:p-14 text-center">
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Exclusive 6fit Offer</p>
              <h2 className="text-5xl md:text-7xl font-black text-white uppercase leading-none mb-2">£200</h2>
              <h3 className="text-2xl font-black uppercase mb-6" style={{ color: R }}>Off Your Course</h3>
              <p className="text-white/60 text-sm mb-8">Only available when you join through 6fit Gyms.</p>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {["Save £200 instantly", "Secure your place", "Start immediately"].map(i => (
                  <div key={i} className="bg-white/10 rounded-xl p-3 text-center">
                    <span style={{ color: R }} className="block font-bold text-base mb-1">✔</span>
                    <span className="text-white/70 text-xs">{i}</span>
                  </div>
                ))}
              </div>
              <a href="/6fit-academy/enrol"
                className="inline-block px-10 py-4 rounded-full font-black text-white uppercase text-base hover:opacity-90 transition-all"
                style={{ backgroundColor: R }}>
                Claim Your £200 Discount Now →
              </a>
            </div>
          </div>
        </section>

        {/* ── WHO IT'S FOR ── */}
        <section className="bg-gray-50 py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-black text-black uppercase text-center mb-12">Who This Is For</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <p className="font-black uppercase text-sm tracking-wide mb-4" style={{ color: R }}>✔ This is for you if:</p>
                <ul className="space-y-3">
                  {["You love training", "You want more freedom", "You're stuck in a job you don't enjoy", "You want to earn from fitness", "You don't want to go back to college"].map(i => <Check key={i}>{i}</Check>)}
                </ul>
              </div>
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="font-black uppercase text-sm tracking-wide text-gray-400 mb-4">You don&apos;t need to:</p>
                  <ul className="space-y-3">
                    {["Quit your job to start", "Have any experience", "Be perfect — just ready"].map(i => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                        <span className="text-gray-300 shrink-0 font-bold">✗</span><span>{i}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-black font-bold text-sm">You just need to start.</p>
                  <p className="text-gray-400 text-sm">We guide you through everything.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-black uppercase mb-10">How It Works</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-0">
              {["Apply through 6fit", "Get your £200 discount", "Start your course", "Get qualified", "Work at 6fit"].map((step, i) => (
                <div key={step} className="flex sm:flex-col items-center gap-2 sm:gap-0 flex-1">
                  <div className="flex sm:flex-col items-center sm:mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm shrink-0" style={{ backgroundColor: R }}>
                      {i + 1}
                    </div>
                    {i < 4 && <div className="w-8 sm:w-px h-px sm:h-6 bg-gray-200 sm:mx-auto" />}
                  </div>
                  <p className="text-black font-bold text-xs text-center sm:mt-2 max-w-[80px]">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="py-16 md:py-20" style={{ backgroundColor: R }}>
          <div className="max-w-2xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase leading-tight mb-3">
              Start Your PT Journey Today
            </h2>
            <p className="text-white/70 font-bold uppercase tracking-wide mb-8">Claim Your £200 Discount Now</p>
            <a href="/6fit-academy/enrol"
              className="inline-block bg-white font-black uppercase tracking-wide text-base px-12 py-5 rounded-full hover:opacity-90 transition-all shadow-xl mb-5"
              style={{ color: R }}>
              Apply Now →
            </a>
            <p className="text-white/50 text-xs">Use code <span className="text-white font-bold">6FITPTDISCOUNT</span> at checkout</p>
          </div>
        </section>

      {/* Minimal footer */}
      <footer className="bg-black border-t border-white/10 py-6 px-6 text-center">
        <p className="text-white/30 text-xs">
          Powered by PT Launch Lab · NCFE Accredited Centre No. 9002788 ·{" "}
          <a href="/terms" className="hover:text-white/50 transition-colors">Terms</a>
          {" "}·{" "}
          <a href="/privacy" className="hover:text-white/50 transition-colors">Privacy</a>
        </p>
      </footer>
    </>
  );
}
