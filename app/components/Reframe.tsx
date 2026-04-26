const futures = [
  "A fully recognised Level 3 PT qualification — NCFE, Ofqual-regulated, CIMSPA-approved",
  "Lifetime access to our £500 business mentorship community — included free, not a paid add-on",
  "A real understanding of the business of being a PT: pricing, client retention, marketing yourself",
  "Guaranteed gym interviews lined up for when you graduate",
  "A personal tutor who's guided you through every unit",
  "Confidence walking into any gym in the UK and getting hired",
];

export default function Reframe() {
  return (
    <section className="bg-surface py-14 md:py-28">
      <div className="max-w-5xl mx-auto px-6">
        <div className="w-12 h-[3px] bg-gold rounded mx-auto mb-10 md:mb-12" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Left — honest reframe */}
          <div>
            <h2 className="font-display font-extrabold text-5xl md:text-6xl text-white leading-none tracking-tight mb-5 md:mb-6">
              Here&apos;s the honest truth
              <br />
              <span className="text-gold">about the PT industry.</span>
            </h2>
            <p className="text-base md:text-lg text-soft/75 leading-relaxed mb-5 md:mb-6">
              Most personal trainers struggle in their first year — not because they&apos;re bad at training people, but because no one taught them the business side. How to get clients. How to price themselves. How to walk into a gym and get hired on the spot. The qualification alone doesn&apos;t cover any of that.
            </p>
            <p className="text-base md:text-lg text-soft/75 leading-relaxed mb-8">
              PT Launch Lab was built to fix this. We&apos;re gym owners. We&apos;ve hired over 500 PTs. We know exactly what gyms look for — because we&apos;ve been the ones doing the hiring. When you qualify through us, you&apos;re not just exam-ready. You&apos;re employment-ready, client-ready, and business-ready.
            </p>
            <a
              href="/quiz"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-gold text-deep text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-gold/20"
            >
              <span className="hidden sm:inline">Take the free quiz — find out if PT is right for you →</span>
              <span className="sm:hidden">Take the free quiz →</span>
            </a>
          </div>

          {/* Right — completion checklist */}
          <div className="bg-card border border-white/[0.07] rounded-2xl p-6 md:p-8">
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase mb-5">
              By the time you complete the course, you&apos;ll have:
            </p>
            <ul className="space-y-4">
              {futures.map((item) => (
                <li key={item} className="flex items-start gap-3 text-white text-[15px] leading-snug">
                  <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-gold">
                      <path d="M2 6l3 3 5-5"/>
                    </svg>
                  </span>
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
