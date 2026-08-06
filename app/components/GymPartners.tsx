"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

// `dark` is unused by the rendering below (kept for a future light/dark logo
// swap that was never wired up) — do not rely on it to affect layout.
// `partner` marks entries confirmed against the `pp_partners` table; it drives
// the "N partner gyms" caption below. Leodis 24/7, 1079 Fitness and Ultimate
// Shred are kept on screen but excluded from the count — see task-8-report.md.
const gymPartners = [
  { name: "Leodis 24/7 Gym",       src: "/logos/leodis-gym.png",          dark: false, partner: false },
  { name: "Iron Wolf Gym",         src: "/logos/iron-wolf-gym.png",       dark: false, partner: true  },
  { name: "1079 Fitness",          src: "/logos/1079-fitness.png",        dark: false, partner: false },
  { name: "Ultimate Shred",        src: "/logos/ultimate-shred.png",      dark: true,  partner: false },
  { name: "6FitGym",               src: "/logos/6fit-gym.png",            dark: true,  partner: true  },
  { name: "MOF Gym",               src: "/logos/mof.png",                 dark: true,  partner: true  },
  { name: "Muscle Bound Gym",      src: "/logos/muscle bound gym.png",    dark: true,  partner: true  },
  { name: "Ebor Gym",              src: "/logos/EBOR GYM.png",            dark: false, partner: true  },
  { name: "HITIO Gym Orpington",   src: "/logos/hitio-gym.png",           dark: true,  partner: true  },
];

const partnerGymCount = gymPartners.filter((p) => p.partner).length;

const accreditations = [
  { name: "NCFE", src: "/logos/ncfe.png", dark: false },
];

export default function GymPartners() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % gymPartners.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="bg-base py-16 border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="text-faint text-[11px] font-semibold tracking-widest uppercase mb-3">
          Partners &amp; Accreditations
        </p>
        <h2 className="font-display font-extrabold text-3xl md:text-4xl text-white leading-none tracking-tight mb-2">
          Backed by industry.
          <br />
          <span className="text-gold">Trusted by gyms.</span>
        </h2>
        <p className="text-soft/60 text-sm mb-12 max-w-xl mx-auto">
          Our qualification is fully accredited and our graduates are welcomed into
          {" "}{partnerGymCount} partner gyms across the UK.
        </p>

        {/* Mobile: auto carousel */}
        <div className="block lg:hidden mb-10">
          <div className="relative w-56 h-32 mx-auto">
            {gymPartners.map((p, i) => (
              <div
                key={p.name}
                className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
              >
                <Image src={p.src} alt={p.name} fill className="object-contain" />
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {gymPartners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "bg-gold w-5" : "bg-white/20 w-1.5"}`}
              />
            ))}
          </div>
        </div>

        {/* Desktop: flex grid */}
        <div className="hidden lg:flex flex-wrap items-center justify-center gap-10 mb-10">
          {gymPartners.map((p) => (
            <div
              key={p.name}
              className="relative w-52 h-28 opacity-70 hover:opacity-100 transition-all duration-300 hover:scale-105"
            >
              <Image src={p.src} alt={p.name} fill className="object-contain" />
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 max-w-xs mx-auto mb-10">
          <div className="flex-1 h-px bg-white/[0.07]" />
          <span className="text-faint text-[10px] tracking-widest uppercase">Accredited by</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        {/* Accreditation logos */}
        <div className="flex flex-wrap items-center justify-center gap-10 mb-14">
          {accreditations.map((p) => (
            <div
              key={p.name}
              className="relative w-52 h-28 opacity-70 hover:opacity-100 transition-all duration-300 hover:scale-105"
            >
              <Image src={p.src} alt={p.name} fill className="object-contain" />
            </div>
          ))}
        </div>

        {/* Gym partnership CTA */}
        <div className="border-t border-white/[0.06] pt-12">
          <p className="text-white font-bold text-xl md:text-2xl mb-2">Own a gym?</p>
          <p className="text-soft/60 text-sm mb-6 max-w-md mx-auto">
            Earn £500 per learner and build your own white-label PT academy — without doing any teaching, admin, or courses.
          </p>
          <a
            href="/gym-partnership"
            className="inline-block px-8 py-3.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all shadow-xl shadow-gold/20"
          >
            Gym Partnership Programme →
          </a>
        </div>
      </div>
    </section>
  );
}
