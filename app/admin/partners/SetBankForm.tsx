"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { setPartnerBankDetails, type SetBankState } from "./actions";

const inputClass =
  "w-full px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-2.5 rounded-lg bg-blue-700 text-white font-bold text-sm hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
    >
      {pending ? "Saving…" : "Save bank details"}
    </button>
  );
}

export default function SetBankForm({
  partners,
}: {
  partners: { id: string; gym_name: string; hasBank: boolean }[];
}) {
  const [state, formAction] = useActionState<SetBankState, FormData>(setPartnerBankDetails, {});
  const missing = partners.filter((p) => !p.hasBank);

  return (
    <form action={formAction} className="rounded-xl bg-white border border-slate-200 p-6 space-y-4">
      <div>
        <h2 className="text-slate-900 font-bold text-lg">Record bank details</h2>
        <p className="text-slate-500 text-xs mt-1">
          For details you were given by email. Until they&rsquo;re here the partner gets nagged on
          their home page for something you already have.
          {missing.length > 0 && (
            <> Still missing: <span className="text-amber-700">{missing.map((p) => p.gym_name).join(", ")}</span>.</>
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="bank-partner" className="block text-slate-500 text-xs font-semibold mb-1.5">Gym</label>
          <select id="bank-partner" name="partnerId" required defaultValue="" className={inputClass}>
            <option value="" disabled>Choose…</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.gym_name}{p.hasBank ? " — on file" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="bank-name" className="block text-slate-500 text-xs font-semibold mb-1.5">Name on the account</label>
          <input id="bank-name" name="accountName" type="text" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="bank-sort" className="block text-slate-500 text-xs font-semibold mb-1.5">Sort code</label>
          <input id="bank-sort" name="sortCode" type="text" inputMode="numeric" placeholder="12-34-56" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="bank-acc" className="block text-slate-500 text-xs font-semibold mb-1.5">Account number</label>
          <input id="bank-acc" name="accountNumber" type="text" inputMode="numeric" placeholder="12345678" required className={inputClass} />
        </div>
      </div>

      {state.error && (
        <div role="alert" className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-200 text-sm">
          {state.error}
        </div>
      )}
      {state.success && (
        <div role="status" className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-emerald-200 text-sm">
          {state.success}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
