"use client";

import Image from "next/image";
import FunnelPricingBlock from "@/app/components/FunnelPricingBlock";

// /youtube-discount/thank-you
// Landing page after a successful YouTube subscriber signup. Shows the
// 48h discounted-pricing block (driven by the ptll_promo cookie set on the
// /api/youtube-subscribe response).

export default function YouTubeThankYouClient() {
  return (
    <div className="min-h-screen bg-[#072B4A] text-white">
      <header className="border-b border-white/[0.06] bg-[#051D33] px-6 py-4 flex items-center justify-between">
        <a href="/" className="inline-flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="PT Launch Lab"
            width={120}
            height={36}
            className="h-8 w-auto"
            priority
          />
        </a>
        <a href="/" className="text-sm text-[#8CA3BF] hover:text-white transition-colors">
          ← Back to site
        </a>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#F5C518]/30 bg-[#0D3559] mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F5C518] animate-pulse" />
          <span className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase">
            £200 discount unlocked
          </span>
        </div>

        <h1 className="font-display font-extrabold text-3xl sm:text-5xl leading-none tracking-tight mb-5">
          You&apos;re in. Cheers for{" "}
          <span className="text-[#F5C518]">the subscribe.</span>
        </h1>

        <p className="text-[#8CA3BF] text-lg leading-relaxed mb-8">
          Your £200 discount is live below for the next 48 hours. We&apos;ll
          also email you the link as a backup so you&apos;ve got it saved.
        </p>

        <FunnelPricingBlock variant="light" />

        <div className="bg-[#0D3559] border border-white/[0.07] rounded-2xl p-6 mb-8">
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-2">
            Not ready to enrol?
          </p>
          <h3 className="font-display font-extrabold text-xl mb-2">
            Book a free 15-minute strategy call
          </h3>
          <p className="text-[#8CA3BF] text-sm mb-5 leading-relaxed">
            We&apos;ll answer every question honestly — and if PT isn&apos;t
            right for you, we&apos;ll tell you that too.
          </p>
          <a
            href="/book-call"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-[#F5C518] text-[#F5C518] font-bold text-sm hover:bg-[#F5C518] hover:text-[#072B4A] transition-all"
          >
            Book Your Free Strategy Call →
          </a>
        </div>

        <div className="bg-[#0D3559] border border-white/[0.07] rounded-2xl p-6">
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-2">
            While you decide
          </p>
          <h3 className="font-display font-extrabold text-lg mb-2">
            Catch up on the podcast
          </h3>
          <p className="text-[#8CA3BF] text-sm mb-4 leading-relaxed">
            31 full episodes — gym hiring managers, six-figure trainers, and
            honest takes on getting hired in the UK fitness industry.
          </p>
          <a
            href="/podcast"
            className="inline-flex items-center gap-1 text-[#F5C518] text-sm font-semibold hover:underline"
          >
            Browse all episodes →
          </a>
        </div>

        <p className="text-[#4A6280] text-xs text-center mt-8">
          Questions? Email{" "}
          <a href="mailto:info@ptlaunchlab.co.uk" className="underline hover:text-[#8CA3BF]">
            info@ptlaunchlab.co.uk
          </a>
        </p>
      </main>
    </div>
  );
}
