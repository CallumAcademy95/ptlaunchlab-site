import type { Metadata } from "next";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";
import PartnershipForm from "./PartnershipForm";

export const metadata: Metadata = {
  title: "Gym Partnership Programme | PT Launch Lab — A New Annual Revenue Stream",
  description:
    "Turn your gym into its own white-label PT academy. £500 per learner upfront plus annual PT rental and membership income — a recurring revenue stream that compounds year-on-year, with zero admin.",
  alternates: {
    canonical: "https://ptlaunchlab.co.uk/gym-partnership",
  },
  openGraph: {
    title: "Gym Partnership Programme | PT Launch Lab",
    description:
      "Add a new annual revenue stream to your gym. £500 per learner upfront plus PT rental and retention income. We handle education, compliance & mentorship — you keep the revenue.",
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

function CheckIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" className={`${className} text-gold shrink-0 mt-0.5`}>
      <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" className={`${className} text-red-400 shrink-0 mt-0.5`}>
      <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function GymOwnerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-6 h-6 text-gold">
      <path d="M6 12h12M4 8v8M20 8v8M2 9v6M22 9v6" />
    </svg>
  );
}

function AwardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gold">
      <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

function NetworkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gold">
      <circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
      <path d="M12 7v4m0 0-5.5 6M12 11l5.5 6" />
    </svg>
  );
}

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
        <section className="relative flex flex-col bg-base overflow-hidden">
          <div className="absolute -left-64 top-0 w-[700px] h-[700px] rounded-full bg-gold opacity-[0.05] blur-3xl pointer-events-none" />
          <div className="absolute -right-32 bottom-0 w-[500px] h-[500px] rounded-full bg-blue opacity-[0.06] blur-3xl pointer-events-none" />
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <line x1="0" y1="0" x2="45%" y2="100%" stroke="#F5C518" strokeWidth="1" />
            <line x1="15%" y1="0" x2="60%" y2="100%" stroke="#F5C518" strokeWidth="0.5" />
          </svg>

          <div className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-14 md:pt-24 md:pb-20 w-full">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/30 bg-surface mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                <span className="text-gold text-xs font-semibold tracking-widest uppercase">Gym Partnership Programme</span>
              </div>

              <h1 className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl text-white leading-none tracking-tight mb-6">
                Add a New Annual<br />
                <span className="text-gold">Revenue Stream</span><br />
                <span className="text-white">to Your Gym.</span>
              </h1>

              <p className="text-xl text-soft/70 leading-relaxed mb-10 max-w-xl">
                We build, run, and manage a fully white-label PT academy inside your gym.
                <strong className="text-white"> £500 per learner upfront</strong>, plus PT rental and membership income that builds year on year.
                Zero teaching. Zero admin. Zero cost to you.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#apply" className="px-8 py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-gold/30 text-center">
                  Apply to Secure Your Area →
                </a>
                <a href="#how-it-works" className="px-8 py-4 rounded-full border border-white/20 text-white font-medium text-base hover:bg-white/10 transition-all text-center">
                  See How It Works
                </a>
                <a
                  href="/gym-partner-prospectus.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 rounded-full border border-gold/40 text-gold font-medium text-base hover:bg-gold/10 transition-all text-center flex items-center justify-center gap-2"
                >
                  ↓ Download Prospectus
                </a>
              </div>
            </div>
          </div>

          {/* Stat strip */}
          <div className="relative z-10 bg-deep/80 backdrop-blur-sm border-t border-white/[0.06]">
            <div className="max-w-5xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: "£500", label: "Per learner" },
                { value: "0", label: "Admin for you" },
                { value: "1", label: "Partner per area" },
                { value: "100%", label: "White-label branded" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-display font-extrabold text-gold text-2xl leading-none">{s.value}</p>
                  <p className="text-soft/50 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROBLEM / SOLUTION ────────────────────── */}
        <section className="bg-surface py-20 md:py-28">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Problem */}
              <div className="bg-card rounded-2xl p-8 border border-white/[0.07]">
                <p className="text-faint text-xs font-bold tracking-widest uppercase mb-6">The Problem</p>
                <h2 className="font-display font-extrabold text-2xl text-white leading-tight tracking-tight mb-6">
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
                      <CrossIcon />
                      <span className="text-soft/60">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Solution */}
              <div className="bg-card rounded-2xl p-8 border border-gold/25">
                <p className="text-gold text-xs font-bold tracking-widest uppercase mb-6">The Solution</p>
                <h2 className="font-display font-extrabold text-2xl text-white leading-tight tracking-tight mb-6">
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
                      <CheckIcon />
                      <span className="text-white">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── REVENUE ───────────────────────────────── */}
        <section className="bg-base py-20 md:py-28">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-faint text-xs font-bold tracking-widest uppercase mb-3">Revenue</p>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight">Two ways you earn</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl p-10 border-2 border-gold/40 shadow-xl shadow-gold/5">
                <p className="text-gold text-xs font-bold tracking-widest uppercase mb-4">Front End</p>
                <p className="font-display font-extrabold text-gold text-7xl leading-none mb-2">£500</p>
                <p className="text-white font-semibold text-lg mb-6">per learner who enrols through your gym</p>
                <ul className="space-y-2 text-sm">
                  {["Paid directly to your gym", "No teaching required", "No extra work required"].map((i) => (
                    <li key={i} className="flex items-center gap-2 text-soft/60">
                      <CheckIcon />{i}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-card rounded-2xl p-10 border-2 border-blue/30 shadow-xl shadow-blue/5">
                <p className="text-blue text-xs font-bold tracking-widest uppercase mb-4">Back End</p>
                <p className="font-display font-extrabold text-white text-3xl leading-snug mb-2">They qualify.<br />They stay.</p>
                <p className="text-soft/60 text-sm mb-6">Every learner becomes a qualified PT who already knows your gym — and needs somewhere to work.</p>
                <ul className="space-y-2 text-sm">
                  {["PT floor rent", "PT membership fees", "Long-term trainer retention", "More coaching revenue in-club"].map((i) => (
                    <li key={i} className="flex items-center gap-2 text-soft/60">
                      <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 text-blue shrink-0 mt-0.5">
                        <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────── */}
        <section id="how-it-works" className="bg-surface py-20 md:py-28">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-faint text-xs font-bold tracking-widest uppercase mb-3">The Process</p>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-3">How it works</h2>
              <p className="text-soft/60">Simple. Scalable. No extra staff.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {STEPS.map((s) => (
                <div key={s.n} className="bg-card rounded-2xl p-6 border border-white/[0.07] relative">
                  <p className="text-gold/10 text-6xl font-black leading-none absolute top-4 right-5 select-none">{s.n}</p>
                  <p className="text-gold text-xs font-bold tracking-widest uppercase mb-3">{s.n}</p>
                  <p className="text-white font-bold text-base mb-2">{s.title}</p>
                  <p className="text-soft/60 text-sm leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHAT YOU GET ──────────────────────────── */}
        <section className="bg-base py-20 md:py-28">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-faint text-xs font-bold tracking-widest uppercase mb-3">What&apos;s Included</p>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-3">Everything done for you</h2>
              <p className="text-soft/60 max-w-lg mx-auto">Your academy is fully branded, fully managed, and fully compliant — we handle it all.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* White label */}
              <div className="bg-card rounded-2xl p-8 border border-gold/20">
                <p className="text-gold text-xs font-bold tracking-widest uppercase mb-5">Your Brand</p>
                <h3 className="text-white text-xl font-bold mb-2">Your academy, your name</h3>
                <p className="text-soft/60 text-sm mb-6">To your members it looks exactly like <span className="text-white font-semibold">&ldquo;[Your Gym] PT Academy&rdquo;</span> — not ours.</p>
                <ul className="space-y-2">
                  {["Your logo and branding", "Your custom link & QR code", "Your academy landing page", "Your messaging to members"].map((i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckIcon /><span className="text-white">{i}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Zero admin */}
              <div className="bg-card rounded-2xl p-8 border border-blue/20">
                <p className="text-blue text-xs font-bold tracking-widest uppercase mb-5">We Handle Everything</p>
                <h3 className="text-white text-xl font-bold mb-2">You do none of this</h3>
                <p className="text-soft/60 text-sm mb-6">Your only role is gym partner. Everything else is on us.</p>
                <div className="grid grid-cols-2 gap-2">
                  {["Teaching", "Compliance", "Tutors", "Assessments", "Paperwork", "Certification", "Student support", "Course material"].map((i) => (
                    <div key={i} className="flex items-center gap-2 bg-deep/50 rounded-lg px-3 py-2 text-xs">
                      <CrossIcon />
                      <span className="text-soft/60">{i}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Why us bar */}
            <div className="bg-card rounded-2xl p-8 border border-white/[0.07]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                {[
                  { icon: <GymOwnerIcon />, title: "Built by gym owners", body: "We've hired 500+ PTs. We know what gyms actually need." },
                  { icon: <AwardIcon />, title: "NCFE & Ofqual regulated", body: "Industry-recognised Level 2 & 3 qualifications. Fully compliant." },
                  { icon: <NetworkIcon />, title: "Not courses. Recruitment.", body: "We solve your pipeline problem — not just sell qualifications." },
                ].map((c) => (
                  <div key={c.title}>
                    <div className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-3">
                      {c.icon}
                    </div>
                    <p className="text-white font-bold text-sm mb-1">{c.title}</p>
                    <p className="text-soft/60 text-xs leading-relaxed">{c.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── WHO IT'S FOR ──────────────────────────── */}
        <section className="bg-surface py-20 md:py-28">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-faint text-xs font-bold tracking-widest uppercase mb-3">Ideal Fit</p>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight">Is this for you?</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl p-8 border border-gold/25">
                <div className="flex items-center gap-2 mb-5">
                  <CheckIcon className="w-4 h-4" />
                  <p className="text-gold font-bold text-base">Great fit if you…</p>
                </div>
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
                      <CheckIcon />
                      <span className="text-white">{i}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-card rounded-2xl p-8 border border-white/[0.07] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <CrossIcon />
                    <p className="text-soft/60 font-bold text-base">Not a fit if you…</p>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "Run a small studio with no PT floor space",
                      "Don't rent space to self-employed PTs",
                    ].map((i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <CrossIcon />
                        <span className="text-soft/60">{i}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-10 pt-6 border-t border-white/[0.06]">
                  <p className="text-white font-semibold text-sm">
                    We take <span className="text-gold font-bold">one partner gym per area</span> to protect exclusivity.{" "}
                    <span className="text-soft/60">Areas close as applications come in.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PIPELINE CLOSE ────────────────────────── */}
        <section className="bg-deep py-14 border-y border-white/[0.06]">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <p className="font-display font-extrabold text-3xl md:text-4xl text-white leading-tight tracking-tight mb-4">
              Most gyms don&apos;t have a recruitment problem.
              <br />
              They have a <span className="text-gold">pipeline problem.</span>
            </p>
            <p className="text-soft/60 text-lg">Fix the pipeline once. Never recruit again.</p>
          </div>
        </section>

        {/* ── PROSPECTUS DOWNLOAD ───────────────────── */}
        <section className="bg-deep py-10 border-b border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-white font-bold text-lg">Want to read through it first?</p>
              <p className="text-soft/60 text-sm">Download the full partnership prospectus — everything you need to know in one document.</p>
            </div>
            <a
              href="/gym-partner-prospectus.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-8 py-4 rounded-full bg-white/[0.07] border border-white/[0.12] text-white font-semibold text-sm hover:bg-white/[0.12] transition-all flex items-center gap-2"
            >
              ↓ Download Prospectus PDF
            </a>
          </div>
        </section>

        {/* ── APPLICATION FORM ──────────────────────── */}
        <section id="apply" className="bg-base py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[600px] rounded-full bg-gold opacity-[0.04] blur-3xl" />
          </div>

          <div className="relative z-10 max-w-xl mx-auto px-6">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-400/25 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-red-400 text-xs font-bold tracking-wide uppercase">One partner per area</span>
              </div>
              <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white leading-none tracking-tight mb-3">
                Apply to Become a Partner Gym
              </h2>
              <p className="text-soft/60 text-sm">
                Earn £500 per learner · Your own PT academy · Zero admin
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 border border-gold/20 shadow-2xl">
              <PartnershipForm />
            </div>

            <p className="text-center text-faint text-sm mt-6">
              Prefer to talk first?{" "}
              <a
                href="https://calendly.com/ptlaunchlab-info/information-call"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline font-semibold"
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
