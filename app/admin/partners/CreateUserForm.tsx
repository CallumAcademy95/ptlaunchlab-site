"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createPartnerUser, type CreatePartnerUserState } from "./actions";

const inputClass =
  "w-full px-4 py-2.5 rounded-lg bg-deep border border-white/15 text-white placeholder:text-soft focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-2.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
    >
      {pending ? "Creating…" : "Create login and email them"}
    </button>
  );
}

export default function CreateUserForm({
  partners,
}: {
  partners: { id: string; gym_name: string; slug: string }[];
}) {
  const [state, formAction] = useActionState<CreatePartnerUserState, FormData>(
    createPartnerUser,
    {}
  );

  return (
    <form action={formAction} className="rounded-xl bg-card border border-white/10 p-6 space-y-4">
      <h2 className="text-white font-bold text-lg">Create a partner login</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="partnerId" className="block text-soft text-xs font-semibold mb-1.5">
            Partner
          </label>
          <select id="partnerId" name="partnerId" required className={inputClass}>
            <option value="">Choose a gym…</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.gym_name} ({p.slug})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="role" className="block text-soft text-xs font-semibold mb-1.5">
            Role
          </label>
          <select id="role" name="role" defaultValue="owner" className={inputClass}>
            <option value="owner">Owner</option>
            <option value="staff">Staff</option>
          </select>
        </div>

        <div>
          <label htmlFor="fullName" className="block text-soft text-xs font-semibold mb-1.5">
            Full name
          </label>
          <input id="fullName" name="fullName" type="text" className={inputClass} />
        </div>

        <div>
          <label htmlFor="email" className="block text-soft text-xs font-semibold mb-1.5">
            Email address
          </label>
          <input id="email" name="email" type="email" required className={inputClass} />
        </div>
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-200 text-sm"
        >
          {state.error}
        </div>
      )}
      {state.success && (
        <div
          role="status"
          className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-emerald-200 text-sm"
        >
          {state.success}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
