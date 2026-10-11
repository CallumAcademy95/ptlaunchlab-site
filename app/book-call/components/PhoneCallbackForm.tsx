"use client";

import { useState, useRef } from "react";
import LeadForm from "@/app/components/LeadForm";
import { trackEvent } from "@/app/lib/gtag";
import FunnelPricingBlock from "@/app/components/FunnelPricingBlock";
import { WHATSAPP_DISPLAY } from "@/app/lib/contactDetails";

export default function PhoneCallbackForm() {
  const [submitted, setSubmitted] = useState(false);
  const startedRef = useRef(false);

  function handleStart() {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent("book_call_form_started", { call_type: "phone" });
  }

  // The lead is already saved and the Pixel Lead fired by submitLead. Here we
  // only keep the book-call analytics and the Meta Schedule event (+ its CAPI relay).
  function handleSuccess(_result: unknown, v: { name: string; phone: string; email: string }) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "book_call_form_submitted", call_type: "phone" });
    if (typeof window.gtag === "function") {
      window.gtag("event", "book_call_form_submitted", { call_type: "phone" });
    }
    const scheduleEventId =
      window.crypto?.randomUUID?.() ?? `schedule-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (typeof window.fbq === "function") {
      window.fbq("track", "Schedule", { content_category: "phone_callback" }, { eventID: scheduleEventId });
    }
    fetch("/api/capi-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: scheduleEventId, name: v.name, phone: v.phone, email: v.email, source: "phone_callback" }),
    }).catch((err) => console.warn("[book-call] CAPI schedule relay failed:", err));
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="py-8 px-2 md:px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/20 mb-5">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-gold">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="font-display font-extrabold text-3xl md:text-4xl text-white leading-none tracking-tight mb-3">
            Got your details.
          </h3>
          <p className="text-white/85 text-base md:text-lg max-w-xl mx-auto">
            Callum or Ryan will WhatsApp you shortly. Here&apos;s what to expect:
          </p>
        </div>

        {/* Timeline */}
        <ol className="max-w-md mx-auto space-y-4 mb-8">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gold/20 text-gold font-bold text-sm flex items-center justify-center mt-0.5">1</span>
            <div>
              <p className="text-white text-sm font-semibold">Within a few hours (business hours)</p>
              <p className="text-soft text-xs leading-relaxed mt-0.5">
                You&apos;ll get a WhatsApp from <strong className="text-white/80">{WHATSAPP_DISPLAY}</strong> — that&apos;s us. Save the number so it doesn&apos;t look like spam.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gold/20 text-gold font-bold text-sm flex items-center justify-center mt-0.5">2</span>
            <div>
              <p className="text-white text-sm font-semibold">Quick back-and-forth on WhatsApp</p>
              <p className="text-soft text-xs leading-relaxed mt-0.5">
                We&apos;ll find a time that suits you. No calendar wrestling.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gold/20 text-gold font-bold text-sm flex items-center justify-center mt-0.5">3</span>
            <div>
              <p className="text-white text-sm font-semibold">The call — 15 mins</p>
              <p className="text-soft text-xs leading-relaxed mt-0.5">
                Real conversation. No pressure. You decide what happens after.
              </p>
            </div>
          </li>
        </ol>

        <p className="text-center text-soft text-xs max-w-xs mx-auto mb-8">
          Didn&apos;t receive anything in 4 hrs (during business hours)? Email{" "}
          <a href="mailto:info@ptlaunchlab.co.uk" className="text-gold hover:underline">
            info@ptlaunchlab.co.uk
          </a>
          .
        </p>

        {/* While you wait — the two ways to pay. No discount or deadline:
            the price is the same for everyone (October 2026). */}
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-4">
            <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-1">
              While you wait for the call
            </p>
            <h4 className="font-display font-extrabold text-xl md:text-2xl text-white leading-tight tracking-tight">
              Here&apos;s how paying for the course works.
            </h4>
          </div>
          <FunnelPricingBlock />
        </div>
      </div>
    );
  }

  return (
    <div onFocus={handleStart}>
      <LeadForm
        intent="call"
        source="book_call_phone"
        tone="dark"
        question={{ label: "What would you like to talk about? (optional)" }}
        extra={{ page_url: typeof window !== "undefined" ? window.location.href : "" }}
        submitLabel="Request my callback →"
        onSuccess={handleSuccess}
        footnote={
          <>
            We&apos;ll WhatsApp you within a few hours during business hours from <strong className="text-white/70">{WHATSAPP_DISPLAY}</strong>. No pressure, no script.
          </>
        }
      />
    </div>
  );
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}
