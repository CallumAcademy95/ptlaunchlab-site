"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { setPartnerContact, type SetContactState } from "./actions";

// How to reach a partner, in one place.
//
// Until this existed the only contact detail on a partner record was an email,
// and seven of the nine did not have one of those either — the addresses on the
// index come from pp_partner_users, which are logins rather than contacts.

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
      {pending ? "Saving…" : "Save contact details"}
    </button>
  );
}

export interface ContactPartner {
  id: string;
  gym_name: string;
  hasMobile: boolean;
}

export default function SetContactForm({ partners }: { partners: ContactPartner[] }) {
  const [state, formAction] = useActionState<SetContactState, FormData>(setPartnerContact, {});
  const missing = partners.filter((p) => !p.hasMobile);

  return (
    <form action={formAction} className="rounded-xl bg-white border border-slate-200 p-6 space-y-4">
      <div>
        <h2 className="text-slate-900 font-bold text-lg">Record contact details</h2>
        <p className="text-slate-500 text-xs mt-1">
          A blank box is left alone, so you can fill in one number without clearing the rest.
          {missing.length > 0 && (
            <>
              {" "}
              No mobile yet for{" "}
              <span className="text-amber-700">{missing.map((p) => p.gym_name).join(", ")}</span>.
            </>
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="contact-partner" className="block text-slate-500 text-xs font-semibold mb-1.5">
            Gym
          </label>
          <select id="contact-partner" name="partnerId" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Choose…
            </option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.gym_name}
                {p.hasMobile ? " — mobile on file" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="contact-mobile" className="block text-slate-500 text-xs font-semibold mb-1.5">
            Mobile
          </label>
          <input
            id="contact-mobile"
            name="contact_mobile"
            className={inputClass}
            placeholder="07828 594328"
            autoComplete="off"
          />
          <p className="text-slate-400 text-[11px] mt-1">
            Only a mobile can take a WhatsApp, so a landline here is refused.
          </p>
        </div>

        <div>
          <label htmlFor="contact-phone" className="block text-slate-500 text-xs font-semibold mb-1.5">
            Phone (the gym)
          </label>
          <input
            id="contact-phone"
            name="contact_phone"
            className={inputClass}
            placeholder="01904 611070"
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor="contact-name" className="block text-slate-500 text-xs font-semibold mb-1.5">
            Who to ask for
          </label>
          <input id="contact-name" name="contact_name" className={inputClass} placeholder="Miles" autoComplete="off" />
        </div>

        <div>
          <label htmlFor="contact-email" className="block text-slate-500 text-xs font-semibold mb-1.5">
            Contact email
          </label>
          <input
            id="contact-email"
            name="contact_email"
            type="email"
            className={inputClass}
            placeholder="miles@gym.co.uk"
            autoComplete="off"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="contact-instagram" className="block text-slate-500 text-xs font-semibold mb-1.5">
            Instagram
          </label>
          <input
            id="contact-instagram"
            name="contact_instagram"
            className={inputClass}
            placeholder="@6fitgym — or paste the profile link"
            autoComplete="off"
          />
        </div>
      </div>

      {state.error && <p className="text-rose-700 text-sm">{state.error}</p>}
      {state.ok && <p className="text-emerald-700 text-sm">{state.ok}</p>}

      <SubmitButton />
    </form>
  );
}
