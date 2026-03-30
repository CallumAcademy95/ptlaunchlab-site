import type { Metadata } from "next";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";
import PartnershipForm from "./PartnershipForm";

export const metadata: Metadata = {
  title: "Gym Partnership Programme | PT Launch Lab — Earn £500 Per Learner",
  description:
    "Turn your gym into its own white-label PT academy. Earn £500 per learner, build a steady pipeline of qualified PTs, and increase rental income — with zero admin.",
  alternates: {
    canonical: "https://ptlaunchlab.co.uk/gym-partnership",
  },
  openGraph: {
    title: "Gym Partnership Programme | PT Launch Lab",
    description:
      "Earn £500 per learner. Get your own white-label PT academy. We handle education, compliance & mentorship — you keep the revenue.",
    url: "https://ptlaunchlab.co.uk/gym-partnership",
  },
};

const partnershipSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "PT Launch Lab Gym Partnership Programme",
  description:
    "A white-label personal trainer academy programme for commercial gyms. Partner gyms earn £500 per learner, receive a branded PT academy, and build a consistent pipeline of qualified personal trainers.",
  provider: {
    "@type": "Organization",
    name: "PT Launch Lab",
    url: "https://ptlaunchlab.co.uk",
  },
  areaServed: {
    "@type": "Country",
    name: "United Kingdom",
  },
  offers: {
    "@type": "Offer",
    description: "£500 referral fee per learner enrolled through your gym",
    price: "0",
    priceCurrency: "GBP",
    eligibleCustomerType: "https://schema.org/Business",
  },
};

const STEPS = [
  { n: "01", title: "Join the Partnership", body: "Apply below — we review your gym and confirm your area." },
  { n: "02", title: "We Build Your Academy", body: "Your white-label PT academy is set up with your branding, logo and link." },
  { n: "03", title: "Promote It In Your Gym", body: "Display your QR code and link on-site and across your socials." },
  { n: "04", title: "Earn Front & Back End", body: "£500 per enrolment upfront. PT rent and membership long-term." },
];

export default function GymPartnershipPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(partnershipSchema) }}
      />
      <Nav />
      <main className="pt-[72px]">

        {/* ── HERO ──────────────────────────────────── */}
        <section className="relative flex flex-col bg-gradient-to-br from-[#0E5FA0] via-[#0A4A80] to-[#072B4A] overflow-hidden">
          <div className="absolute -left-64 top-0 w-[700px] h-[700px] rounded-full bg-[#F5C518] opacity-[0.06] blur-3xl pointer-events-none" />
          <div className="absolute -right-32 bottom-0 w-[500px] h-[500px] rounded-full bg-[#60A5FA] opacity-[0.08] blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-14 md:pt-24 md:pb-20 w-full">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#F5C518]/40 bg-white/10 backdrop-blur-sm mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F5C518] animate-pulse" />
                <span className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase">Gym Partnership Programme</span>
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-[1.05] mb-6">
                Turn Your Gym Into<br />
                <span className="text-[#F5C518]">Its Own PT Academy</span>
              </h1>

              <p className="text-xl text-blue-100/80 leading-relaxed mb-10 max-w-xl">
                We build, run, and manage a fully white-label PT academy inside your gym.
                You earn <strong className="text-white">£500 per learner</strong> upfront — plus long-term PT rental income.
                Zero teaching. Zero admin. Zero cost.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#apply" className="px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/30 text-center">
                  Apply to Secure Your Area →
                </a>
                <a href="#how-it-works" className="px-8 py-4 rounded-full border border-white/30 text-white font-medium text-base hover:bg-white/10 transition-all text-center">
                  See How It Works
                </a>
              </div>
            </div>
          </div>

          {/* Stat strip — flows naturally below content, no overlap */}
          <div className="relative z-10 bg-[#061F36]/80 backdrop-blur-sm border-t border-white/10">
            <div className="max-w-5xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: "£500", label: "Per learner" },
                { value: "0", label: "Admin for you" },
                { value: "1", label: "Partner per area" },
                { value: "100%", label: "White-label branded" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-[#F5C518] font-bold text-2xl leading-none">{s.value}</p>
                  <p className="text-[#8CA3BF] text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROBLEM / SOLUTION ────────────────────── */}
        <section className="bg-[#0D3559] py-20 md:py-28">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Problem */}
              <div className="bg-[#072B4A] rounded-2xl p-8 border border-[#3B82F6]/15">
                <p className="text-[#4A6280] text-xs font-bold tracking-widest uppercase mb-6">The Problem</p>
                <h2 className="text-2xl font-bold text-white mb-6 leading-snug">
                  Most gyms can&apos;t keep a steady pipeline of good PTs
                </h2>
                <ul className="space-y-3">
                  {[
                    "No one good applies for PT roles",
                    "PT quality is inconsistent",
                    "Floor space sits empty without rental income",
                    "Running your own course is too much work",
                    "Hours wasted interviewing unqualified people",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <span className="text-red-400 mt-0.5 shrink-0">✗</span>
                      <span className="text-[#8CA3BF]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Solution */}
              <div className="bg-[#072B4A] rounded-2xl p-8 border border-[#F5C518]/25">
                <p className="text-[#F5C518] text-xs font-bold tracking-widest uppercase mb-6">The Solution</p>
                <h2 className="text-2xl font-bold text-white mb-6 leading-snug">
                  A PT academy running inside your gym — fully managed by us
                </h2>
                <ul className="space-y-3">
                  {[
                    "Your own white-label branded academy",
                    "We handle all education, compliance & mentorship",
                    "Qualified PTs ready to work in your gym",
                    "£500 per learner paid to your gym",
                    "Zero teaching, zero admin, zero cost",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <span className="text-[#F5C518] mt-0.5 shrink-0">✔</span>
                      <span className="text-white">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── REVENUE ───────────────────────────────── */}
        <section className="bg-[#072B4A] py-20 md:py-28">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-[#4A6280] text-xs font-bold tracking-widest uppercase mb-3">Revenue</p>
              <h2 className="text-3xl md:text-5xl font-bold text-white">Two ways you earn</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0D3559] rounded-2xl p-10 border-2 border-[#F5C518]/50 shadow-xl shadow-[#F5C518]/5">
                <p className="text-[#F5C518] text-xs font-bold tracking-widest uppercase mb-4">Front End</p>
                <p className="text-[#F5C518] text-7xl font-bold leading-none mb-2">£500</p>
                <p className="text-white font-semibold text-lg mb-6">per learner who enrols through your gym</p>
                <ul className="space-y-2 text-sm">
                  {["Paid directly to your gym", "No teaching required", "No extra work required"].map((i) => (
                    <li key={i} className="flex items-center gap-2 text-[#8CA3BF]">
                      <span className="text-[#F5C518]">✔</span> {i}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#0D3559] rounded-2xl p-10 border-2 border-[#3B82F6]/40 shadow-xl shadow-[#3B82F6]/5">
                <p className="text-[#3B82F6] text-xs font-bold tracking-widest uppercase mb-4">Back End</p>
                <p className="text-white text-3xl font-bold leading-snug mb-2">They qualify.<br />They stay.</p>
                <p className="text-[#8CA3BF] text-sm mb-6">Every learner becomes a qualified PT who already knows your gym — and needs somewhere to work.</p>
                <ul className="space-y-2 text-sm">
                  {["PT floor rent", "PT membership fees", "Long-term trainer retention", "More coaching revenue in-club"].map((i) => (
                    <li key={i} className="flex items-center gap-2 text-[#8CA3BF]">
                      <span className="text-[#3B82F6]">✔</span> {i}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────── */}
        <section id="how-it-works" className="bg-[#0D3559] py-20 md:py-28">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-[#4A6280] text-xs font-bold tracking-widest uppercase mb-3">The Process</p>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">How it works</h2>
              <p className="text-[#8CA3BF]">Simple. Scalable. No extra staff.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {STEPS.map((s) => (
                <div key={s.n} className="bg-[#072B4A] rounded-2xl p-6 border border-[#3B82F6]/15 relative">
                  <p className="text-[#F5C518]/20 text-6xl font-black leading-none absolute top-4 right-5 select-none">{s.n}</p>
                  <p className="text-[#F5C518] text-xs font-bold tracking-widest uppercase mb-3">{s.n}</p>
                  <p className="text-white font-bold text-base mb-2">{s.title}</p>
                  <p className="text-[#8CA3BF] text-sm leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHAT YOU GET ──────────────────────────── */}
        <section className="bg-[#072B4A] py-20 md:py-28">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-[#4A6280] text-xs font-bold tracking-widest uppercase mb-3">What&apos;s Included</p>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">Everything done for you</h2>
              <p className="text-[#8CA3BF] max-w-lg mx-auto">Your academy is fully branded, fully managed, and fully compliant — we handle it all.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* White label */}
              <div className="bg-[#0D3559] rounded-2xl p-8 border border-[#F5C518]/20">
                <p className="text-[#F5C518] text-xs font-bold tracking-widest uppercase mb-5">Your Brand</p>
                <h3 className="text-white text-xl font-bold mb-2">Your academy, your name</h3>
                <p className="text-[#8CA3BF] text-sm mb-6">To your members it looks exactly like <span className="text-white font-semibold">&ldquo;[Your Gym] PT Academy&rdquo;</span> — not ours.</p>
                <ul className="space-y-2">
                  {["Your logo and branding", "Your custom link & QR code", "Your academy landing page", "Your messaging to members"].map((i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-[#F5C518]">✔</span><span className="text-white">{i}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Zero admin */}
              <div className="bg-[#0D3559] rounded-2xl p-8 border border-[#3B82F6]/20">
                <p className="text-[#3B82F6] text-xs font-bold tracking-widest uppercase mb-5">We Handle Everything</p>
                <h3 className="text-white text-xl font-bold mb-2">You do none of this</h3>
                <p className="text-[#8CA3BF] text-sm mb-6">Your only role is gym partner. Everything else is on us.</p>
                <div className="grid grid-cols-2 gap-2">
                  {["Teaching", "Compliance", "Tutors", "Assessments", "Paperwork", "Certification", "Student support", "Course material"].map((i) => (
                    <div key={i} className="flex items-center gap-2 bg-[#072B4A] rounded-lg px-3 py-2 text-xs">
                      <span className="text-red-400">✗</span>
                      <span className="text-[#8CA3BF]">{i}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Why us bar */}
            <div className="bg-[#0D3559] rounded-2xl p-8 border border-[#3B82F6]/15">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                {[
                  { icon: "🏋️", title: "Built by gym owners", body: "We've hired 500+ PTs. We know what gyms actually need." },
                  { icon: "🎓", title: "NCFE & Ofqual regulated", body: "Industry-recognised Level 2 & 3 qualifications. Fully compliant." },
                  { icon: "🤝", title: "Not courses. Recruitment.", body: "We solve your pipeline problem — not just sell qualifications." },
                ].map((c) => (
                  <div key={c.title}>
                    <div className="text-3xl mb-3">{c.icon}</div>
                    <p className="text-white font-bold text-sm mb-1">{c.title}</p>
                    <p className="text-[#8CA3BF] text-xs leading-relaxed">{c.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── WHO IT'S FOR ──────────────────────────── */}
        <section className="bg-[#0D3559] py-20 md:py-28">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-[#4A6280] text-xs font-bold tracking-widest uppercase mb-3">Ideal Fit</p>
              <h2 className="text-3xl md:text-5xl font-bold text-white">Is this for you?</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#072B4A] rounded-2xl p-8 border border-[#F5C518]/25">
                <p className="text-[#F5C518] font-bold text-base mb-5">✔ Great fit if you…</p>
                <ul className="space-y-3">
                  {[
                    "Run a commercial gym with PT floor space",
                    "Want a new revenue stream without extra staff",
                    "Struggle to find and keep quality PTs",
                    "Want better, pre-vetted trainers on your floor",
                    "Want your own branded PT academy",
                    "Don't want to deal with education or compliance",
                  ].map((i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-[#F5C518] mt-0.5 shrink-0">✔</span>
                      <span className="text-white">{i}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#072B4A] rounded-2xl p-8 border border-[#3B82F6]/20 flex flex-col justify-between">
                <div>
                  <p className="text-[#8CA3BF] font-bold text-base mb-5">✗ Not a fit if you…</p>
                  <ul className="space-y-3">
                    {[
                      "Run a small studio with no PT floor space",
                      "Don't rent space to self-employed PTs",
                    ].map((i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="text-red-400 mt-0.5 shrink-0">✗</span>
                        <span className="text-[#8CA3BF]">{i}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-10 pt-6 border-t border-[#3B82F6]/20">
                  <p className="text-white font-semibold text-sm">
                    We take <span className="text-[#F5C518] font-bold">one partner gym per area</span> to protect exclusivity.{" "}
                    <span className="text-[#8CA3BF]">Areas close as applications come in.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PIPELINE CLOSE ────────────────────────── */}
        <section className="bg-[#061F36] py-14 border-y border-[#3B82F6]/10">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <p className="text-3xl md:text-4xl font-bold text-white leading-snug mb-4">
              Most gyms don&apos;t have a recruitment problem.
              <br />
              They have a <span className="text-[#F5C518]">pipeline problem.</span>
            </p>
            <p className="text-[#8CA3BF] text-lg">Fix the pipeline once. Never recruit again.</p>
          </div>
        </section>

        {/* ── APPLICATION FORM ──────────────────────── */}
        <section id="apply" className="bg-[#072B4A] py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[600px] rounded-full bg-[#F5C518] opacity-[0.04] blur-3xl" />
          </div>

          <div className="relative z-10 max-w-xl mx-auto px-6">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-400/25 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-red-400 text-xs font-bold tracking-wide uppercase">One partner per area</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Apply to Become a Partner Gym
              </h2>
              <p className="text-[#8CA3BF] text-sm">
                Earn £500 per learner · Your own PT academy · Zero admin
              </p>
            </div>

            <div className="bg-[#0D3559] rounded-2xl p-8 border border-[#F5C518]/20 shadow-2xl">
              <PartnershipForm />
            </div>

            <p className="text-center text-[#4A6280] text-sm mt-6">
              Prefer to talk first?{" "}
              <a
                href="https://calendly.com/ptlaunchlab-info/information-call"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#F5C518] hover:underline font-semibold"
              >
                Book a 15-min partnership call →
              </a>
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
