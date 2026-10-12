"use client";

import { useEffect, useState } from "react";
import { useCallModal } from "@/app/components/cta/CallModal";
import { ENROL_HREF, enrolLabel } from "@/app/lib/homeCta";
import { trackEvent } from "@/app/lib/gtag";

// Mobile-only bar. Shows once the watched hero CTA has scrolled off the top,
// hides while the call pop-up is open, and broadcasts its visibility so the
// chat bubble can lift clear of it.
export default function StickyCtaBar({ watchSelector }: { watchSelector: string }) {
  const { open } = useCallModal();
  const [heroOut, setHeroOut] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const el = document.querySelector(watchSelector);
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      setHeroOut(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [watchSelector]);

  useEffect(() => {
    const onModal = (e: Event) => setModalOpen(Boolean((e as CustomEvent<{ open: boolean }>).detail?.open));
    window.addEventListener("ptll:call-modal", onModal);
    return () => window.removeEventListener("ptll:call-modal", onModal);
  }, []);

  const visible = heroOut && !modalOpen;

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("ptll:sticky-cta", { detail: { visible } }));
  }, [visible]);

  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent("ptll:sticky-cta", { detail: { visible: false } }));
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-deep/95 backdrop-blur-md border-t border-white/[0.08] px-4 pt-3 flex gap-3"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <a
        href={ENROL_HREF}
        onClick={() => trackEvent("cta_click", { source: "home-sticky", action: "enrol" })}
        className="flex-1 text-center py-3 rounded-full bg-gold text-deep font-bold text-sm"
      >
        {enrolLabel(true)}
      </a>
      <button
        type="button"
        onClick={() => {
          trackEvent("cta_click", { source: "home-sticky", action: "call" });
          open("home-sticky");
        }}
        className="flex-1 text-center py-3 rounded-full border border-gold/60 text-gold font-semibold text-sm"
      >
        Book a call
      </button>
    </div>
  );
}
