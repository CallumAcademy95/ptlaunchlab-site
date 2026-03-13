const steps = [
  {
    num: "01",
    title: "Learn",
    body: "Master anatomy, nutrition, exercise science, and programming. Everything you need to coach confidently and pass your qualification.",
    highlight: false,
  },
  {
    num: "02",
    title: "Qualify",
    body: "Complete your NCFE Level 2 & 3 Personal Training qualification, fast-track, regulated by Ofqual and recognised across the entire UK fitness industry.",
    highlight: false,
  },
  {
    num: "03",
    title: "Launch",
    body: "This is where most courses stop. We're just getting started. Guaranteed gym interviews, mentorship, client acquisition, pricing, social media, systems — we help you build a career, not just earn a certificate.",
    highlight: true,
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-[#0A0E1A] py-24">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase text-center mb-4">
          Simple. Structured. Proven.
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-16">
          Here&apos;s how it works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {steps.map((step) => (
            <div
              key={step.num}
              className={`rounded-2xl p-8 border transition-all ${
                step.highlight
                  ? "bg-[#141B2D] border-[#F5C518]/70 shadow-lg shadow-[#F5C518]/10"
                  : "bg-[#141B2D] border-[#3B82F6]/25"
              }`}
            >
              <p
                className={`text-4xl font-bold mb-6 ${
                  step.highlight ? "text-[#F5C518]" : "text-[#3B82F6]"
                }`}
              >
                {step.num}
              </p>
              <h3 className="text-white font-bold text-xl mb-3">
                {step.title}
                {step.highlight && (
                  <span className="ml-2 text-sm bg-[#F5C518] text-[#0A0E1A] px-2 py-0.5 rounded-full font-bold">
                    ⭐ Key
                  </span>
                )}
              </h3>
              <p className="text-[#9CA3AF] text-[15px] leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="https://signup-lauchlab.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 rounded-full bg-[#F5C518] text-[#0A0E1A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20"
          >
            Start Today →
          </a>
        </div>
      </div>
    </section>
  );
}
