import type { Metadata } from "next";
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
import GymPartners from "./components/GymPartners";
import Podcast from "./components/Podcast";
import ConversionSection from "./components/ConversionSection";
import FAQ from "./components/FAQ";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";
import StickyMobileCTA from "./components/StickyMobileCTA";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://ptlaunchlab.co.uk",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is the Level 3 PT qualification recognised by gyms and insurers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The NCFE Level 2 & 3 qualification from PT Launch Lab is regulated by Ofqual and recognised by CIMSPA and REPs — the gold standard for UK fitness professionals. NCFE is the qualification name UK gym managers ask for by default on their job listings — PureGym, David Lloyd, Nuffield Health, JD Gyms, and independents. Other UK academies offer their own self-branded certifications or use Focus Awards; NCFE Level 3 is the one gym managers recognise on a CV without explanation.",
      },
    },
    {
      "@type": "Question",
      name: "How long does it take to become a qualified personal trainer?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most students complete the NCFE Level 2 & 3 Personal Trainer qualification in 8–16 weeks studying part-time. The course is 100% online and self-paced, so you study around your current job.",
      },
    },
    {
      "@type": "Question",
      name: "How much does the PT Launch Lab course cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The course costs £1,599 for full payment, or £599 deposit followed by 5 monthly payments of £200. The £1,599 is the total cost — it includes our £500 business mentorship community, your personal tutor, the full NCFE Level 3 qualification, and the guaranteed gym interview you get on qualifying. Nothing is bolted on as a paid upgrade.",
      },
    },
    {
      "@type": "Question",
      name: "What's included in the £1,599 course fee?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The full NCFE Level 2 & 3 Personal Trainer qualification (Ofqual regulated, CIMSPA recognised), a personal tutor assigned within 24 hours of enrolment, our £500 Mentorship Hub plus Skool community at no extra cost, business training built into the curriculum, and guaranteed warm-introduction interviews to UK gym employers in our network. Most UK PT academies charge £1,200–£2,800 for the qualification alone and price mentorship as a separate £500–£3,000 product. We bundle the lot.",
      },
    },
    {
      "@type": "Question",
      name: "Can I study for a personal trainer qualification while working full-time?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — this is the most common situation our students are in. The course is 100% online with no fixed class times. Most students study in evenings and weekends and qualify in 8–16 weeks.",
      },
    },
    {
      "@type": "Question",
      name: "What is the guaranteed gym interview?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "On completion of your qualification, PT Launch Lab arranges at least one interview for you: either with a gym in our partner network, or with a gym local to you that we approach on your behalf. It is a warm introduction rather than a job board listing. Our founders have hired 500+ PTs and use those relationships to get you in front of the right person.",
      },
    },
    {
      "@type": "Question",
      name: "How much can I earn as a personal trainer in the UK?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A PT working in a gym on an employed basis typically earns £20,000–£28,000 to start. Self-employed PTs who build their own client base regularly earn £35,000–£50,000+. PT Launch Lab's business training is specifically designed to accelerate you to the upper range.",
      },
    },
    {
      "@type": "Question",
      name: "When can I start the PT Launch Lab course?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Immediately. As soon as you enrol you get full access to the course and your personal tutor is introduced within 24 hours. There is no waiting for a cohort start date.",
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
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
