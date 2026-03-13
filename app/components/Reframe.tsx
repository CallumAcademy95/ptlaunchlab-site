const futures = [
  "Make money from something you actually enjoy",
  "Work in a gym, coach online, or build both alongside each other",
  "Keep your job until you're ready — qualify around it first",
  "Have freedom over your hours and who you work with",
  "Know the path is clear before you leave anything behind",
];

export default function Reframe() {
  return (
    <section className="bg-[#091524] py-28">
      <div className="max-w-5xl mx-auto px-6">
        <div className="w-16 h-1 bg-[#F5C518] rounded mx-auto mb-10" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — empathy */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
              You&apos;re not broken.
              <br />
              <span className="text-[#F5C518]">You&apos;re just in the wrong place.</span>
            </h2>
            <p className="text-lg text-[#8CA3BF] leading-relaxed mb-8">
              Most people who come to us aren&apos;t career changers by accident. They&apos;re driven,
              passionate, and sick of wasting their potential. They just need the right qualification,
              the right support, and someone who&apos;s actually done it — to show them the way.
              That&apos;s exactly what PT Launch Lab was built for.
            </p>
            <a
              href="/quiz"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#F5C518] text-[#091524] text-sm font-bold hover:brightness-110 transition-all"
            >
              Take the free quiz — find out if PT is right for you →
            </a>
          </div>

          {/* Right — future vision */}
          <div className="bg-[#112035] border border-[#3B82F6]/25 rounded-2xl p-8">
            <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-5">
              What you actually want
            </p>
            <ul className="space-y-4">
              {futures.map((item) => (
                <li key={item} className="flex items-start gap-3 text-white text-[15px]">
                  <span className="text-[#F5C518] mt-0.5 shrink-0 font-bold">→</span>
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
