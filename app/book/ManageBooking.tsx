"use client";
import { useEffect, useState } from "react";

type B = { type: "consultation" | "gym_partner"; title: string; startIso: string; label: string; status: string; phone: string };
type Slot = { iso: string; label: string };

const nowMs = () => Date.now();

export default function ManageBooking({ token }: { token: string }) {
  const [b, setB] = useState<B | null>(null);
  const [missing, setMissing] = useState(false);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch(`/api/booking/manage?token=${encodeURIComponent(token)}`, { cache: "no-store" }).then((x) => x.json()).catch(() => null);
    if (!r?.ok) setMissing(true); else setB(r.booking);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, []);

  async function act(body: Record<string, unknown>) {
    setBusy(true); setMsg(null);
    const r = await fetch("/api/booking/manage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, ...body }) })
      .then((x) => x.json()).catch(() => ({ ok: false, error: "Something went wrong." }));
    setBusy(false);
    if (r.ok) { setSlots(null); setMsg(body.action === "cancel" ? "Cancelled. Thanks for letting us know." : `Moved to ${r.label}.`); await load(); }
    else { setMsg(r.error); if (Array.isArray(r.nearest) && r.nearest.length) setSlots(r.nearest); }
  }

  async function showTimes() {
    if (!b) return;
    const r = await fetch(`/api/booking/slots?type=${b.type}`, { cache: "no-store" }).then((x) => x.json()).catch(() => null);
    if (r?.ok) setSlots(r.slots); else setMsg("We can't show times right now. Please try again shortly.");
  }

  if (missing) return <p className="text-soft/80">We couldn&apos;t find that booking. The link may be incomplete.</p>;
  if (!b) return <p className="text-soft/60">Loading…</p>;
  const live = b.status === "booked" && Date.parse(b.startIso) > nowMs();
  return (
    <div className="bg-card border border-white/10 rounded-2xl p-6">
      <h1 className="text-white font-bold text-2xl mb-2">{b.title}</h1>
      <p className="text-soft/80 mb-4">{b.status === "cancelled" ? "This call is cancelled." : `Callum will ring you on ${b.phone} at ${b.label}.`}</p>
      {msg && <p className="text-gold text-sm mb-4">{msg}</p>}
      {live && !slots && (
        <div className="flex gap-3">
          <button disabled={busy} onClick={showTimes} className="px-4 py-2 rounded-full bg-gold text-deep font-bold">Pick a new time</button>
          <button disabled={busy} onClick={() => act({ action: "cancel" })} className="px-4 py-2 rounded-full border border-white/30 text-white">Cancel the call</button>
        </div>
      )}
      {live && slots && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {slots.slice(0, 40).map((s) => (
            <button key={s.iso} disabled={busy} onClick={() => act({ action: "move", startIso: s.iso })} className="px-3 py-2 rounded-lg bg-base border border-white/10 text-white text-sm">{s.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
