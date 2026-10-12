"use client";
import { ENROL_HREF, ctaClickEvents, enrolLabel as label, type GaEvent } from "@/app/lib/homeCta";
import { trackEvent } from "@/app/lib/gtag";
import CallLink from "./CallLink";

const send = (events: ReturnType<typeof ctaClickEvents>) => events.forEach(([name, params]) => trackEvent(name, params));

/**
 * Enrol now + Book a free call. Both are links in the static HTML; inside a
 * CallModalProvider the call link opens the pop-up instead of navigating.
 * @param legacy  Old GA events to send alongside cta_click (see LEGACY_EVENTS).
 */
export default function TwoWayCTA({
  source,
  tone = "dark",
  enrolLabel,
  className = "",
  legacy,
}: {
  source: string;
  tone?: "dark" | "light";
  enrolLabel?: string;
  className?: string;
  legacy?: { enrol?: GaEvent; call?: GaEvent };
}) {
  const outline = tone === "dark" ? "border-2 border-white/30 text-white hover:bg-white/10" : "border-2 border-deep/30 text-deep hover:bg-deep/5";
  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`} data-cta-source={source}>
      <a href={ENROL_HREF} onClick={() => send(ctaClickEvents(source, "enrol", legacy?.enrol))}
        className="px-8 py-4 rounded-full bg-gold text-deep font-bold text-base text-center hover:brightness-110 transition-all shadow-lg shadow-gold/20">
        {enrolLabel ?? label(false)}
      </a>
      <CallLink source={source} onClick={() => send(ctaClickEvents(source, "call", legacy?.call))}
        className={`px-8 py-4 rounded-full font-semibold text-base text-center transition-all ${outline}`}>
        Book a free call
      </CallLink>
    </div>
  );
}
