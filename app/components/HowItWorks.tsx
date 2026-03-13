const steps = [
  {
    num: "01",
    title: "Qualification",
    body: "Complete your NCFE Level 2 & 3 Personal Training qualification — fast-track, Ofqual regulated, and recognised across the entire UK fitness industry. Done around your job.",
    highlight: false,
  },
  {
    num: "02",
    title: "Mentorship",
    body: "Direct access to Callum, Miles and Ryan throughout your entire journey. Not a chatbot. Not a helpdesk. The people who've actually built successful PT businesses.",
    highlight: false,
  },
  {
    num: "03",
    title: "Gym Placement",
    body: "Once you qualify, we guarantee interviews with our partner gyms. We've hired 500+ PTs ourselves — we know exactly what gyms look for and we prepare you for it.",
    highlight: true,
  },
  {
    num: "04",
    title: "Income Building",
    body: "Learn how to price your services, get your first clients, set up your business, and actually make money — from the people who've done it at scale.",
    highlight: false,
  },
  {
    num: "05",
    title: "Online Coaching",
    body: "Expand beyond the gym floor. Build an online income stream that runs alongside your in-person work — and scales without a ceiling.",
    highlight: false,
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-[#072B4A] py-24">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">
          A system, not just a course
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-3">
          The PT Launch Method™
        </h2>
        <p className="text-[#8CA3BF] text-center text-lg mb-16 max-w-xl mx-auto">
          We don&apos;t just get you qualified. We get you hired, earning, and building.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-14">
          {steps.map((step) => (
            <div
              key={step.num}
              className={`rounded-2xl p-7 border transition-all ${
                step.highlight
                  ? "bg-[#0D3559] border-[#F5C518]/70 shadow-lg shadow-[#F5C518]/10"
                  : "bg-[#0D3559] border-[#3B82F6]/25"
              }`}
            >
              <p className={`text-3xl font-bold mb-5 ${step.highlight ? "text-[#F5C518]" : "text-[#3B82F6]"}`}>
                {step.num}
              </p>
              <h3 className="text-white font-bold text-lg mb-3">
                {step.title}
                {step.highlight && (
                  <span className="ml-2 text-xs bg-[#F5C518] text-[#072B4A] px-2 py-0.5 rounded-full font-bold">
                    ⭐ Key
                  </span>
                )}
              </h3>
              <p className="text-[#8CA3BF] text-sm leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="https://signup-lauchlab.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20"
          >
            Start Today →
          </a>
        </div>
      </div>
    </section>
  );
}
