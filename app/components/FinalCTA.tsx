export default function FinalCTA() {
  return (
    <section className="bg-[#0A0E1A] py-28 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[400px] rounded-full bg-[#3B82F6] opacity-[0.06] blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-8">
          You don&apos;t need to quit your job today.
          <br />
          <span className="text-[#F5C518]">You just need to decide.</span>
        </h2>
        <p className="text-[#9CA3AF] text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
          Do you want to stay where you are — or start moving towards a career you actually enjoy?
          If we can get you qualified around your job, with guaranteed gym interviews at the end, is there any reason not to start?
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
            Book a Free Call
          </a>
        </div>
      </div>
    </section>
  );
}
