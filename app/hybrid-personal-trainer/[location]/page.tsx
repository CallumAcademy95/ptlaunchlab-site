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
import { ukLocations, priorityLocations, getLocationBySlug } from "@/app/lib/ukLocations";

export const dynamicParams = true;
export const revalidate = false;

export async function generateStaticParams() {
  return priorityLocations.map((l) => ({ location: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ location: string }> }) {
  const { location } = await params;
  const loc = getLocationBySlug(location);
  if (!loc) return {};
  return {
    title: `Hybrid Personal Trainer Course in ${loc.name} | PT Launch Lab`,
    description: `Want to be a hybrid PT near ${loc.name}? Train clients in person and online. PT Launch Lab's Level 3 PT qualification teaches you how to build a hybrid coaching business from scratch.`,
    alternates: { canonical: `https://ptlaunchlab.co.uk/hybrid-personal-trainer/${location}` },
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
        <LocationHero location={loc.name} headline="Hybrid Personal Trainer in {location}.|Train clients in person and online." />
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
