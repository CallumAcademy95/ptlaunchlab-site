const ClipboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
    <rect x="9" y="3" width="6" height="4" rx="1"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const GradCapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/>
  </svg>
);

const RocketIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m3.5 11.5 5 5M12 17l7-7M17 3l4 4-10 10-6-1-1-6L17 3z"/>
  </svg>
);

const steps = [
  {
    num: "01",
    Icon: ClipboardIcon,
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
    Icon: GradCapIcon,
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
    Icon: RocketIcon,
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
    <section className="bg-surface py-14 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-gold text-[11px] font-semibold tracking-widest uppercase text-center mb-4">
          How it works
        </p>
        <h2 className="font-display font-extrabold text-5xl md:text-7xl text-white text-center leading-none tracking-tight mb-3">
          From sign-up to employed PT
          <br />
          <span className="text-gold">in 8–16 weeks.</span>
        </h2>
        <p className="text-soft/65 text-center text-lg mb-10 md:mb-16 max-w-xl mx-auto">
          Here&apos;s exactly what the journey looks like — no ambiguity, no surprises.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-14">
          {steps.map((step) => (
            <div
              key={step.num}
              className={`rounded-2xl p-6 md:p-8 border transition-all relative ${
                step.highlight
                  ? "bg-card border-gold/50 shadow-2xl shadow-gold/[0.07]"
                  : "bg-card border-white/[0.07]"
              }`}
            >
              {step.highlight && (
                <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-gold to-transparent" />
              )}

              {/* Header */}
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  step.highlight
                    ? "bg-gold/15 border border-gold/35 text-gold"
                    : "bg-white/[0.05] border border-white/[0.08] text-soft/60"
                }`}>
                  <step.Icon />
                </div>
                <div>
                  <p className={`text-[10px] font-bold tracking-widest uppercase ${step.highlight ? "text-gold" : "text-blue"}`}>
                    Step {step.num}
                  </p>
                  <h3 className="font-display font-bold text-white text-2xl leading-none">{step.title}</h3>
                </div>
                {step.highlight && (
                  <span className="ml-auto text-[10px] bg-gold text-deep px-2.5 py-1 rounded-full font-bold uppercase tracking-wide shrink-0">
                    The Difference
                  </span>
                )}
              </div>

              <p className="text-white font-semibold text-sm mb-3">{step.subtitle}</p>
              <p className="text-soft/65 text-sm leading-relaxed mb-5">{step.body}</p>

              <ul className="space-y-2.5">
                {step.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-soft/65 text-sm">
                    <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-gold/15 flex items-center justify-center">
                      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 text-gold">
                        <path d="M2 6l3 3 5-5"/>
                      </svg>
                    </span>
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
            className="inline-block px-8 py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all shadow-xl shadow-gold/20"
          >
            Secure Your Place →
          </a>
        </div>
      </div>
    </section>
  );
}
