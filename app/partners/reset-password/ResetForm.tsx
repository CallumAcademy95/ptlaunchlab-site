"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { resetPasswordWithToken, type PartnerFormState } from "../actions";

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
      {pending ? "Saving…" : "Set my password"}
    </button>
  );
}

export default function ResetForm({ token }: { token: string }) {
  const [state, formAction] = useActionState<PartnerFormState, FormData>(resetPasswordWithToken, {});

  return (
    <form action={formAction} className="space-y-4">
      {/* The token is redeemed on submit, not on page load — a mail scanner
          previewing the link would otherwise burn it before its owner clicks. */}
      <input type="hidden" name="token" value={token} />

      <div>
        <label htmlFor="password" className="block text-soft text-xs font-semibold mb-1.5">
          New password
        </label>
        <input id="password" name="password" type="password" autoComplete="new-password" autoFocus required minLength={10} className={inputClass} />
        <p className="text-soft text-xs mt-1.5">At least 10 characters.</p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-soft text-xs font-semibold mb-1.5">
          Confirm new password
        </label>
        <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={10} className={inputClass} />
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
