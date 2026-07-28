"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addPlaybookEntry, type PlaybookEntryState } from "./actions";
import { PLAYBOOK_TYPES } from "@/app/lib/partner-playbook-types";

const inputClass =
  "w-full px-4 py-2.5 rounded-lg bg-deep border border-white/15 text-white placeholder:text-soft/60 focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-2.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
    >
      {pending ? "Saving…" : "Add to playbook"}
    </button>
  );
}

export default function AddPlaybookForm() {
  const [state, formAction] = useActionState<PlaybookEntryState, FormData>(addPlaybookEntry, {});

  return (
    <form action={formAction} className="rounded-xl bg-card border border-white/10 p-6 space-y-4">
      <div>
        <h2 className="text-white font-bold text-lg">Add a playbook entry</h2>
        <p className="text-soft text-xs mt-1">
          For one-offs. The curated entries live as markdown in the repo and win on a title clash, so
          nothing reviewed gets overwritten from here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label htmlFor="pb-title" className="block text-soft text-xs font-semibold mb-1.5">Title</label>
          <input id="pb-title" name="title" type="text" required placeholder="January intake — story post" className={inputClass} />
        </div>
        <div>
          <label htmlFor="pb-type" className="block text-soft text-xs font-semibold mb-1.5">Section</label>
          <select id="pb-type" name="type" required defaultValue="" className={inputClass}>
            <option value="" disabled>Choose…</option>
            {PLAYBOOK_TYPES.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="pb-channel" className="block text-soft text-xs font-semibold mb-1.5">Channel</label>
          <input id="pb-channel" name="channel" type="text" placeholder="Instagram" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="pb-when" className="block text-soft text-xs font-semibold mb-1.5">Use it when</label>
          <input id="pb-when" name="whenToUse" type="text" placeholder="A member asks what the course involves" className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="pb-body" className="block text-soft text-xs font-semibold mb-1.5">
          Content (markdown)
        </label>
        <textarea
          id="pb-body"
          name="body"
          rows={8}
          placeholder={"Anything in a fenced code block becomes a copy button:\n\n```\nSome of you already spend more time here than we do...\n```"}
          className={`${inputClass} font-mono text-xs`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="pb-file" className="block text-soft text-xs font-semibold mb-1.5">Attach a file</label>
          <input id="pb-file" name="file" type="file" className={`${inputClass} py-2`} />
        </div>
        <div>
          <label htmlFor="pb-url" className="block text-soft text-xs font-semibold mb-1.5">Or a link</label>
          <input id="pb-url" name="externalUrl" type="url" placeholder="https://…" className={inputClass} />
        </div>
        <div>
          <label htmlFor="pb-order" className="block text-soft text-xs font-semibold mb-1.5">Order</label>
          <input id="pb-order" name="sortOrder" type="number" defaultValue={100} className={inputClass} />
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
