import HeroSlideshow from "./HeroSlideshow";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-[#0E5FA0] via-[#0A4A80] to-[#072B4A] overflow-hidden pt-[72px]">
      {/* Decorative blobs */}
      <div className="absolute -left-48 top-20 w-[600px] h-[600px] rounded-full bg-[#F5C518] opacity-[0.08] blur-3xl pointer-events-none" />
      <div className="absolute -right-32 top-40 w-[500px] h-[500px] rounded-full bg-[#60A5FA] opacity-[0.12] blur-3xl pointer-events-none" />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[700px] h-[300px] rounded-full bg-[#072B4A] opacity-[0.5] blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left — text */}
          <div>
            {/* Pill label */}
            <div className="inline-flex flex-wrap items-center gap-2 px-4 py-2 rounded-full border border-[#F5C518]/40 bg-white/10 backdrop-blur-sm mb-6 md:mb-8">
              <span className="text-[#F5C518] text-[10px] sm:text-xs font-semibold tracking-widest uppercase leading-relaxed">
                NCFE Level 3 · Ofqual Regulated · CIMSPA Recognised · Qualify in 8–16 Weeks
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] mb-6 animate-fade-in-up">
              You&apos;re good enough
              <br />
              to be a PT.
              <br />
              <span className="text-[#F5C518]">Here&apos;s how to make it pay.</span>
            </h1>

            {/* Positioning line */}
            <p className="text-lg md:text-xl text-white font-semibold leading-snug mb-4 animate-fade-in-up animate-delay-100">
              The UK&apos;s only PT course built by gym owners who&apos;ve hired over 500 personal trainers — so you learn what actually gets you employed, not just qualified.
            </p>

            {/* Sub */}
            <p className="text-base text-blue-100/80 leading-relaxed mb-8 animate-fade-in-up animate-delay-100">
              An 8–16 week online Level 3 qualification with business training and guaranteed gym interviews built in. Because a certificate on its own doesn&apos;t pay your rent.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8 md:mb-10 animate-fade-in-up animate-delay-200">
              <a
                href="/enrol"
                className="px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/30 text-center"
              >
                Secure Your Place →
              </a>
              <a
                href="/book-call"
                className="px-8 py-4 rounded-full border-2 border-white/60 text-white font-semibold text-base hover:bg-white/10 transition-all text-center"
              >
                Book a Free Call First
              </a>
            </div>

            {/* Trust bar */}
            <div className="flex flex-wrap gap-3 md:gap-5 text-blue-200/70 text-xs animate-fade-in-up animate-delay-300">
              <span>✓ NCFE &amp; Ofqual Regulated</span>
              <span className="hidden sm:inline opacity-40">·</span>
              <span>✓ Guaranteed Gym Interviews</span>
              <span className="hidden sm:inline opacity-40">·</span>
              <span>✓ 500+ PTs Hired by Our Team</span>
              <span className="hidden sm:inline opacity-40">·</span>
              <span>✓ Personal Tutor From Day One</span>
              <span className="hidden sm:inline opacity-40">·</span>
              <span>✓ Study Around Your Current Job</span>
            </div>
          </div>

          {/* Mobile stats strip — visible only on mobile */}
          <div className="lg:hidden grid grid-cols-3 gap-3 mt-2">
            {[
              { value: "500+", label: "PTs Hired" },
              { value: "5.0★", label: "Google Rating" },
              { value: "NCFE", label: "Ofqual Regulated" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 border border-white/20 rounded-xl p-3 text-center">
                <p className="text-[#F5C518] font-bold text-base leading-none mb-1">{s.value}</p>
                <p className="text-blue-100/70 text-[10px] font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Right — slideshow */}
          <HeroSlideshow />

        </div>
      </div>
    </section>
  );
}
