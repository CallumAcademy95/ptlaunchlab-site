export default function ConversionSection() {
  return (
    <section id="book-call" className="bg-[#0A0E1A] py-28 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[700px] h-[400px] rounded-full bg-[#F5C518] opacity-[0.05] blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Ready to start your new career?
        </h2>
        <p className="text-[#9CA3AF] text-lg max-w-xl mx-auto mb-16">
          You&apos;ve got two options. Both lead to the same place — a career you actually want.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left — Start Today */}
          <div className="bg-[#141B2D] border-2 border-[#F5C518]/80 rounded-2xl p-8 text-left flex flex-col shadow-xl shadow-[#F5C518]/10">
            <div className="inline-block mb-6">
              <span className="bg-[#F5C518] text-[#0A0E1A] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                Most Popular
              </span>
            </div>
            <h3 className="text-white text-2xl font-bold mb-4">I&apos;m ready. Let&apos;s go.</h3>
            <p className="text-[#9CA3AF] text-[15px] leading-relaxed mb-7">
              Enrol today and get immediate access to the full course — your login, your tutor,
              and everything you need to start your journey to becoming a qualified PT.
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "Immediate access on enrolment",
                "Start your first module today",
                "Your personal tutor assigned from day one",
                "Study at your own pace",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-[#F5C518] text-sm font-medium">
                  <span className="text-[#F5C518] font-bold">✓</span>
                  <span className="text-white">{item}</span>
                </li>
              ))}
            </ul>
            <a
              href="https://signup-lauchlab.co.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-4 rounded-full bg-[#F5C518] text-[#0A0E1A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20 mb-3"
            >
              Enrol Now — Start Today →
            </a>
            <p className="text-[#6B7280] text-xs text-center">Immediate access. Start within minutes.</p>
          </div>

          {/* Right — Book a Call */}
          <div className="bg-[#141B2D] border-2 border-[#3B82F6]/70 rounded-2xl p-8 text-left flex flex-col shadow-xl shadow-[#3B82F6]/10">
            <div className="inline-block mb-6">
              <span className="bg-[#3B82F6] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                No hard sell
              </span>
            </div>
            <h3 className="text-white text-2xl font-bold mb-4">I have a few questions first.</h3>
            <p className="text-[#9CA3AF] text-[15px] leading-relaxed mb-7">
              Book a free 15-minute call with our team. We&apos;ll answer every question honestly —
              and if the course isn&apos;t right for you, we&apos;ll tell you that too.
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                "15 minutes, completely free",
                "Honest answers, no pressure",
                "Talk to a real person",
                "We'll tell you if it's not right for you",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium">
                  <span className="text-[#3B82F6] font-bold">✓</span>
                  <span className="text-white">{item}</span>
                </li>
              ))}
            </ul>
            <a
              href="#book-call"
              className="block w-full text-center py-4 rounded-full border-2 border-[#F5C518] text-[#F5C518] font-bold text-base hover:bg-[#F5C518] hover:text-[#0A0E1A] transition-all mb-3"
            >
              Book a Free Call →
            </a>
            <p className="text-[#6B7280] text-xs text-center">Usually available within 24 hours</p>
          </div>
        </div>
      </div>
    </section>
  );
}
