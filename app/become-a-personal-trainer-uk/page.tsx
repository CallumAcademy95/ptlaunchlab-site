import type { Metadata } from "next";
import ColdLanding from "../components/cold/ColdLanding";

// Short-form, quiz-first COLD Meta traffic page (Starter avatar).
// Long-form sales/VSL twin (schema + ranking signals) lives at the canonical
// /vsl/ URL below.
const VSL_URL = "https://ptlaunchlab.co.uk/vsl/become-a-personal-trainer-uk";

export const metadata: Metadata = {
  title: "Become a Personal Trainer in the UK — Take the 60-Second Quiz | PT Launch Lab",
  description:
    "Already live in the gym? Take the 60-second quiz to see which personal-training path fits you — and how to turn the thing you already love into a recognised UK career.",
  alternates: { canonical: VSL_URL },
  openGraph: {
    type: "website",
    title: "Become a Personal Trainer in the UK — Take the 60-Second Quiz",
    description:
      "See which PT path fits you and how to turn your gym obsession into a real career. NCFE Level 3, Ofqual regulated. Honest answer either way.",
    url: VSL_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function BecomePtColdPage() {
  return (
    <ColdLanding
      avatar="starter"
      headlineLead="You’re already in"
      headlineAccent="the gym anyway…"
      subhead="Take the 60-second quiz to see which personal-training path actually fits you — and how to turn the thing you already love into a career that pays."
    />
  );
}
