import Image from "next/image";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import FounderTabs from "../components/FounderTabs";

export const metadata = {
  title: "About PT Launch Lab — PT Academy Founded by Gym Owners",
  description: "PT Launch Lab is a gym-owner run PT academy based in Pontefract, Yorkshire. We don't just run courses — we run gyms, we hire trainers, and we know what works.",
  alternates: {
    canonical: "https://ptlaunchlab.co.uk/about",
  },
};

const values = [
  {
    icon: "🎯",
    title: "Mentorship as standard",
    body: "Every student gets real mentorship — not a helpdesk. Direct access to Callum, Miles and Ryan from day one through to your first paying clients.",
  },
  {
    icon: "🏋️",
    title: "Built by gym owners",
    body: "We don't just teach theory. We run gyms, we hire trainers, and we built this course from what we've actually seen work — and what we've seen fail.",
  },
  {
    icon: "💼",
    title: "Business first",
    body: "Getting qualified is step one. Building a career that pays you is the point. That's why business training isn't an add-on — it's in the core.",
  },
  {
    icon: "🤝",
    title: "Nobody left behind",
    body: "The biggest reason PTs fail in their first six months is isolation. We stay with you through qualification and into your career. That's the commitment.",
  },
  {
    icon: "📍",
    title: "Yorkshire roots",
    body: "Founded in Pontefract. Direct, honest, no-nonsense. We say what we mean and we mean what we say — and we think that's exactly what this industry needs more of.",
  },
  {
    icon: "🔁",
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


export default function AboutPage() {
  return (
    <>
      <Nav />
      <main className="pt-[72px]">

        {/* HERO */}
        <section className="bg-[#072B4A] py-24 px-6 relative overflow-hidden">
          <div className="absolute -left-48 top-0 w-[500px] h-[500px] rounded-full bg-[#F5C518] opacity-[0.05] blur-3xl pointer-events-none" />
          <div className="absolute -right-32 top-20 w-[400px] h-[400px] rounded-full bg-[#3B82F6] opacity-[0.06] blur-3xl pointer-events-none" />
          <div className="relative max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-4">Who we are</p>
              <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
                We don&apos;t just run<br />PT courses.
              </h1>
              <p className="text-xl text-[#F5C518] font-semibold mb-6">
                We run gyms. We hire trainers. We know what works.
              </p>
              <p className="text-lg text-[#8CA3BF] leading-relaxed mb-8">
                PT Launch Lab was built by Callum, Miles and Ryan — three personal trainers who scaled a fitness business to over £500K in revenue, hired hundreds of PTs, and then built the academy they wished had existed when they were starting out.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="/courses"
                  className="px-7 py-3.5 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-sm hover:brightness-110 transition-all">
                  View the Course →
                </a>
                <a href="/book-call"
                  className="px-7 py-3.5 rounded-full border border-[#F5C518] text-[#F5C518] font-semibold text-sm hover:bg-[#F5C518] hover:text-[#072B4A] transition-all">
                  Book a Free Call
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-[#0D3559] border border-[#3B82F6]/25 rounded-2xl p-6">
                  <p className="text-[#F5C518] text-4xl font-bold mb-2">{stat.value}</p>
                  <p className="text-[#8CA3BF] text-sm leading-relaxed">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MISSION */}
        <section className="bg-[#0D3559] py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-1 bg-[#F5C518] rounded mx-auto mb-10" />
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
              Everyone deserves mentorship<br />
              <span className="text-[#F5C518]">as standard.</span>
            </h2>
            <p className="text-xl text-[#8CA3BF] leading-relaxed mb-6">
              The biggest reason PTs fail in their first six months isn&apos;t lack of knowledge — it&apos;s lack of direction. They qualify, step out alone, and have no idea how to get clients, what to charge, or how to build something that actually pays them.
            </p>
            <p className="text-xl text-[#8CA3BF] leading-relaxed">
              We built PT Launch Lab to fix that. Not just a qualification — a complete pathway from career change to career built.
            </p>
          </div>
        </section>

        {/* THE STORY */}
        <section id="our-story" className="bg-[#072B4A] py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">Our story</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-16">
              Built from experience.<br /><span className="text-[#F5C518]">Not a textbook.</span>
            </h2>
            <FounderTabs />
          </div>
        </section>

        {/* VALUES */}
        <section className="bg-[#0D3559] py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">What drives us</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-16">
              How we operate.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {values.map((v) => (
                <div key={v.title} className="bg-[#072B4A] border border-[#3B82F6]/25 rounded-2xl p-7 hover:border-[#F5C518]/40 transition-all">
                  <span className="text-3xl mb-4 block">{v.icon}</span>
                  <h3 className="text-white font-bold text-lg mb-3">{v.title}</h3>
                  <p className="text-[#8CA3BF] text-sm leading-relaxed">{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PODCAST */}
        <section className="bg-[#072B4A] py-24 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-4">The podcast</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Real stories. Real<br /><span className="text-[#F5C518]">Yorkshire honesty.</span>
              </h2>
              <p className="text-[#8CA3BF] text-lg leading-relaxed mb-6">
                The PT Launch Lab Podcast covers what nobody else talks about — how PTs actually build careers, make money, and navigate the reality of working in fitness.
              </p>
              <ul className="space-y-3 mb-8">
                {["Real transformation stories from working PTs", "Step-by-step business building from scratch", "How to go from qualification to full-time income", "Honest takes on the fitness industry"].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[#8CA3BF]">
                    <span className="text-[#F5C518] font-bold shrink-0">→</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a href="https://www.youtube.com/@ptlaunchlab" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#F5C518] text-[#F5C518] font-semibold text-sm hover:bg-[#F5C518] hover:text-[#072B4A] transition-all">
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
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#F5C518] text-[#072B4A] font-bold text-sm hover:brightness-110 transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  YouTube
                </a>
                <a href="https://www.instagram.com/ptlaunchlab" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-[#2A4A6C] text-[#8CA3BF] font-bold text-sm hover:border-[#F5C518]/40 hover:text-white transition-all">
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
        <section className="bg-[#0D3559] py-24 px-6 text-center border-t border-[#3B82F6]/15">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Want to know if this is<br /><span className="text-[#F5C518]">right for you?</span>
            </h2>
            <p className="text-[#8CA3BF] text-lg mb-10">
              Book a free 15-minute call with Callum, Miles or Ryan. No pressure, no script — just an honest conversation about your situation and what the right next step looks like.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/book-call"
                className="px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20">
                Book a Free Call →
              </a>
              <a href="/courses"
                className="px-8 py-4 rounded-full border border-[#F5C518] text-[#F5C518] font-semibold hover:bg-[#F5C518] hover:text-[#072B4A] transition-all">
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
