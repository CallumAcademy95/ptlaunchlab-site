"use client";

import { useEffect } from "react";
import Image from "next/image";
import FunnelPricingBlock from "@/app/components/FunnelPricingBlock";

// /prospectus/thank-you
// Landing page after a successful prospectus form submission.
// Opens the PDF in a new tab on mount and presents the 48h £200 discount.

export default function ProspectusThankYouClient() {
  useEffect(() => {
    // Open the PDF in a new tab once — guard against StrictMode double-fire
    const opened = sessionStorage.getItem("ptll_prospectus_opened");
    if (!opened) {
      sessionStorage.setItem("ptll_prospectus_opened", "1");
      window.open("/prospectus.pdf", "_blank", "noopener");
    }
  }, []);

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
            Prospectus sent
          </span>
        </div>

        <h1 className="font-display font-extrabold text-3xl sm:text-5xl leading-none tracking-tight mb-4">
          Your prospectus is{" "}
          <span className="text-[#F5C518]">on the way.</span>
        </h1>

        <p className="text-[#8CA3BF] text-lg leading-relaxed mb-8">
          We&apos;ve opened the PDF in a new tab. Didn&apos;t open?{" "}
          <a
            href="/prospectus.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#F5C518] underline hover:no-underline"
          >
            Click here to open it
          </a>
          . Check the inside cover — the full module breakdown and payment
          options are on page 4.
        </p>

        <FunnelPricingBlock variant="light" />

        <div className="bg-[#0D3559] border border-white/[0.07] rounded-2xl p-6 mb-8">
          <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-2">
            Not ready to enrol yet?
          </p>
          <h3 className="font-display font-extrabold text-xl mb-2">
            Book a free 15-minute strategy call
          </h3>
          <p className="text-[#8CA3BF] text-sm mb-5 leading-relaxed">
            We&apos;ll walk you through the course, answer every question,
            and be honest about whether PT is right for you. No pressure.
          </p>
          <a
            href="/book-call"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-[#F5C518] text-[#F5C518] font-bold text-sm hover:bg-[#F5C518] hover:text-[#072B4A] transition-all"
          >
            Book Your Free Strategy Call →
          </a>
        </div>

        <p className="text-[#4A6280] text-xs text-center">
          Questions? Email{" "}
          <a href="mailto:info@ptlaunchlab.co.uk" className="underline hover:text-[#8CA3BF]">
            info@ptlaunchlab.co.uk
          </a>
        </p>
      </main>
    </div>
  );
}
