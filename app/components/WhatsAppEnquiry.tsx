"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// WhatsAppEnquiry — USA-style click-to-WhatsApp enquiry.
// Composes a formatted message and opens the visitor's WhatsApp addressed to the
// main business number, so enquiries land directly in the normal WhatsApp app
// (NOT the Cloud API / admin inbox). Mirrors the Ultimate Shred site flow.
// ─────────────────────────────────────────────────────────────────────────────

const BUSINESS_WA = "447822012186"; // main business WhatsApp (app-based)

const INTERESTS = [
  { value: "career-change", label: "Changing career into PT" },
  { value: "getting-started", label: "Getting started / gym enthusiast" },
  { value: "already-in-fitness", label: "Already in fitness" },
  { value: "gym-partnership", label: "Gym partnership (I own/run a gym)" },
  { value: "not-sure", label: "Not sure yet" },
];

export default function WhatsAppEnquiry() {
  const [f, setF] = useState({ name: "", email: "", phone: "", interest: "", message: "" });

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [e.target.name]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = window as unknown as { fbq?: (...args: unknown[]) => void };
    if (typeof w.fbq === "function") w.fbq("track", "Lead", { content_name: "whatsapp_enquiry" });
    const interestLabel = INTERESTS.find((i) => i.value === f.interest)?.label || f.interest;
    const msg =
      `*New PT Launch Lab enquiry*\n\n` +
      `Name: ${f.name}\n` +
      `Email: ${f.email}\n` +
      `Phone: ${f.phone}\n` +
      `Interested in: ${interestLabel}` +
      (f.message ? `\n\nMessage:\n${f.message}` : "");
    window.open(`https://wa.me/${BUSINESS_WA}?text=${encodeURIComponent(msg)}`, "_blank");
    setF({ name: "", email: "", phone: "", interest: "", message: "" });
  };

  const field =
    "w-full bg-transparent border-b border-white/15 focus:border-gold text-white py-3.5 focus:outline-none placeholder-soft/40 transition-colors text-base";
  const lbl = "block text-soft/70 mb-1 text-[11px] font-bold tracking-widest uppercase";

  return (
    <form onSubmit={submit} className="space-y-1">
      {[
        { id: "name", label: "Your name", type: "text", ph: "Full name" },
        { id: "email", label: "Email address", type: "email", ph: "your@email.com" },
        { id: "phone", label: "Phone number", type: "tel", ph: "07XXX XXXXXX" },
      ].map((x) => (
        <div key={x.id} className="pb-2">
          <label htmlFor={x.id} className={lbl}>{x.label}</label>
          <input
            id={x.id}
            name={x.id}
            type={x.type}
            required
            value={f[x.id as keyof typeof f]}
            onChange={change}
            className={field}
            placeholder={x.ph}
          />
        </div>
      ))}

      <div className="pb-2 pt-2">
        <label htmlFor="interest" className={lbl}>Interested in</label>
        <select id="interest" name="interest" required value={f.interest} onChange={change} className={`${field} cursor-pointer`}>
          <option value="" disabled className="bg-base">Select an option</option>
          {INTERESTS.map((i) => (
            <option key={i.value} value={i.value} className="bg-base">{i.label}</option>
          ))}
        </select>
      </div>

      <div className="pb-2 pt-2">
        <label htmlFor="message" className={lbl}>Message (optional)</label>
        <textarea
          id="message"
          name="message"
          rows={3}
          value={f.message}
          onChange={change}
          className={`${field} resize-none`}
          placeholder="Tell us where you're at and what you want to know..."
        />
      </div>

      <div className="pt-6">
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2.5 bg-gold hover:brightness-110 text-deep py-4 font-bold text-base rounded-full transition-all shadow-lg shadow-gold/30"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.6.2-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.6-1.5-.9-2.1-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.6 1.1 2.7c.1.2 1.9 3 4.7 4.1.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-2.9-.4-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>
          Message us on WhatsApp
        </button>
        <p className="text-soft/55 text-center mt-3 text-xs">
          Opens WhatsApp with your details ready to send — a real person replies, usually within a few hours.
        </p>
      </div>
    </form>
  );
}
