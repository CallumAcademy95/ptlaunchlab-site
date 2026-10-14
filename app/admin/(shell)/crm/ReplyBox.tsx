"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { sendOwnerMessage } from "./actions";
import {
  RESEND_WARNING,
  SEND_UNCONFIRMED,
  TEMPLATE_CUT_WARNING,
  TEMPLATE_NOTICE,
  TEMPLATE_NOTICE_PROBABLY,
  WINDOW_PROBABLY_OPEN,
  attemptAfter,
  channelLabel,
  insideWhatsAppWindow,
  planAttempt,
  replyCount,
  replyForm,
  replyKey,
  replyState,
  sentNotice,
  type LastAttempt,
  type ReplyChannel,
  type ReplyForm,
} from "./crm";

// Callum's reply box, under the conversation.
//
// The text goes to sendOwnerMessage, which hands it to Leads Central to send
// and record. Each send attempt carries a requestId. When an attempt may have
// gone out (timeout, lost connection, still in progress) a retry of the same
// message reuses its id, so Leads Central's dedupe stops it going twice; any
// other message after that needs an explicit "send as a new message?" first.

const BTN =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition disabled:opacity-50 md:min-h-9";

function newRequestId(): string {
  return crypto.randomUUID();
}

/** One send, decided when Send is clicked and frozen while it's confirmed. */
interface SendPlan {
  channel: ReplyChannel;
  text: string;
  key: string;
  requestId: string;
  takeover: boolean;
  form: ReplyForm;
  resend: boolean;
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
  /** When their last WhatsApp message was sent, by Leads Central's rule. */
  lastWhatsAppInbound: string | null;
  /**
   * False when that time is the stored row's created_at (no identity
   * timestamp): it can be hours late, so the notices say "probably". Leads
   * Central makes the real decision either way.
   */
  windowExact: boolean;
  /** Server's view at render time: a WhatsApp reply would go as the template. */
  templateAtRender: boolean;
}) {
  const router = useRouter();
  const [channel, setChannel] = useState<ReplyChannel | null>(defaultChannel);
  const [text, setText] = useState("");
  const [plan, setPlan] = useState<SendPlan | null>(null);
  const [windowClosed, setWindowClosed] = useState(false);
  const [error, setError] = useState<{ text: string; conflict?: boolean } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // Synchronous guard: a second click lands before `pending` re-renders.
  const inFlight = useRef(false);
  // The last attempt that may have gone out (null after a success or a definite refusal).
  const last = useRef<LastAttempt | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus the dialog when it opens, so Escape and Tab work from the keyboard.
  useEffect(() => {
    if (plan) cancelRef.current?.focus();
  }, [plan]);

  const state = replyState(setterStatus, unsubscribed);
  const form = replyForm(channel, templateAtRender || windowClosed, windowExact);
  const count = replyCount(text, form);
  const blockedReason =
    state.kind === "blocked" ? state.reason : channels.length === 0 ? "No WhatsApp or email they can be sent to" : null;
  const canSend = !blockedReason && !!channel && count.length > 0 && !count.over && !pending;

  const send = (p: SendPlan) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    setNotice(null);
    start(async () => {
      try {
        const res = await sendOwnerMessage({
          consultationId,
          channel: p.channel,
          text: p.text,
          expectStatus: setterStatus,
          requestId: p.requestId,
        });
        last.current = attemptAfter(res, p.requestId, p.key);
        if (res.ok) {
          setText("");
          setPlan(null);
          setNotice(sentNotice(res, p.channel));
          router.refresh();
          return;
        }
        // Close the dialog: the next Send is planned afresh (and picks the id).
        setPlan(null);
        setError({ text: res.error, conflict: res.conflict });
        if (res.refresh) router.refresh();
      } catch {
        // The action itself didn't answer: it may still have sent.
        last.current = { id: p.requestId, key: p.key, reusable: true, uncertain: true };
        setPlan(null);
        setError({ text: SEND_UNCONFIRMED });
      } finally {
        inFlight.current = false;
      }
    });
  };

  const onSendClick = () => {
    if (!canSend || !channel || inFlight.current || state.kind === "blocked") return;
    // Re-check the window now: the page may have been open a while.
    let f = form;
    if (channel === "whatsapp" && f === "free" && !insideWhatsAppWindow(lastWhatsAppInbound, Date.now())) {
      setWindowClosed(true);
      f = replyForm(channel, true, windowExact);
      if (replyCount(text, f).over) return; // the counter now shows the template cap
    }
    const key = replyKey(channel, text);
    const attempt = planAttempt(last.current, key, newRequestId);
    const p: SendPlan = {
      channel,
      text,
      key,
      requestId: attempt.requestId,
      takeover: state.kind === "takeover",
      form: f,
      resend: attempt.confirmResend,
    };
    if (p.takeover || p.form !== "free" || p.resend) {
      setError(null);
      setPlan(p);
      return;
    }
    send(p);
  };

  const dialogTitle = plan
    ? plan.resend
      ? "Send as a new message?"
      : plan.takeover
        ? "Take over and send?"
        : plan.form === "template"
          ? "Send as a template?"
          : "Send, maybe as a template?"
    : "";

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

      {!blockedReason && form === "template" && (
        <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm font-medium text-amber-900">{TEMPLATE_NOTICE}</p>
      )}
      {!blockedReason && form === "maybe_template" && (
        <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm font-medium text-amber-900">
          {TEMPLATE_NOTICE_PROBABLY}. {TEMPLATE_CUT_WARNING}
        </p>
      )}
      {!blockedReason && channel === "whatsapp" && form === "free" && !windowExact && (
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
        <span className={`text-xs ${count.over ? "font-semibold text-rose-700" : count.willCut ? "font-semibold text-amber-700" : "text-slate-500"}`}>
          {count.length}/{count.max}
          {count.over && form === "template" ? " (template limit)" : ""}
          {count.willCut ? " (over 900: would be cut if sent as a template)" : ""}
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
      {error && !plan && (
        <p className="mt-2 text-sm text-rose-700">
          {error.text}{" "}
          {error.conflict && (
            <button type="button" className="font-semibold underline" onClick={() => router.refresh()}>
              Refresh
            </button>
          )}
        </p>
      )}

      {plan && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reply-dialog-title"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
          onKeyDown={(e) => e.key === "Escape" && !pending && setPlan(null)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 id="reply-dialog-title" className="text-base font-semibold text-slate-900">
              {dialogTitle}
            </h2>
            {plan.resend && <p className="mt-1 rounded-lg bg-rose-50 p-2 text-sm font-medium text-rose-900">{RESEND_WARNING}</p>}
            {plan.takeover && (
              <p className="mt-2 text-sm text-slate-600">
                This switches them to 👤 Human first, so the setter goes silent until you hand back. Then your message goes out.
              </p>
            )}
            {plan.form !== "free" && (
              <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-900">
                {plan.form === "template" ? TEMPLATE_NOTICE : TEMPLATE_NOTICE_PROBABLY}. It opens “Hi &lt;first name&gt;, it&apos;s
                Callum from PT Launch Lab.” and your text follows on one line.
                {plan.form === "maybe_template" && ` ${TEMPLATE_CUT_WARNING}`}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500">By {channelLabel(plan.channel)}, from the setter&apos;s number/inbox.</p>

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
              <button
                ref={cancelRef}
                type="button"
                className={`${BTN} border-slate-300 bg-white text-slate-700`}
                disabled={pending}
                onClick={() => setPlan(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${BTN} border-slate-900 bg-slate-900 text-white hover:bg-slate-800`}
                disabled={pending}
                onClick={() => send(plan)}
              >
                {pending ? "Sending…" : plan.resend ? "Send as a new message" : "Confirm and send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
