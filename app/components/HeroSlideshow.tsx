"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

// Add images to /public/ named learner-1.png, learner-2.png, etc.
// Update this array as you add more photos
const SLIDES = [
  { src: "/learner-1.png", name: "Learner" },
  { src: "/learner-2.png", name: "Learner" },
  { src: "/learner-3.png", name: "Learner" },
  { src: "/learner-4.png", name: "Learner" },
];

const INTERVAL = 4000;

export default function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setPrev(current);
      setFading(true);
      setCurrent((c) => (c + 1) % SLIDES.length);
      setTimeout(() => {
        setPrev(null);
        setFading(false);
      }, 700);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, [current]);

  return (
    <div className="flex justify-center items-center animate-fade-in-up animate-delay-200 mt-2 lg:mt-0">
      <div className="relative w-full lg:w-auto">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#F5C518]/30 to-[#3B82F6]/20 blur-2xl scale-105" />

        {/* Card */}
        <div className="relative z-0 rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl shadow-black/40 w-full aspect-[4/3] lg:w-[400px] lg:aspect-[3/4]">

          {/* Previous slide (fading out) */}
          {prev !== null && (
            <div
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: fading ? 0 : 1 }}
            >
              <Image
                src={SLIDES[prev].src}
                alt="PT Launch Lab learner with certificate"
                fill
                className="object-cover object-top"
                priority
              />
            </div>
          )}

          {/* Current slide (fading in) */}
          <div
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: fading ? 1 : 1 }}
          >
            <Image
              src={SLIDES[current].src}
              alt="PT Launch Lab learner with certificate"
              fill
              className="object-cover object-top"
              priority={current === 0}
            />
          </div>

          {/* Bottom gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#072B4A] to-transparent z-10" />

          {/* LEARN · QUALIFY · LAUNCH */}
          <div className="absolute bottom-0 inset-x-0 p-6 z-20">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-[#F5C518]/40" />
              <span className="text-[#F5C518] text-[10px] font-bold tracking-[0.2em] uppercase">PT Launch Lab</span>
              <div className="flex-1 h-px bg-[#F5C518]/40" />
            </div>
            <div className="flex justify-between">
              {["Learn", "Qualify", "Launch"].map((word) => (
                <div key={word} className="text-center">
                  <div className="w-8 h-8 rounded-full bg-[#F5C518]/15 border border-[#F5C518]/40 flex items-center justify-center mx-auto mb-1">
                    <span className="text-[#F5C518] text-xs">
                      {word === "Learn" ? "📚" : word === "Qualify" ? "🏅" : "🚀"}
                    </span>
                  </div>
                  <p className="text-white font-bold text-xs tracking-wider uppercase">{word}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dot indicators */}
          <div className="absolute top-4 inset-x-0 flex justify-center gap-1.5 z-20">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-5 h-1.5 bg-[#F5C518]"
                    : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Top accent border */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#F5C518] to-transparent z-20" />
        </div>

        {/* Floating stat badge */}
        <div className="hidden lg:block absolute -bottom-5 -left-6 z-50 bg-[#F5C518] rounded-2xl px-5 py-3 shadow-xl shadow-[#F5C518]/30">
          <p className="text-[#072B4A] font-bold text-lg leading-none">500+</p>
          <p className="text-[#072B4A]/70 text-xs font-semibold">PTs Hired</p>
        </div>

        {/* Floating accreditation badge */}
        <div className="hidden lg:block absolute -top-4 -right-4 z-50 bg-[#0D3559] border border-[#3B82F6]/40 rounded-xl px-4 py-2.5 shadow-xl">
          <p className="text-white font-bold text-xs">NCFE · Ofqual</p>
          <p className="text-[#8CA3BF] text-[10px]">Regulated &amp; Recognised</p>
        </div>
      </div>
    </div>
  );
}
