import Image from "next/image";

export default function Podcast() {
  return (
    <section className="bg-surface py-24 border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — copy */}
          <div>
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase mb-4">
              The Podcast
            </p>
            <h2 className="font-display font-extrabold text-5xl md:text-6xl text-white leading-none tracking-tight mb-6">
              Real stories.
              <br />
              <span className="text-gold">Real Yorkshire honesty.</span>
            </h2>
            <p className="text-soft/70 text-lg leading-relaxed mb-8">
              The PT Launch Lab Podcast covers what nobody else talks about — how PTs actually build careers, make money, and navigate the reality of working in fitness.
            </p>
            <ul className="space-y-3 mb-10">
              {[
                "Real transformation stories from working PTs",
                "Step-by-step business building from scratch",
                "How to go from qualification to full-time income",
                "Honest takes on the fitness industry",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-soft/70 text-[15px]">
                  <span className="text-gold mt-0.5 shrink-0 font-bold">→</span>
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="https://www.youtube.com/@ptlaunchlab"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-gold/60 text-gold font-bold text-sm hover:bg-gold hover:text-deep transition-all"
            >
              Watch on YouTube →
            </a>
          </div>

          {/* Right — thumbnail + platform buttons */}
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/[0.08]">
              <Image
                src="/podcast-thumbnail.jpg"
                alt="PT Launch Lab Podcast — Callum Brown & Ryan Robinson"
                width={480}
                height={480}
                className="w-full h-auto object-cover"
              />
            </div>

            <div className="w-full max-w-sm space-y-3">
              <a
                href="https://www.youtube.com/@ptlaunchlab"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                Watch on YouTube
              </a>
              <a
                href="https://www.instagram.com/ptlaunchlab"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-white/[0.1] text-soft/70 font-bold text-sm hover:border-gold/30 hover:text-white transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                </svg>
                Follow on Instagram
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
