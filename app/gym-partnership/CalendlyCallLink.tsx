"use client";

// The "prefer to talk first?" Calendly link on /gym-partnership. Booking a call
// is a genuine gym-partnership conversion, but Calendly is off-site so no Pixel
// event would ever fire for it — which is how the campaign's real calls went
// unattributed. We fire a browser Lead on click so the intent registers and the
// gym campaign (which optimises on Lead) gets the signal.
//
// NOTE: this fires on CLICK, not on a completed Calendly booking — it slightly
// over-counts vs. actual bookings. For exact booking attribution, add a Calendly
// webhook → CAPI Lead. It opens in a new tab (target=_blank) so the current page
// isn't unloaded and fbq fires reliably.
export default function CalendlyCallLink() {
  function handleClick() {
    if (typeof window.fbq === "function") {
      window.fbq("track", "Lead", {
        content_category: "gym_partnership",
        content_name: "calendly_call_click",
      });
    }
  }

  return (
    <a
      href="https://calendly.com/ptlaunchlab-info/information-call"
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="text-gold hover:underline font-semibold"
    >
      Book a 15-min partnership call →
    </a>
  );
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}
