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
  title: "Personal Trainer Course Near Me | Study Online From Anywhere | PT Launch Lab",
  description: "Searching for a personal trainer course near you? PT Launch Lab is 100% online — you can study from anywhere in the UK. No commute. No classroom. Start anytime.",
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
                  <span className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase">Personal Trainer Course Near Me</span>
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] mb-6">
                  The course is online.<br />
                  <span className="text-[#F5C518]">So it's near you.</span>
                </h1>
                <p className="text-lg md:text-xl text-white font-semibold leading-snug mb-4">
                  PT Launch Lab is 100% online — so wherever you are in the UK, the course is right there with you.
                </p>
                <p className="text-base text-blue-100/80 leading-relaxed mb-8">
                  No classroom, no commute, no fixed timetable. Study your Level 3 PT qualification at a pace that works for your life — with real mentorship from day one. Whether you're in London, Leeds, Glasgow or anywhere in between.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <a href="/enrol" className="px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/30 text-center">Start Today →</a>
                  <a href="/book-call" className="px-8 py-4 rounded-full border-2 border-white/60 text-white font-semibold text-base hover:bg-white/10 transition-all text-center">Discover Your Pathway</a>
                </div>
                <div className="flex flex-wrap gap-3 text-blue-200/70 text-xs">
                  <span>⭐ 5-Star Rated</span><span className="opacity-40">·</span>
                  <span>100% Online</span><span className="opacity-40">·</span>
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
