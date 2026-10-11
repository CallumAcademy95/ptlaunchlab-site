"use client";

import { useState } from "react";
import { trackEvent } from "@/app/lib/gtag";
import LeadForm from "@/app/components/LeadForm";

// ─────────────────────────────────────────────────────────────────────────────
// LiveRegisterForm
//
// Email-gate for the monthly live webinar/podcast. Name + email required,
// mobile for WhatsApp reminders. Saves through /api/lead (intent live) →
// "Live Sessions" MailerLite segment; submitLead fires the Pixel Lead once the
// lead is saved. Then shows an add-to-calendar button. The lead is in the
// reminder sequence regardless of whether they click straight through.
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  /** Add-to-Google-Calendar URL, prebuilt server-side from the event time. */
  calendarUrl: string;
  /** Human-readable event date/time line, e.g. "Thursday 24 July · 7:30pm". */
  whenLabel: string;
};

export default function LiveRegisterForm({ calendarUrl, whenLabel }: Props) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="bg-card border-2 border-gold/60 rounded-2xl p-7 md:p-8 max-w-2xl mx-auto shadow-xl shadow-gold/10 text-center">
        <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-3">You&apos;re on the list</p>
        <h3 className="text-white font-bold text-2xl md:text-3xl mb-2">Your seat is saved 🎟️</h3>
        <p className="text-soft/80 text-base leading-relaxed mb-6">
          We&apos;ve emailed you the link and we&apos;ll remind you before we go live. Mark it in your diary:{" "}
          <span className="text-white font-semibold">{whenLabel}</span>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-cta="live-add-calendar"
            className="inline-block text-center px-7 py-3.5 rounded-full border border-white/20 text-white font-bold text-base hover:bg-white/[0.06] transition-all"
          >
            Add to Calendar
          </a>
        </div>
        <div className="mt-7 pt-6 border-t border-white/[0.08]">
          <p className="text-white font-semibold text-base mb-1">Got a question for the panel?</p>
          <p className="text-soft/75 text-sm leading-relaxed mb-4">
            Submit it now and we&apos;ll answer the best ones live on the night.
          </p>
          <a
            href="/ask"
            data-cta="live-ask-question"
            className="inline-block text-center px-7 py-3 rounded-full border border-gold/50 text-gold font-bold text-sm hover:bg-gold/10 transition-all"
          >
            Submit a Question →
          </a>
        </div>
        <p className="text-soft/55 text-[12px] mt-6">
          Can&apos;t make it live? Register anyway — we&apos;ll send you the podcast episode a week later.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-white/[0.08] rounded-2xl p-6 md:p-7 max-w-2xl mx-auto shadow-xl">
      <p className="text-gold text-[11px] font-bold tracking-widest uppercase text-center mb-4">
        Free · Live · Mailing-list only
      </p>
      <LeadForm
        intent="live"
        source="live_page"
        tone="dark"
        submitLabel="Save My Free Seat →"
        onSuccess={() => {
          trackEvent("live_register_submitted", { source: "live-page" });
          setSubmitted(true);
        }}
        footnote="We'll email you the watch link · No spam · Unsubscribe any time"
      />
    </div>
  );
}
