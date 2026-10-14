// Server component: the stats, review texts and logo marquee are static HTML.
// Only ReviewRotator and TwoWayCTA ship as client JS.
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import TwoWayCTA from "@/app/components/cta/TwoWayCTA";
import ReviewRotator from "./ReviewRotator";
import { reviews } from "@/app/lib/reviewsData";
import { gymPartners } from "@/app/lib/gymPartnersData";

// Short reviews (~200 characters or less), shown in full, word for word.
const ROTATING = ["Alex Doyle", "Rachel Waldock", "Matthew Bell", "Jordan Wills"];
const quotes = ROTATING.map((name) => {
  const r = reviews.find((x) => x.name === name);
  if (!r) throw new Error(`ProofStrip: review "${name}" not found in reviewsData`);
  return { name: r.name, text: r.quote };
});

const STATS: { value: string; label: ReactNode; href?: string }[] = [
  { value: "5.0★", label: "Google rating" },
  { value: "500+", label: "PTs hired by our team" },
  {
    value: "NCFE L3",
    // The qualification number only from md up, so the label stays on one line on phones.
    label: (
      <>
        Ofqual<span className="hidden md:inline"> 603/4388/6</span> · CIMSPA
      </>
    ),
  },
  { value: "Podcast", label: "Listen →", href: "/podcast" },
];

const LOGO_H = 36;

function LogoSet({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      className={`flex shrink-0 items-center gap-x-10 pr-10 md:gap-x-14 md:pr-14 motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-6 motion-reduce:pr-0 md:motion-reduce:pr-0 ${hidden ? "motion-reduce:hidden" : ""}`}
      {...(hidden ? { "aria-hidden": true } : { "aria-label": "Partner gyms" })}
    >
      {gymPartners.map((g) => (
        <li key={g.name} className="shrink-0">
          <Image
            src={g.mono}
            alt={hidden ? "" : g.name}
            width={Math.round((g.monoSize[0] * LOGO_H) / g.monoSize[1])}
            height={LOGO_H}
            loading="lazy"
            className="h-8 md:h-9 w-auto opacity-70 hover:opacity-100 transition-opacity [filter:brightness(0)_invert(1)]"
          />
        </li>
      ))}
    </ul>
  );
}

export default function ProofStrip() {
  return (
    <section className="bg-base py-14 md:py-16 border-y border-white/[0.05]" aria-labelledby="proof-heading">
      <h2 id="proof-heading" className="sr-only">Why PT Launch Lab</h2>
      <div className="max-w-6xl mx-auto px-6">
        {/* 1. Stats */}
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-y-10 md:divide-x md:divide-white/10">
          {STATS.map((s) => {
            const body = (
              <>
                <span className="block font-display font-extrabold text-gold text-4xl md:text-5xl leading-none tracking-tight">{s.value}</span>
                <span className="block mt-2 text-soft/85 text-xs md:text-sm leading-snug">{s.label}</span>
              </>
            );
            return (
              <li key={s.value} className="px-3 text-center">
                {s.href ? (
                  <Link href={s.href} className="inline-block rounded-lg hover:opacity-90 focus-visible:outline-2 focus-visible:outline-gold">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>

        {/* 2. One rotating review */}
        <div className="mt-12 md:mt-14 max-w-2xl mx-auto text-center">
          <ReviewRotator quotes={quotes} />
          <a href="#reviews" className="mt-3 inline-block text-gold text-sm font-semibold hover:underline">
            Read all reviews →
          </a>
        </div>
      </div>

      {/* 3. Partner logo marquee: CSS only, the second set is a visual copy for the loop. */}
      <div className="mt-12 md:mt-14">
        <p className="text-center text-soft/80 text-[11px] font-semibold tracking-[0.2em] uppercase mb-6">Gyms in our partner network</p>
        <div className="group overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] motion-reduce:[mask-image:none]">
          <div className="flex w-max animate-[scrollX_50s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:w-full motion-reduce:justify-center motion-reduce:px-6">
            <LogoSet />
            <LogoSet hidden />
          </div>
        </div>
      </div>

      {/* 4. CTA */}
      <div className="max-w-6xl mx-auto px-6">
        <TwoWayCTA source="home-proof" className="mt-12 md:mt-14 justify-center" />
      </div>
    </section>
  );
}
