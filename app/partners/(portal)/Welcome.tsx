"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { dismissOnboarding } from "../actions";

const STEPS = [
  {
    href: "/partners",
    label: "My Academy",
    body: "Your academy link and QR code. Print the QR and put it where members already stand still — the front desk, the changing room mirror, the wall people face on the leg press.",
  },
  {
    href: "/partners/playbook",
    label: "Playbook",
    body: "What to post, what to say, and when to push. Captions, member emails, and the exact words for your team when someone asks what the poster is about. Copy it, swap in your gym's name, use it.",
  },
  {
    href: "/partners/resources",
    label: "Resources",
    body: "Your posters, your member handout, and a video for your gym TV — all branded to you. Plus your signed agreement, so you never have to go looking for it.",
  },
  {
    href: "/partners/sales",
    label: "Enrolments",
    body: "Every member who enrols through your link, as it happens. No waiting for a monthly summary and no need to ask us.",
  },
  {
    href: "/partners/payments",
    label: "Payments",
    body: "What you're owed, when it becomes payable, and what we've already paid. Add your bank details here so nothing waits on a chase.",
  },
];

function DismissButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-2.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 disabled:opacity-60 transition-all"
    >
      {pending ? "…" : "Got it — take me in"}
    </button>
  );
}

/**
 * First-run walkthrough.
 *
 * Steps advance one at a time rather than listing all five at once: a wall of
 * text on first sign-in gets skipped, and the point is that they actually read
 * what the Playbook is for. Each step links to the tab it describes, so someone
 * who wants to jump straight there can.
 */
export default function Welcome({ firstName, gymName }: { firstName: string | null; gymName: string }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <section className="rounded-xl border border-gold/40 bg-gold/5 p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-gold text-[10px] font-bold tracking-widest uppercase mb-1">
            Welcome{firstName ? `, ${firstName}` : ""}
          </p>
          <h2 className="text-white font-bold text-xl">
            This is your academy portal for {gymName}.
          </h2>
        </div>
        <span className="text-soft text-xs shrink-0 mt-1">
          {step + 1} of {STEPS.length}
        </span>
      </div>

      <div className="rounded-lg bg-deep/60 border border-white/10 p-5 mb-4">
        <Link
          href={current.href}
          className="text-gold font-bold text-lg hover:underline inline-block mb-1.5"
        >
          {current.label} →
        </Link>
        <p className="text-soft text-sm leading-relaxed">{current.body}</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {!last ? (
          <>
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all"
            >
              Next
            </button>
            <form action={dismissOnboarding}>
              <button type="submit" className="text-soft text-xs font-semibold hover:text-white">
                Skip
              </button>
            </form>
          </>
        ) : (
          <form action={dismissOnboarding}>
            <DismissButton />
          </form>
        )}

        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="text-soft text-xs font-semibold hover:text-white"
          >
            Back
          </button>
        )}
      </div>
    </section>
  );
}
