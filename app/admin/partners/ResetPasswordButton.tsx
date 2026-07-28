"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { resetPartnerPassword, type ResetPasswordState } from "./actions";

function Button() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-gold text-[10px] font-semibold hover:underline disabled:opacity-60"
    >
      {pending ? "Resetting…" : "Reset password"}
    </button>
  );
}

export default function ResetPasswordButton({ userId }: { userId: string }) {
  const [state, formAction] = useActionState<ResetPasswordState, FormData>(resetPartnerPassword, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={userId} />
      <Button />
      {state.error && <p className="text-red-300 text-[10px] mt-0.5">{state.error}</p>}
      {state.success && <p className="text-emerald-300 text-[10px] mt-0.5">{state.success}</p>}
    </form>
  );
}
