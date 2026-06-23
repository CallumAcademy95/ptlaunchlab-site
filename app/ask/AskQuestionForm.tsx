"use client";

import { useState } from "react";
import { trackEvent } from "@/app/lib/gtag";
import { useFormSecurity } from "@/app/lib/security/client";

// ─────────────────────────────────────────────────────────────────────────────
// AskQuestionForm
//
// The /ask form — reached from the live-event confirmation + reminder emails.
// Email + question (name optional). Posts to /api/live-question → Zapier,
// tagged with the current event so the host can review before going live.
// Kept separate from registration so it never competes with the signup.
// ─────────────────────────────────────────────────────────────────────────────

export default function AskQuestionForm() {
  const sec = useFormSecurity();
  const [form, setForm] = useState({ name: "", email: "", question: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/live-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, [sec.SEC_KEY]: sec.payload() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Something went wrong.");
      trackEvent("live_question_submitted", { source: "ask-page" });
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
        <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-3">Question received</p>
        <h3 className="text-white font-bold text-2xl md:text-3xl mb-2">Cheers — we&apos;ve got it 🙌</h3>
        <p className="text-soft/80 text-base leading-relaxed mb-6">
          We read every question and answer the best ones live on the night. Got another? Send it over.
        </p>
        <button
          type="button"
          onClick={() => {
            setForm({ name: "", email: form.email, question: "" });
            setSubmitted(false);
          }}
          className="inline-block text-center px-7 py-3 rounded-full border border-gold/50 text-gold font-bold text-sm hover:bg-gold/10 transition-all"
        >
          Ask Another →
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-white/[0.08] rounded-2xl p-6 md:p-7 max-w-2xl mx-auto shadow-xl"
    >
      <sec.Honeypot />
      <div className="space-y-3 mb-3">
        <input
          type="email"
          required
          placeholder="Your email (so we know it's you)"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full bg-base border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder-soft/50 focus:outline-none focus:border-gold/60 transition-colors text-base"
        />
        <input
          type="text"
          placeholder="Your name (optional)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full bg-base border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder-soft/50 focus:outline-none focus:border-gold/60 transition-colors text-base"
        />
        <textarea
          required
          rows={4}
          placeholder="What do you want the panel to tackle?"
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
          className="w-full bg-base border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder-soft/50 focus:outline-none focus:border-gold/60 transition-colors text-base resize-y"
        />
      </div>
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full py-4 rounded-full bg-gold text-deep font-bold text-base hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-gold/30"
      >
        {busy ? "Sending…" : "Send My Question →"}
      </button>
      <p className="text-soft/55 text-[11px] text-center mt-3">
        We answer the best questions live · One question per submission works best
      </p>
    </form>
  );
}
