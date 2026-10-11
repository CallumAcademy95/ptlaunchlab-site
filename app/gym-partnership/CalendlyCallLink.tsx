"use client";

import { trackEvent } from "@/app/lib/gtag";

// The "prefer to talk first?" Calendly link on /gym-partnership. A click is not
// a lead, so it no longer fires a Pixel Lead (that over-counted the gym
// campaign's optimisation event). It is recorded as a GA4 event only. For real
// booking attribution, add a Calendly webhook → CAPI. Opens in a new tab.
export default function CalendlyCallLink() {
  return (
    <a
      href="https://calendly.com/ptlaunchlab-info/information-call"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("partnership_call_click")}
      className="text-gold hover:underline font-semibold"
    >
      Book a 15-min partnership call →
    </a>
  );
}
