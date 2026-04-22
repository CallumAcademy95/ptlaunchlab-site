"use client";
import { useEffect } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { ContentCard } from "./components/ContentCard";
import { VideoPlaceholder } from "./components/VideoPlaceholder";
import { StepCard } from "./components/StepCard";
import { TestimonialCard } from "./components/TestimonialCard";

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
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-base">
      <Nav />

      {/* SUCCESS CONFIRMATION */}
      <section className="pt-[104px] pb-8 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-8">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-emerald-400">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-emerald-400 text-lg">Your application has been received</p>
          </div>
        </div>
      </section>

      {/* HERO */}
      <section className="pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display font-extrabold text-6xl md:text-7xl text-white leading-none tracking-tight mb-6">
            You&apos;re on the right path.
          </h1>
          <div className="mt-6 h-[3px] w-[50px] bg-gold mx-auto mb-10" />
          <p className="text-2xl text-soft/80 mb-8 leading-relaxed">
            Thanks for taking the first step. You&apos;ve successfully submitted your details and you&apos;re
            now moving forward towards becoming a Personal Trainer.
          </p>
          <p className="text-lg text-soft/60">
            The next step is to book your free consultation call so we can talk things through properly.
          </p>
        </div>
      </section>

      {/* VIDEO */}
      <section className="pb-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-display font-extrabold text-3xl text-white leading-none tracking-tight mb-3">Watch this first (2 minutes)</h2>
            <p className="text-soft/60">This explains what the call is for and what happens next.</p>
          </div>
          <VideoPlaceholder />
        </div>
      </section>

      {/* WHAT HAPPENS NEXT */}
      <section className="py-32 px-6 bg-surface">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display font-extrabold text-5xl md:text-6xl text-white text-center leading-none tracking-tight mb-20">
            Here&apos;s what happens next
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard number={1} title="You've Taken Action" description="You've already done the hard part by getting started." />
            <StepCard number={2} title="Book Your Call" description="Choose a time that works for you and speak directly with our team." />
            <StepCard number={3} title="Get Clarity" description="We'll talk through your goals, your situation, and what the next steps could look like." />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-extrabold text-5xl md:text-6xl text-white leading-none tracking-tight mb-6">
              What others say about PT Launch Lab
            </h2>
            <div className="h-[3px] w-[50px] bg-gold mx-auto" />
          </div>
          <div className="grid md:grid-cols-3 gap-8 mb-8">
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

      {/* CALENDLY */}
      <section id="calendly-section" className="py-32 px-6 bg-surface">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-extrabold text-5xl md:text-6xl text-white text-center leading-none tracking-tight mb-6">
            Book your free consultation call
          </h2>
          <p className="text-xl text-soft/70 text-center mb-12 max-w-3xl mx-auto leading-relaxed">
            Pick a time below that suits you. The call is relaxed, no pressure, and focused on helping you decide what&apos;s right for you.
          </p>

          <div className="mb-8 max-w-2xl mx-auto">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center gap-3">
                <ClockIcon />
                <span className="text-soft/70">15–20 minute phone call</span>
              </div>
              <div className="flex items-center gap-3">
                <PhoneIcon />
                <span className="text-soft/70">You&apos;ll speak directly with Callum, Miles or Ryan</span>
              </div>
              <div className="flex items-center gap-3">
                <TargetIcon />
                <span className="text-soft/70">Focused on your goals and next steps</span>
              </div>
            </div>
            <p className="text-center text-faint italic">No pressure. No obligation. Just a clear conversation.</p>
          </div>

          <div className="bg-card border border-white/[0.07] rounded-2xl p-4">
            <div
              className="calendly-inline-widget rounded-xl overflow-hidden bg-white"
              data-url="https://calendly.com/ptlaunchlab-info/free-consultation"
              style={{ minWidth: "320px", height: "700px" }}
            />
          </div>

          <p className="text-center text-faint text-sm mt-6">
            If you need to, you can easily reschedule your call via Calendly.
          </p>
        </div>
      </section>

      {/* REASSURANCE */}
      <section className="pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          <ContentCard hover={false}>
            <h3 className="font-display font-extrabold text-3xl text-white text-center leading-none tracking-tight mb-12">
              What this call is (and isn&apos;t)
            </h3>
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h4 className="text-xl text-gold mb-6 font-bold">This call is:</h4>
                <ul className="space-y-4">
                  {["A chance to talk things through", "Focused on your goals", "Honest and straightforward", "About clarity, not pressure"].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckIcon />
                      <span className="text-soft/70 text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xl text-soft/50 mb-6 font-bold">This call isn&apos;t:</h4>
                <ul className="space-y-4">
                  {["A hard sell", "An obligation to sign up", "Rushed or scripted"].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full border-2 border-white/[0.12] shrink-0 mt-0.5" />
                      <span className="text-soft/50 text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ContentCard>
        </div>
      </section>

      <Footer />
    </div>
  );
}
