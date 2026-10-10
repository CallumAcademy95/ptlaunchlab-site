import type { Metadata } from "next";
import EnrolmentFlow from "@/app/enrol/EnrolmentFlow";
import { memberSavingForGym } from "@/app/lib/gyms";

export const metadata: Metadata = {
  title: "Enrol | Xcelerate PT Academy",
  description: "Start your Level 2 & 3 PT qualification today — pay in full or monthly.",
  robots: { index: false },
};

// ─── Xcelerate partner config ─────────────────────────────────────────────────
const XCELERATE_PARTNER = {
  gymSlug: "xcelerate",
  gymReferral: "Xcelerate Gyms Edgware",
};

export default function XcelerateEnrolPage() {
  return (
    <div className="min-h-screen bg-[#061F36]">
      {/* Branded top bar — replaces Nav */}
      <div className="bg-black border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/gym-logos/xcelerate.png"
              alt="Xcelerate Gyms"
              width={866}
              height={182}
              className="h-7 w-auto object-contain shrink-0"
            />
            <div className="min-w-0">
              <p className="text-white font-black text-sm uppercase leading-none truncate">Xcelerate PT Academy</p>
              <p className="text-white/40 text-[10px] mt-0.5">Enrolment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolment flow — referral pre-set */}
      <EnrolmentFlow
        partner={XCELERATE_PARTNER}
        standalone
        memberSavingPence={memberSavingForGym(XCELERATE_PARTNER.gymSlug).savingPence}
      />

      {/* Minimal footer */}
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
