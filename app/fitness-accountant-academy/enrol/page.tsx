import type { Metadata } from "next";
import EnrolmentFlow from "@/app/enrol/EnrolmentFlow";
import { FitnessAccountantWordmark } from "../Wordmark";

export const metadata: Metadata = {
  title: "Enrol | The Fitness Accountant Academy",
  description: "Start your Level 2 & 3 PT qualification plus The Fitness Accountant's Business Launch Package. One payment.",
  robots: { index: false },
};

// ─── The Fitness Accountant partner config ───────────────────────────────────
// gymSlug is the stable join key (pp_partners.slug) and must NEVER change:
// every sale attributed to this partner is keyed on it. gymReferral is display
// only. An accountant, not a gym, so no member saving and no registry entry.
const FITNESS_ACCOUNTANT_PARTNER = {
  gymSlug: "the-fitness-accountant",
  gymReferral: "The Fitness Accountant",
};

export default function FitnessAccountantEnrolPage() {
  return (
    <div className="min-h-screen bg-[#061F36]">
      <div className="bg-black border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <FitnessAccountantWordmark size="sm" />
          <p className="text-white/40 text-[10px] uppercase tracking-widest">Enrolment</p>
        </div>
      </div>

      <EnrolmentFlow partner={FITNESS_ACCOUNTANT_PARTNER} standalone />

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
