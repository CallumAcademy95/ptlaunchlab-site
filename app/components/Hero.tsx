export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[#0A0E1A] overflow-hidden pt-[72px]">
      {/* Decorative blobs */}
      <div className="absolute -left-48 top-20 w-[600px] h-[600px] rounded-full bg-[#F5C518] opacity-[0.06] blur-3xl pointer-events-none" />
      <div className="absolute -right-32 top-40 w-[500px] h-[500px] rounded-full bg-[#3B82F6] opacity-[0.07] blur-3xl pointer-events-none" />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-10 w-[400px] h-[400px] rounded-full bg-[#F5C518] opacity-[0.04] blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center py-24">
        {/* Pill label */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#F5C518]/30 bg-[#141B2D] mb-10">
          <span className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase">
            NCFE Level 3 · Ofqual Regulated · CIMSPA Accredited
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-8 animate-fade-in-up">
          Become a Qualified
          <br />
          Personal Trainer.
          <br />
          <span className="text-[#F5C518]">Build a Business That</span>
          <br />
          Actually Pays You.
        </h1>

        {/* Sub */}
        <p className="text-lg md:text-xl text-[#9CA3AF] max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-in-up animate-delay-100">
          Get your NCFE Level 3 PT qualification online — in as little as 8 weeks — with real
          mentorship, business support, and a community that actually gives a damn about your success.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up animate-delay-200">
          <a
            href="https://signup-lauchlab.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 rounded-full bg-[#F5C518] text-[#0A0E1A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20"
          >
            Start Today →
          </a>
          <a
            href="#book-call"
            className="px-8 py-4 rounded-full border border-[#F5C518] text-[#F5C518] font-semibold text-base hover:bg-[#F5C518] hover:text-[#0A0E1A] transition-all"
          >
            Not sure? Book a free call
          </a>
        </div>

        {/* Trust bar */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-[#6B7280] text-sm animate-fade-in-up animate-delay-300">
          <span>⭐ 5-Star Rated</span>
          <span className="hidden sm:inline">·</span>
          <span>NCFE &amp; Ofqual Regulated</span>
          <span className="hidden sm:inline">·</span>
          <span>CIMSPA Accredited</span>
          <span className="hidden sm:inline">·</span>
          <span>Study Online</span>
        </div>
      </div>
    </section>
  );
}
