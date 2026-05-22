"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/app/lib/gtag";
import { useFormSecurity } from "@/app/lib/security/client";

// ─────────────────────────────────────────────────────────────────────────────
// HeroLeadForm
//
// Inline 3-field lead capture for avatar-targeted Meta ads landing pages.
// Submits to /api/prospectus — same endpoint as the prospectus modal — so it
// re-uses the existing Zapier → MailerLite → WhatsApp warm-up wiring AND sets
// the 48h £200 funnel-promo cookie on success.
//
// On success the form swaps to an inline thank-you state showing the
// countdown + a high-intent "Book Your Call" CTA. The lead is in the warm-up
// sequence regardless of whether they click through.
//
// Avatar prop is for analytics attribution (lead_capture_submitted variant).
// ─────────────────────────────────────────────────────────────────────────────

type Avatar = "starter" | "switcher" | "returner";

const COPY: Record<Avatar, { eyebrow: string; submit: string; busy: string; thankHeadline: string; thankBody: string }> = {
  starter: {
    eyebrow: "Lock in your £200 off — straight answer in 60 secs",
    submit: "Start My PT Career →",
    busy: "One sec…",
    thankHeadline: "You're in. £200 off is locked.",
    thankBody: "We'll text you on WhatsApp shortly. While you're here — book your free 15-min call so we can map the route in person.",
  },
  switcher: {
    eyebrow: "See if it works for your situation — no pressure",
    submit: "See How It Works →",
    busy: "One sec…",
    thankHeadline: "You're in. £200 off is locked.",
    thankBody: "We'll WhatsApp you with a quick intro shortly. Book a 15-min call below and we'll walk through your exact transition plan.",
  },
  returner: {
    eyebrow: "Honest answers + your £200 off locked in",
    submit: "I'm Ready to Hear More →",
    busy: "One sec…",
    thankHeadline: "Got it — and your £200 off is locked.",
    thankBody: "We'll WhatsApp you a kind hello shortly. If you'd like to talk it through, book a no-pressure 15-min chat below.",
  },
};

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function HeroLeadForm({ avatar }: { avatar: Avatar }) {
  const copy = COPY[avatar];
  const sec = useFormSecurity();
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!submitted) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [submitted]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/prospectus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, [sec.SEC_KEY]: sec.payload() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Something went wrong.");
      trackEvent("lead_capture_submitted", { avatar, source: "hero-form" });
      // Poll status to get authoritative expiresAt
      try {
        const s = await fetch("/api/funnel-promo/status", { cache: "no-store" }).then((r) => r.json());
        if (s?.active && s.expiresAt) setExpiresAt(s.expiresAt);
      } catch {
        /* non-fatal */
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    const secondsRemaining = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : null;
    return (
      <div className="bg-card border-2 border-gold/60 rounded-2xl p-7 md:p-8 max-w-2xl mx-auto shadow-xl shadow-gold/10">
        <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-3">£200 off · expires in</p>
        <p className="font-display font-extrabold text-5xl md:text-6xl text-white leading-none tracking-tight mb-5 tabular-nums">
          {secondsRemaining !== null ? formatCountdown(secondsRemaining) : "48:00:00"}
        </p>
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
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-white/[0.08] rounded-2xl p-6 md:p-7 max-w-2xl mx-auto shadow-xl"
    >
      <p className="text-gold text-[11px] font-bold tracking-widest uppercase text-center mb-4">{copy.eyebrow}</p>
      <sec.Honeypot />
      <div className="space-y-3 mb-3">
        <input
          type="text"
          required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full bg-base border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder-soft/50 focus:outline-none focus:border-gold/60 transition-colors text-base"
        />
        <input
          type="tel"
          required
          placeholder="Mobile (we'll WhatsApp you)"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full bg-base border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder-soft/50 focus:outline-none focus:border-gold/60 transition-colors text-base"
        />
        <input
          type="email"
          required
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full bg-base border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder-soft/50 focus:outline-none focus:border-gold/60 transition-colors text-base"
        />
      </div>
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-gold/30"
      >
        {busy ? copy.busy : copy.submit}
      </button>
      <p className="text-soft/55 text-[11px] text-center mt-3">
        We&apos;ll WhatsApp you with a quick intro · No spam · Unsubscribe any time
      </p>
    </form>
  );
}
