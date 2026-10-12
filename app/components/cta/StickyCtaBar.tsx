"use client";

import { useEffect, useState } from "react";
import { useCallModal } from "./callModalContext";
import CallLink from "./CallLink";
import { ENROL_HREF, enrolLabel } from "@/app/lib/homeCta";
import { trackEvent } from "@/app/lib/gtag";

// Mobile-only bar. Shows once the watched hero CTA has scrolled off the top
// (or, with no hero to watch, after 400px of scroll),
// hides while the call pop-up is open, and broadcasts its visibility so the
// chat bubble can lift clear of it.
//
// It stays mounted when hidden (slid down, inert, aria-hidden) so the pop-up
// can hand focus back to "Book a call" on close. The pop-up state comes from
// context, so the bar is un-inerted in the same commit the dialog closes,
// before the dialog's cleanup restores focus.
export default function StickyCtaBar({
  watchSelector,
  source = "home-sticky",
}: {
  watchSelector?: string;
  source?: string;
}) {
  const { isOpen: modalOpen } = useCallModal();
  const [heroOut, setHeroOut] = useState(false);

  useEffect(() => {
    const el = watchSelector ? document.querySelector(watchSelector) : null;
    if (el) {
      const io = new IntersectionObserver(([entry]) => {
        setHeroOut(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      });
      io.observe(el);
      return () => io.disconnect();
    }
    // No hero to watch (any page but the home page): show after 400px of scroll.
    const onScroll = () => setHeroOut(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [watchSelector]);

  const visible = heroOut && !modalOpen;

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("ptll:sticky-cta", { detail: { visible } }));
  }, [visible]);

  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent("ptll:sticky-cta", { detail: { visible: false } }));
    };
  }, []);

  return (
    <div
      inert={!visible}
      aria-hidden={!visible}
      className={`fixed bottom-0 inset-x-0 z-50 md:hidden bg-deep/95 backdrop-blur-md border-t border-white/[0.08] px-4 pt-3 flex gap-3 transition-[transform,opacity] duration-200 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      }`}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <a
        href={ENROL_HREF}
        onClick={() => trackEvent("cta_click", { source, action: "enrol" })}
        className="flex-1 text-center py-3 rounded-full bg-gold text-deep font-bold text-sm"
      >
        {enrolLabel(true)}
      </a>
      <CallLink
        source={source}
        onClick={() => trackEvent("cta_click", { source, action: "call" })}
        className="flex-1 text-center py-3 rounded-full border border-gold/60 text-gold font-semibold text-sm"
      >
        Book a call
      </CallLink>
    </div>
  );
}
