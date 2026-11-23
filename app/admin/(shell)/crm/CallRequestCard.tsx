"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { closeCallRequest } from "./actions";
import { CALL_OUTCOMES, CALL_OUTCOME_HINT, CALL_OUTCOME_LABEL, type CallOutcome } from "./crm";

// A lead who asked for a call (Leads Central call_handovers). The server
// renders the facts; this is only the "what happened?" buttons, each behind a
// confirm, the same way the mode controls work.

const BTN =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 disabled:opacity-50 md:min-h-9";

export function CallRequestOutcome({ id }: { id: string }) {
  const router = useRouter();
  const [picked, setPicked] = useState<CallOutcome | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();

  function save() {
    if (!picked) return;
    start(async () => {
      const r = await closeCallRequest({ id, outcome: picked });
      if (r.ok) {
        setMessage({ tone: "ok", text: r.warning ?? "Saved." });
        setPicked(null);
        router.refresh();
      } else {
        setMessage({ tone: "err", text: r.error });
      }
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">What happened?</p>
      <div className="flex flex-wrap gap-2">
        {CALL_OUTCOMES.map((o) => (
          <button key={o} type="button" className={BTN} disabled={pending} aria-pressed={picked === o} onClick={() => { setPicked(o); setMessage(null); }}>
            {CALL_OUTCOME_LABEL[o]}
          </button>
        ))}
      </div>
      {picked && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <p>
            <span className="font-semibold">{CALL_OUTCOME_LABEL[picked]}:</span> {CALL_OUTCOME_HINT[picked]}
          </p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={save} disabled={pending} className="inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50 md:min-h-9">
              {pending ? "Saving…" : "Confirm"}
            </button>
            <button type="button" onClick={() => setPicked(null)} disabled={pending} className={BTN}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {message && <p role="status" className={`text-sm ${message.tone === "ok" ? "text-emerald-700" : "text-rose-700"}`}>{message.text}</p>}
    </div>
  );
}
