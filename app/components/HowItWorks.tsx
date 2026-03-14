const steps = [
  {
    num: "01",
    icon: "📚",
    title: "Learn",
    subtitle: "Learn the fundamentals",
    body: "Everything you need to coach real people — safely, confidently, and effectively. Anatomy, nutrition, exercise science, client consultations, and behaviour change. Study online at your own pace, around your current job.",
    bullets: ["Anatomy, nutrition & exercise science", "Client consultations & goal setting", "Behaviour change & motivation strategies"],
    highlight: false,
  },
  {
    num: "02",
    icon: "🏅",
    title: "Qualify",
    subtitle: "Get qualified",
    body: "You'll earn an NCFE Level 3 qualification that every UK gym recognises. The same one we used to launch our own careers. Ofqual regulated, with continuous tutor support throughout.",
    bullets: ["NCFE & Ofqual-regulated certification", "Online and practical assessments", "Continuous tutor feedback & support"],
    highlight: true,
  },
  {
    num: "03",
    icon: "🚀",
    title: "Launch",
    subtitle: "Launch your business",
    body: "Other courses stop once you pass. We stay until you've built something real. Find and convert your first clients, build your brand, and use proven systems to reach £5K per month.",
    bullets: ["Find & convert your first clients", "Build your online & in-person PT brand", "Proven systems to reach £5K/month"],
    highlight: false,
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-[#072B4A] py-14 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">
          How it works
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-3">
          Three steps to a career
          <br />
          <span className="text-[#F5C518]">you actually want.</span>
        </h2>
        <p className="text-[#8CA3BF] text-center text-lg mb-10 md:mb-16 max-w-xl mx-auto">
          We don&apos;t just get you qualified. We get you hired, earning, and building.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-14">
          {steps.map((step) => (
            <div
              key={step.num}
              className={`rounded-2xl p-6 md:p-8 border transition-all ${
                step.highlight
                  ? "bg-[#0D3559] border-[#F5C518]/60 shadow-xl shadow-[#F5C518]/10"
                  : "bg-[#0D3559] border-[#3B82F6]/25"
              }`}
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                  step.highlight ? "bg-[#F5C518]/15 border border-[#F5C518]/40" : "bg-[#072B4A] border border-[#3B82F6]/25"
                }`}>
                  {step.icon}
                </div>
                <div>
                  <p className={`text-xs font-bold tracking-widest uppercase ${step.highlight ? "text-[#F5C518]" : "text-[#3B82F6]"}`}>
                    Step {step.num}
                  </p>
                  <h3 className="text-white font-bold text-2xl leading-none">{step.title}</h3>
                </div>
                {step.highlight && (
                  <span className="ml-auto text-[10px] bg-[#F5C518] text-[#072B4A] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide shrink-0">
                    Key Step
                  </span>
                )}
              </div>

              <p className="text-white font-semibold text-sm mb-3">{step.subtitle}</p>
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
          <a
            href="/enrol"
            className="inline-block px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20"
          >
            Start Today →
          </a>
        </div>
      </div>
    </section>
  );
}
