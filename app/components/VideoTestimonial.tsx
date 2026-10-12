import ClickToPlay from "./ClickToPlay";

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

        {/* Click-to-play: only the YouTube thumbnail loads with the page; the
            iframe (and YouTube's ~1 MB of player JS) arrives on click. */}
        <div className="max-w-4xl mx-auto mb-6">
          <ClickToPlay
            source={{ kind: "youtube", id: "pAm1jvDKRM0" }}
            poster="https://i.ytimg.com/vi/pAm1jvDKRM0/hqdefault.jpg"
            title="How I escaped the 9-5 with PT Launch Lab — Gemma's Story"
            label="Gemma's story"
            trackAs="gemma_testimonial"
            sizes="(min-width:1024px) 896px, 100vw"
          />
        </div>

        <p className="text-faint text-sm italic">
          &ldquo;Watch how Gemma made the leap — and what life looks like on the other side.&rdquo;
        </p>
      </div>
    </section>
  );
}
