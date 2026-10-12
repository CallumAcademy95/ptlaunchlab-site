"use client";
import { useState } from "react";
import Image from "next/image";

// Click-to-play video. Until the visitor clicks, the page carries only a
// poster image (next/image, lazy) and a button: no video element, no iframe, no
// player JavaScript and no bytes of video. The click swaps in the real player
// with autoplay, so one click starts playback.

// Window.gtag / Window.fbq types live here (moved from VslPlayer.tsx, which
// the home page no longer renders). Identical declarations elsewhere merge.
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

type Source =
  | { kind: "file"; src: string; srcSmall?: string }
  | { kind: "youtube"; id: string };

export default function ClickToPlay({
  source,
  poster,
  title,
  label,
  trackAs,
  metaEvent,
  sizes = "(min-width:1024px) 50vw, 100vw",
}: {
  source: Source;
  poster: string;
  /** Accessible name of the player, e.g. "Gemma's story". */
  title: string;
  /** Short line shown under the play icon, e.g. "47 sec · sound on". */
  label?: string;
  /** video_title sent with the GA4 video_play event. */
  trackAs: string;
  /** Meta Pixel custom event fired on first play, e.g. "VSLPlay". */
  metaEvent?: string;
  sizes?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [fileSrc, setFileSrc] = useState<string | null>(null);

  const play = () => {
    if (source.kind === "file") {
      const small = !!source.srcSmall && window.matchMedia("(max-width: 767px)").matches;
      setFileSrc(small ? source.srcSmall! : source.src);
    }
    setPlaying(true);
    window.gtag?.("event", "video_play", { video_title: trackAs });
    if (metaEvent) window.fbq?.("trackCustom", metaEvent, { content_name: trackAs });
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl shadow-black/50 aspect-video bg-deep">
      {playing ? (
        source.kind === "file" ? (
          <video
            src={fileSrc ?? source.src}
            controls
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            aria-label={title}
          />
        ) : (
          <iframe
            src={`https://www.youtube.com/embed/${source.id}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        )
      ) : (
        <button
          type="button"
          onClick={play}
          className="group absolute inset-0 flex items-end justify-start p-3 md:p-5 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold/60"
          aria-label={`Play the video: ${title}`}
        >
          <Image src={poster} alt="" fill sizes={sizes} className="object-cover" />
          {/* Control sits bottom-left so the poster's own title stays readable. */}
          <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-deep/70 to-transparent" aria-hidden="true" />
          <span className="relative flex items-center gap-3">
            <span className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-gold text-deep shadow-xl shadow-gold/30 group-hover:scale-105 transition-transform" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 md:w-8 md:h-8 translate-x-[2px]">
                <path d="M7 4.5v15l13-7.5z" />
              </svg>
            </span>
            {label && (
              <span className="whitespace-nowrap px-3 py-1.5 rounded-full bg-deep/80 backdrop-blur-sm text-white text-xs font-semibold tracking-wide">
                {label}
              </span>
          )}
          </span>
        </button>
      )}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold/60 to-transparent pointer-events-none" aria-hidden="true" />
    </div>
  );
}
