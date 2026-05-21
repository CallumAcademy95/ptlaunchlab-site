import Nav from "@/app/components/Nav";
import PainPoints from "@/app/components/PainPoints";
import Reframe from "@/app/components/Reframe";
import FounderStory from "@/app/components/FounderStory";
import HowItWorks from "@/app/components/HowItWorks";
import WhatYouGet from "@/app/components/WhatYouGet";
import VideoTestimonial from "@/app/components/VideoTestimonial";
import Reviews from "@/app/components/Reviews";
import Accreditation from "@/app/components/Accreditation";
import GymPartners from "@/app/components/GymPartners";
import Podcast from "@/app/components/Podcast";
import ConversionSection from "@/app/components/ConversionSection";
import FAQ from "@/app/components/FAQ";
import FinalCTA from "@/app/components/FinalCTA";
import Footer from "@/app/components/Footer";
import HeroSlideshow from "@/app/components/HeroSlideshow";

export const metadata = {
  title: "Personal Trainer Mentorship UK | PT Launch Lab — £500 Community Included Free",
  description: "PT Launch Lab includes our £500 business mentorship community at no extra cost with the NCFE Level 3 course. Most UK academies charge £500–£3,000 separately or skip mentorship entirely. We bundle it.",
  alternates: {
    canonical: "https://ptlaunchlab.co.uk/personal-trainer-mentorship-uk",
  },
};

export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <section className="relative min-h-screen flex items-center bg-gradient-to-br from-[#0E5FA0] via-[#0A4A80] to-[#072B4A] overflow-hidden pt-[72px]">
          <div className="absolute -left-48 top-20 w-[600px] h-[600px] rounded-full bg-[#F5C518] opacity-[0.08] blur-3xl pointer-events-none" />
          <div className="absolute -right-32 top-40 w-[500px] h-[500px] rounded-full bg-[#60A5FA] opacity-[0.12] blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-20 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#F5C518]/40 bg-white/10 backdrop-blur-sm mb-6">
                  <span className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase">Personal Trainer Mentorship UK</span>
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] mb-6">
                  Real mentorship.<br />
                  <span className="text-[#F5C518]">Bundled, not bolted on.</span>
                </h1>
                <p className="text-lg md:text-xl text-white font-semibold leading-snug mb-4">
                  Every PT Launch Lab student gets our £500 Mentorship Hub — built around one job: walking you from qualifying to your first paying client. Direct access to mentors who&apos;ve built real careers in fitness, not tutors who&apos;ve only ever taught.
                </p>
                <p className="text-base text-blue-100/80 leading-relaxed mb-8">
                  Most UK PT academies charge £500–£3,000 separately for ongoing mentorship — or skip it entirely. We bundle it into the £1,599 course fee. From your first lesson through to your first paying client, we&apos;re with you every step.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <a href="/enrol" className="px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/30 text-center">Start Today →</a>
                  <a href="/book-call" className="px-8 py-4 rounded-full border-2 border-white/60 text-white font-semibold text-base hover:bg-white/10 transition-all text-center">Discover Your Pathway</a>
                </div>
                <div className="flex flex-wrap gap-3 text-blue-200/70 text-xs">
                  <span>⭐ 5-Star Rated</span><span className="opacity-40">·</span>
                  <span>£500 Mentorship Included</span><span className="opacity-40">·</span>
                  <span>500+ PTs Hired</span><span className="opacity-40">·</span>
                  <span>NCFE & Ofqual Regulated</span>
                </div>
              </div>
              <HeroSlideshow />
            </div>
          </div>
        </section>
        <PainPoints />
        <Reframe />
        <FounderStory />
        <HowItWorks />
        <WhatYouGet />
        <VideoTestimonial />
        <Reviews />
        <Accreditation />
        <GymPartners />
        <Podcast />
        <ConversionSection />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
