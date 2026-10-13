"use client";
import { useRef, useState, useEffect } from "react";
import { reviews } from "@/app/lib/reviewsData";
import { GOOGLE_PROFILE_URL } from "@/app/lib/contactDetails";

export default function Reviews() {
  const [current, setCurrent] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const startX = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    function update() {
      if (window.innerWidth < 640) setVisibleCount(1);
      else if (window.innerWidth < 1024) setVisibleCount(2);
      else setVisibleCount(3);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxIndex = reviews.length - visibleCount;
  const prev = () => setCurrent((c) => Math.max(c - 1, 0));
  const next = () => setCurrent((c) => Math.min(c + 1, maxIndex));

  function onTouchStart(e: React.TouchEvent) { startX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    const diff = startX.current - e.changedTouches[0].clientX;
    if (diff > 50) next(); else if (diff < -50) prev();
  }
  function onMouseDown(e: React.MouseEvent) { isDragging.current = true; startX.current = e.clientX; }
  function onMouseUp(e: React.MouseEvent) {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = startX.current - e.clientX;
    if (diff > 50) next(); else if (diff < -50) prev();
  }

  const cardWidthPct = 100 / visibleCount;

  return (
    <section className="bg-base py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10">
          <div>
            <p className="text-gold text-[11px] font-semibold tracking-widest uppercase mb-3">
              Student reviews
            </p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white leading-none tracking-tight">
              Don&apos;t just take
              <br />our word for it.
            </h2>
            <div className="flex items-center gap-2 mt-4">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} viewBox="0 0 16 16" className="w-4 h-4 text-gold fill-current">
                    <path d="M8 1l1.8 3.6L14 5.5l-3 2.9.7 4.1L8 10.4l-3.7 2.1.7-4.1-3-2.9 4.2-.9z"/>
                  </svg>
                ))}
              </div>
              <span className="text-white text-sm font-semibold">5.0</span>
              <span className="text-soft/60 text-sm">· Google rating</span>
              <a
                href={GOOGLE_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold text-sm font-medium hover:underline ml-1"
              >
                See all →
              </a>
            </div>
          </div>

          {/* Arrow buttons */}
          <div className="flex gap-3">
            <button
              onClick={prev}
              disabled={current === 0}
              aria-label="Previous review"
              className="w-11 h-11 rounded-full border border-white/[0.1] flex items-center justify-center text-white hover:border-gold/50 hover:text-gold transition-all disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button
              onClick={next}
              disabled={current >= maxIndex}
              aria-label="Next review"
              className="w-11 h-11 rounded-full border border-white/[0.1] flex items-center justify-center text-white hover:border-gold/50 hover:text-gold transition-all disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          className="cursor-grab active:cursor-grabbing select-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
        >
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${current * cardWidthPct}%)` }}
          >
            {reviews.map((rev) => (
              <div
                key={rev.name}
                className="shrink-0 px-2.5"
                style={{ width: `${cardWidthPct}%` }}
              >
                <div className="bg-card border border-white/[0.07] rounded-2xl p-6 h-full flex flex-col gap-4 hover:border-gold/20 transition-colors">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} viewBox="0 0 16 16" className="w-3.5 h-3.5 text-gold fill-current">
                        <path d="M8 1l1.8 3.6L14 5.5l-3 2.9.7 4.1L8 10.4l-3.7 2.1.7-4.1-3-2.9 4.2-.9z"/>
                      </svg>
                    ))}
                  </div>
                  <p className="text-white/85 text-sm leading-relaxed flex-1">
                    &ldquo;{rev.quote}&rdquo;
                  </p>
                  <div className="border-t border-white/[0.06] pt-4">
                    <p className="text-gold text-sm font-bold">{rev.name}</p>
                    <p className="text-soft/50 text-xs mt-0.5">{rev.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to review ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "bg-gold w-6" : "bg-white/20 w-1.5 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
