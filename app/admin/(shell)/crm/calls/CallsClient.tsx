"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import type { BookingRow } from "@/app/lib/booking/data";
import { CALL_TYPES } from "@/app/lib/booking/callTypes";
import { londonDate, longLabel, slotLabel } from "@/app/lib/booking/london";
import { markCall, cancelCall, moveCall, adminSlots } from "./actions";

function groupName(day: string): string {
  const today = londonDate(Date.now()), tomorrow = londonDate(Date.now() + 86_400_000);
  if (day === today) return "Today";
  if (day === tomorrow) return "Tomorrow";
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
}

const BTN = "min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";

export default function CallsClient({ calls, past }: { calls: BookingRow[]; past: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [moving, setMoving] = useState<{ id: string; slots: { iso: string; label: string }[] } | null>(null);
  const run = (p: Promise<{ ok: boolean; error?: string }>) => start(async () => { const r = await p; setMsg(r.ok ? "Saved." : r.error ?? "Failed."); });
  const groups = new Map<string, BookingRow[]>();
  for (const c of calls) { const d = londonDate(Date.parse(c.start_at)); groups.set(d, [...(groups.get(d) ?? []), c]); }
  const tab = (on: boolean) =>
    "inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-semibold " +
    (on ? "border-blue-600 bg-blue-700 text-white" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300");
  return (
    <div>
      <div className="mb-4 flex gap-2">
        <Link href="/admin/crm/calls" className={tab(!past)}>Upcoming</Link>
        <Link href="/admin/crm/calls?tab=past" className={tab(past)}>Past</Link>
      </div>
      {msg && <p className="mb-3 text-sm text-slate-700" role="status">{msg}</p>}
      {calls.length === 0 && <p className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-500 shadow-sm">No calls.</p>}
      {[...groups].map(([day, rows]) => (
        <section key={day} className="mb-6">
          <h2 className="mb-2 font-semibold text-slate-900">{groupName(day)}</h2>
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {rows.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 p-3 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900 [overflow-wrap:anywhere]">
                    {slotLabel(Date.parse(c.start_at)).split(", ").pop()} · {c.name}{" "}
                    <span className="text-xs text-slate-500">({CALL_TYPES[c.call_type].title}{c.is_test ? ", TEST" : ""})</span>
                  </div>
                  <div className="text-sm text-slate-600 [overflow-wrap:anywhere]">
                    <a className="text-blue-700 underline" href={`tel:${c.phone}`}>{c.phone}</a> · {c.email} · {c.source} · <span className="text-xs uppercase">{c.status}</span>
                    {c.google_sync_error && <span className="ml-2 text-xs text-amber-700">calendar not synced</span>}
                    {c.last_send_error && <span className="ml-2 text-xs text-amber-700">message failed: {c.last_send_error}</span>}
                  </div>
                  {c.consultation_id && <Link className="text-xs text-blue-700 underline" href={`/admin/crm?open=${c.consultation_id}`}>Open in CRM</Link>}
                </div>
                {c.status === "booked" && (
                  <div className="flex flex-wrap gap-2">
                    <button disabled={pending} onClick={() => run(markCall(c.id, "done", prompt("Notes (optional)") ?? ""))} className={BTN}>Done</button>
                    <button disabled={pending} onClick={() => run(markCall(c.id, "no_show"))} className={BTN}>No-show</button>
                    <button disabled={pending} onClick={() => start(async () => { const r = await adminSlots(c.call_type); if (r.ok) setMoving({ id: c.id, slots: r.slots }); else setMsg(r.error); })} className={BTN}>Move</button>
                    <button disabled={pending} onClick={() => { if (confirm(`Cancel ${c.name}'s call at ${longLabel(Date.parse(c.start_at))}? They'll be told.`)) run(cancelCall(c.id, prompt("Reason (optional)") ?? "")); }} className={BTN + " !text-red-700"}>Cancel</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {moving && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center" onClick={() => setMoving(null)}>
          <div className="max-h-[70vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 font-semibold">Move to…</h3>
            {moving.slots.length === 0 && <p className="text-sm text-slate-500">No free times.</p>}
            <div className="grid grid-cols-2 gap-2">
              {moving.slots.map((s) => (
                <button key={s.iso} className="min-h-9 rounded-lg border border-slate-300 px-2 py-1 text-sm" onClick={() => { const id = moving.id; setMoving(null); run(moveCall(id, s.iso)); }}>{s.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
