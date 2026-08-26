import HeroSlideshow from "./HeroSlideshow";
import { getVisitorGeo } from "@/app/lib/geoDetect";

// Geo-aware variant of the homepage hero. Yorkshire visitors get a hero
// that leans into the local advantage (Pontefract-based, workshops nearby,
// "built by Yorkshire gym owners"). Everyone else gets a neutral national
// hero so the Yorkshire flavour doesn't read as "not for me" to a London
// or Manchester visitor.
//
// Reading the visitor's geo via headers() makes this route dynamic. The
// trade-off: every request goes through Vercel's edge instead of being
// served as fully cached static HTML. The perf cost is small (edge runs
// hot) and the conversion lift on the dominant Yorkshire traffic should
// dwarf it.

export default async function Hero() {
  const { isYorkshire } = await getVisitorGeo();

  const pillCopy = isYorkshire
    ? "NCFE Level 3 · Pontefract-Based · Yorkshire Workshops · Ofqual · CIMSPA"
    : "NCFE Level 3 · Ofqual Regulated · CIMSPA Recognised · Qualify in 8–16 Weeks";

  const positioningCopy = isYorkshire
    ? "Built in Yorkshire by gym owners who've hired over 500 personal trainers, so the course covers getting hired as well as getting qualified."
    : "Built by gym owners who've hired over 500 personal trainers, so the course covers getting hired as well as getting qualified.";

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden pt-[72px]"
      data-hero-variant={isYorkshire ? "yorkshire" : "neutral"}
      style={{ background: "linear-gradient(150deg, #0B2D52 0%, #091F3D 45%, #070D1B 100%)" }}
    >
      {/* Warm radial glow behind headline */}
      <div className="absolute left-[-5%] top-1/3 w-[700px] h-[500px] rounded-full bg-gold/[0.045] blur-[140px] pointer-events-none" />
      <div className="absolute right-[-5%] bottom-1/4 w-[500px] h-[400px] rounded-full bg-blue/[0.06] blur-[120px] pointer-events-none" />

      {/* Geometric accent lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <line x1="100%" y1="0" x2="55%" y2="100%" stroke="#F5C518" strokeWidth="1" />
        <line x1="85%" y1="0" x2="40%" y2="100%" stroke="#F5C518" strokeWidth="0.6" />
      </svg>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left — text */}
          <div>
            {/* Pill label */}
            <div className="inline-flex flex-wrap items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-white/[0.06] backdrop-blur-sm mb-6 md:mb-8 animate-fade-in">
              <span className="text-gold text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase leading-relaxed">
                {pillCopy}
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display font-extrabold text-6xl sm:text-7xl md:text-[82px] text-white leading-none mb-5 animate-fade-in-up tracking-tight">
              You&apos;re good enough
              <br />to be a PT.
              <br /><span className="text-gold">Here&apos;s how to</span>
              <br /><span className="text-gold">make it pay.</span>
            </h1>

            {/* Positioning line */}
            <p className="text-base md:text-lg text-white font-semibold leading-snug mb-3 animate-fade-in-up animate-delay-100">
              {positioningCopy}
            </p>

            {/* Sub */}
            <p className="text-[15px] text-soft/80 leading-relaxed mb-8 animate-fade-in-up animate-delay-100">
              An 8–16 week online Level 3 qualification with business training and our <span className="text-white font-semibold">£500 business mentorship community, included in the fee</span> rather than sold on afterwards.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-3 animate-fade-in-up animate-delay-200">
              <a
                href="/book-call"
                className="px-8 py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all shadow-xl shadow-gold/25 text-center"
              >
                Discover Your Pathway →
              </a>
              <a
                href="/enrol"
                className="px-8 py-4 rounded-full border-2 border-white/30 text-white font-semibold text-base hover:bg-white/10 hover:border-white/50 transition-all text-center"
              >
                Start Today
              </a>
            </div>

            {/* Urgency line */}
            <p className="text-soft/50 text-xs mb-7 animate-fade-in-up animate-delay-200">
              Free 15-min call · No pressure · Tutor assigned within 24 hours of enrolling
            </p>

            {/* Trust bar — one bullet swaps per geo variant */}
            <div className="flex flex-wrap gap-3 md:gap-5 text-soft/60 text-xs animate-fade-in-up animate-delay-300">
              <span>✓ NCFE &amp; Ofqual Regulated</span>
              <span className="hidden sm:inline opacity-30">·</span>
              <span>✓ £500 Mentorship Included Free</span>
              <span className="hidden sm:inline opacity-30">·</span>
              <span>✓ Guaranteed Gym Interviews</span>
              <span className="hidden sm:inline opacity-30">·</span>
              <span>✓ 500+ PTs Hired by Our Team</span>
              <span className="hidden sm:inline opacity-30">·</span>
              <span>{isYorkshire ? "✓ Yorkshire Workshops Available" : "✓ 100% Online, Study from Anywhere in the UK"}</span>
              <span className="hidden sm:inline opacity-30">·</span>
              <span>✓ Study Around Your Current Job</span>
            </div>
          </div>

          {/* Mobile stats strip */}
          <div className="lg:hidden grid grid-cols-3 gap-3 mt-2">
            {[
              { value: "500+", label: "PTs Hired" },
              { value: "5.0★", label: "Google Rating" },
              { value: "NCFE", label: "Ofqual Regulated" },
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.07] border border-white/[0.1] rounded-xl p-3 text-center">
                <p className="text-gold font-bold text-base leading-none mb-1">{s.value}</p>
                <p className="text-soft/60 text-[10px] font-medium">{s.label}</p>
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
