"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { setQualified, saveView, deleteView } from "./actions";

// The small interactive pieces of the CRM. Each calls one server action and
// refreshes the server-rendered page; none of them holds state worth keeping.

/** "Already a qualified PT": the coach's choice, same semantics as Leads Central. */
export function QualifiedToggle({ id, value }: { id: string; value: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = useState(value);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div>
      <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-800 md:min-h-9">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={checked}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.checked;
            setChecked(next);
            setMsg(null);
            start(async () => {
              const res = await setQualified({ id, value: next });
              if (!res.ok) {
                setChecked(!next);
                setMsg(res.error);
                return;
              }
              setMsg(res.warning ?? null);
              router.refresh();
            });
          }}
        />
        Already a qualified PT
        {pending && <span className="text-xs font-normal text-slate-400">saving…</span>}
      </label>
      <p className="text-xs text-slate-500">
        Your choice wins over the setter&apos;s guess. Qualified PTs get mentoring chat, not the course pitch.
      </p>
      {msg && <p className="mt-1 text-xs text-rose-700">{msg}</p>}
    </div>
  );
}

/** Name the current filters and keep them as a view. */
export function SaveViewForm({ query }: { query: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!query) return null;
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-dashed border-slate-300 px-3 text-xs font-semibold text-slate-600 hover:border-slate-400"
      >
        + Save this view
      </button>
    );
  }
  return (
    <form
      className="flex w-full flex-wrap items-center gap-2 sm:w-auto"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          const res = await saveView({ name, query });
          if (!res.ok) {
            setMsg(res.error);
            return;
          }
          setOpen(false);
          setName("");
          router.refresh();
        });
      }}
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
        placeholder="View name"
        className="min-h-9 min-w-0 flex-1 rounded-lg border border-slate-300 px-2.5 text-sm sm:w-44 sm:flex-none"
      />
      <button type="submit" disabled={pending} className="min-h-9 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white disabled:opacity-50">
        {pending ? "Saving…" : "Save"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="min-h-9 px-2 text-xs text-slate-500">
        Cancel
      </button>
      {msg && <p className="w-full text-xs text-rose-700">{msg}</p>}
    </form>
  );
}

/** A custom view's chip, with a remove button. */
export function CustomViewChip({ id, name, href, active }: { id: string; name: string; href: string; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <span
      className={
        "inline-flex shrink-0 items-center rounded-full border text-xs font-semibold " +
        (active ? "border-blue-600 bg-blue-700 text-white" : "border-slate-200 bg-slate-50 text-slate-600")
      }
    >
      <Link href={href} className="inline-flex min-h-9 items-center pl-3 pr-1">
        {name}
      </Link>
      <button
        type="button"
        aria-label={`Delete view ${name}`}
        disabled={pending}
        className="inline-flex min-h-9 items-center pl-1 pr-2.5 opacity-70 hover:opacity-100"
        onClick={() => {
          if (!window.confirm(`Delete the view “${name}”?`)) return;
          start(async () => {
            const res = await deleteView({ id });
            if (res.ok) router.refresh();
            else window.alert(res.error);
          });
        }}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
