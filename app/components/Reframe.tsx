const futures = [
  "A fully recognised Level 3 PT qualification — NCFE, Ofqual-regulated, CIMSPA-approved",
  "A real understanding of the business of being a PT: pricing, client retention, marketing yourself",
  "Guaranteed gym interviews lined up for when you graduate",
  "A personal tutor who's guided you through every unit",
  "Confidence walking into any gym in the UK and getting hired",
];

export default function Reframe() {
  return (
    <section className="bg-[#072B4A] py-14 md:py-28">
      <div className="max-w-5xl mx-auto px-6">
        <div className="w-16 h-1 bg-[#F5C518] rounded mx-auto mb-8 md:mb-10" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Left — honest reframe */}
          <div>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-5 md:mb-6">
              Here&apos;s the honest truth
              <br />
              <span className="text-[#F5C518]">about the PT industry.</span>
            </h2>
            <p className="text-base md:text-lg text-[#8CA3BF] leading-relaxed mb-5 md:mb-6">
              Most personal trainers struggle in their first year — not because they&apos;re bad at training people, but because no one taught them the business side. How to get clients. How to price themselves. How to walk into a gym and get hired on the spot. The qualification alone doesn&apos;t cover any of that.
            </p>
            <p className="text-base md:text-lg text-[#8CA3BF] leading-relaxed mb-6 md:mb-8">
              PT Launch Lab was built to fix this. We&apos;re gym owners. We&apos;ve hired over 500 PTs. We know exactly what gyms look for — because we&apos;ve been the ones doing the hiring. When you qualify through us, you&apos;re not just exam-ready. You&apos;re employment-ready, client-ready, and business-ready.
            </p>
            <a
              href="/quiz"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#F5C518] text-[#072B4A] text-sm font-bold hover:brightness-110 transition-all"
            >
              <span className="hidden sm:inline">Take the free quiz — find out if PT is right for you →</span>
              <span className="sm:hidden">Take the free quiz →</span>
            </a>
          </div>

          {/* Right — what you'll have on completion */}
          <div className="bg-[#0D3559] border border-[#3B82F6]/25 rounded-2xl p-6 md:p-8">
            <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-4 md:mb-5">
              By the time you complete the course, you&apos;ll have:
            </p>
            <ul className="space-y-3 md:space-y-4">
              {futures.map((item) => (
                <li key={item} className="flex items-start gap-3 text-white text-[15px]">
                  <span className="text-[#F5C518] mt-0.5 shrink-0 font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
