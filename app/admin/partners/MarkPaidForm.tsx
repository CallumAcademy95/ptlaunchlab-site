"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { markCommissionPaid, type MarkPaidState } from "./actions";

function SubmitButton({ amount }: { amount: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-full bg-gold text-deep text-xs font-bold hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all whitespace-nowrap"
    >
      {pending ? "Recording…" : `Mark ${amount} paid`}
    </button>
  );
}

export default function MarkPaidForm({
  partnerId,
  amount,
  count,
  today,
}: {
  partnerId: string;
  amount: string;
  count: number;
  today: string;
}) {
  const [state, formAction] = useActionState<MarkPaidState, FormData>(markCommissionPaid, {});

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="partnerId" value={partnerId} />
      <div className="flex items-end gap-2 flex-wrap">
        <div>
          <label htmlFor={`paidOn-${partnerId}`} className="block text-soft text-[10px] font-semibold mb-1">
            Date sent
          </label>
          <input
            id={`paidOn-${partnerId}`}
            name="paidOn"
            type="date"
            defaultValue={today}
            required
            className="px-3 py-2 rounded-lg bg-deep border border-white/15 text-white text-xs focus:border-gold/60 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor={`ref-${partnerId}`} className="block text-soft text-[10px] font-semibold mb-1">
            Reference
          </label>
          <input
            id={`ref-${partnerId}`}
            name="reference"
            type="text"
            placeholder="bank-transfer"
            className="px-3 py-2 rounded-lg bg-deep border border-white/15 text-white text-xs placeholder:text-soft/60 focus:border-gold/60 focus:outline-none w-36"
          />
        </div>
        <SubmitButton amount={amount} />
      </div>

      <p className="text-soft text-[10px]">
        Settles {count} enrolment{count === 1 ? "" : "s"}. The date is what the partner sees.
      </p>

      {state.error && <p className="text-red-300 text-xs">{state.error}</p>}
      {state.success && <p className="text-emerald-300 text-xs">{state.success}</p>}
    </form>
  );
}
