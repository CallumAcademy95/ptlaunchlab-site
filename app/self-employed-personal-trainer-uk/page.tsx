import Nav from "@/app/components/Nav";
import RelatedGuides from "@/app/components/RelatedGuides";
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
  title: "Self-Employed Personal Trainer UK | Build Your Own PT Business | PT Launch Lab",
  description: "Go self-employed as a UK personal trainer with NCFE Level 3 + our £500 business mentorship community bundled in for £1,599. The mentorship piece — pricing, client acquisition, marketing — most UK academies sell separately or skip. We bundle it.",
  alternates: { canonical: "https://ptlaunchlab.co.uk/self-employed-personal-trainer-uk" },
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
                  <span className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase">Self-Employed Personal Trainer UK</span>
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] mb-6">
                  Don't just qualify.<br />
                  <span className="text-[#F5C518]">Go self-employed.</span>
                </h1>
                <p className="text-lg md:text-xl text-white font-semibold leading-snug mb-4">
                  PT Launch Lab is built for self-employed personal trainers — not gym employees.
                </p>
                <p className="text-base text-blue-100/80 leading-relaxed mb-8">
                  We train you to get your Level 3 qualification and build a real self-employed PT business from scratch — getting clients, setting rates, and creating the income and freedom you actually want. Our mentors have done exactly this, and they'll be with you every step of the way.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <a href="/enrol" className="px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/30 text-center">Start Today →</a>
                  <a href="/book-call" className="px-8 py-4 rounded-full border-2 border-white/60 text-white font-semibold text-base hover:bg-white/10 transition-all text-center">Discover Your Pathway</a>
                </div>
                <div className="flex flex-wrap gap-3 text-blue-200/70 text-xs">
                  <span>⭐ 5-Star Rated</span><span className="opacity-40">·</span>
                  <span>Self-Employment Focused</span><span className="opacity-40">·</span>
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
        <RelatedGuides currentHref="/self-employed-personal-trainer-uk" />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
