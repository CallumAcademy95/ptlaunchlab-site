import type { Metadata } from "next";
import VslPage from "../VslPage";
import { VSL_CONTENT } from "../content";

const PAGE_URL = "https://ptlaunchlab.co.uk/vsl/career-change-to-personal-trainer";

export const metadata: Metadata = {
  title: "Career Change to Personal Trainer (UK) — Qualify Without Quitting Your Job | PT Launch Lab",
  description:
    "Burned out at work? Train as a UK personal trainer around your current job. NCFE Level 2 + 3, Ofqual regulated, study evenings/weekends, business mentorship included.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    title: "Career Change to Personal Trainer (UK) — Qualify Without Quitting Your Job",
    description:
      "A realistic, evidence-backed route from desk job to PT career. Study around full-time work. Business mentorship included. Transition safely.",
    url: PAGE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function CareerChangeToPersonalTrainerPage() {
  return <VslPage content={VSL_CONTENT.switcher} />;
}
