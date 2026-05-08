"use client";

import { useState, FormEvent } from "react";

const ZAPIER_HOOK = process.env.NEXT_PUBLIC_ZAPIER_PHONE_CALLBACK_HOOK || "";

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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const mobile = String(data.get("mobile") || "").trim();
    const availability = String(data.get("availability") || "").trim();
    const topics = String(data.get("topics") || "").trim();

    if (!name || !mobile) {
      setError("Please enter your name and mobile number.");
      setSubmitting(false);
      return;
    }

    const firstTouch = readTouch("ptll_first_touch");
    const lastTouch = readTouch("ptll_last_touch");

    const payload = {
      call_type: "phone",
      name,
      mobile,
      availability,
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
      if (!ZAPIER_HOOK) {
        throw new Error("Form endpoint not configured. Please WhatsApp us instead.");
      }
      // Form-encoded body (not JSON) — keeps the request CORS-simple so
      // the browser skips preflight, which Zapier's catch hook does not
      // fully support. Zapier parses application/x-www-form-urlencoded
      // identically to JSON for catch hooks.
      const body = new URLSearchParams();
      Object.entries(payload).forEach(([k, v]) => {
        body.append(k, String(v ?? ""));
      });
      const res = await fetch(ZAPIER_HOOK, {
        method: "POST",
        body,
      });
      if (!res.ok) {
        throw new Error("Submission failed");
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
      if (typeof window.fbq === "function") {
        window.fbq("track", "Lead", { content_category: "phone_callback" });
      }

      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message + " Please try again, or WhatsApp us at +44 7822 012186.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12 px-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/20 mb-6">
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
        <h3 className="font-display font-extrabold text-3xl md:text-4xl text-white leading-none tracking-tight mb-4">
          Got your details.
        </h3>
        <p className="text-white/80 text-lg max-w-xl mx-auto mb-3">
          Callum or Ryan will WhatsApp you within a few hours during business hours to lock in a time that suits you.
        </p>
        <p className="text-soft text-sm max-w-xl mx-auto">
          Keep an eye on your messages — we&apos;ll text the mobile you gave us. No spam, no script.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
        <label htmlFor="availability" className="block text-white text-sm font-semibold mb-2">
          Best days/times to reach you
        </label>
        <input
          id="availability"
          name="availability"
          type="text"
          maxLength={120}
          className="w-full px-4 py-3 rounded-lg bg-base/60 border border-white/15 text-white placeholder:text-soft focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 transition-colors"
          placeholder="e.g. weekday evenings, Sat morning"
        />
      </div>

      <div>
        <label htmlFor="topics" className="block text-white text-sm font-semibold mb-2">
          What would you like to cover on the call?
        </label>
        <textarea
          id="topics"
          name="topics"
          rows={4}
          maxLength={1000}
          className="w-full px-4 py-3 rounded-lg bg-base/60 border border-white/15 text-white placeholder:text-soft focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40 resize-none transition-colors"
          placeholder="Anything on your mind — worries, questions, what you want to figure out. Doesn't need to be polished."
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
        We&apos;ll WhatsApp you within a few hours during business hours to lock in a time. No pressure, no script — just a real conversation.
      </p>
    </form>
  );
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}
