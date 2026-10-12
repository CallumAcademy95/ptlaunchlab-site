"use client";
// One review at a time under the proof band's stats. The server renders the
// first quote, so the static HTML carries a real review before any JS runs.
import { useEffect, useState } from "react";

const ROTATE_MS = 6000;

export default function ReviewRotator({ quotes }: { quotes: { name: string; text: string }[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true); // until we know, don't move

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduced || paused || quotes.length < 2) return;
    const t = window.setTimeout(() => setI((n) => (n + 1) % quotes.length), ROTATE_MS);
    return () => window.clearTimeout(t);
  }, [i, reduced, paused, quotes.length]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* All quotes share one grid cell, so the box is as tall as the longest and never jumps. */}
      {/* Announce only when the reader chose the quote (paused, or no auto-rotation), not every 6 s. */}
      <div aria-live={paused || reduced ? "polite" : "off"} className="grid">
        {quotes.map((r, n) => (
          <figure
            key={r.name}
            aria-hidden={n !== i}
            inert={n !== i}
            className={`[grid-area:1/1] flex flex-col items-center justify-center motion-safe:transition-opacity motion-safe:duration-500 ${n === i ? "opacity-100" : "invisible opacity-0"}`}
          >
            <p className="text-gold text-sm tracking-[0.2em]" aria-hidden="true">★★★★★</p>
            <blockquote className="mt-3 text-white text-base sm:text-lg md:text-xl leading-relaxed">&ldquo;{r.text}&rdquo;</blockquote>
            <figcaption className="mt-3 text-soft/85 text-sm font-semibold">
              {r.name}
              <span className="sr-only">, 5 stars</span>
            </figcaption>
          </figure>
        ))}
      </div>
      {quotes.length > 1 && (
        <div className="mt-4 flex justify-center gap-1">
          {quotes.map((r, n) => (
            <button
              key={r.name}
              type="button"
              onClick={() => setI(n)}
              aria-label={`Show review ${n + 1} of ${quotes.length}, from ${r.name}`}
              aria-current={n === i ? "true" : undefined}
              className="group p-2 rounded-full focus-visible:outline-2 focus-visible:outline-gold"
            >
              <span className={`block h-2 rounded-full transition-all ${n === i ? "w-6 bg-gold" : "w-2 bg-white/30 group-hover:bg-white/60"}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
