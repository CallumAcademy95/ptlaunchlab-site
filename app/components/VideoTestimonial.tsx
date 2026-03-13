export default function VideoTestimonial() {
  return (
    <section className="bg-[#091524] py-24">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
          Real people. Real results.
        </h2>
        <p className="text-[#8CA3BF] text-lg mb-12 max-w-2xl mx-auto">
          Gemma went from corporate burnout to running her own PT business. Here&apos;s her story
          in her own words.
        </p>

        {/* Video embed — replace VIDEO_ID with real YouTube ID */}
        <div className="relative rounded-2xl overflow-hidden border border-[#3B82F6]/25 shadow-2xl shadow-[#3B82F6]/10 aspect-video max-w-4xl mx-auto mb-6">
          <iframe
            src="https://www.youtube.com/embed/VIDEO_ID"
            title="How I escaped the 9-5 with PT Launch Lab — Gemma's Story"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full absolute inset-0"
          />
        </div>

        <p className="text-[#4A6280] text-sm italic">
          &ldquo;Watch how Gemma made the leap — and what life looks like on the other side.&rdquo;
        </p>
      </div>
    </section>
  );
}
