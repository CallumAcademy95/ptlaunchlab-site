"use client";
import { useState, useTransition } from "react";
import type { Rules, Block } from "@/app/lib/booking/slots";
import { CALL_TYPES, type CallType } from "@/app/lib/booking/callTypes";
import { saveSettings, adminSlots, bookForSomeone } from "./actions";

// Labels run Mon..Sun; keys are weekday numbers with 0 = Sunday.
const DAYS: { label: string; key: string }[] = [
  { label: "Monday", key: "1" }, { label: "Tuesday", key: "2" }, { label: "Wednesday", key: "3" },
  { label: "Thursday", key: "4" }, { label: "Friday", key: "5" }, { label: "Saturday", key: "6" }, { label: "Sunday", key: "0" },
];

const INPUT = "h-9 min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-800";
const BTN = "min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";
const PRIMARY = "min-h-9 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50";
const CARD = "space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5";
const LABEL = "flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-500";

export default function SettingsPanel({
  initial, typesEnabled, googleCheckedAt,
}: {
  initial: Rules;
  typesEnabled: Record<CallType, boolean>;
  googleCheckedAt: string | null;
}) {
  const [hours, setHours] = useState<Record<string, Block[]>>(() => {
    const h: Record<string, Block[]> = {};
    for (const d of DAYS) h[d.key] = (initial.weeklyHours[d.key] ?? []).map((b) => ({ ...b }));
    return h;
  });
  const [daysOff, setDaysOff] = useState(initial.daysOff.map((d) => ({ ...d })));
  const [noticeHours, setNoticeHours] = useState(String(initial.minNoticeMinutes / 60));
  const [horizon, setHorizon] = useState(String(initial.horizonDays));
  const [buffer, setBuffer] = useState(String(initial.bufferMinutes));
  const [maxPerDay, setMaxPerDay] = useState(initial.maxPerDay == null ? "" : String(initial.maxPerDay));
  const [enabled, setEnabled] = useState({ ...typesEnabled });
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const setBlock = (day: string, i: number, patch: Partial<Block>) =>
    setHours((h) => ({ ...h, [day]: h[day].map((b, j) => (j === i ? { ...b, ...patch } : b)) }));

  const save = () => {
    const weeklyHours: Record<string, Block[]> = {};
    for (const [k, v] of Object.entries(hours)) if (v.length) weeklyHours[k] = v;
    const minNoticeMinutes = Math.round(Number(noticeHours) * 60);
    start(async () => {
      const r = await saveSettings({
        weeklyHours, daysOff,
        minNoticeMinutes,
        horizonDays: Number(horizon),
        bufferMinutes: Number(buffer),
        maxPerDay: maxPerDay.trim() === "" ? null : Number(maxPerDay),
        typesEnabled: enabled,
      });
      setMsg(r.ok ? "Settings saved." : r.error);
    });
  };

  return (
    <div className="space-y-6">
      <section className={CARD}>
        <h2 className="text-base font-semibold text-slate-900">Your hours</h2>
        <div className="space-y-3">
          {DAYS.map((d) => (
            <div key={d.key} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
              <span className="w-24 shrink-0 pt-1.5 text-sm font-medium text-slate-700">{d.label}</span>
              <div className="space-y-2">
                {hours[d.key].length === 0 && <span className="mr-2 inline-block pt-1.5 text-sm text-slate-400">Not available</span>}
                {hours[d.key].map((b, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <input type="time" aria-label={`${d.label} start`} className={INPUT} value={b.start} onChange={(e) => setBlock(d.key, i, { start: e.target.value })} />
                    <span className="text-slate-400">to</span>
                    <input type="time" aria-label={`${d.label} end`} className={INPUT} value={b.end} onChange={(e) => setBlock(d.key, i, { end: e.target.value })} />
                    <button type="button" className={BTN} onClick={() => setHours((h) => ({ ...h, [d.key]: h[d.key].filter((_, j) => j !== i) }))}>Remove</button>
                  </div>
                ))}
                <button type="button" className={BTN} onClick={() => setHours((h) => ({ ...h, [d.key]: [...h[d.key], { start: "09:00", end: "12:00" }] }))}>Add hours</button>
              </div>
            </div>
          ))}
        </div>

        <h3 className="pt-2 text-sm font-semibold text-slate-900">Days off</h3>
        <div className="space-y-2">
          {daysOff.length === 0 && <p className="text-sm text-slate-400">None.</p>}
          {daysOff.map((d, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input type="date" aria-label="Day off from" className={INPUT} value={d.from} onChange={(e) => setDaysOff((x) => x.map((r, j) => (j === i ? { ...r, from: e.target.value } : r)))} />
              <span className="text-slate-400">to</span>
              <input type="date" aria-label="Day off to" className={INPUT} value={d.to} onChange={(e) => setDaysOff((x) => x.map((r, j) => (j === i ? { ...r, to: e.target.value } : r)))} />
              <button type="button" className={BTN} onClick={() => setDaysOff((x) => x.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <button type="button" className={BTN} onClick={() => setDaysOff((x) => [...x, { from: "", to: "" }])}>Add days off</button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className={LABEL}>Notice (hours)<input type="number" min={0} step="0.5" className={INPUT} value={noticeHours} onChange={(e) => setNoticeHours(e.target.value)} /></label>
          <label className={LABEL}>Horizon (days)<input type="number" min={1} className={INPUT} value={horizon} onChange={(e) => setHorizon(e.target.value)} /></label>
          <label className={LABEL}>Gap between (min)<input type="number" min={0} className={INPUT} value={buffer} onChange={(e) => setBuffer(e.target.value)} /></label>
          <label className={LABEL}>Max per day (blank = none)<input type="number" min={1} className={INPUT} value={maxPerDay} onChange={(e) => setMaxPerDay(e.target.value)} /></label>
        </div>

        <fieldset className="space-y-1">
          <legend className="text-sm font-semibold text-slate-900">Call types</legend>
          {(Object.keys(CALL_TYPES) as CallType[]).map((t) => (
            <label key={t} className="flex min-h-9 items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={enabled[t]} onChange={(e) => setEnabled((x) => ({ ...x, [t]: e.target.checked }))} />
              {CALL_TYPES[t].title} enabled
            </label>
          ))}
        </fieldset>

        <p className="text-sm text-slate-600">
          Google Calendar:{" "}
          {googleCheckedAt
            ? `Connected, last checked ${new Date(googleCheckedAt).toLocaleString("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}`
            : "Not connected yet"}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={PRIMARY} disabled={pending} onClick={save}>Save settings</button>
          {msg && <span className="text-sm text-slate-700" role="status">{msg}</span>}
        </div>
      </section>

      <BookForSomeone />
    </div>
  );
}

function BookForSomeone() {
  const [type, setType] = useState<CallType>("consultation");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [slots, setSlots] = useState<{ iso: string; label: string }[] | null>(null);
  const [slot, setSlot] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const changeType = (t: CallType) => { setType(t); setAnswers({}); setSlots(null); setSlot(""); };

  return (
    <section className={CARD}>
      <h2 className="text-base font-semibold text-slate-900">Book a call for someone</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={LABEL}>Type
          <select className={INPUT} value={type} onChange={(e) => changeType(e.target.value as CallType)}>
            {(Object.keys(CALL_TYPES) as CallType[]).map((t) => <option key={t} value={t}>{CALL_TYPES[t].title}</option>)}
          </select>
        </label>
        <label className={LABEL}>Name<input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className={LABEL}>Email<input type="email" className={INPUT} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className={LABEL}>Mobile<input type="tel" className={INPUT} value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
      </div>
      <div className="space-y-3">
        {CALL_TYPES[type].questions.map((q) => (
          <div key={q.key} className={LABEL}>
            <span>{q.label}{q.required ? " *" : ""}</span>
            {q.kind === "multi" ? (
              <div className="flex flex-wrap gap-3">
                {(q.choices ?? []).map((c) => {
                  const cur = (answers[q.key] as string[] | undefined) ?? [];
                  return (
                    <label key={c} className="flex min-h-9 items-center gap-2 text-sm font-normal text-slate-700">
                      <input type="checkbox" checked={cur.includes(c)} onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.checked ? [...cur, c] : cur.filter((x) => x !== c) }))} />
                      {c}
                    </label>
                  );
                })}
              </div>
            ) : q.kind === "text" ? (
              <textarea rows={3} className="min-w-0 rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-800" value={(answers[q.key] as string) ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))} />
            ) : (
              <input className={INPUT} value={(answers[q.key] as string) ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))} />
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={BTN} disabled={pending} onClick={() => start(async () => {
          const r = await adminSlots(type);
          if (r.ok) { setSlots(r.slots); setSlot(""); setMsg(r.slots.length ? null : "No free times."); } else setMsg(r.error);
        })}>Find times</button>
        {slots && slots.length > 0 && (
          <select className={INPUT} aria-label="Time" value={slot} onChange={(e) => setSlot(e.target.value)}>
            <option value="">Pick a time</option>
            {slots.map((s) => <option key={s.iso} value={s.iso}>{s.label}</option>)}
          </select>
        )}
        <button type="button" className={PRIMARY} disabled={pending || !slot} onClick={() => start(async () => {
          const r = await bookForSomeone({ type, startIso: slot, name, email, phone, answers });
          setMsg(r.ok ? "Booked." : r.error);
          if (r.ok) { setName(""); setEmail(""); setPhone(""); setAnswers({}); setSlots(null); setSlot(""); }
        })}>Book it</button>
      </div>
      {msg && <p className="text-sm text-slate-700" role="status">{msg}</p>}
    </section>
  );
}
