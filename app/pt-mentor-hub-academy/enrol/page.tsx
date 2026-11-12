import type { Metadata } from "next";
import EnrolmentFlow from "@/app/enrol/EnrolmentFlow";

export const metadata: Metadata = {
  title: "Enrol | PT Mentor Hub Academy",
  description: "Start your Level 2 & 3 PT qualification with PT Mentor Hub mentorship: pay in full or monthly.",
  robots: { index: false },
};

// ─── PT Mentor Hub partner config ────────────────────────────────────────────
// gymSlug is the stable join key (pp_partners.slug) and must NEVER change:
// every sale attributed to this partner is keyed on it. gymReferral is display
// only. A mentor, not a gym, so no member saving and no registry entry.
const PT_MENTOR_HUB_PARTNER = {
  gymSlug: "pt-mentor-hub",
  gymReferral: "PT Mentor Hub",
};

export default function PtMentorHubEnrolPage() {
  return (
    <div className="min-h-screen bg-[#061F36]">
      {/* Branded top bar. Black, because the logo's white lettering is cut for dark. */}
      <div className="bg-black border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/gym-logos/pt-mentor-hub-long.png" alt="PT Mentor Hub" width={96} height={36} />
          <div>
            <p className="text-white font-black text-sm uppercase leading-none">PT Mentor Hub Academy</p>
            <p className="text-white/40 text-[10px] mt-0.5">Enrolment</p>
          </div>
        </div>
      </div>

      <EnrolmentFlow partner={PT_MENTOR_HUB_PARTNER} standalone />

      <div className="bg-[#061F36] border-t border-[#1A3A5C] py-6 px-6 text-center">
        <p className="text-[#4A6280] text-xs">
          PT Launch Lab · NCFE Accredited Centre No. 9002788 ·{" "}
          <a href="/terms" className="hover:text-[#8CA3BF] transition-colors">Terms</a>
          {" "}·{" "}
          <a href="/privacy" className="hover:text-[#8CA3BF] transition-colors">Privacy</a>
        </p>
      </div>
    </div>
  );
}
