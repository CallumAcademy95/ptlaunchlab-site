"use client";

import { useState, useRef, FormEvent } from "react";
import { trackEvent } from "@/app/lib/gtag";
import FunnelPricingBlock from "@/app/components/FunnelPricingBlock";
import { WHATSAPP_DISPLAY } from "@/app/lib/contactDetails";


type Touch = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  gclid?: string;
  msclkid?: string;
  ttclid?: string;
  landing_path?: string;
  referrer?: string;
};

function readTouch(key: string): Touch {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Touch) : {};
  } catch {
    return {};
  }
}

export default function PhoneCallbackForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  function handleStart() {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent("book_call_form_started", { call_type: "phone" });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const mobile = String(data.get("mobile") || "").trim();
    const email = String(data.get("email") || "").trim();
    const topics = String(data.get("topics") || "").trim();

    if (!name || !mobile || !email) {
      setError("Please enter your name, email and mobile number.");
      setSubmitting(false);
      return;
    }

    const firstTouch = readTouch("ptll_first_touch");
    const lastTouch = readTouch("ptll_last_touch");

    const payload = {
      call_type: "phone",
      name,
      mobile,
      email,
      topics,
      page_url: window.location.href,
      page_referrer: document.referrer,
      submitted_at: new Date().toISOString(),
      first_touch_source: firstTouch.utm_source || "(direct)",
      first_touch_medium: firstTouch.utm_medium || "(none)",
      first_touch_campaign: firstTouch.utm_campaign || "(none)",
      first_touch_content: firstTouch.utm_content || "",
      first_touch_landing: firstTouch.landing_path || "",
      first_touch_referrer: firstTouch.referrer || "",
      last_touch_source: lastTouch.utm_source || firstTouch.utm_source || "(direct)",
      last_touch_medium: lastTouch.utm_medium || firstTouch.utm_medium || "(none)",
      last_touch_campaign: lastTouch.utm_campaign || firstTouch.utm_campaign || "(none)",
      fbclid: firstTouch.fbclid || lastTouch.fbclid || "",
      gclid: firstTouch.gclid || lastTouch.gclid || "",
    };

    try {
      // Posts to OUR origin, not hooks.zapier.com. The direct-to-Zapier call
      // this replaces was blocked before it left the device by ad blockers,
      // privacy browsers, DNS filters and some carrier networks — every one of
      // which has hooks.zapier.com on a list — and surfaced to the visitor as a
      // raw "Failed to fetch" on the form we most need to work. The route
      // forwards to the same Zapier hook server-side and emails the request to
      // the team inbox, so a blocked or dead hook can no longer lose a lead.
      // Everything in the payload that isn't a field the route takes directly
      // rides along as attribution: utm/click-ids, landing path, referrer.
      const CORE = new Set(["call_type", "name", "mobile", "email", "topics"]);
      const attribution: Record<string, string> = {};
      for (const [k, v] of Object.entries(payload)) {
        if (!CORE.has(k)) attribution[k] = String(v ?? "");
      }
      const res = await fetch("/api/book-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobile, email, topics, attribution }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error ?? "Submission failed");
      }

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "book_call_form_submitted",
        call_type: "phone",
        first_touch_source: payload.first_touch_source,
        first_touch_medium: payload.first_touch_medium,
        first_touch_campaign: payload.first_touch_campaign,
        last_touch_source: payload.last_touch_source,
      });
      if (typeof window.gtag === "function") {
        window.gtag("event", "book_call_form_submitted", {
          call_type: "phone",
          first_touch_source: payload.first_touch_source,
          last_touch_source: payload.last_touch_source,
        });
      }
      // Shared event_id for browser fbq + server CAPI dedup on Meta's side.
      // Browser fires Schedule + Lead immediately; the server CAPI relay below
      // sends a matching Schedule event for iOS/Safari/ad-block recovery.
      const scheduleEventId =
        window.crypto?.randomUUID?.() ?? `schedule-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      if (typeof window.fbq === "function") {
        window.fbq(
          "track",
          "Schedule",
          { content_category: "phone_callback" },
          { eventID: scheduleEventId },
        );
        // Keep the legacy Lead event firing too — useful for any audience
        // still optimised on Lead rather than Schedule.
        window.fbq("track", "Lead", { content_category: "phone_callback" });
      }
      fetch("/api/capi-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: scheduleEventId,
          name,
          phone: mobile,
          email,
          source: "phone_callback",
        }),
      }).catch((err) => console.warn("[book-call] CAPI schedule relay failed:", err));

      // Fire and forget — issues the 48h £200 promo cookie so the
      // FunnelPricingBlock below renders the discounted state.
      fetch("/api/funnel-promo/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "book-call" }),
      }).catch((err) => console.warn("[book-call] promo cookie not set:", err));

      setSubmitted(true);
    } catch (err) {
      // A raw fetch TypeError reads "Failed to fetch", which tells the visitor
      // nothing and looks broken. Only show a message we wrote ourselves.
      const raw = err instanceof Error ? err.message : "";
      const known = raw && !/fetch|network|load failed/i.test(raw);
      const message = known ? raw : "Something went wrong sending your request.";
      setError(`${message.replace(/\.?$/, ".")} Please try again, or WhatsApp us at ${WHATSAPP_DISPLAY}.`);
    } finally {
      setSubmitting(false);
    }
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

        {/* PROMO — while-you-wait £200 incentive (48h cookie set on submit) */}
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-4">
            <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-1">
              While you wait for the call
            </p>
            <h4 className="font-display font-extrabold text-xl md:text-2xl text-white leading-tight tracking-tight">
              We&apos;ve unlocked a £200 discount for you.
            </h4>
          </div>
          <FunnelPricingBlock />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} onFocus={handleStart} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-white text-sm font-semibold mb-2">
          Your name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={80}
          className="w-full px-4 py-3 rounded-lg bg-base/60 border border-white/15 text-white placeholder:text-soft focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 transition-colors"
          placeholder="First name is fine"
        />
      </div>

      <div>
        <label htmlFor="mobile" className="block text-white text-sm font-semibold mb-2">
          Mobile number
        </label>
        <input
          id="mobile"
          name="mobile"
          type="tel"
          autoComplete="tel"
          required
          maxLength={20}
          className="w-full px-4 py-3 rounded-lg bg-base/60 border border-white/15 text-white placeholder:text-soft focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 transition-colors"
          placeholder="07..."
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-white text-sm font-semibold mb-2">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={120}
          className="w-full px-4 py-3 rounded-lg bg-base/60 border border-white/15 text-white placeholder:text-soft focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 transition-colors"
          placeholder="you@email.com"
        />
      </div>

      <div>
        <label htmlFor="topics" className="block text-white text-sm font-semibold mb-2">
          What&apos;s the one thing you&apos;d most like to cover?
        </label>
        <textarea
          id="topics"
          name="topics"
          rows={3}
          maxLength={1000}
          className="w-full px-4 py-3 rounded-lg bg-base/60 border border-white/15 text-white placeholder:text-soft focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 resize-none transition-colors"
          placeholder="A worry, a question, the thing keeping you stuck. A few words is enough."
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-200 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        data-cta="phone-callback-submit"
        className="w-full px-6 py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-gold/20"
      >
        {submitting ? "Sending..." : "Request my callback →"}
      </button>

      <p className="text-center text-soft text-xs leading-relaxed">
        We&apos;ll WhatsApp you within a few hours during business hours from <strong className="text-white/70">{WHATSAPP_DISPLAY}</strong>. No pressure, no script.
      </p>
    </form>
  );
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}
