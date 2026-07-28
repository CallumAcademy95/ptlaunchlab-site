"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { partnerSaveBankDetails, type PartnerFormState } from "../../actions";
import type { MaskedBankDetails } from "@/app/lib/partner-bank";

type State = PartnerFormState & { success?: string };

const inputClass =
  "w-full px-4 py-2.5 rounded-lg bg-deep border border-white/15 text-white placeholder:text-soft/60 focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";

function SubmitButton({ isSet }: { isSet: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-2.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
    >
      {pending ? "Saving…" : isSet ? "Update payment details" : "Save payment details"}
    </button>
  );
}

export default function BankDetailsForm({ current }: { current: MaskedBankDetails }) {
  const [state, formAction] = useActionState<State, FormData>(partnerSaveBankDetails, {});
  // Details already on file stay collapsed — the common case is a partner
  // glancing to confirm the right account, not editing.
  const [editing, setEditing] = useState(!current.isSet);

  return (
    <div className="rounded-xl bg-card border border-white/10 p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h3 className="text-white font-bold text-base">Where we pay you</h3>
          {current.isSet ? (
            <p className="text-soft text-sm mt-1">
              {current.accountName} · {current.sortCodeMasked} · {current.accountNumberMasked}
            </p>
          ) : (
            <p className="text-soft text-sm mt-1">
              We don&rsquo;t have your bank details yet — we can&rsquo;t pay you without them.
            </p>
          )}
        </div>
        {current.isSet && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-gold text-xs font-semibold hover:underline shrink-0"
          >
            Change
          </button>
        )}
      </div>

      {state.success && (
        <div role="status" className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-emerald-200 text-sm">
          {state.success}
        </div>
      )}

      {editing && (
        <form action={formAction} className="space-y-3">
          <div>
            <label htmlFor="accountName" className="block text-soft text-xs font-semibold mb-1.5">
              Name on the account
            </label>
            <input id="accountName" name="accountName" type="text" required className={inputClass} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="sortCode" className="block text-soft text-xs font-semibold mb-1.5">
                Sort code
              </label>
              <input
                id="sortCode"
                name="sortCode"
                type="text"
                inputMode="numeric"
                placeholder="12-34-56"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="accountNumber" className="block text-soft text-xs font-semibold mb-1.5">
                Account number
              </label>
              <input
                id="accountNumber"
                name="accountNumber"
                type="text"
                inputMode="numeric"
                placeholder="12345678"
                required
                className={inputClass}
              />
            </div>
          </div>

          {state.error && (
            <div role="alert" className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-200 text-sm">
              {state.error}
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <SubmitButton isSet={current.isSet} />
            {current.isSet && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-soft text-xs font-semibold hover:text-white"
              >
                Cancel
              </button>
            )}
          </div>

          <p className="text-soft text-xs leading-relaxed">
            We only ever show the last 4 digits back to you. If these details change, everyone with a
            login on this account gets an email — so a change you didn&rsquo;t make can&rsquo;t go
            unnoticed.
          </p>
        </form>
      )}
    </div>
  );
}
