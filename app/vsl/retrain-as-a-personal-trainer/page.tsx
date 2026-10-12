import type { Metadata } from "next";
import VslPage from "../VslPage";
import { VSL_CONTENT } from "../content";

const PAGE_URL = "https://ptlaunchlab.co.uk/vsl/retrain-as-a-personal-trainer";

export const metadata: Metadata = {
  title: "Retrain as a Personal Trainer (UK) — Online Course Around the Kids | PT Launch Lab",
  description:
    "It's not too late. Retrain as a UK personal trainer around school hours and family life. NCFE Level 2 + 3, Ofqual regulated, fully online from home. Supportive route for parents and returners.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    title: "Retrain as a Personal Trainer (UK) — Online Course Around the Kids",
    description:
      "Build a fitness career around school hours and family life. Online from home, supportive tutor model, built for parents and returners. NCFE Level 2 + 3, Ofqual regulated.",
    url: PAGE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function RetrainAsAPersonalTrainerPage() {
  return <VslPage content={VSL_CONTENT.returner} />;
}
