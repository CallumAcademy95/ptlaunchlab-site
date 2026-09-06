"use client";
import { useRef, useState } from "react";

// Homepage VSL. Click-to-play with sound rather than muted autoplay: the cut
// has no burned-in captions (they covered the graphics on 16:9), so a silent
// loop would say nothing. The poster is the first hook frame and the play
// button is the only affordance until the visitor chooses to watch.
//
// Two encodes. Phones get the 720p file (1.8 MB); everything else the 1080p
// (3.1 MB). The choice is made on the click, not at render, so the server
// markup is identical for every visitor and nothing is downloaded until
// they ask for it.

const SOURCES = {
  hd: "/video/homepage-vsl-1080.mp4",
  sd: "/video/homepage-vsl-720.mp4",
};
const POSTER = "/video/homepage-vsl-poster.jpg";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"idle" | "playing" | "ended">("idle");

  const play = () => {
    const v = videoRef.current;
    if (!v) return;
    if (!v.getAttribute("src")) {
      const small = window.matchMedia("(max-width: 767px)").matches;
      v.src = small ? SOURCES.sd : SOURCES.hd;
    }
    v.currentTime = 0;
    v.muted = false;
    void v.play();
    setState("playing");
    if (state === "idle") {
      window.gtag?.("event", "video_play", { video_title: "homepage_vsl" });
      window.fbq?.("trackCustom", "VSLPlay", { content_name: "homepage_vsl" });
    }
  };

  return (
    <div className="flex justify-center items-center animate-fade-in-up animate-delay-200 mt-2 lg:mt-0">
      <div className="relative w-full">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold/25 to-blue/15 blur-2xl scale-105" />

        {/* Card */}
        <div className="relative z-0 rounded-2xl border border-white/15 overflow-hidden shadow-2xl shadow-black/50 w-full aspect-video bg-deep">
          <video
            ref={videoRef}
            poster={POSTER}
            preload="none"
            playsInline
            controls={state !== "idle"}
            onEnded={() => setState("ended")}
            className="absolute inset-0 w-full h-full object-cover"
            aria-label="What PT Launch Lab actually is, in 47 seconds"
          />

          {state !== "playing" && (
            <button
              type="button"
              onClick={play}
              className="group absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold/60"
              aria-label={state === "ended" ? "Replay the video" : "Play the video: what PT Launch Lab actually is"}
            >
              <span className="absolute inset-0 bg-deep/25 group-hover:bg-deep/10 transition-colors" />
              <span className="relative flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-gold text-deep shadow-xl shadow-gold/30 group-hover:scale-105 transition-transform">
                {state === "ended" ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
                    <path d="M3 12a9 9 0 1 0 3-6.7" />
                    <path d="M3 4v5h5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9 translate-x-[3px]">
                    <path d="M7 4.5v15l13-7.5z" />
                  </svg>
                )}
              </span>
              <span className="relative px-4 py-1.5 rounded-full bg-deep/70 backdrop-blur-sm text-white text-xs font-semibold tracking-wide">
                {state === "ended" ? "Watch again" : "What we actually are · 47 sec · sound on"}
              </span>
            </button>
          )}

          {/* Top accent line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent z-20 pointer-events-none" />
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
