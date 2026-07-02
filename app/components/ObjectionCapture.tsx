"use client";
import { useState } from "react";
import { useFormSecurity } from "@/app/lib/security/client";

// ─────────────────────────────────────────────────────────────────────────────
// ObjectionCapture — Objection Intelligence (Sprint 3).
//
// A low-friction "what's holding you back?" micro-survey for warm drop-off
// points (career-planner result, book-call, enrol). One tap logs the objection
// via /api/objection → Zapier → Sheet so marketing can see WHY warm leads don't
// convert (too expensive / finance / no time / comparing / needs L2 / not
// confident…). Anonymous — no email required. Shows a short thank-you on submit.
// ─────────────────────────────────────────────────────────────────────────────

const REASONS: { value: string; label: string; wantsNote?: boolean }[] = [
  { value: "too_expensive", label: "The cost" },
  { value: "need_finance", label: "I need a payment plan" },
  { value: "no_time", label: "No time right now" },
  { value: "comparing", label: "Comparing other courses" },
  { value: "need_level2", label: "Not sure I'm ready / need Level 2" },
  { value: "not_confident", label: "Not confident it's for me" },
  { value: "just_researching", label: "Just researching for now" },
  { value: "other", label: "Something else", wantsNote: true },
];

export default function ObjectionCapture({
  context,
  heading = "Not ready yet? Tell us what's holding you back.",
  sub = "One tap — it helps us make this easier for people like you. No email needed.",
}: {
  context: string;
  heading?: string;
  sub?: string;
}) {
  const sec = useFormSecurity();
  const [picked, setPicked] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  async function send(reason: string, noteText: string) {
    if (sending) return;
    setSending(true);
    try {
      await fetch("/api/objection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, note: noteText, context, [sec.SEC_KEY]: sec.payload() }),
      });
    } catch {
      /* best-effort — never block the user on an intelligence ping */
    }
    setDone(true);
  }

  function onPick(value: string, wantsNote?: boolean) {
    setPicked(value);
    if (!wantsNote) void send(value, "");
  }

  if (done) {
    return (
      <div className="bg-card border border-white/[0.08] rounded-2xl p-6 text-center">
        <p className="text-gold font-semibold">Thank you — that genuinely helps.</p>
        <p className="text-soft/60 text-sm mt-1">We&apos;ll use it to make the next step easier.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-white/[0.08] rounded-2xl p-6">
      <sec.Honeypot />
      <p className="text-white font-bold text-base">{heading}</p>
      <p className="text-soft/60 text-sm mt-1 mb-4">{sub}</p>

      <div className="flex flex-wrap gap-2">
        {REASONS.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => onPick(r.value, r.wantsNote)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
              picked === r.value
                ? "bg-gold text-base border-gold"
                : "bg-base text-white/80 border-white/[0.12] hover:border-gold/40"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {picked && REASONS.find((r) => r.value === picked)?.wantsNote && (
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's stopping you? (optional)"
            className="flex-1 bg-base border border-white/[0.12] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-soft/40 focus:border-gold/50 outline-none"
          />
          <button
            type="button"
            onClick={() => void send(picked, note)}
            disabled={sending}
            className="bg-gold text-base font-bold px-6 py-2.5 rounded-lg hover:brightness-110 transition disabled:opacity-60"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
