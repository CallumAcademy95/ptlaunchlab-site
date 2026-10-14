"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { sendOwnerMessage } from "./actions";
import {
  SEND_UNCONFIRMED,
  TEMPLATE_NOTICE,
  TEMPLATE_NOTICE_PROBABLY,
  WINDOW_PROBABLY_OPEN,
  channelLabel,
  insideWhatsAppWindow,
  replyCount,
  replyState,
  type ReplyChannel,
} from "./crm";

// Callum's reply box, under the conversation.
//
// The text goes to sendOwnerMessage, which hands it to Leads Central to send
// and record. Each send attempt carries a requestId; when an attempt can't be
// confirmed (timeout, connection lost) the same id is reused for a retry of
// the same message, so Leads Central's dedupe stops it going out twice.

const BTN =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition disabled:opacity-50 md:min-h-9";

function newRequestId(): string {
  return crypto.randomUUID();
}

export function ReplyBox({
  consultationId,
  setterStatus,
  unsubscribed,
  channels,
  defaultChannel,
  lastWhatsAppInbound,
  windowExact,
  templateAtRender,
}: {
  consultationId: string;
  setterStatus: string;
  unsubscribed: boolean;
  channels: ReplyChannel[];
  defaultChannel: ReplyChannel | null;
  /** Their newest inbound WhatsApp message, from the loaded timeline. */
  lastWhatsAppInbound: string | null;
  /**
   * False when that time is the stored row's created_at (no identity
   * timestamp): it can be hours late, so the notice says "probably". Leads
   * Central makes the real decision either way.
   */
  windowExact: boolean;
  /** Server's view at render time: a WhatsApp reply would go as the template. */
  templateAtRender: boolean;
}) {
  const router = useRouter();
  const [channel, setChannel] = useState<ReplyChannel | null>(defaultChannel);
  const [text, setText] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [windowClosed, setWindowClosed] = useState(false);
  const [error, setError] = useState<{ text: string; conflict?: boolean } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // Synchronous guard: a second click lands before `pending` re-renders.
  const inFlight = useRef(false);
  // The id of an attempt that may have gone out, and what it was sending.
  const retry = useRef<{ id: string; key: string } | null>(null);

  const state = replyState(setterStatus, unsubscribed);
  const template = channel === "whatsapp" && (templateAtRender || windowClosed);
  const count = replyCount(text, template);
  const blockedReason =
    state.kind === "blocked" ? state.reason : channels.length === 0 ? "No WhatsApp number or email to reply to" : null;
  const canSend = !blockedReason && !!channel && count.length > 0 && !count.over && !pending;

  const send = () => {
    if (inFlight.current || !channel || state.kind === "blocked") return;
    inFlight.current = true;
    const key = `${channel}\u0000${text.trim()}`;
    const requestId = retry.current && retry.current.key === key ? retry.current.id : newRequestId();
    setError(null);
    setNotice(null);
    start(async () => {
      try {
        const res = await sendOwnerMessage({ consultationId, channel, text, expectStatus: setterStatus, requestId });
        if (res.ok) {
          retry.current = null;
          setText("");
          setConfirming(false);
          setNotice(
            res.duplicate
              ? "Already sent: an earlier attempt went through, so nothing new went out."
              : `Sent ${res.template ? "as the WhatsApp template" : `by ${channelLabel(channel)}`}.` +
                  (res.truncated ? " It was shortened to fit the template." : "") +
                  (res.tookOver ? " You've taken over: the setter stays silent until you hand back." : ""),
          );
          router.refresh();
          return;
        }
        // Same id only when the attempt may have gone out; a fresh one after any
        // definite answer (including a conflict).
        retry.current = res.retrySameId ? { id: requestId, key } : null;
        setError({ text: res.error, conflict: res.conflict });
        if (res.refresh) router.refresh();
      } catch {
        // The action itself didn't answer: it may still have sent.
        retry.current = { id: requestId, key };
        setError({ text: SEND_UNCONFIRMED });
      } finally {
        inFlight.current = false;
      }
    });
  };

  const onSendClick = () => {
    if (!canSend || inFlight.current) return;
    // Re-check the window now: the page may have been open a while.
    let tpl = template;
    if (channel === "whatsapp" && !tpl && !insideWhatsAppWindow(lastWhatsAppInbound, Date.now())) {
      setWindowClosed(true);
      tpl = true;
      if (replyCount(text, true).over) return; // the counter now shows the template cap
    }
    if (state.kind === "takeover" || tpl) {
      setError(null);
      setConfirming(true);
      return;
    }
    send();
  };

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">Reply</p>
        {channels.length > 1 ? (
          <div role="radiogroup" aria-label="Send by" className="inline-flex rounded-lg border border-slate-300 p-0.5">
            {channels.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={channel === c}
                disabled={pending || !!blockedReason}
                onClick={() => {
                  setChannel(c);
                  setError(null);
                }}
                className={`min-h-9 rounded-md px-3 text-sm font-semibold ${channel === c ? "bg-slate-900 text-white" : "text-slate-700"}`}
              >
                {channelLabel(c)}
              </button>
            ))}
          </div>
        ) : (
          channel && <span className="text-xs text-slate-500">by {channelLabel(channel)}</span>
        )}
      </div>

      {template && !blockedReason && (
        <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm font-medium text-amber-900">
          {windowExact || windowClosed ? TEMPLATE_NOTICE : TEMPLATE_NOTICE_PROBABLY}
        </p>
      )}
      {channel === "whatsapp" && !template && !windowExact && !blockedReason && (
        <p className="mt-2 text-xs text-slate-500">{WINDOW_PROBABLY_OPEN}</p>
      )}

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setNotice(null);
        }}
        disabled={!!blockedReason || pending}
        rows={4}
        aria-label="Your reply"
        placeholder={blockedReason ?? "Write your reply…"}
        // 16px stops iOS zooming the page when the box is focused.
        className="mt-2 w-full rounded-lg border border-slate-300 p-2.5 text-base leading-relaxed text-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
      />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className={`text-xs ${count.over ? "font-semibold text-rose-700" : "text-slate-500"}`}>
          {count.length}/{count.max}
          {count.over && template ? " (template limit)" : ""}
        </span>
        {blockedReason ? (
          <span className="text-sm font-medium text-slate-600">{blockedReason}</span>
        ) : (
          <button
            type="button"
            disabled={!canSend}
            onClick={onSendClick}
            className={`${BTN} ${state.kind === "takeover" ? "border-amber-400 bg-amber-500 text-white hover:bg-amber-600" : "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"}`}
          >
            <Send className="h-4 w-4" />
            {pending ? "Sending…" : state.kind === "blocked" ? "Send" : state.label}
          </button>
        )}
      </div>
      {state.kind === "takeover" && !blockedReason && (
        <p className="mt-1 text-xs text-slate-500">Sending takes over: the setter goes silent until you hand back.</p>
      )}

      {notice && <p className="mt-2 text-sm text-green-700">{notice}</p>}
      {error && !confirming && (
        <p className="mt-2 text-sm text-rose-700">
          {error.text}{" "}
          {error.conflict && (
            <button type="button" className="font-semibold underline" onClick={() => router.refresh()}>
              Refresh
            </button>
          )}
        </p>
      )}

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reply-dialog-title"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
          onKeyDown={(e) => e.key === "Escape" && !pending && setConfirming(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 id="reply-dialog-title" className="text-base font-semibold text-slate-900">
              {state.kind === "takeover" ? "Take over and send?" : "Send as a template?"}
            </h2>
            {state.kind === "takeover" && (
              <p className="mt-1 text-sm text-slate-600">
                This switches them to 👤 Human first, so the setter goes silent until you hand back. Then your message goes out.
              </p>
            )}
            {template && (
              <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-900">
                {windowExact || windowClosed ? TEMPLATE_NOTICE : TEMPLATE_NOTICE_PROBABLY}. It opens “Hi &lt;first name&gt;, it&apos;s Callum from PT Launch Lab.” and your text follows on one line.
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500">By {channel ? channelLabel(channel) : "?"}, from the setter&apos;s number/inbox.</p>

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
              <button type="button" className={`${BTN} border-slate-300 bg-white text-slate-700`} disabled={pending} onClick={() => setConfirming(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={`${BTN} border-slate-900 bg-slate-900 text-white hover:bg-slate-800`}
                disabled={pending || !text.trim()}
                onClick={send}
              >
                {pending ? "Sending…" : "Confirm and send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
