"use client";
// The step after the plan (spec 2026-10-21): Prime/Strong answer two commitment
// questions, then everyone chooses book / WhatsApp / start. Each answer is recorded
// on the lead via /api/career-planner/next-step (keepalive, so a tap that navigates
// away still lands). Leads Central reads the choice to decide its follow-up.
import { useMemo, useRef, useState } from "react";
import BookingFlow from "@/app/book/BookingFlow";
import { CALL_TYPES } from "@/app/lib/booking/callTypes";
import { WHATSAPP_LINK } from "@/app/lib/contactDetails";
import { COURSE_PRICE_LABEL, MONTHLY_PLAN_LABEL } from "@/app/lib/pricing";
import { trackEvent } from "@/app/lib/gtag";
import type { CareerPlanV2, PlannerAnswers } from "@/app/lib/careerPlannerV2";
import {
  startMonthOptions, whatsappMessage, whatsappHref, bookingPrefill, showCommitmentCard,
  type PriceFit, type NextStepChoice,
} from "@/app/lib/plannerNextStep";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
const PRICE_OPTIONS: [PriceFit, string][] = [["yes", "Yes, that works"], ["plan", "I'd need to plan for it"], ["no", "Not right now"]];

type Body = { priceFit?: PriceFit; startMonth?: string; nextStep?: NextStepChoice; booked?: true; eventId?: string };

function newEventId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function NextStep({ plan, answers, lead, nextToken }: {
  plan: CareerPlanV2;
  answers: Partial<PlannerAnswers>;
  lead: { name: string; email: string; phone: string };
  nextToken: string | null;
}) {
  const months = useMemo(() => startMonthOptions(new Date()), []);
  const [priceFit, setPriceFit] = useState<PriceFit | null>(null);
  const [startMonth, setStartMonth] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const minutes = CALL_TYPES.consultation.minutes;
  // The endpoint reads, merges, then writes the lead row, so overlapping saves can
  // lose an answer. Send them one after another.
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  function record(body: Body) {
    if (!nextToken) return;
    queue.current = queue.current
      .then(() => fetch("/api/career-planner/next-step", {
        method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
        body: JSON.stringify({ token: nextToken, ...body }),
      }))
      .catch(() => {});
  }
  function track(step: string) {
    trackEvent("career_planner_next_step", { step, band: plan.band, price_fit: priceFit ?? "", start_month: startMonth ?? "" });
  }

  const monthLabel = months.find((m) => m.value === startMonth)?.label ?? null;
  const waHref = whatsappHref(WHATSAPP_LINK, whatsappMessage({ startMonthLabel: monthLabel, blocker: answers.blocker ?? null }));

  return (
    <div className="grid gap-4 mt-2">
      {showCommitmentCard(plan.band) && (
        <section className="rounded-xl bg-base border border-gold/30 p-5" aria-labelledby="ns-commit">
          <h3 id="ns-commit" className="text-gold text-xs font-semibold uppercase tracking-widest mb-3">Two quick ones</h3>
          <p className="text-white font-semibold mb-2">Is {COURSE_PRICE_LABEL}, or {MONTHLY_PLAN_LABEL} a month, workable for you?</p>
          <div className="grid sm:grid-cols-3 gap-2 mb-5">
            {PRICE_OPTIONS.map(([v, label]) => (
              <button key={v} type="button" id={`ns-price-${v}`} aria-pressed={priceFit === v}
                onClick={() => { setPriceFit(v); record({ priceFit: v }); track(`price_${v}`); }}
                className={`rounded-xl px-4 py-3 border text-sm font-semibold ${FOCUS} ${priceFit === v ? "border-gold bg-gold/10 text-white" : "border-white/10 text-soft hover:border-gold/40"}`}>
                {label}
              </button>
            ))}
          </div>
          <p className="text-white font-semibold mb-2">When would you like to start?</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[...months, { value: "not_sure", label: "Not sure" }].map((m) => (
              <button key={m.value} type="button" id={`ns-month-${m.value}`} aria-pressed={startMonth === m.value}
                onClick={() => { setStartMonth(m.value); record({ startMonth: m.value }); track("start_month"); }}
                className={`rounded-xl px-3 py-3 border text-sm font-semibold ${FOCUS} ${startMonth === m.value ? "border-gold bg-gold/10 text-white" : "border-white/10 text-soft hover:border-gold/40"}`}>
                {m.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl bg-base border border-white/10 p-5" aria-labelledby="ns-choose">
        <h3 id="ns-choose" className="font-display font-extrabold text-xl text-white mb-4">How would you like to take this forward?</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <button type="button" id="ns-book"
            onClick={() => { setBooking(true); record({ nextStep: "book" }); track("book_open"); }}
            className={`rounded-xl px-4 py-4 border border-white/25 text-white font-semibold text-sm text-left ${FOCUS}`}>
            📅 Book a {minutes}-minute call<span className="block text-soft font-normal mt-1">Pick a time that suits you.</span>
          </button>
          <a id="ns-whatsapp" href={waHref} target="_blank" rel="noopener noreferrer"
            onClick={() => {
              const eventId = newEventId("contact");
              record({ nextStep: "whatsapp", eventId });
              try { if (typeof window.fbq === "function") window.fbq("track", "Contact", { content_name: "career_planner" }, { eventID: eventId }); } catch {}
              track("whatsapp");
            }}
            className={`rounded-xl px-4 py-4 border border-white/25 text-white font-semibold text-sm ${FOCUS}`}>
            💬 Chat on WhatsApp<span className="block text-soft font-normal mt-1">Message us; we reply in person.</span>
          </a>
          <a id="ns-start" href="/enrol"
            onClick={() => { record({ nextStep: "start" }); track("start"); }}
            className={`rounded-xl px-4 py-4 bg-gold text-deep font-bold text-sm ${FOCUS}`}>
            🚀 I&apos;m ready to start<span className="block font-normal mt-1">Enrol online now.</span>
          </a>
        </div>

        {booking && (
          <div className="mt-5" id="ns-booking">
            <BookingFlow
              callType="consultation"
              questions={CALL_TYPES.consultation.questions}
              prefill={bookingPrefill({ name: lead.name, email: lead.email, phone: lead.phone, why: answers.why ?? null, blocker: answers.blocker ?? null })}
              token={null}
              onBooked={() => {
                const eventId = newEventId("schedule");
                record({ nextStep: "book", booked: true, eventId });
                try { if (typeof window.fbq === "function") window.fbq("track", "Schedule", { content_name: "career_planner" }, { eventID: eventId }); } catch {}
                track("booked");
              }}
            />
          </div>
        )}
      </section>
    </div>
  );
}
