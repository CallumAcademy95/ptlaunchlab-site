"use client";

import { trackEvent } from "@/app/lib/gtag";

// The "prefer to talk first?" link on /gym-partnership. A click is not
// a lead, so it no longer fires a Pixel Lead (that over-counted the gym
// campaign's optimisation event). It is recorded as a GA4 event only. For real
// booking attribution, add a Calendly webhook → CAPI. Goes to our own booking
// page once NEXT_PUBLIC_BOOKING_PROVIDER=crm; otherwise opens Calendly in a new tab.
const CRM = process.env.NEXT_PUBLIC_BOOKING_PROVIDER === "crm";

export default function CalendlyCallLink() {
  return (
    <a
      href={CRM ? "/book/gym-partner" : "https://calendly.com/ptlaunchlab-info/information-call"}
      {...(CRM ? {} : { target: "_blank", rel: "noopener noreferrer" })}
      onClick={() => trackEvent("partnership_call_click")}
      className="text-gold hover:underline font-semibold"
    >
      Book a 30-min partnership call →
    </a>
  );
}
