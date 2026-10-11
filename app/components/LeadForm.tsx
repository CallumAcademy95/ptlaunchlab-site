"use client";

import { useId, useState, type FormEvent } from "react";
import { submitLead, type SubmitLeadResult } from "@/app/lib/submitLead";
import type { LeadIntent } from "@/app/lib/leads";

// The one lead form. Posts to /api/lead via submitLead, which saves first and
// fires the Meta Pixel Lead only after the lead is saved.

type Variant = "inline" | "modal" | "page";

export type LeadFormProps = {
  intent: LeadIntent;
  source: string;
  gymSlug?: string;
  /** Optional extra field: a <select> when `options` is given, else a <textarea>. */
  question?: { label: string; options?: string[]; required?: boolean };
  extra?: Record<string, unknown>;
  successMessage?: string | ((firstName: string) => string);
  onSuccess?: (result: Extract<SubmitLeadResult, { ok: true }>) => void;
  variant?: Variant;
  submitLabel?: string;
};

const WRAPPER: Record<Variant, string> = {
  inline: "w-full",
  modal: "w-full max-w-md mx-auto p-6",
  page: "w-full max-w-xl mx-auto px-6 py-10",
};

const FIELD =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-gray-400";
const LABEL = "block text-sm font-semibold mb-1";
const BUTTON =
  "w-full py-3.5 rounded-full font-black bg-gold text-deep text-sm uppercase tracking-wide hover:opacity-90 transition-all disabled:opacity-60";

function defaultSuccess(intent: LeadIntent, first: string): string {
  return intent === "call" ? `Thanks ${first}, we'll call you today.` : `Thanks ${first}, we've got your details.`;
}

export default function LeadForm({
  intent,
  source,
  gymSlug,
  question,
  extra,
  successMessage,
  onSuccess,
  variant = "inline",
  submitLabel = "Send",
}: LeadFormProps) {
  const uid = useId();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [answer, setAnswer] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setFieldError("");
    setBusy(true);
    try {
      const result = await submitLead({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim(),
        question: answer.trim() || undefined,
        intent,
        source,
        gymSlug,
        extra,
        honeypot,
      });
      if (result.ok) {
        setDone(true);
        onSuccess?.(result);
      } else {
        setError(result.message);
        setFieldError(result.field ?? "");
      }
    } finally {
      setBusy(false);
    }
  }

  const first = name.trim().split(/\s+/)[0] || "there";

  if (done) {
    const msg = typeof successMessage === "function" ? successMessage(first) : (successMessage ?? defaultSuccess(intent, first));
    return (
      <div className={WRAPPER[variant]}>
        <div role="status" className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
          <p className="text-black font-black text-lg">{msg}</p>
        </div>
      </div>
    );
  }

  const invalid = (f: string) => (fieldError === f ? true : undefined);

  return (
    <div className={WRAPPER[variant]}>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <div>
          <label htmlFor={`${uid}-name`} className={LABEL}>Your name</label>
          <input id={`${uid}-name`} name="name" autoComplete="name" required className={FIELD} placeholder="Your name"
            aria-invalid={invalid("name")} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor={`${uid}-phone`} className={LABEL}>Phone number</label>
          <input id={`${uid}-phone`} name="phone" type="tel" inputMode="tel" autoComplete="tel" className={FIELD}
            placeholder="Phone number" aria-invalid={invalid("phone")} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label htmlFor={`${uid}-email`} className={LABEL}>Email address</label>
          <input id={`${uid}-email`} name="email" type="email" autoComplete="email" required className={FIELD}
            placeholder="Email address" aria-invalid={invalid("email")} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {question && (
          <div>
            <label htmlFor={`${uid}-question`} className={LABEL}>{question.label}</label>
            {question.options ? (
              <select id={`${uid}-question`} name="question" className={FIELD} required={question.required}
                aria-invalid={invalid("question")} value={answer} onChange={(e) => setAnswer(e.target.value)}>
                <option value="">Select one</option>
                {question.options.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <textarea id={`${uid}-question`} name="question" rows={3} className={FIELD} required={question.required}
                aria-invalid={invalid("question")} value={answer} onChange={(e) => setAnswer(e.target.value)} />
            )}
          </div>
        )}
        {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
        <div aria-hidden="true" className="sr-only">
          <input name="company" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={busy} className={BUTTON}>
          {busy ? "Sending…" : submitLabel}
        </button>
      </form>
    </div>
  );
}
