import Nav from "../components/Nav";
import Footer from "../components/Footer";

export const metadata = {
  title: "About | PT Launch Lab",
  description: "PT Launch Lab is a gym-owner run PT academy based in Pontefract, Yorkshire. We don't just run courses — we run gyms, we hire trainers, and we know what works.",
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

const timeline = [
  { year: "The Beginning", label: "Callum, Miles and Ryan start coaching as independent PTs — no gym brand, no safety net. Built from scratch." },
  { year: "Ultimate Shred", label: "Scaled to over £500K in revenue as independent personal trainers. Hired, managed and developed PTs along the way." },
  { year: "PT Launch Lab", label: "Built the academy we wished had existed when we started — qualification, mentorship, gym connections, and a real business launchpad." },
  { year: "Today", label: "500+ PTs hired, 5 gym partnerships, and a growing community of trainers building careers on their own terms." },
];

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main className="pt-[72px]">

        {/* HERO */}
        <section className="bg-[#091524] py-24 px-6 relative overflow-hidden">
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
                  className="px-7 py-3.5 rounded-full bg-[#F5C518] text-[#091524] font-bold text-sm hover:brightness-110 transition-all">
                  View the Course →
                </a>
                <a href="/book-call"
                  className="px-7 py-3.5 rounded-full border border-[#F5C518] text-[#F5C518] font-semibold text-sm hover:bg-[#F5C518] hover:text-[#091524] transition-all">
                  Book a Free Call
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-[#112035] border border-[#3B82F6]/25 rounded-2xl p-6">
                  <p className="text-[#F5C518] text-4xl font-bold mb-2">{stat.value}</p>
                  <p className="text-[#8CA3BF] text-sm leading-relaxed">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MISSION */}
        <section className="bg-[#112035] py-24 px-6">
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
        <section className="bg-[#091524] py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">Our story</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-16">
              Built from experience.<br /><span className="text-[#F5C518]">Not a textbook.</span>
            </h2>
            <div className="space-y-6 max-w-3xl mx-auto">
              {timeline.map((item, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="shrink-0 w-2 h-2 rounded-full bg-[#F5C518] mt-3" />
                  <div className="bg-[#112035] border border-[#3B82F6]/25 rounded-2xl p-6 flex-1">
                    <p className="text-[#F5C518] text-xs font-bold tracking-widest uppercase mb-2">{item.year}</p>
                    <p className="text-[#8CA3BF] leading-relaxed">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VALUES */}
        <section className="bg-[#112035] py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">What drives us</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-16">
              How we operate.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {values.map((v) => (
                <div key={v.title} className="bg-[#091524] border border-[#3B82F6]/25 rounded-2xl p-7 hover:border-[#F5C518]/40 transition-all">
                  <span className="text-3xl mb-4 block">{v.icon}</span>
                  <h3 className="text-white font-bold text-lg mb-3">{v.title}</h3>
                  <p className="text-[#8CA3BF] text-sm leading-relaxed">{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PODCAST */}
        <section className="bg-[#091524] py-24 px-6">
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
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#F5C518] text-[#F5C518] font-semibold text-sm hover:bg-[#F5C518] hover:text-[#091524] transition-all">
                Watch on YouTube →
              </a>
            </div>
            <div className="bg-[#112035] border border-[#3B82F6]/25 rounded-2xl p-8 text-center">
              <p className="text-6xl mb-6">🎙️</p>
              <h3 className="text-white font-bold text-xl mb-3">PT Launch Lab Podcast</h3>
              <p className="text-[#8CA3BF] text-sm leading-relaxed mb-6">Available on YouTube, Spotify, and Apple Podcasts. New episodes dropping regularly.</p>
              <div className="flex flex-col gap-3">
                <a href="https://www.youtube.com/@ptlaunchlab" target="_blank" rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-full bg-[#F5C518] text-[#091524] font-bold text-sm hover:brightness-110 transition-all">YouTube</a>
                <a href="https://www.instagram.com/pt_launch_lab" target="_blank" rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-full border border-[#3B82F6]/40 text-[#8CA3BF] font-medium text-sm hover:border-[#F5C518] hover:text-[#F5C518] transition-all">Instagram</a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#112035] py-24 px-6 text-center border-t border-[#3B82F6]/15">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Want to know if this is<br /><span className="text-[#F5C518]">right for you?</span>
            </h2>
            <p className="text-[#8CA3BF] text-lg mb-10">
              Book a free 15-minute call with Callum, Miles or Ryan. No pressure, no script — just an honest conversation about your situation and what the right next step looks like.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/book-call"
                className="px-8 py-4 rounded-full bg-[#F5C518] text-[#091524] font-bold hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20">
                Book a Free Call →
              </a>
              <a href="/courses"
                className="px-8 py-4 rounded-full border border-[#F5C518] text-[#F5C518] font-semibold hover:bg-[#F5C518] hover:text-[#091524] transition-all">
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
