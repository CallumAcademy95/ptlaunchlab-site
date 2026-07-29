"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestPasswordReset, type ResetRequestState } from "../actions";

const inputClass =
  "w-full px-4 py-3 rounded-lg bg-card border border-white/15 text-white placeholder:text-soft focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-6 py-3 rounded-full bg-gold text-deep font-bold hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
    >
      {pending ? "Sending…" : "Send me a link"}
    </button>
  );
}

export default function ForgotForm() {
  const [state, formAction] = useActionState<ResetRequestState, FormData>(requestPasswordReset, {});

  // Deliberately the same confirmation whether or not the address exists —
  // anything else lets someone work out which gyms we work with.
  if (state.sent) {
    return (
      <div
        role="status"
        className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-4 text-emerald-200 text-sm leading-relaxed"
      >
        If that email has a partner account, a reset link is on its way. It works once and expires
        shortly, so use it now rather than saving it.
        <div className="text-soft text-xs mt-2">
          Nothing arrived? Check spam, then email info@ptlaunchlab.co.uk.
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-soft text-xs font-semibold mb-1.5">
          Email address
        </label>
        <input id="email" name="email" type="email" autoComplete="username" autoFocus required className={inputClass} />
      </div>

      {state.error && (
        <div role="alert" className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-200 text-sm">
          {state.error}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
