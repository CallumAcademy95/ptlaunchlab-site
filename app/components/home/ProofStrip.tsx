"use client";
// A client component on purpose: `reviews` and `gymPartners` live in
// "use client" modules, and a server component that imports a non-component
// export from one gets a client reference, not the array.
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import TwoWayCTA from "@/app/components/cta/TwoWayCTA";
import { reviews } from "@/app/components/Reviews";
import { gymPartners } from "@/app/components/GymPartners";

const EXCERPT_MAX = 140;

/** First 140 characters, cut back to a word boundary, plus "…". */
function excerpt(text: string): string {
  if (text.length <= EXCERPT_MAX) return text;
  const cut = text.slice(0, EXCERPT_MAX + 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > 0 ? cut.slice(0, space) : text.slice(0, EXCERPT_MAX)).replace(/[\s,;:.—–-]+$/, "")}…`;
}

const excerpts = [reviews[1], reviews[2], reviews[3]].map((r) => ({ name: r.name, text: excerpt(r.quote) }));

// Logos drawn in dark ink vanish on navy, so they get a light tile. Measured
// from the PNGs (mean luminance of the opaque pixels below ~128). A logo not
// listed here sits on the dark tile.
const DARK_INK_LOGOS = new Set(["Leodis 24/7 Gym", "Iron Wolf Gym", "1079 Fitness", "MOF Gym", "Muscle Bound Gym"]);

const BADGES = ["NCFE", "Ofqual 603/4388/6", "CIMSPA"];

function ColumnHeading({ children }: { children: ReactNode }) {
  return <h3 className="font-display font-extrabold text-2xl md:text-[28px] text-white leading-none tracking-tight mb-5">{children}</h3>;
}

export default function ProofStrip() {
  return (
    <section className="bg-base py-12 border-y border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {/* (a) Google reviews */}
          <div className="bg-card border border-white/[0.07] rounded-2xl p-6 flex flex-col">
            <ColumnHeading>
              <span className="text-gold" aria-hidden="true">★★★★★</span> 5.0 on Google
              <span className="sr-only">Rated 5 out of 5 on Google</span>
            </ColumnHeading>
            <ul className="space-y-4 flex-1">
              {excerpts.map((r) => (
                <li key={r.name} className="border-l-2 border-gold/40 pl-3">
                  <p className="text-soft/85 text-sm leading-relaxed">&ldquo;{r.text}&rdquo;</p>
                  <p className="text-white text-xs font-semibold mt-1.5">{r.name}</p>
                </li>
              ))}
            </ul>
            <a href="#reviews" className="mt-5 text-gold text-sm font-semibold hover:underline self-start">
              Read all reviews →
            </a>
          </div>

          {/* (b) Hired by our team, partner gyms */}
          <div className="bg-card border border-white/[0.07] rounded-2xl p-6 flex flex-col min-w-0">
            <ColumnHeading>
              <span className="text-gold">500+ PTs</span> hired by our team
            </ColumnHeading>
            <p className="text-soft/70 text-sm leading-relaxed mb-5">
              Our founders run gyms and hire trainers. On qualifying, we introduce you to one.
            </p>
            <div className="relative -mx-6 flex-1">
              <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-card to-transparent z-10" aria-hidden="true" />
              <ul
                className="grid grid-rows-2 md:grid-rows-3 grid-flow-col auto-cols-[7.5rem] gap-2.5 overflow-x-auto snap-x px-6 pb-2 [scrollbar-width:thin]"
                aria-label="Partner gyms"
              >
                {gymPartners.map((g) => (
                  <li
                    key={g.name}
                    className={`snap-start h-16 rounded-xl border flex items-center justify-center px-3 ${
                      DARK_INK_LOGOS.has(g.name) ? "bg-white/90 border-white/20" : "bg-white/[0.05] border-white/[0.08]"
                    }`}
                  >
                    <Image src={g.src} alt={g.name} width={120} height={40} loading="lazy" className="h-10 w-auto max-w-full object-contain" />
                  </li>
                ))}
              </ul>
            </div>
            <a href="#partners" className="mt-5 text-gold text-sm font-semibold hover:underline self-start">
              Partner gyms →
            </a>
          </div>

          {/* (c) Accreditation and podcast */}
          <div className="bg-card border border-white/[0.07] rounded-2xl p-6 flex flex-col">
            <ColumnHeading>
              Regulated, <span className="text-gold">not in-house</span>
            </ColumnHeading>
            <ul className="flex flex-wrap gap-2 mb-4" aria-label="Accreditations">
              {BADGES.map((b) => (
                <li key={b} className="px-3 py-1.5 rounded-full border border-gold/30 bg-gold/[0.07] text-gold text-xs font-semibold tracking-wide">
                  {b}
                </li>
              ))}
            </ul>
            <div className="rounded-xl bg-white/90 h-20 flex items-center justify-center mb-4">
              <Image src="/logos/ncfe.png" alt="NCFE" width={1634} height={530} loading="lazy" className="h-12 w-auto" />
            </div>
            <p className="text-soft/70 text-sm leading-relaxed flex-1">
              An NCFE Level 3 qualification, regulated by Ofqual and recognised by CIMSPA: the one UK gym managers ask for by name.
            </p>
            <Link
              href="/podcast"
              className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white text-sm font-semibold hover:border-gold/40 hover:bg-white/[0.07] transition-colors"
            >
              <span aria-hidden="true">🎙</span>
              <span>Listen to the PT Launch Lab Podcast</span>
              <span className="ml-auto text-gold" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <TwoWayCTA source="home-proof" className="mt-8 justify-center" />
      </div>
    </section>
  );
}
