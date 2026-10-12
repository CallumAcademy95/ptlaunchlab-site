import Image from "next/image";
import ClickToPlay from "@/app/components/ClickToPlay";
import TwoWayCTA from "@/app/components/cta/TwoWayCTA";
import WasPrice from "@/app/components/WasPrice";
import { COURSE_PRICE_LABEL } from "@/app/lib/pricing";
import { wasPriceActive } from "@/app/lib/priceDrop";

// The money pages' hero: the home hero's format (app/components/home/HomeHero.tsx)
// with the copy, CTA source and media as props. What it is, what it costs, how
// to start: on a 390×844 phone the H1, the price and both buttons sit in the
// first screen, with the video or photo below the buttons.

/** Build-time hint, as in HomeHero: hold the was-price space until the browser decides. */
const RESERVE_WAS_PRICE = wasPriceActive(Date.now());

/** A YouTube id from an id, a watch URL, a youtu.be link or an embed URL. */
function youtubeId(src: string): string {
  const m = src.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m ? m[1] : src;
}

export type MoneyHeroProps = {
  eyebrow: string;
  headline: string;
  goldTail: string;
  subline: string;
  source: string;
  video?: { kind: "mp4" | "youtube"; src: string; poster: string; trackAs: string; metaEvent?: string };
  image?: { src: string; alt: string };
};

export default function MoneyHero({ eyebrow, headline, goldTail, subline, source, video, image }: MoneyHeroProps) {
  const title = `${headline} ${goldTail}`;
  return (
    <section
      className="relative overflow-hidden pt-[72px]"
      style={{ background: "linear-gradient(150deg, #0B2D52 0%, #091F3D 45%, #070D1B 100%)" }}
    >
      <div className="absolute left-[-10%] top-1/4 w-[640px] h-[460px] rounded-full bg-gold/[0.05] blur-[140px] pointer-events-none" />
      <div className="absolute right-[-5%] bottom-0 w-[520px] h-[420px] rounded-full bg-blue/[0.07] blur-[120px] pointer-events-none" />
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line x1="100%" y1="0" x2="55%" y2="100%" stroke="#F5C518" strokeWidth="1" />
        <line x1="85%" y1="0" x2="40%" y2="100%" stroke="#F5C518" strokeWidth="0.6" />
      </svg>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-5 pb-12 md:pt-14 md:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
          {/* Left: the five seconds */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/30 bg-white/[0.06] backdrop-blur-sm mb-4 md:mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_8px_#F5C518]" aria-hidden="true" />
              <span className="text-gold text-[10px] sm:text-[11px] font-semibold tracking-widest leading-none">{eyebrow}</span>
            </div>

            <h1 className="font-display font-extrabold text-[44px] leading-[1.02] sm:text-6xl md:text-7xl text-white tracking-tight mb-3 md:mb-5">
              {headline} <span className="text-gold">{goldTail}</span>
            </h1>

            <p className="text-base text-soft leading-relaxed mb-4 md:mb-6 max-w-xl">{subline}</p>

            {/* Pay in full is the offer; the monthly plan is on /enrol for whoever wants it. */}
            <div className="mb-4 md:mb-6">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <p className="leading-tight">
                  <span className="text-gold font-bold text-3xl lg:text-4xl">{COURSE_PRICE_LABEL}</span>{" "}
                  <span className="text-white font-semibold text-lg">everything included</span>
                </p>
                <WasPrice reserve={RESERVE_WAS_PRICE} className="text-soft text-base" />
              </div>
              <p className="text-soft/80 text-sm mt-1">Flexible ways to pay at checkout</p>
            </div>

            <TwoWayCTA source={source} />

            <p className="text-soft/70 text-xs mt-4">★ 5.0 Google · 500+ PTs hired · Study around your job</p>
          </div>

          {/* Right on desktop; below the buttons on mobile. Video wins over image. */}
          {video ? (
            <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
              <ClickToPlay
                source={video.kind === "youtube" ? { kind: "youtube", id: youtubeId(video.src) } : { kind: "file", src: video.src }}
                poster={video.poster}
                title={title}
                label="Watch · sound on"
                trackAs={video.trackAs}
                metaEvent={video.metaEvent}
                sizes="(min-width:1024px) 45vw, 100vw"
              />
            </div>
          ) : image ? (
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="absolute -inset-3 rounded-[28px] bg-gradient-to-br from-gold/25 via-gold/5 to-transparent blur-xl pointer-events-none" aria-hidden="true" />
              <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-gold/60 via-white/10 to-white/5 shadow-2xl shadow-black/40">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={1200}
                  height={1200}
                  priority
                  sizes="(min-width:1024px) 40vw, 100vw"
                  className="rounded-2xl w-full h-auto"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
