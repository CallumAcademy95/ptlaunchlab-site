export default function VideoTestimonial() {
  return (
    <section className="bg-surface py-24">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <p className="text-gold text-[11px] font-semibold tracking-widest uppercase mb-4">
          Real results
        </p>
        <h2 className="font-display font-extrabold text-5xl md:text-7xl text-white leading-none tracking-tight mb-4">
          Real people.
          <br />
          <span className="text-gold">Real results.</span>
        </h2>
        <p className="text-soft/65 text-lg mb-12 max-w-2xl mx-auto">
          Gemma went from corporate burnout to running her own PT business. Here&apos;s her story
          in her own words.
        </p>

        <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/50 aspect-video max-w-4xl mx-auto mb-6">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <iframe
            src="https://www.youtube.com/embed/pAm1jvDKRM0"
            title="How I escaped the 9-5 with PT Launch Lab — Gemma's Story"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full absolute inset-0"
          />
        </div>

        <p className="text-faint text-sm italic">
          &ldquo;Watch how Gemma made the leap — and what life looks like on the other side.&rdquo;
        </p>
      </div>
    </section>
  );
}
