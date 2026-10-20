import type { Metadata } from "next";
import EnrolmentFlow from "@/app/enrol/EnrolmentFlow";
import { memberSavingForGym } from "@/app/lib/gyms";

export const metadata: Metadata = {
  title: "Enrol | M Club PT Academy Stoke-on-Trent",
  description:
    "Start your Level 2 & 3 PT qualification today — pay in full or monthly.",
  robots: { index: false },
};

// ─── M Club partner config ───────────────────────────────────────────────────
// gymSlug is the stable join key and must NEVER change: every sale ever
// attributed to this partner is keyed on it. gymReferral is display only.
const MCLUB_PARTNER = {
  gymSlug: "mclub",
  gymReferral: "M Club",
};

export default function MClubEnrolPage() {
  return (
    <div className="min-h-screen bg-[#061F36]">
      {/* Branded top bar — replaces Nav. Their own dark teal, because the
          logo is white on transparent and drawn for dark surfaces. */}
      <div className="bg-[#002F2C] border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/gym-logos/mclub.png"
              alt="M Club"
              width={76}
              height={32}
            />
            <div>
              <p className="text-white font-black text-sm uppercase leading-none">M Club PT Academy</p>
              <p className="text-white/40 text-[10px] mt-0.5">Stoke-on-Trent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolment flow — referral pre-set */}
      <EnrolmentFlow
        partner={MCLUB_PARTNER}
        standalone
        memberSavingPence={memberSavingForGym(MCLUB_PARTNER.gymSlug).savingPence}
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
