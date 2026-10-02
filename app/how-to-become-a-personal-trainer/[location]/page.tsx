import { notFound } from "next/navigation";
import Nav from "@/app/components/Nav";
import LocationHero from "@/app/components/LocationHero";
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
import StickyMobileCTA from "@/app/components/StickyMobileCTA";
import LocationContext from "@/app/components/LocationContext";
import { ukLocations, hubLocations, getLocationBySlug } from "@/app/lib/ukLocations";

export const dynamicParams = false;
export const revalidate = false;

export async function generateStaticParams() {
  return hubLocations.map((l) => ({ location: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ location: string }> }) {
  const { location } = await params;
  const loc = getLocationBySlug(location);
  if (!loc) return {};
  return {
    title: `How to Become a Personal Trainer in ${loc.name} | PT Launch Lab`,
    description: `Want to become a personal trainer in ${loc.name}? Here's everything you need to know — qualifications, costs, timelines and how to build a career from scratch with PT Launch Lab.`,
    alternates: { canonical: `https://ptlaunchlab.co.uk/level-3-personal-trainer-course/${location}` },
    // Duplicate keyword template. Google was ignoring the canonical above and
    // indexing these variants against the canonical page, so this is explicit.
    robots: { index: false, follow: true },
  };
}

export default async function LocationPage({ params }: { params: Promise<{ location: string }> }) {
  const { location } = await params;
  const loc = getLocationBySlug(location);
  if (!loc) notFound();

  return (
    <>
      <Nav />
      <main>
        <LocationHero location={loc.name} headline="How to Become a Personal Trainer in {location}.|Everything you need. Nothing you don't." />
        <LocationContext locationSlug={loc.slug} locationName={loc.name} region={loc.region} />
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
      <StickyMobileCTA />
    </>
  );
}
