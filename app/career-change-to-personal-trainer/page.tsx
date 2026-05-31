import type { Metadata } from "next";
import ColdLanding from "../components/cold/ColdLanding";

// Short-form, quiz-first COLD Meta traffic page (Switcher avatar).
// The long-form sales/VSL version lives at the canonical /vsl/ twin below —
// it carries the schema + ranking signals; this page exists to convert paid
// clicks into quiz starts with zero competing actions.
const VSL_URL = "https://ptlaunchlab.co.uk/vsl/career-change-to-personal-trainer";

export const metadata: Metadata = {
  title: "Career Change to Personal Trainer (UK) — Take the 60-Second Quiz | PT Launch Lab",
  description:
    "Sick of a job you've outgrown? Take the 60-second quiz to see whether becoming a UK personal trainer is realistically viable around your current job, income and responsibilities.",
  alternates: { canonical: VSL_URL },
  openGraph: {
    type: "website",
    title: "Career Change to Personal Trainer (UK) — Take the 60-Second Quiz",
    description:
      "See whether becoming a PT is realistically viable for your situation — around your current job, income and responsibilities. Honest answer either way.",
    url: VSL_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function CareerChangeColdPage() {
  return (
    <ColdLanding
      avatar="switcher"
      headlineLead="Sick of working a job"
      headlineAccent="you’ve outgrown?"
      subhead="Take the 60-second quiz to see whether becoming a PT is realistically viable for your situation — around your current job, income and responsibilities."
    />
  );
}
