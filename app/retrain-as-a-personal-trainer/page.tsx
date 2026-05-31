import type { Metadata } from "next";
import ColdLanding from "../components/cold/ColdLanding";

// Short-form, quiz-first COLD Meta traffic page (Returner avatar).
// Long-form sales/VSL twin (schema + ranking signals) lives at the canonical
// /vsl/ URL below.
const VSL_URL = "https://ptlaunchlab.co.uk/vsl/retrain-as-a-personal-trainer";

export const metadata: Metadata = {
  title: "Retrain as a Personal Trainer (UK) — Take the 60-Second Quiz | PT Launch Lab",
  description:
    "It's not too late. Take the 60-second quiz to see whether retraining as a UK personal trainer is realistically viable — around your life, your family and the time you actually have.",
  alternates: { canonical: VSL_URL },
  openGraph: {
    type: "website",
    title: "Retrain as a Personal Trainer (UK) — Take the 60-Second Quiz",
    description:
      "See whether retraining as a PT is realistically viable around school hours and family life. Supportive route for parents and returners. Honest answer either way.",
    url: VSL_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function RetrainColdPage() {
  return (
    <ColdLanding
      avatar="returner"
      headlineLead="Ready for something"
      headlineAccent="that’s yours again?"
      subhead="Take the 60-second quiz to see whether retraining as a PT is realistically viable — around your life, your family, and the time you actually have."
    />
  );
}
