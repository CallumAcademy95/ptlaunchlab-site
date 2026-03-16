export default function FinalCTA() {
  return (
    <section className="bg-[#072B4A] py-28 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[400px] rounded-full bg-[#3B82F6] opacity-[0.06] blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-4">Ready to make the move?</p>
        <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-6">
          The gap between the job you tolerate
          <br />
          <span className="text-[#F5C518]">and the career you actually want</span>
          <br />
          is smaller than you think.
        </h2>
        <p className="text-[#8CA3BF] text-lg max-w-2xl mx-auto mb-6 leading-relaxed">
          You don&apos;t need to quit your job tomorrow. You don&apos;t need to have it all figured out. You just need to take the first step — with a provider that&apos;ll be with you from that step all the way to your first session as a qualified PT.
        </p>
        <p className="text-[#8CA3BF] text-base max-w-xl mx-auto mb-12 leading-relaxed">
          Every month you wait is another month you&apos;re not earning in a career you love. If we can get you qualified in 8–16 weeks, around your current job, with guaranteed gym interviews at the end — is there a reason not to start?
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <a
            href="/enrol"
            className="px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20"
          >
            Secure Your Place →
          </a>
          <a
            href="/book-call"
            className="px-8 py-4 rounded-full border border-[#F5C518] text-[#F5C518] font-semibold text-base hover:bg-[#F5C518] hover:text-[#072B4A] transition-all"
          >
            Prefer to talk first? Book a free call
          </a>
        </div>

        <p className="text-[#4A6280] text-xs">
          NCFE Level 3 · Ofqual Regulated · CIMSPA Recognised · Personal Tutor Included · Guaranteed Gym Interviews · Study in 8–16 Weeks
        </p>
      </div>
    </section>
  );
}
