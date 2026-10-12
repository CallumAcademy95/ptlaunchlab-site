"use client";
import StickyCtaBar from "./cta/StickyCtaBar";

// Mobile and tablet sticky bar. Pass watchSelector to show it only once that
// element (normally the hero's buttons) has scrolled off the top.
export default function StickyMobileCTA({ watchSelector }: { watchSelector?: string } = {}) {
  return <StickyCtaBar source="sticky" hideFrom="lg" watchSelector={watchSelector} />;
}
