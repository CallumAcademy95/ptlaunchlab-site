import VslPlayer from "./VslPlayer";

// Sits directly under the hero. The hero keeps the learner slideshow; this is
// the 47-second "what we actually are" video on its own, full width, so it
// is the first thing after the headline for anyone who scrolls.
export default function HomepageVsl() {
  return (
    <section className="bg-deep border-t border-white/[0.06] py-16 md:py-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-8 md:mb-10">
          <p className="text-gold text-[11px] font-semibold tracking-widest uppercase mb-3">
            47 seconds
          </p>
          <h2 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-none tracking-tight mb-3">
            Not sure where to start?
          </h2>
          <p className="text-soft/70 text-base md:text-lg max-w-xl mx-auto">
            Here&apos;s what PT Launch Lab actually is, start to finish.
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <VslPlayer />
        </div>
      </div>
    </section>
  );
}
