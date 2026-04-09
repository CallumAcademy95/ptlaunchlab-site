import type { Metadata } from "next";
import EnrolmentFlow from "@/app/enrol/EnrolmentFlow";

export const metadata: Metadata = {
  title: "Enrol | Ministry of Fitness PT Academy",
  description: "Claim your £200 MOF member discount and start your Level 2 & 3 PT qualification today.",
  robots: { index: false },
};

const MOF_PARTNER = {
  gymReferral: "Ministry of Fitness",
  promoCodes: {
    "MOFPTDISCOUNT": {
      label: "Ministry of Fitness Member Discount",
      discountAmount: 200,
      fullPrice: 1399,
      depositPrice: 599,
      fullStripeLink:    "https://buy.stripe.com/9B69AN7QI3127ayeeSfEk0f",
      depositStripeLink: "https://buy.stripe.com/8x2bIVef6bxy2Ui1s6fEk05",
    },
  },
};

export default function MofGymEnrolPage() {
  return (
    <div className="min-h-screen bg-[#061F36]">
      {/* Branded top bar */}
      <div className="bg-black border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://mofgym.co.uk/wp-content/uploads/2020/08/cropped-Ministry-Logo-new-final-05.png"
              alt="Ministry of Fitness"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <div>
              <p className="text-white font-black text-sm uppercase leading-none">Ministry of Fitness PT Academy</p>
              <p className="text-white/40 text-[10px] mt-0.5">Powered by PT Launch Lab</p>
            </div>
          </div>
          <div className="bg-[#00cc33] text-black text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
            MOFPTDISCOUNT
          </div>
        </div>
      </div>

      <EnrolmentFlow partner={MOF_PARTNER} standalone />

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
