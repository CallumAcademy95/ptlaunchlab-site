"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

const SLIDES = [
  { src: "/learner-1.webp", alt: "PT Launch Lab graduate holding their NCFE Level 3 personal trainer certificate" },
  { src: "/learner-2.webp", alt: "PT Launch Lab graduate qualified through the NCFE Level 3 personal trainer course" },
  { src: "/learner-3.webp", alt: "PT Launch Lab learner who completed the online Level 3 personal training qualification" },
  { src: "/learner-4.webp", alt: "PT Launch Lab graduate working as a qualified personal trainer in the UK" },
];

const INTERVAL = 4000;

const LearnIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const QualifyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="8" r="5"/>
    <path d="M9 14.5 8 22l4-2 4 2-1-7.5"/>
  </svg>
);

const LaunchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

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
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold/25 to-blue/15 blur-2xl scale-105" />

        {/* Card */}
        <div className="relative z-0 rounded-2xl border border-white/15 overflow-hidden shadow-2xl shadow-black/50 w-full aspect-[4/3] lg:w-[400px] lg:aspect-[3/4]">

          {/* Previous slide (fading out) */}
          {prev !== null && (
            <div
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: fading ? 0 : 1 }}
            >
              <Image
                src={SLIDES[prev].src}
                alt={SLIDES[prev].alt}
                fill
                sizes="(max-width: 1024px) 100vw, 400px"
                className="object-cover object-center lg:object-top"
              />
            </div>
          )}

          {/* Current slide */}
          <div
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: fading ? 1 : 1 }}
          >
            <Image
              src={SLIDES[current].src}
              alt={SLIDES[current].alt}
              fill
              sizes="(max-width: 1024px) 100vw, 400px"
              className="object-cover object-center lg:object-top"
              priority={current === 0}
            />
          </div>

          {/* Bottom gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#081729] to-transparent z-10" />

          {/* LEARN · QUALIFY · LAUNCH strip */}
          <div className="absolute bottom-0 inset-x-0 p-6 z-20">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-gold/30" />
              <span className="text-gold text-[10px] font-bold tracking-[0.2em] uppercase">PT Launch Lab</span>
              <div className="flex-1 h-px bg-gold/30" />
            </div>
            <div className="flex justify-between">
              {[
                { word: "Learn",   Icon: LearnIcon   },
                { word: "Qualify", Icon: QualifyIcon },
                { word: "Launch",  Icon: LaunchIcon  },
              ].map(({ word, Icon }) => (
                <div key={word} className="text-center">
                  <div className="w-8 h-8 rounded-full bg-gold/[0.12] border border-gold/35 flex items-center justify-center mx-auto mb-1 text-gold">
                    <Icon />
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
                  i === current ? "w-5 h-1.5 bg-gold" : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Top accent line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent z-20" />
        </div>

        {/* Floating stat badge */}
        <div className="hidden lg:block absolute -bottom-5 -left-6 z-50 bg-gold rounded-2xl px-5 py-3 shadow-xl shadow-gold/30">
          <p className="text-deep font-bold text-lg leading-none font-display">500+</p>
          <p className="text-deep/70 text-xs font-semibold">PTs Hired</p>
        </div>

        {/* Floating accreditation badge */}
        <div className="hidden lg:block absolute -top-4 -right-4 z-50 bg-card border border-white/[0.12] rounded-xl px-4 py-2.5 shadow-xl shadow-black/30">
          <p className="text-white font-bold text-xs">NCFE · Ofqual</p>
          <p className="text-soft/60 text-[10px]">Regulated &amp; Recognised</p>
        </div>
      </div>
    </div>
  );
}
