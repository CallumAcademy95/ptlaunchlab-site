import Nav from "./components/Nav";
import Hero from "./components/Hero";
import PainPoints from "./components/PainPoints";
import Reframe from "./components/Reframe";
import FounderStory from "./components/FounderStory";
import HowItWorks from "./components/HowItWorks";
import WhatYouGet from "./components/WhatYouGet";
import VideoTestimonial from "./components/VideoTestimonial";
import Reviews from "./components/Reviews";
import Accreditation from "./components/Accreditation";
import ConversionSection from "./components/ConversionSection";
import FAQ from "./components/FAQ";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <PainPoints />
        <Reframe />
        <FounderStory />
        <HowItWorks />
        <WhatYouGet />
        <VideoTestimonial />
        <Reviews />
        <Accreditation />
        <ConversionSection />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
