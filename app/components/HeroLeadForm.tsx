"use client";

import { useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/app/lib/gtag";
import LeadForm from "./LeadForm";

// ─────────────────────────────────────────────────────────────────────────────
// HeroLeadForm
//
// Inline 3-field lead capture for avatar-targeted Meta ads landing pages.
// Saves through /api/lead (intent prospectus), the same door as the prospectus
// modal, so the existing Zapier / email-server warm-up wiring is unchanged.
//
// On success the form swaps to an inline thank-you state with a high-intent
// "Book Your Call" CTA. The lead is in the warm-up sequence regardless of
// whether they click through.
//
// October 2026 change-over: no promo, no countdown, no "priority intake".
// Enrolment is rolling and the price is the same for everyone.
//
// Avatar prop is for analytics attribution (lead_capture_submitted variant).
// ─────────────────────────────────────────────────────────────────────────────

type Avatar = "starter" | "switcher" | "returner";

const COPY: Record<Avatar, { eyebrow: string; submit: string; busy: string; thankHeadline: string; thankBody: string }> = {
  starter: {
    eyebrow: "Straight answer in 60 seconds",
    submit: "Start My PT Career →",
    busy: "One sec…",
    thankHeadline: "You're in.",
    thankBody: "We'll be in touch shortly. While you're here — book your free 15-min call so we can map the route in person.",
  },
  switcher: {
    eyebrow: "See if it works for your situation — no pressure",
    submit: "See How It Works →",
    busy: "One sec…",
    thankHeadline: "You're in.",
    thankBody: "We'll be in touch shortly. Book a 15-min call below and we'll walk through your exact transition plan.",
  },
  returner: {
    eyebrow: "Honest answers, no pressure",
    submit: "I'm Ready to Hear More →",
    busy: "One sec…",
    thankHeadline: "Got it — thank you.",
    thankBody: "We'll be in touch shortly. If you'd like to talk it through, book a no-pressure 15-min chat below.",
  },
};

export default function HeroLeadForm({ avatar }: { avatar: Avatar }) {
  const copy = COPY[avatar];
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="bg-card border-2 border-gold/60 rounded-2xl p-7 md:p-8 max-w-2xl mx-auto shadow-xl shadow-gold/10">
        <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-3">Thanks — we&apos;ve got your details</p>
        <h3 className="text-white font-bold text-xl md:text-2xl mb-2">{copy.thankHeadline}</h3>
        <p className="text-soft/80 text-base leading-relaxed mb-6">{copy.thankBody}</p>
        <Link
          href="/book-call"
          data-cta="hero-form-thanks"
          className="block w-full sm:w-auto sm:inline-block text-center px-8 py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-gold/30"
        >
          Book Your Free 15-Min Call →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card border border-white/[0.08] rounded-2xl p-6 md:p-7 max-w-2xl mx-auto shadow-xl">
      <p className="text-gold text-[11px] font-bold tracking-widest uppercase text-center mb-4">{copy.eyebrow}</p>
      <LeadForm
        intent="prospectus"
        source={`vsl_hero_${avatar}`}
        tone="dark"
        extra={{ avatar }}
        submitLabel={copy.submit}
        onSuccess={() => {
          trackEvent("lead_capture_submitted", { avatar, source: "hero-form" });
          setSubmitted(true);
        }}
        footnote="We'll be in touch with a quick intro · No spam · Unsubscribe any time"
      />
    </div>
  );
}
