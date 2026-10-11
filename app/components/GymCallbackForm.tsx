"use client";

import LeadForm from "@/app/components/LeadForm";
import { GYM_CALLBACK_CONSENT_TEXT } from "@/app/lib/gymCallback";

// "Not ready yet? Leave your number and the academy team will ring you."
//
// On every gym academy page. Posts to /api/lead (intent gym_callback), which forwards the
// lead with the gym's slug so a later enrolment can be credited to the gym.
// White-label: member-facing copy says "the academy team", never our name.

export default function GymCallbackForm({
  gymSlug,
  gymName,
  accent,
}: {
  gymSlug: string;
  gymName: string;
  accent: string;
}) {
  return (
    <section id="ring-me" className="bg-white py-16 md:py-20">
      <div className="max-w-xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-black text-black uppercase text-center mb-2">Not Ready Yet?</h2>
        <p className="text-center text-gray-500 mb-8">
          Leave your number and the academy team will ring you. No pressure, just answers.
        </p>

        <LeadForm
          intent="gym_callback"
          source="gym_page_ring_me"
          gymSlug={gymSlug}
          submitLabel="Ring Me →"
          submitStyle={{ backgroundColor: accent, color: "#fff" }}
          successMessage={(first) => `Thanks, ${first}. The ${gymName} academy team will ring you shortly.`}
          footnote={GYM_CALLBACK_CONSENT_TEXT}
        />
      </div>
    </section>
  );
}
