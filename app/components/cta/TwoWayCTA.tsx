"use client";
import { ENROL_HREF, enrolLabel as label } from "@/app/lib/homeCta";
import { trackEvent } from "@/app/lib/gtag";
import { useOptionalCallModal } from "./CallModal";

export default function TwoWayCTA({ source, tone = "dark", enrolLabel, className = "" }: { source: string; tone?: "dark" | "light"; enrolLabel?: string; className?: string }) {
  const modal = useOptionalCallModal();
  const outline = tone === "dark" ? "border-2 border-white/30 text-white hover:bg-white/10" : "border-2 border-deep/30 text-deep hover:bg-deep/5";
  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`} data-cta-source={source}>
      <a href={ENROL_HREF} onClick={() => trackEvent("cta_click", { source, action: "enrol" })}
        className="px-8 py-4 rounded-full bg-gold text-deep font-bold text-base text-center hover:brightness-110 transition-all shadow-lg shadow-gold/20">
        {enrolLabel ?? label(false)}
      </a>
      {modal ? (
        <button type="button" onClick={() => { trackEvent("cta_click", { source, action: "call" }); modal.open(source); }}
          className={`px-8 py-4 rounded-full font-semibold text-base text-center transition-all ${outline}`}>
          Book a free call
        </button>
      ) : (
        // No CallModalProvider on this page: fall back to the call page.
        <a href="/book-call" onClick={() => trackEvent("cta_click", { source, action: "call" })}
          className={`px-8 py-4 rounded-full font-semibold text-base text-center transition-all ${outline}`}>
          Book a free call
        </a>
      )}
    </div>
  );
}
