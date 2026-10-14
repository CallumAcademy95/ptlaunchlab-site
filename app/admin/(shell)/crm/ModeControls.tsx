"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeMode } from "./actions";
import { DNC_REASONS, DNC_REASON_LABEL, MODE_LABEL, modeOf, type CrmMode, type DncReason } from "./crm";

// The control bar: who is in charge of this conversation.
//
// Every change goes through a confirm dialog. The server action only applies it
// if the conversation is still in the status this panel was rendered with
// (`setterStatus`); otherwise it answers "Changed elsewhere, refresh".

const MODE_SKIN: Record<CrmMode, string> = {
  ai: "bg-blue-100 text-blue-800",
  reply_only: "bg-violet-100 text-violet-800",
  human: "bg-amber-100 text-amber-800",
  dnc: "bg-rose-100 text-rose-800",
};

const EXPLAIN: Record<CrmMode, string> = {
  ai: "The setter replies and follows up on its own, as it does today.",
  reply_only: "The setter answers when they write, but sends nothing first: no nudges, re-engagement or scheduled chases.",
  human: "The setter goes silent. You reply yourself, from Gmail or WhatsApp.",
  dnc: "Nothing is sent on any channel: no replies, openers, nudges or re-engagement.",
};

export function ModeChip({ status }: { status: string | null }) {
  const mode = modeOf(status);
  if (!mode) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${MODE_SKIN[mode]}`}>
      {MODE_LABEL[mode]}
    </span>
  );
}

const BTN =
  "inline-flex min-h-11 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition disabled:opacity-50 md:min-h-9";

export function ModeControls({
  id,
  setterStatus,
  unsubscribed,
}: {
  id: string;
  setterStatus: string;
  unsubscribed: boolean;
}) {
  const router = useRouter();
  const mode = modeOf(setterStatus);
  const [target, setTarget] = useState<CrmMode | null>(null);
  const [reason, setReason] = useState<DncReason | "">("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<{ text: string; conflict?: boolean } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!mode) return null;

  const open = (t: CrmMode) => {
    setTarget(t);
    setReason("");
    setNote("");
    setError(null);
    setNotice(null);
  };

  const confirm = () => {
    if (!target) return;
    start(async () => {
      const res = await changeMode({ id, expected: setterStatus, target, reason: reason || undefined, note });
      if (!res.ok) {
        setError({ text: res.error, conflict: res.conflict });
        return;
      }
      setTarget(null);
      setNotice(res.warning ?? null);
      router.refresh();
    });
  };

  const handBack = mode === "human" || mode === "dnc";
  const aiBlocked = unsubscribed;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <ModeChip status={setterStatus} />
        {mode !== "human" && (
          <button type="button" className={`${BTN} border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100`} onClick={() => open("human")}>
            Take over
          </button>
        )}
        {!aiBlocked && mode !== "ai" && (
          <button type="button" className={`${BTN} border-blue-300 bg-white text-blue-800 hover:bg-blue-50`} onClick={() => open("ai")}>
            {handBack ? "Hand back: AI active" : "Switch to AI active"}
          </button>
        )}
        {!aiBlocked && mode !== "reply_only" && (
          <button type="button" className={`${BTN} border-violet-300 bg-white text-violet-800 hover:bg-violet-50`} onClick={() => open("reply_only")}>
            {handBack ? "Hand back: Reply-only" : "Switch to Reply-only"}
          </button>
        )}
        {mode !== "dnc" && (
          <button type="button" className={`${BTN} border-rose-300 bg-white text-rose-700 hover:bg-rose-50`} onClick={() => open("dnc")}>
            ⛔ Do not contact
          </button>
        )}
      </div>
      {aiBlocked && <p className="text-xs text-slate-500">They unsubscribed, so the AI can&apos;t be switched back on.</p>}
      {notice && <p className="text-xs text-amber-700">{notice}</p>}
      {error && !target && <p className="text-sm text-rose-700">{error.text}</p>}

      {target && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mode-dialog-title"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
          onKeyDown={(e) => e.key === "Escape" && !pending && setTarget(null)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 id="mode-dialog-title" className="text-base font-semibold text-slate-900">
              Change to {MODE_LABEL[target]}?
            </h2>
            <p className="mt-1 text-sm text-slate-600">{EXPLAIN[target]}</p>
            <p className="mt-1 text-xs text-slate-500">Nothing is sent by this change.</p>

            {target === "dnc" && (
              <fieldset className="mt-4 space-y-1.5">
                <legend className="text-sm font-medium text-slate-800">Reason (required)</legend>
                {DNC_REASONS.map((r) => (
                  <label key={r} className="flex min-h-9 items-center gap-2 text-sm text-slate-700">
                    <input type="radio" name="dnc_reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
                    {DNC_REASON_LABEL[r]}
                  </label>
                ))}
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={300}
                  rows={2}
                  placeholder={reason === "other" ? "Say why (required)" : "Note (optional)"}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
                />
              </fieldset>
            )}

            {error && (
              <div className="mt-3 text-sm text-rose-700">
                {error.text}{" "}
                {error.conflict && (
                  <button type="button" className="font-semibold underline" onClick={() => router.refresh()}>
                    Refresh
                  </button>
                )}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={`${BTN} border-slate-300 bg-white text-slate-700`} disabled={pending} onClick={() => setTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={`${BTN} border-slate-900 bg-slate-900 text-white hover:bg-slate-800`}
                disabled={pending || (target === "dnc" && (!reason || (reason === "other" && !note.trim())))}
                onClick={confirm}
              >
                {pending ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
