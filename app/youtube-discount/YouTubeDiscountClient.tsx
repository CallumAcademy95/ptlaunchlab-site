"use client";

import { useState } from "react";
import Image from "next/image";
import { trackEvent } from "@/app/lib/gtag";

// ─────────────────────────────────────────────────────────────────────────────
// /youtube-discount
// Honor-system YouTube subscribe funnel: subscribe to the channel in
// exchange for a £200 discount on the course (48h promo cookie).
//
// Flow:
//   1. Visitor hits the page → sees the offer + "Subscribe on YouTube" CTA
//   2. Click subscribe → opens YouTube in a new tab + reveals the email form
//   3. Submit email → POST to /api/youtube-subscribe → cookie set → redirect
//      to /youtube-discount/thank-you with the FunnelPricingBlock
// ─────────────────────────────────────────────────────────────────────────────

const YOUTUBE_URL = "https://www.youtube.com/@ptlaunchlab?sub_confirmation=1";

type Step = "intro" | "form" | "submitting";

export default function YouTubeDiscountClient() {
  const [step, setStep] = useState<Step>("intro");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");

  const handleSubscribeClick = () => {
    trackEvent("youtube_subscribe_clicked");
    window.open(YOUTUBE_URL, "_blank", "noopener,noreferrer");
    setStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.includes("@")) {
      setError("Please enter your name and a valid email.");
      return;
    }
    setStep("submitting");
    try {
      const res = await fetch("/api/youtube-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Something went wrong. Please try again.");
        setStep("form");
        return;
      }
      trackEvent("youtube_subscribe_completed");
      window.location.href = "/youtube-discount/thank-you";
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("form");
    }
  };

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
            Subscriber Bonus · £200 Off
          </span>
        </div>

        <h1 className="font-display font-extrabold text-3xl sm:text-5xl leading-none tracking-tight mb-5">
          Subscribe to our YouTube channel —{" "}
          <span className="text-[#F5C518]">save £200 on the course.</span>
        </h1>

        <p className="text-[#8CA3BF] text-lg leading-relaxed mb-10">
          We&apos;ve loaded our channel with the full PT Launch Lab podcast —
          gym hiring managers, six-figure trainers, and the honest version of
          how this industry actually works. Subscribe and we&apos;ll unlock a
          £200 discount on the NCFE Level 3 PT course.
        </p>

        {step === "intro" && (
          <>
            {/* Two-step progress indicator */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#F5C518] text-[#072B4A] flex items-center justify-center text-xs font-bold">1</div>
                <span className="text-[#F5C518] text-sm font-semibold">Subscribe</span>
              </div>
              <div className="h-px bg-white/[0.08] flex-1" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#0D3559] border border-white/[0.08] text-[#4A6280] flex items-center justify-center text-xs font-bold">2</div>
                <span className="text-[#4A6280] text-sm">Get your discount</span>
              </div>
            </div>

            <div className="bg-[#0D3559] border border-[#F5C518]/30 rounded-2xl p-8 mb-6">
              <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-3">
                Step 1 of 2
              </p>
              <h2 className="font-display font-extrabold text-2xl mb-3">
                Subscribe on YouTube
              </h2>
              <p className="text-[#8CA3BF] text-sm mb-6 leading-relaxed">
                Click below to open the channel and tap subscribe. We&apos;ll
                show the email form when you come back.
              </p>
              <button
                onClick={handleSubscribeClick}
                className="w-full inline-flex items-center justify-center gap-3 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.546 15.568V8.432L15.818 12l-6.272 3.568z" />
                </svg>
                Subscribe on YouTube →
              </button>
            </div>

            <p className="text-[#4A6280] text-xs text-center">
              Already subscribed?{" "}
              <button
                onClick={() => setStep("form")}
                className="text-[#F5C518] underline hover:no-underline"
              >
                Skip to the form
              </button>
            </p>
          </>
        )}

        {(step === "form" || step === "submitting") && (
          <>
            {/* Two-step progress indicator */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#F5C518]/40 text-[#F5C518] flex items-center justify-center text-xs font-bold">✓</div>
                <span className="text-[#F5C518]/60 text-sm">Subscribed</span>
              </div>
              <div className="h-px bg-[#F5C518]/40 flex-1" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#F5C518] text-[#072B4A] flex items-center justify-center text-xs font-bold">2</div>
                <span className="text-[#F5C518] text-sm font-semibold">Get your discount</span>
              </div>
            </div>

            <div className="bg-[#0D3559] border border-[#F5C518]/30 rounded-2xl p-8 mb-6">
              <p className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase mb-3">
                Step 2 of 2 · Almost there
              </p>
              <h2 className="font-display font-extrabold text-2xl mb-3">
                Unlock your £200 discount
              </h2>
              <p className="text-[#8CA3BF] text-sm mb-6 leading-relaxed">
                Pop your details in — we&apos;ll email your discount link and
                add you to the newsletter so you don&apos;t miss new episodes.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#8CA3BF] mb-2">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Jamie Clarke"
                    className="w-full px-5 py-4 rounded-xl bg-[#072B4A] border border-white/[0.08] text-white placeholder-[#4A6280] focus:outline-none focus:border-[#F5C518] transition-colors text-base"
                    required
                    autoComplete="name"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8CA3BF] mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@email.com"
                    className="w-full px-5 py-4 rounded-xl bg-[#072B4A] border border-white/[0.08] text-white placeholder-[#4A6280] focus:outline-none focus:border-[#F5C518] transition-colors text-base"
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8CA3BF] mb-2">
                    Mobile <span className="text-[#4A6280] font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. 07700 900000"
                    className="w-full px-5 py-4 rounded-xl bg-[#072B4A] border border-white/[0.08] text-white placeholder-[#4A6280] focus:outline-none focus:border-[#F5C518] transition-colors text-base"
                    autoComplete="tel"
                  />
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={step === "submitting"}
                  className="w-full py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/20 disabled:opacity-60 mt-2"
                >
                  {step === "submitting" ? "Unlocking…" : "Unlock My £200 Discount →"}
                </button>

                <p className="text-[#4A6280] text-xs text-center pt-1">
                  By submitting you agree to receive course info from PT Launch
                  Lab. Unsubscribe anytime.
                </p>
              </form>
            </div>
          </>
        )}

        <div className="border-t border-white/[0.06] pt-8 mt-12 text-center">
          <p className="text-[#4A6280] text-xs">
            Need to talk first?{" "}
            <a href="/book-call" className="text-[#F5C518] underline hover:no-underline">
              Book a free 15-minute strategy call
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
