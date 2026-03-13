export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-[#0E5FA0] via-[#0A4A80] to-[#072B4A] overflow-hidden pt-[72px]">
      {/* Decorative blobs */}
      <div className="absolute -left-48 top-20 w-[600px] h-[600px] rounded-full bg-[#F5C518] opacity-[0.08] blur-3xl pointer-events-none" />
      <div className="absolute -right-32 top-40 w-[500px] h-[500px] rounded-full bg-[#60A5FA] opacity-[0.12] blur-3xl pointer-events-none" />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[700px] h-[300px] rounded-full bg-[#072B4A] opacity-[0.5] blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left — text */}
          <div>
            {/* Pill label */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#F5C518]/40 bg-white/10 backdrop-blur-sm mb-8">
              <span className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase">
                Level 2 &amp; 3 PT · Fast Track · NCFE · Ofqual · CIMSPA
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] mb-6 animate-fade-in-up">
              Become a Qualified
              <br />
              Personal Trainer.
              <br />
              <span className="text-[#F5C518]">Build a Business That</span>
              <br />
              Actually Pays You.
            </h1>

            {/* Positioning line */}
            <p className="text-lg md:text-xl text-white font-semibold leading-snug mb-4 animate-fade-in-up animate-delay-100">
              Most PT courses teach theory.{" "}
              <span className="text-[#F5C518]">We build personal trainers gyms actually want to hire.</span>
            </p>

            {/* Sub */}
            <p className="text-base text-blue-100/80 leading-relaxed mb-8 animate-fade-in-up animate-delay-100">
              Online Level 2 &amp; 3, fast-track, Ofqual regulated — done around your current job. Mentorship, guaranteed gym interviews, and a full business launchpad included.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10 animate-fade-in-up animate-delay-200">
              <a
                href="https://signup-lauchlab.co.uk/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/30 text-center"
              >
                Start Today →
              </a>
              <a
                href="/book-call"
                className="px-8 py-4 rounded-full border-2 border-white/60 text-white font-semibold text-base hover:bg-white/10 transition-all text-center"
              >
                Not sure? Book a free call
              </a>
            </div>

            {/* Trust bar */}
            <div className="flex flex-wrap gap-3 md:gap-5 text-blue-200/70 text-xs animate-fade-in-up animate-delay-300">
              <span>⭐ 5-Star Rated</span>
              <span className="hidden sm:inline opacity-40">·</span>
              <span>Guaranteed Gym Interviews</span>
              <span className="hidden sm:inline opacity-40">·</span>
              <span>500+ PTs Hired</span>
              <span className="hidden sm:inline opacity-40">·</span>
              <span>NCFE &amp; Ofqual Regulated</span>
              <span className="hidden sm:inline opacity-40">·</span>
              <span>Study Around Your Job</span>
            </div>
          </div>

          {/* Right — image box */}
          <div className="hidden lg:flex justify-center items-center animate-fade-in-up animate-delay-200">
            <div className="relative">
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#F5C518]/30 to-[#3B82F6]/20 blur-2xl scale-105" />

              {/* Card with outline */}
              <div className="relative rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl shadow-black/40 w-[400px] aspect-[3/4]">

                {/* Background — replace div with Next/Image once hero-photo.jpg is added to /public */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1060A0] via-[#0A4A80] to-[#072B4A] flex items-center justify-center">
                  <div className="text-center opacity-20">
                    <div className="w-24 h-24 rounded-full border-2 border-white mx-auto mb-3 flex items-center justify-center text-4xl">👤</div>
                    <p className="text-white text-xs tracking-widest uppercase">Add hero-photo.jpg<br />to /public</p>
                  </div>
                </div>

                {/* Overlay gradient at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#072B4A] to-transparent" />

                {/* LEARN QUALIFY LAUNCH badge */}
                <div className="absolute bottom-0 inset-x-0 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px bg-[#F5C518]/40" />
                    <span className="text-[#F5C518] text-[10px] font-bold tracking-[0.2em] uppercase">PT Launch Lab</span>
                    <div className="flex-1 h-px bg-[#F5C518]/40" />
                  </div>
                  <div className="flex justify-between">
                    {["Learn", "Qualify", "Launch"].map((word) => (
                      <div key={word} className="text-center">
                        <div className="w-8 h-8 rounded-full bg-[#F5C518]/15 border border-[#F5C518]/40 flex items-center justify-center mx-auto mb-1">
                          <span className="text-[#F5C518] text-xs">
                            {word === "Learn" ? "📚" : word === "Qualify" ? "🏅" : "🚀"}
                          </span>
                        </div>
                        <p className="text-white font-bold text-xs tracking-wider uppercase">{word}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top accent border */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#F5C518] to-transparent" />
              </div>

              {/* Floating stat badge */}
              <div className="absolute -bottom-5 -left-6 bg-[#F5C518] rounded-2xl px-5 py-3 shadow-xl shadow-[#F5C518]/30">
                <p className="text-[#072B4A] font-bold text-lg leading-none">500+</p>
                <p className="text-[#072B4A]/70 text-xs font-semibold">PTs Hired</p>
              </div>

              {/* Floating accreditation badge */}
              <div className="absolute -top-4 -right-4 bg-[#0D3559] border border-[#3B82F6]/40 rounded-xl px-4 py-2.5 shadow-xl">
                <p className="text-white font-bold text-xs">NCFE · Ofqual</p>
                <p className="text-[#8CA3BF] text-[10px]">Regulated &amp; Recognised</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
