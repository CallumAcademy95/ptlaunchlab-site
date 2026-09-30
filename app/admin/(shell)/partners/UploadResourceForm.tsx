"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { uploadResource, type UploadResourceState } from "./actions";
import { RESOURCE_CATEGORIES } from "@/app/lib/partner-resources";

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
      {pending ? "Uploading…" : "Add resource"}
    </button>
  );
}

export default function UploadResourceForm({
  partners,
}: {
  partners: { id: string; gym_name: string }[];
}) {
  const [state, formAction] = useActionState<UploadResourceState, FormData>(uploadResource, {});
  // A file and a link are alternatives, not both — showing both at once invites
  // filling in both and wondering which won.
  const [mode, setMode] = useState<"file" | "link">("file");

  return (
    <form action={formAction} className="rounded-xl bg-white border border-slate-200 p-6 space-y-4">
      <div>
        <h2 className="text-slate-900 font-bold text-lg">Add a resource</h2>
        <p className="text-slate-500 text-xs mt-1">
          Leave the gym blank to share it with every partner. Files go to a private bucket — partners
          only ever get a 60-second signed link.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="res-partner" className="block text-slate-500 text-xs font-semibold mb-1.5">
            Gym
          </label>
          <select id="res-partner" name="partnerId" defaultValue="" className={inputClass}>
            <option value="">All partners (shared)</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>{p.gym_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="res-category" className="block text-slate-500 text-xs font-semibold mb-1.5">
            Category
          </label>
          <select id="res-category" name="category" required defaultValue="" className={inputClass}>
            <option value="" disabled>Choose…</option>
            {RESOURCE_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="res-title" className="block text-slate-500 text-xs font-semibold mb-1.5">
          Title
        </label>
        <input id="res-title" name="title" type="text" required placeholder="A3 QR poster" className={inputClass} />
      </div>

      <div>
        <label htmlFor="res-description" className="block text-slate-500 text-xs font-semibold mb-1.5">
          Description
        </label>
        <input
          id="res-description"
          name="description"
          type="text"
          placeholder="Print at A3 for the front desk. Scans straight to your academy page."
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="res-pack" className="block text-slate-500 text-xs font-semibold mb-1.5">
          Campaign pack (optional)
        </label>
        <input
          id="res-pack"
          name="pack"
          type="text"
          placeholder="campaign-january-new-career"
          className={inputClass}
        />
        <p className="text-slate-500 text-[10px] mt-1">
          The playbook entry&rsquo;s filename without .md. Attaches this file inside that campaign.
        </p>
      </div>

      <div className="flex gap-2">
        {(["file", "link"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              mode === m ? "border-blue-600 text-blue-700 bg-blue-50" : "border-slate-200 text-slate-500 hover:text-slate-900"
            }`}
          >
            {m === "file" ? "Upload a file" : "Link somewhere else"}
          </button>
        ))}
      </div>

      {mode === "file" ? (
        <div>
          <label htmlFor="res-file" className="block text-slate-500 text-xs font-semibold mb-1.5">
            File (max 50MB)
          </label>
          <input id="res-file" name="file" type="file" className={`${inputClass} py-2`} />
        </div>
      ) : (
        <div>
          <label htmlFor="res-url" className="block text-slate-500 text-xs font-semibold mb-1.5">
            Link (Drive, Canva, YouTube…)
          </label>
          <input id="res-url" name="externalUrl" type="url" placeholder="https://…" className={inputClass} />
        </div>
      )}

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
