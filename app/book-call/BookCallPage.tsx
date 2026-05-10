"use client";
import { useEffect, useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { ContentCard } from "./components/ContentCard";
import { VideoPlaceholder } from "./components/VideoPlaceholder";
import { StepCard } from "./components/StepCard";
import { TestimonialCard } from "./components/TestimonialCard";
import PhoneCallbackForm from "./components/PhoneCallbackForm";

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-gold shrink-0 mt-0.5">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-gold shrink-0">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-gold shrink-0">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.42 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.83a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-gold shrink-0">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gold">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export default function BookCallPage() {
  const [tab, setTab] = useState<"phone" | "video">("phone");

  useEffect(() => {
    if (tab !== "video") return;
    const existing = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
    if (existing) return;
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);
  }, [tab]);

  return (
    <div className="min-h-screen bg-base">
      <Nav />

      {/* HERO — cold-visitor friendly, regret-aversion forward */}
      <section className="pt-[112px] pb-12 md:pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gold text-[11px] font-bold tracking-widest uppercase mb-4">
            Free 15-min call · No pressure
          </p>
          <h1 className="font-display font-extrabold text-5xl md:text-7xl text-white leading-[0.95] tracking-tight mb-6">
            Talk to a real person
            <br />
            <span className="text-gold">before you decide.</span>
          </h1>
          <p className="text-xl text-soft/85 mb-8 leading-relaxed max-w-2xl mx-auto">
            15 minutes with Callum, Miles or Ryan. No script. No sales pitch.
            Just an honest chat about whether becoming a PT is right for you —
            and whether PT Launch Lab is the right route in.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-soft/70">
            <span className="flex items-center gap-2">
              <span className="text-gold">✓</span> No commitment to enrol
            </span>
            <span className="flex items-center gap-2">
              <span className="text-gold">✓</span> Phone or video — your choice
            </span>
            <span className="flex items-center gap-2">
              <span className="text-gold">✓</span> Reply within a few hours
            </span>
          </div>
        </div>
      </section>

      {/* VIDEO — face exposure before the form (mere exposure → conversion lift) */}
      <section className="pb-12 md:pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white leading-tight tracking-tight mb-2">
              Watch this first (2 min)
            </h2>
            <p className="text-soft text-sm md:text-base">
              Exactly what we&apos;ll cover on the call — and what we won&apos;t.
            </p>
          </div>
          <VideoPlaceholder />
        </div>
      </section>

      {/* BOOKING — TABBED PHONE FORM (default) + VIDEO CALENDLY */}
      <section id="calendly-section" className="py-16 md:py-24 px-6 bg-surface border-y border-white/[0.05]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white text-center leading-none tracking-tight mb-4">
            Book your free call
          </h2>
          <p className="text-lg md:text-xl text-soft/80 text-center mb-10 max-w-2xl mx-auto leading-relaxed">
            Two ways to chat. Pick whichever feels right — both are free, both are no-pressure.
          </p>

          {/* TAB SELECTOR */}
          <div
            role="tablist"
            aria-label="Choose call type"
            className="grid grid-cols-2 gap-2 p-1.5 mb-8 bg-card border border-white/10 rounded-2xl"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "phone"}
              onClick={() => setTab("phone")}
              className={`px-4 py-4 rounded-xl text-center transition-all ${
                tab === "phone"
                  ? "bg-gold text-deep shadow-md shadow-gold/20"
                  : "bg-transparent text-white/80 hover:bg-white/5"
              }`}
            >
              <span className="block font-bold text-base mb-0.5">Quick chat by phone</span>
              <span className={`block text-xs ${tab === "phone" ? "text-deep/70" : "text-soft"}`}>
                Recommended · just a few questions
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "video"}
              onClick={() => setTab("video")}
              className={`px-4 py-4 rounded-xl text-center transition-all ${
                tab === "video"
                  ? "bg-gold text-deep shadow-md shadow-gold/20"
                  : "bg-transparent text-white/80 hover:bg-white/5"
              }`}
            >
              <span className="block font-bold text-base mb-0.5">30-min video call</span>
              <span className={`block text-xs ${tab === "video" ? "text-deep/70" : "text-soft"}`}>
                For if you&apos;re seriously considering
              </span>
            </button>
          </div>

          {tab === "phone" && (
            <div className="bg-card border border-white/10 rounded-2xl p-6 md:p-10">
              <div className="mb-6 max-w-xl mx-auto text-center">
                <h3 className="font-display font-extrabold text-xl md:text-2xl text-white leading-tight tracking-tight mb-2">
                  Drop your details, we&apos;ll reach out.
                </h3>
                <p className="text-soft text-sm md:text-base leading-relaxed">
                  No calendar to navigate. Three short fields. We&apos;ll WhatsApp you to lock in a time.
                </p>
              </div>
              <div className="max-w-xl mx-auto">
                <PhoneCallbackForm />
              </div>
            </div>
          )}

          {tab === "video" && (
            <>
              <div className="mb-8 max-w-2xl mx-auto">
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <ClockIcon />
                    <span className="text-white/85">30-minute Google Meet call</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <PhoneIcon />
                    <span className="text-white/85">You&apos;ll speak directly with Callum, Miles or Ryan</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <TargetIcon />
                    <span className="text-white/85">Focused on your goals and next steps</span>
                  </div>
                </div>
                <p className="text-center text-soft italic">No pressure. No obligation. Just a clear conversation.</p>
              </div>

              <div className="bg-card border border-white/10 rounded-2xl p-4">
                <div
                  key="calendly-widget"
                  className="calendly-inline-widget rounded-xl overflow-hidden bg-white"
                  data-url="https://calendly.com/ptlaunchlab-info/free-consultation"
                  style={{ minWidth: "320px", height: "700px" }}
                />
              </div>

              <p className="text-center text-soft text-sm mt-6">
                If you need to, you can easily reschedule your call via Calendly.
              </p>
            </>
          )}
        </div>
      </section>

      {/* REASSURANCE — catches anxiety right after they see the form */}
      <section className="py-16 md:py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <ContentCard hover={false}>
            <h3 className="font-display font-extrabold text-2xl md:text-3xl text-white text-center leading-tight tracking-tight mb-10">
              What this call is — and isn&apos;t
            </h3>
            <div className="grid md:grid-cols-2 gap-10 md:gap-12">
              <div>
                <h4 className="text-xl text-gold mb-5 font-bold">It is:</h4>
                <ul className="space-y-3.5">
                  {[
                    "A real conversation about your situation",
                    "Honest answers — even if the answer is &quot;this isn&apos;t for you&quot;",
                    "Focused on what you want, not what we sell",
                    "15 minutes. No more unless you want it",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckIcon />
                      <span className="text-white/80 text-base md:text-lg" dangerouslySetInnerHTML={{ __html: item }} />
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xl text-soft/60 mb-5 font-bold">It isn&apos;t:</h4>
                <ul className="space-y-3.5">
                  {[
                    "A hard sell or pressure to enrol",
                    "A scripted sales call",
                    "An obligation to sign up to anything",
                    "A reason to feel awkward saying no",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full border-2 border-white/[0.12] shrink-0 mt-0.5" />
                      <span className="text-soft/60 text-base md:text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ContentCard>
        </div>
      </section>

      {/* WHAT HAPPENS NEXT — sets expectations */}
      <section className="py-16 md:py-20 px-6 bg-surface border-y border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white text-center leading-none tracking-tight mb-3">
            Here&apos;s what happens next
          </h2>
          <p className="text-soft text-center text-base md:text-lg mb-12 max-w-xl mx-auto">
            From the moment you submit, to the call itself.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <StepCard
              number={1}
              title="You drop your details"
              description="Takes 30 seconds. Three short fields. We don&apos;t ask for your life story."
            />
            <StepCard
              number={2}
              title="Callum WhatsApps you"
              description="Within a few hours during business hours. We&apos;ll find a call time that suits you."
            />
            <StepCard
              number={3}
              title="The call itself"
              description="15 mins. Real conversation. Then you decide if you want a next step — or you don&apos;t."
            />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 md:py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-none tracking-tight mb-4">
              What others say about PT Launch Lab
            </h2>
            <div className="h-[3px] w-[50px] bg-gold mx-auto" />
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <TestimonialCard
              quote="I have just completed my training with PT Launch Lab and the support I received was second to none! After having my baby, I thought I would struggle finding the time to complete, however Callum and the team were so supportive and helpful throughout the process."
              author="Rebecca Davies"
            />
            <TestimonialCard
              quote="I completed my Level 3 Personal Training certification with PT Launch Lab, and they've been fantastic from start to finish. The support didn't stop once I qualified — they've continued to offer guidance and help that's been invaluable as I've grown my own successful business."
              author="Matthew Bell"
            />
            <TestimonialCard
              quote="My training experience with PT Launch Lab has been amazing. I have gained new skills, knowledge and confidence. I was able to learn at my own pace, I was well supported throughout the program."
              author="Annie Chomba-Kilbride"
            />
          </div>
          <div className="flex items-center justify-center gap-2 text-soft/60 text-sm">
            <StarIcon />
            <span>Rated 5.0 based on Google reviews</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
