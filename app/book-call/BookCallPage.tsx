"use client";
import { useEffect } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { ContentCard } from "./components/ContentCard";
import { VideoPlaceholder } from "./components/VideoPlaceholder";
import { StepCard } from "./components/StepCard";
import { TestimonialCard } from "./components/TestimonialCard";
import { CheckCircle2, Clock, Phone, Target, Star } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-b from-[#072B4A] via-[#0A3A66] to-[#0E4C80]">
      <Nav />

      {/* SUCCESS CONFIRMATION */}
      <section className="pt-[104px] pb-8 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-8">
            <CheckCircle2 className="w-6 h-6 text-[#35C6A4]" />
            <p className="text-[#35C6A4] text-lg">Your application has been received</p>
          </div>
        </div>
      </section>

      {/* HERO */}
      <section className="pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl text-white mb-6 leading-tight font-bold">
            You&apos;re on the right path.
          </h1>
          <div className="mt-6 h-[3px] w-[50px] bg-[#FFD400] mx-auto mb-10" />
          <p className="text-2xl text-[#D6DEE6] mb-8 leading-relaxed">
            Thanks for taking the first step. You&apos;ve successfully submitted your details and you&apos;re
            now moving forward towards becoming a Personal Trainer.
          </p>
          <p className="text-lg text-[#9FB3C8]">
            The next step is to book your free consultation call so we can talk things through properly.
          </p>
        </div>
      </section>

      {/* VIDEO */}
      <section className="pb-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl text-white mb-3 font-bold">Watch this first (2 minutes)</h2>
            <p className="text-[#D6DEE6]">This explains what the call is for and what happens next.</p>
          </div>
          <VideoPlaceholder />
        </div>
      </section>

      {/* WHAT HAPPENS NEXT */}
      <section className="py-32 px-6 bg-[#061F36]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl md:text-6xl text-white text-center mb-20 font-bold">
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
            <h2 className="text-5xl md:text-6xl text-white mb-6 font-bold">
              What others say about PT Launch Lab
            </h2>
            <div className="h-[3px] w-[50px] bg-[#FFD400] mx-auto" />
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
          <div className="flex items-center justify-center gap-2 text-[#9FB3C8] text-sm">
            <Star className="w-4 h-4 fill-[#FFD400] text-[#FFD400]" />
            <span>Rated 5.0 based on Google reviews</span>
          </div>
        </div>
      </section>

      {/* CALENDLY */}
      <section id="calendly-section" className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl md:text-6xl text-white text-center mb-6 font-bold">
            Book your free consultation call
          </h2>
          <p className="text-xl text-[#D6DEE6] text-center mb-12 max-w-3xl mx-auto leading-relaxed">
            Pick a time below that suits you. The call is relaxed, no pressure, and focused on helping you decide what&apos;s right for you.
          </p>

          <div className="mb-8 max-w-2xl mx-auto">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#FFD400] flex-shrink-0" />
                <span className="text-[#D6DEE6]">15–20 minute phone call</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#FFD400] flex-shrink-0" />
                <span className="text-[#D6DEE6]">You&apos;ll speak directly with Callum, Miles or Ryan</span>
              </div>
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-[#FFD400] flex-shrink-0" />
                <span className="text-[#D6DEE6]">Focused on your goals and next steps</span>
              </div>
            </div>
            <p className="text-center text-[#9FB3C8] italic">No pressure. No obligation. Just a clear conversation.</p>
          </div>

          <div className="bg-gradient-to-b from-[#0F3E66] to-[#0D3559] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 shadow-sm">
            <div
              className="calendly-inline-widget rounded-xl overflow-hidden bg-white"
              data-url="https://calendly.com/ptlaunchlab-info/free-consultation"
              style={{ minWidth: "320px", height: "700px" }}
            />
          </div>

          <p className="text-center text-[#9FB3C8] text-sm mt-6">
            If you need to, you can easily reschedule your call via Calendly.
          </p>
        </div>
      </section>

      {/* REASSURANCE */}
      <section className="pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          <ContentCard hover={false}>
            <h3 className="text-3xl text-white text-center mb-12 font-bold">
              What this call is (and isn&apos;t)
            </h3>
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h4 className="text-xl text-[#FFD400] mb-6 font-bold">This call is:</h4>
                <ul className="space-y-4">
                  {["A chance to talk things through", "Focused on your goals", "Honest and straightforward", "About clarity, not pressure"].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-[#35C6A4] flex-shrink-0 mt-0.5" />
                      <span className="text-[#D6DEE6] text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xl text-[#9FB3C8] mb-6 font-bold">This call isn&apos;t:</h4>
                <ul className="space-y-4">
                  {["A hard sell", "An obligation to sign up", "Rushed or scripted"].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full border-2 border-[rgba(255,255,255,0.2)] flex-shrink-0 mt-0.5" />
                      <span className="text-[#9FB3C8] text-lg">{item}</span>
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
