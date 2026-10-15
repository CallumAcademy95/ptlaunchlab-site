"use client";
import { useEffect, useMemo, useState } from "react";
import type { CallType, Question } from "@/app/lib/booking/callTypes";
import PhoneCallbackForm from "@/app/book-call/components/PhoneCallbackForm";

type Slot = { iso: string; label: string };
type Prefill = { name: string | null; email: string | null; phone: string | null; answers: Record<string, string> } | null;

const dayKey = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "short", day: "numeric", month: "short" }).format(new Date(iso));
const timeOnly = (label: string) => label.split(", ").pop() ?? label;

export default function BookingFlow({ callType, questions, prefill, token }: { callType: CallType; questions: Question[]; prefill: Prefill; token: string | null }) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [day, setDay] = useState<string | null>(null);
  const [pick, setPick] = useState<Slot | null>(null);
  const [form, setForm] = useState({ name: prefill?.name ?? "", email: prefill?.email ?? "", phone: prefill?.phone ?? "" });
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(prefill?.answers ?? {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ label: string; phone: string; manageUrl: string | null } | null>(null);

  async function load() {
    const r = await fetch(`/api/booking/slots?type=${callType}`, { cache: "no-store" }).then((x) => x.json()).catch(() => null);
    if (!r?.ok || r.slots.length === 0) { setUnavailable(true); return; }
    setSlots(r.slots);
    setDay(dayKey(r.slots[0].iso));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, []);

  const days = useMemo(() => [...new Set((slots ?? []).map((s) => dayKey(s.iso)))], [slots]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pick) return;
    setBusy(true); setError(null);
    const r = await fetch("/api/booking", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: callType, startIso: pick.iso, ...form, answers, t: token }),
    }).then((x) => x.json()).catch(() => ({ ok: false, error: "Something went wrong. Please try again." }));
    setBusy(false);
    if (r.ok) { setDone({ label: r.label, phone: r.phone, manageUrl: r.manageUrl }); return; }
    setError(r.error ?? "Something went wrong.");
    if (r.taken) {
      setPick(null);
      if (Array.isArray(r.nearest) && r.nearest.length) {
        setSlots(r.nearest);
        setDay(dayKey(r.nearest[0].iso));
      } else {
        await load();
      }
    }
  }

  if (done) {
    return (
      <div className="bg-card border border-gold/40 rounded-2xl p-6">
        <h2 className="text-white font-bold text-xl mb-2">Booked</h2>
        <p className="text-soft/80 mb-4">Callum will ring you on {done.phone} at {done.label}.</p>
        {done.manageUrl && (
          <div className="flex flex-col gap-2 text-sm">
            <a className="text-gold underline" href={`/api/booking/ics?token=${done.manageUrl.split("/").pop()}`}>Add to my calendar</a>
            <a className="text-gold underline" href={done.manageUrl}>Move or cancel</a>
          </div>
        )}
      </div>
    );
  }
  if (unavailable) {
    return (
      <div>
        <p className="text-soft/80 mb-4">Online booking isn&apos;t available right now. Leave your number and Callum will ring you.</p>
        <PhoneCallbackForm />
      </div>
    );
  }
  if (!slots) return <p className="text-soft/60">Loading times…</p>;

  return (
    <div>
      {!pick ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4" role="tablist" aria-label="Day">
            {days.map((d) => (
              <button key={d} role="tab" aria-selected={day === d} onClick={() => setDay(d)}
                className={`shrink-0 px-3 py-2 rounded-lg text-sm font-semibold ${day === d ? "bg-gold text-deep" : "bg-card text-white border border-white/10"}`}>{d}</button>
            ))}
          </div>
          <p className="text-soft/60 text-xs mb-3">Times are UK time.</p>
          <div className="grid grid-cols-3 gap-2">
            {slots.filter((s) => dayKey(s.iso) === day).map((s) => (
              <button key={s.iso} onClick={() => setPick(s)} className="px-3 py-3 rounded-lg bg-card border border-white/10 text-white text-sm font-semibold hover:border-gold">{timeOnly(s.label)}</button>
            ))}
          </div>
          {error && <p className="text-red-300 text-sm mt-4">{error}</p>}
        </>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <p className="text-white">
            {pick.label} (UK time){" "}
            <button type="button" className="text-gold underline text-sm" onClick={() => setPick(null)}>Change</button>
          </p>
          {(["name", "email", "phone"] as const).map((k) => (
            <label key={k} className="flex flex-col gap-1 text-sm text-soft/80">
              {k === "name" ? "Name" : k === "email" ? "Email" : "Mobile number"}
              <input required type={k === "email" ? "email" : k === "phone" ? "tel" : "text"} value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="px-3 py-2 rounded-lg bg-card border border-white/10 text-white" />
            </label>
          ))}
          {questions.map((q) => q.kind === "multi" ? (
            <fieldset key={q.key} className="text-sm text-soft/80">
              <legend className="mb-1">{q.label}</legend>
              {q.choices!.map((c) => {
                const cur = (answers[q.key] as string[] | undefined) ?? [];
                return (
                  <label key={c} className="flex gap-2 items-center">
                    <input type="checkbox" checked={cur.includes(c)} onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.checked ? [...cur, c] : cur.filter((x) => x !== c) })} />
                    {c}
                  </label>
                );
              })}
            </fieldset>
          ) : (
            <label key={q.key} className="flex flex-col gap-1 text-sm text-soft/80">
              {q.label}
              {q.kind === "text"
                ? <textarea required={q.required} rows={3} value={(answers[q.key] as string) ?? ""} onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })} className="px-3 py-2 rounded-lg bg-card border border-white/10 text-white" />
                : <input required={q.required} value={(answers[q.key] as string) ?? ""} onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })} className="px-3 py-2 rounded-lg bg-card border border-white/10 text-white" />}
            </label>
          ))}
          {error && <p className="text-red-300 text-sm">{error}</p>}
          <button disabled={busy} className="px-5 py-3 rounded-full bg-gold text-deep font-bold disabled:opacity-60">{busy ? "Booking…" : "Book this call"}</button>
          <p className="text-soft/50 text-xs">We&apos;ll only contact you about this call. <a href="/privacy" className="underline">Privacy policy</a></p>
        </form>
      )}
    </div>
  );
}
