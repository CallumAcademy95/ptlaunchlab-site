"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { partnerSetPassword, type PartnerFormState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-6 py-3 rounded-full bg-gold text-deep font-bold hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
    >
      {pending ? "Saving…" : "Set password and continue"}
    </button>
  );
}

export default function SetPasswordForm() {
  const [state, formAction] = useActionState<PartnerFormState, FormData>(partnerSetPassword, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-soft text-xs font-semibold mb-1.5">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          autoFocus
          required
          minLength={10}
          className="w-full px-4 py-3 rounded-lg bg-card border border-white/15 text-white placeholder:text-soft focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
        />
        <p className="text-soft text-xs mt-1.5">At least 10 characters.</p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-soft text-xs font-semibold mb-1.5">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          className="w-full px-4 py-3 rounded-lg bg-card border border-white/15 text-white placeholder:text-soft focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
        />
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-200 text-sm"
        >
          {state.error}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
