const steps = [
  {
    num: "01",
    icon: "📚",
    title: "Enrol",
    subtitle: "Meet your personal tutor from day one",
    body: "From day one, you're assigned a dedicated personal tutor — not a support inbox, not a chatbot. A real person who knows your name, tracks your progress, and is available whenever you're stuck. They'll walk you through the course structure and set a realistic study schedule around your current job and life.",
    bullets: [
      "Immediate access to all course materials on enrolment",
      "Personal tutor introduction within 24 hours",
      "Flexible study plan built around your actual life",
    ],
    highlight: false,
  },
  {
    num: "02",
    icon: "🏅",
    title: "Qualify",
    subtitle: "The qualification — plus the business training no one else includes",
    body: "You'll work through your NCFE Level 3 PT qualification online at a pace that fits your life. Alongside the accredited content, you complete PT Launch Lab's business modules — how to get your first clients, how to price yourself, and how to build a sustainable PT income from day one.",
    bullets: [
      "Full Level 3: anatomy, nutrition, programme design, client assessment",
      "Business modules: client acquisition, pricing, self-marketing",
      "Complete in 8 weeks (intensive) or up to 16 weeks — you choose",
    ],
    highlight: true,
  },
  {
    num: "03",
    icon: "🚀",
    title: "Launch",
    subtitle: "Qualify — and walk straight into guaranteed interviews",
    body: "When you complete your qualification, we don't hand you a certificate and wish you luck. We activate your guaranteed gym interviews — direct introductions to employers who are actively hiring CIMSPA-recognised PTs. You've done the work. We make sure the right people know about it.",
    bullets: [
      "Guaranteed gym interviews on completion — actual introductions, not job boards",
      "CV and interview preparation included",
      "Ongoing career support from the PT Launch Lab team",
    ],
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
          From sign-up to employed PT
          <br />
          <span className="text-[#F5C518]">in 8–16 weeks.</span>
        </h2>
        <p className="text-[#8CA3BF] text-center text-lg mb-10 md:mb-16 max-w-xl mx-auto">
          Here&apos;s exactly what the journey looks like — no ambiguity, no surprises.
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
                    The Difference
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
            Secure Your Place →
          </a>
        </div>
      </div>
    </section>
  );
}
