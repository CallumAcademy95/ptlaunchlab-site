"use client";

import { useState } from "react";
import { trackEvent } from "@/app/lib/gtag";
import { useFormSecurity } from "@/app/lib/security/client";

// ─────────────────────────────────────────────────────────────────────────────
// LiveRegisterForm
//
// Email-gate for the monthly live webinar/podcast. Name + email required,
// phone optional (joins the WhatsApp reminders if given). Posts to
// /api/live-register → Zapier → "Live Sessions" MailerLite segment, fires the
// browser fbq Lead (deduped server-side via shared event_id), then reveals the
// private stream link inline + an add-to-calendar button. The lead is in the
// reminder sequence regardless of whether they click straight through.
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  /** Add-to-Google-Calendar URL, prebuilt server-side from the event time. */
  calendarUrl: string;
  /** Human-readable event date/time line, e.g. "Thursday 24 July · 7:30pm". */
  whenLabel: string;
};

export default function LiveRegisterForm({ calendarUrl, whenLabel }: Props) {
  const sec = useFormSecurity();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const eventId =
      typeof window !== "undefined" && window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `live-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const res = await fetch("/api/live-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, event_id: eventId, [sec.SEC_KEY]: sec.payload() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Something went wrong.");

      // Only fire the Lead for real registrations (silent bot drops return lead:false).
      if (data.lead !== false) {
        trackEvent("live_register_submitted", { source: "live-page" });
        if (typeof window !== "undefined" && (window as { fbq?: (...args: unknown[]) => void }).fbq) {
          (window as { fbq: (...args: unknown[]) => void }).fbq(
            "track",
            "Lead",
            { content_name: "live_webinar_registration", content_category: "live-sessions" },
            { eventID: eventId },
          );
        }
      }

      if (typeof data.streamUrl === "string" && data.streamUrl) {
        setStreamUrl(data.streamUrl);
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-card border-2 border-gold/60 rounded-2xl p-7 md:p-8 max-w-2xl mx-auto shadow-xl shadow-gold/10 text-center">
        <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-3">You&apos;re on the list</p>
        <h3 className="text-white font-bold text-2xl md:text-3xl mb-2">Your seat is saved 🎟️</h3>
        <p className="text-soft/80 text-base leading-relaxed mb-6">
          We&apos;ve emailed you the link and we&apos;ll remind you before we go live. Mark it in your diary:{" "}
          <span className="text-white font-semibold">{whenLabel}</span>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-cta="live-add-calendar"
            className="inline-block text-center px-7 py-3.5 rounded-full border border-white/20 text-white font-bold text-base hover:bg-white/[0.06] transition-all"
          >
            Add to Calendar
          </a>
          {streamUrl && (
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-cta="live-stream-link"
              className="inline-block text-center px-8 py-3.5 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-gold/30"
            >
              Save Your Watch Link →
            </a>
          )}
        </div>
        <div className="mt-7 pt-6 border-t border-white/[0.08]">
          <p className="text-white font-semibold text-base mb-1">Got a question for the panel?</p>
          <p className="text-soft/75 text-sm leading-relaxed mb-4">
            Submit it now and we&apos;ll answer the best ones live on the night.
          </p>
          <a
            href="/ask"
            data-cta="live-ask-question"
            className="inline-block text-center px-7 py-3 rounded-full border border-gold/50 text-gold font-bold text-sm hover:bg-gold/10 transition-all"
          >
            Submit a Question →
          </a>
        </div>
        <p className="text-soft/55 text-[12px] mt-6">
          Can&apos;t make it live? Register anyway — we&apos;ll send you the podcast episode a week later.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-white/[0.08] rounded-2xl p-6 md:p-7 max-w-2xl mx-auto shadow-xl"
    >
      <p className="text-gold text-[11px] font-bold tracking-widest uppercase text-center mb-4">
        Free · Live · Mailing-list only
      </p>
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
          type="email"
          required
          placeholder="Email (where we send your link)"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full bg-base border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder-soft/50 focus:outline-none focus:border-gold/60 transition-colors text-base"
        />
        <input
          type="tel"
          placeholder="Mobile (optional — for WhatsApp reminders)"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full bg-base border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder-soft/50 focus:outline-none focus:border-gold/60 transition-colors text-base"
        />
      </div>
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-gold/30"
      >
        {busy ? "Saving your seat…" : "Save My Free Seat →"}
      </button>
      <p className="text-soft/55 text-[11px] text-center mt-3">
        We&apos;ll email you the watch link · No spam · Unsubscribe any time
      </p>
    </form>
  );
}
