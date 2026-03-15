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
  title: "Personal Trainer Course with Business Support | PT Launch Lab",
  description: "The only PT course that includes real business mentorship as standard. Learn how to qualify, get clients, and build a self-employed career — not just pass an exam. PT Launch Lab.",
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
                  <span className="text-[#F5C518] text-xs font-semibold tracking-widest uppercase">PT Course with Business Support</span>
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] mb-6">
                  Qualify as a PT.<br />
                  <span className="text-[#F5C518]">Build a business too.</span>
                </h1>
                <p className="text-lg md:text-xl text-white font-semibold leading-snug mb-4">
                  Most PT courses teach you the exam. PT Launch Lab teaches you the exam and how to actually earn from it.
                </p>
                <p className="text-base text-blue-100/80 leading-relaxed mb-8">
                  Business mentorship is built into the course from day one — not an optional add-on, not a upsell. You'll learn client acquisition, pricing, and how to build a self-employed income alongside your Level 3 qualification.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <a href="/enrol" className="px-8 py-4 rounded-full bg-[#F5C518] text-[#072B4A] font-bold text-base hover:brightness-110 transition-all shadow-lg shadow-[#F5C518]/30 text-center">Start Today →</a>
                  <a href="/book-call" className="px-8 py-4 rounded-full border-2 border-white/60 text-white font-semibold text-base hover:bg-white/10 transition-all text-center">Book a Free Call</a>
                </div>
                <div className="flex flex-wrap gap-3 text-blue-200/70 text-xs">
                  <span>⭐ 5-Star Rated</span><span className="opacity-40">·</span>
                  <span>Business Support Included</span><span className="opacity-40">·</span>
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
