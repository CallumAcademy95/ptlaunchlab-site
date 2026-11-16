"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, SectionTitle, Badge, EmptyState } from "../../ui/praxel";
import type { WeekData } from "@/app/lib/diary/week-data";
import type { TaskRow } from "@/app/lib/diary/types";
import { AREAS, CATEGORIES } from "@/app/lib/diary/types";
import { priorityOf } from "@/app/lib/diary/placement";
import type { MovePlan } from "@/app/lib/diary/clashes";
import {
  addTask, confirmSlot, applyMoves, moveTask, readShot, markDone, dropTask, returnToInbox, approveClaudeTask, previewLayout, applyLayout, type Proposal,
} from "./actions";

const TZ = "Europe/London";
const hm = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const dayLabel = (d: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(new Date(`${d}T12:00:00Z`));
const londonDay = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
const addDaysStr = (d: string, n: number) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
/** London wall time on a date → ISO with the right offset (GMT/BST) for the server. */
function londonIso(date: string, hhmm: string): string {
  const guess = Date.parse(`${date}T${hhmm}:00Z`);
  const wall = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(guess));
  const [h, m] = wall.split(":").map(Number); const [gh, gm] = hhmm.split(":").map(Number);
  let offMin = (h * 60 + m) - (gh * 60 + gm);
  if (offMin > 720) offMin -= 1440;
  if (offMin < -720) offMin += 1440;
  return new Date(guess - offMin * 60_000).toISOString();
}
async function downscale(file: File): Promise<File> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  for (const q of [0.85, 0.7, 0.55, 0.4]) {
    const blob: Blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Could not resize that screenshot."))), "image/jpeg", q));
    if (blob.size <= 900_000) return new File([blob], "shot.jpg", { type: "image/jpeg" });
  }
  throw new Error("Screenshot too large even after resizing.");
}

type Pending = { task: TaskRow; proposal: Proposal | null; reason: string | null; questions: string[] } | null;
/** Merge move plans by task id: keep existing, add or replace by id. */
const mergeMoves = (prev: MovePlan[], next: MovePlan[]) => [...prev.filter((p) => !next.some((n) => n.id === p.id)), ...next];

export default function WeekClient({ data, clashMoves }: { data: WeekData; clashMoves: MovePlan[] }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(clashMoves.length ? "Calls or appointments landed on some of your tasks — see Clashes below." : null);
  const [pending, setPending] = useState<Pending>(null);
  // Starts with any call/appointment-vs-task clashes found on page load (calls win; tasks move).
  const [moves, setMoves] = useState<MovePlan[]>(clashMoves);
  const [questions, setQuestions] = useState<string[]>([]);
  const [fromShot, setFromShot] = useState(false);
  const [ack, setAck] = useState(false);
  const [layout, setLayout] = useState<{ count: number; titles: string[] } | null>(null);
  const [form, setForm] = useState({ title: "", area: "PTLL", category: "Admin", estimate_min: 30, deadline: addDaysStr(data.monday, 4), kind: "task", date: "", start: "", end: "", notes: "" });
  const run = (fn: () => Promise<void>) => { setError(null); setInfo(null); start(async () => { try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } }); };

  const todayTop = useMemo(() => data.tasks
    .filter((t) => t.status === "placed" && t.start_at && londonDay(t.start_at) === data.today)
    .sort((a, b) => priorityOf(a.category) - priorityOf(b.category) || a.start_at!.localeCompare(b.start_at!)).slice(0, 3), [data]);
  const inbox = data.tasks.filter((t) => t.status === "inbox");
  // A "placed" row with no calendar event is a half-finished placement: list it so it can be sent back to the inbox.
  const orphaned = data.tasks.filter((t) => t.status === "placed" && !t.event_id);
  const claudeQueue = data.tasks.filter((t) => t.owner === "Claude" && (t.status === "inbox" || t.status === "placed"));
  const byDay = (d: string) => [
    ...data.events.filter((e) => londonDay(e.start) === d).map((e) => ({ key: e.id, start: e.start, end: e.end, label: e.summary, kind: e.kind as string, task: data.tasks.find((t) => t.event_id === e.id) })),
    ...data.calls.filter((c) => londonDay(c.start_at) === d).map((c) => ({ key: c.id, start: c.start_at, end: c.end_at, label: `Call: ${c.name}`, kind: "call", task: undefined })),
  ].sort((a, b) => a.start.localeCompare(b.start));

  const dayCell = (d: string) => (
      <div key={d} className={`min-w-0 ${d === data.today ? "rounded-lg bg-slate-50 p-2" : "p-2"}`}>
        <p className="mb-1 text-xs font-semibold uppercase text-slate-500">{dayLabel(d)}</p>
        {byDay(d).length === 0 ? <p className="text-xs text-slate-400">—</p> : byDay(d).map((x) => (
          <div key={x.key} className={`mb-1 rounded-md px-2 py-1 text-xs [overflow-wrap:anywhere] ${x.kind === "block" ? "bg-slate-100 text-slate-500" : x.kind === "fixed" ? "bg-rose-50 text-rose-800" : x.kind === "call" ? "bg-blue-50 text-blue-800" : "bg-emerald-50 text-emerald-900"}`}>
            <span className="font-medium">{hm(x.start)}</span> {x.label}
            {x.task && x.task.status === "placed" && (
              <span className="ml-1 inline-flex flex-wrap gap-2">
                <button disabled={busy} className={link} onClick={() => act(markDone, x.task!.id, "Done.")}>Done</button>
                <button disabled={busy} className={link} onClick={() => proposeMove(x.task!, x)}>Move</button>
                <button disabled={busy} className={link} onClick={() => act(returnToInbox, x.task!.id, "Back in the inbox.")}>Inbox</button>
              </span>
            )}
          </div>
        ))}
      </div>
  );
  const weekend = data.days.slice(5).filter((d) => byDay(d).length > 0);

  function submit() {
    run(async () => {
      const any = !!(form.date || form.start || form.end);
      const all = !!(form.date && form.start && form.end);
      if ((any || form.kind === "fixed") && !all) throw new Error("Fill in date, start and end — or clear them to let me find a slot.");
      if (all && form.end <= form.start) throw new Error("End must be after start.");
      const pinned = all;
      const qs = questions;
      const r = await addTask({
        title: form.title, area: form.area, category: form.kind === "fixed" ? "Fixed" : form.category, kind: form.kind,
        estimate_min: form.kind === "fixed" ? null : Number(form.estimate_min), deadline: form.kind === "fixed" ? null : form.deadline || null,
        start_at: pinned ? londonIso(form.date, form.start) : null, end_at: pinned ? londonIso(form.date, form.end) : null,
        notes: null, source: fromShot ? "screenshot" : "typed",
      });
      if (!r.ok) throw new Error(r.error);
      // Saved: clear the form on every path so a second press cannot duplicate it.
      setQuestions([]); setFromShot(false); setAck(false);
      setForm((f) => ({ ...f, title: "", date: "", start: "", end: "", notes: "" }));
      if (!r.proposal) {
        // The task is saved in the inbox but no slot was found: say why and refresh.
        setPending(null);
        setInfo(`Saved to your inbox, but no slot found: ${r.reason ?? "no reason given."}`);
        router.refresh();
        return;
      }
      setPending({ task: r.task, proposal: r.proposal, reason: r.reason, questions: qs });
    });
  }
  function confirm() {
    if (!pending?.proposal) return;
    if (pending.questions.length && !ack) return;
    run(async () => {
      const r = await confirmSlot(pending.task.id, pending.proposal!.start, pending.proposal!.end);
      if (!r.ok) throw new Error(r.error);
      setPending(null); setAck(false); setMoves((prev) => mergeMoves(prev, r.moves));
      const base = r.moves.length ? "Added — it clashes with something, see below." : "Added to your calendar.";
      setInfo(r.warning ? `${base} ${r.warning}` : base);
      router.refresh();
    });
  }
  function doMoves() {
    run(async () => {
      const ok = moves.filter((m) => m.to);
      const r = await applyMoves(ok.map((m) => ({ id: m.id, start: new Date(m.to!.start).toISOString(), end: new Date(m.to!.end).toISOString() })));
      if (!r.ok) throw new Error(r.error);
      if (r.failed.length) setError(`Some moves failed: ${r.failed.join("; ")}`);
      const failedIds = new Set(r.failedIds);
      const appliedIds = new Set(ok.filter((m) => !failedIds.has(m.id)).map((m) => m.id));
      setInfo(`Moved ${r.moved} of ${ok.length}.`); setMoves((prev) => prev.filter((m) => !appliedIds.has(m.id))); router.refresh();
    });
  }
  function onShot(file: File | undefined) {
    if (!file) return;
    run(async () => {
      const fd = new FormData(); fd.set("file", await downscale(file));
      const r = await readShot(fd);
      if (!r.ok) throw new Error(r.error);
      const v = r.value;
      if (v.type === "info") { setInfo("Nothing to schedule in that screenshot."); return; }
      // Prefill only: nothing is added until "Find a slot / add" and then Confirm.
      setForm((f) => ({ ...f, title: v.title, kind: v.type === "fixed" ? "fixed" : "task", area: v.area ?? (v.type === "fixed" ? "Personal" : f.area),
        category: v.category && v.category !== "Fixed" ? v.category : f.category, estimate_min: v.estimate_min ?? f.estimate_min,
        deadline: v.deadline ?? f.deadline, date: v.date ?? "", start: v.start ?? "", end: v.end ?? "", notes: "" }));
      setQuestions(v.questions); setFromShot(true);
    });
  }
  const act = (fn: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>, id: string, done: string) =>
    run(async () => { const r = await fn(id); if (!r.ok) throw new Error(r.error); setInfo(done); router.refresh(); });
  const proposeMove = (t: TaskRow, ev: { start: string; end: string }) => run(async () => {
    const r = await moveTask(t.id); if (!r.ok) throw new Error(r.error);
    const prop = r.proposal;
    if (!prop) throw new Error(r.reason ?? "No slot.");
    setMoves((prev) => mergeMoves(prev, [{ id: t.id, title: t.title, from: { start: Date.parse(ev.start), end: Date.parse(ev.end) }, to: { start: Date.parse(prop.start), end: Date.parse(prop.end) }, reason: null }]));
  });

  const input = "w-full min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm";
  const btn = "rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50";
  const link = "underline disabled:opacity-50";
  return (
    <div className="min-w-0 space-y-4">
      {error && <div role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800 [overflow-wrap:anywhere]">{error}</div>}
      {info && <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 [overflow-wrap:anywhere]">{info}</div>}

      <Card className="p-4">
        <SectionTitle>Today</SectionTitle>
        {todayTop.length === 0 ? <p className="mt-2 text-sm text-slate-500">Nothing placed today yet.</p> : (
          <ol className="mt-2 space-y-1 text-sm">{todayTop.map((t) => <li key={t.id} className="[overflow-wrap:anywhere]"><b>{hm(t.start_at!)}</b> [{t.category}] {t.title}</li>)}</ol>
        )}
        {inbox.length > 0 && <p className="mt-2 text-xs text-slate-500">{inbox.length} in the inbox · {claudeQueue.length} Claude tasks</p>}
      </Card>

      <Card className="space-y-3 p-4">
        <SectionTitle>Add</SectionTitle>
        <input className={input} placeholder="What needs doing?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <select className={input} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            <option value="task">Task (find me a slot)</option><option value="fixed">Personal / appointment (set time)</option>
          </select>
          <select className={input} value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>{AREAS.map((a) => <option key={a}>{a}</option>)}</select>
          {form.kind === "task" && <>
            <select className={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.filter((c) => c !== "Fixed").map((c) => <option key={c}>{c}</option>)}</select>
            <select className={input} value={form.estimate_min} onChange={(e) => setForm({ ...form, estimate_min: Number(e.target.value) })}>{[15, 30, 45, 60, 90, 120, 180].map((m) => <option key={m} value={m}>{m} min</option>)}</select>
            <label className="col-span-2 min-w-0 text-xs text-slate-500">Due by<input type="date" className={input} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></label>
          </>}
          <label className="col-span-2 min-w-0 text-xs text-slate-500">{form.kind === "fixed" ? "Date" : "Set time? (optional) date"}<input type="date" className={input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
          <label className="min-w-0 text-xs text-slate-500">From<input type="time" className={input} value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></label>
          <label className="min-w-0 text-xs text-slate-500">To<input type="time" className={input} value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></label>
        </div>
        {questions.length > 0 && <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Check before adding: {questions.join(" · ")}</div>}
        <div className="flex flex-wrap gap-2">
          <button disabled={busy || !form.title} onClick={submit} className={`${btn} bg-slate-900 text-white`}>Find a slot / add</button>
          <label className={`${btn} border border-slate-300 ${busy ? "pointer-events-none opacity-50" : "cursor-pointer"}`}>Add screenshot
            <input type="file" accept="image/*" disabled={busy} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; onShot(f); }} />
          </label>
        </div>
        {pending && (
          <div className="rounded-lg border border-slate-200 p-3 text-sm [overflow-wrap:anywhere]">
            {pending.proposal ? <>
              {pending.questions.length > 0 && (
                <div className="mb-2 rounded-lg bg-amber-50 p-3 text-amber-900">
                  <p>Check before adding: {pending.questions.join(" · ")}</p>
                  <label className="mt-2 flex items-center gap-2"><input type="checkbox" checked={ack} disabled={busy} onChange={(e) => setAck(e.target.checked)} />I&apos;ve checked these details</label>
                </div>
              )}
              <p><b>{pending.proposal.label}</b>{pending.proposal.blockTitle ? ` in ${pending.proposal.blockTitle}` : ""} — {pending.task.title}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button disabled={busy || (pending.questions.length > 0 && !ack)} onClick={confirm} className={`${btn} bg-emerald-600 text-white`}>Confirm</button>
                <button disabled={busy} onClick={() => { setPending(null); setAck(false); setInfo("Left in the inbox."); router.refresh(); }} className={`${btn} border`}>Leave in inbox</button>
              </div>
            </> : <p>Couldn&apos;t place it: {pending.reason} It&apos;s in the inbox.</p>}
          </div>
        )}
        {moves.length > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm [overflow-wrap:anywhere]">
            <p className="font-medium">Clashes:</p>
            <ul className="my-1 space-y-1">{moves.map((m) => <li key={m.id}>{m.title} → {m.to ? `${hm(new Date(m.to.start).toISOString())} ${dayLabel(londonDay(new Date(m.to.start).toISOString()))}` : `can't move: ${m.reason}`}</li>)}</ul>
            {moves.some((m) => m.to) && <button disabled={busy} onClick={doMoves} className={`${btn} bg-amber-600 text-white`}>Move them</button>}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <SectionTitle>{`Week of ${dayLabel(data.monday)}`}</SectionTitle>
          <div className="flex shrink-0 gap-3 text-sm">
            <a href={`?w=${addDaysStr(data.monday, -7)}`} className="underline">Prev</a>
            <a href={`?w=${addDaysStr(data.monday, 7)}`} className="underline">Next</a>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {data.days.slice(0, 5).map(dayCell)}
        </div>
        {weekend.length > 0 && <div className="mt-3 grid gap-3 md:grid-cols-5">{weekend.map(dayCell)}</div>}
        <div className="mt-3">
          {layout ? (
            <div className="text-sm">
              <p>{layout.count} blocks to create.</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <button disabled={busy || layout.count === 0} onClick={() => run(async () => { const r = await applyLayout(data.monday); if (!r.ok) throw new Error(r.error); if (r.failed.length) setError(`Some blocks failed: ${r.failed.join("; ")}`); setInfo(`Created ${r.created} of ${r.planned} blocks.`); setLayout(null); router.refresh(); })} className={`${btn} bg-slate-900 text-white`}>Create them</button>
                <button disabled={busy} onClick={() => setLayout(null)} className={`${btn} border`}>Cancel</button>
              </div>
            </div>
          ) : (
            <button disabled={busy} onClick={() => run(async () => { const r = await previewLayout(data.monday); if (!r.ok) throw new Error(r.error); setLayout({ count: r.events.length, titles: r.events.map((e) => e.summary) }); })} className={`${btn} border`}>Lay out this week</button>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <SectionTitle>Inbox</SectionTitle>
        <div className="mt-2">
          {inbox.length + orphaned.length === 0 ? <EmptyState title="Inbox empty" /> : [...inbox, ...orphaned].map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-2 text-sm">
              <span className="min-w-0 [overflow-wrap:anywhere]"><Badge>{t.ref}</Badge> [{t.category}] {t.title} {t.deadline && <span className="text-slate-500">· due {dayLabel(t.deadline)}</span>}</span>
              {t.status === "placed" ? (
                <span className="flex items-center gap-3"><span className="text-xs text-amber-700">Placed but not in the calendar</span>
                  <button disabled={busy} className={link} onClick={() => act(returnToInbox, t.id, "Back in the inbox.")}>Inbox</button></span>
              ) : <span className="flex gap-3">
                <button disabled={busy} className={link} onClick={() => run(async () => { const r = await moveTask(t.id); if (!r.ok) throw new Error(r.error); setAck(false); setPending({ task: t, proposal: r.proposal, reason: r.reason, questions: [] }); })}>Slot</button>
                <button disabled={busy} className={link} onClick={() => act(markDone, t.id, "Done.")}>Done</button>
                <button disabled={busy} className={link} onClick={() => act(dropTask, t.id, "Dropped.")}>Drop</button>
              </span>}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <SectionTitle>Claude queue</SectionTitle>
        <div className="mt-2">
          {claudeQueue.length === 0 ? <EmptyState title="Nothing waiting" /> : claudeQueue.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-2 text-sm">
              <span className="min-w-0 [overflow-wrap:anywhere]"><Badge>{t.ref}</Badge> {t.title}</span>
              {t.status === "inbox" && <button disabled={busy} className={link} onClick={() => act(approveClaudeTask, t.id, `Approved ${t.ref}. Claude picks it up next session.`)}>Approve</button>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
