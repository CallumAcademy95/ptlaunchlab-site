import type { Metadata } from "next";
import EnrolmentFlow from "@/app/enrol/EnrolmentFlow";

export const metadata: Metadata = {
  title: "Enrol | ATP PT Academy Felixstowe",
  description:
    "Start your Level 2 & 3 PT qualification today — pay in full or monthly.",
  robots: { index: false },
};

// ─── ATP Fitness Felixstowe partner config ───────────────────────────────────
// gymSlug is the stable join key and must NEVER change: every sale ever
// attributed to this partner is keyed on it. gymReferral is display only.
const ATP_PARTNER = {
  gymSlug: "atp-felixstowe",
  gymReferral: "ATP Fitness Felixstowe",
};

export default function AtpFelixstoweEnrolPage() {
  return (
    <div className="min-h-screen bg-[#061F36]">
      {/* Branded top bar — replaces Nav. Black, because the ATP mark is white
          on transparent and disappears on anything lighter. */}
      <div className="bg-black border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/gym-logos/atp-felixstowe.png"
              alt="ATP Fitness Felixstowe"
              width={44}
              height={45}
            />
            <div>
              <p className="text-white font-black text-sm uppercase leading-none">ATP PT Academy</p>
              <p className="text-white/40 text-[10px] mt-0.5">Felixstowe</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolment flow — referral pre-set */}
      <EnrolmentFlow partner={ATP_PARTNER} standalone />

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
