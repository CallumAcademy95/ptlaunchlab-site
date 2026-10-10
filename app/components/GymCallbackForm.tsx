"use client";

import { useState, type FormEvent } from "react";
import { useFormSecurity } from "@/app/lib/security/client";
import { GYM_CALLBACK_CONSENT_TEXT } from "@/app/lib/gymCallback";

// "Not ready yet? Leave your number and the academy team will ring you."
//
// On every gym academy page. Posts to /api/gym-callback, which forwards the
// lead with the gym's slug so a later enrolment can be credited to the gym.
// White-label: member-facing copy says "the academy team", never our name.

function readTouch(key: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export default function GymCallbackForm({
  gymSlug,
  gymName,
  accent,
}: {
  gymSlug: string;
  gymName: string;
  accent: string;
}) {
  const sec = useFormSecurity();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    setError("");
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError("Please add your name, phone number and email.");
      return;
    }
    if (!consent) {
      setError("Please tick the box so the academy team can contact you.");
      return;
    }
    setSending(true);
    try {
      const first = readTouch("ptll_first_touch");
      const last = readTouch("ptll_last_touch");
      const res = await fetch("/api/gym-callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          consent: true,
          gymSlug,
          page_url: window.location.href,
          utm: {
            first_source: first.utm_source,
            first_medium: first.utm_medium,
            first_campaign: first.utm_campaign,
            last_source: last.utm_source,
          },
          [sec.SEC_KEY]: sec.payload(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error || "Something went wrong. Please try again.");
      setDone(true);
      if (typeof window.fbq === "function") window.fbq("track", "Lead", { content_category: "gym_callback" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const field =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-gray-400";

  return (
    <section id="ring-me" className="bg-white py-16 md:py-20">
      <div className="max-w-xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-black text-black uppercase text-center mb-2">Not Ready Yet?</h2>
        <p className="text-center text-gray-500 mb-8">
          Leave your number and the academy team will ring you. No pressure, just answers.
        </p>

        {done ? (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
            <p className="text-black font-black text-lg mb-1">Thanks, {name.trim().split(/\s+/)[0]}.</p>
            <p className="text-gray-500 text-sm">The {gymName} academy team will ring you shortly.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3" noValidate>
            <sec.Honeypot />
            <input aria-label="Your name" autoComplete="name" className={field} placeholder="Your name"
              value={name} onChange={(e) => setName(e.target.value)} />
            <input aria-label="Phone number" type="tel" autoComplete="tel" className={field} placeholder="Phone number"
              value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input aria-label="Email address" type="email" autoComplete="email" className={field} placeholder="Email address"
              value={email} onChange={(e) => setEmail(e.target.value)} />
            <label className="flex items-start gap-3 text-xs text-gray-500 leading-relaxed">
              <input type="checkbox" className="mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>{GYM_CALLBACK_CONSENT_TEXT}</span>
            </label>
            {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={sending}
              className="w-full py-3.5 rounded-full font-black text-white text-sm uppercase tracking-wide hover:opacity-90 transition-all disabled:opacity-60"
              style={{ backgroundColor: accent }}>
              {sending ? "Sending…" : "Ring Me →"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
