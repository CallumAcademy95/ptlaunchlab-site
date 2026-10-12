import type { Metadata } from "next";
import VslPage from "../VslPage";
import { VSL_CONTENT } from "../content";

const PAGE_URL = "https://ptlaunchlab.co.uk/vsl/become-a-personal-trainer-uk";

export const metadata: Metadata = {
  title: "Become a Personal Trainer in the UK — Level 2 & 3 Course (Online) | PT Launch Lab",
  description:
    "Turn your gym obsession into a recognised career. NCFE Level 2 & 3 Personal Trainer course, Ofqual regulated, fully online, no degree. Built for people who already live in the gym.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    title: "Become a Personal Trainer in the UK — Level 2 & 3 Course (Online)",
    description:
      "Turn your gym obsession into a recognised career. NCFE Level 2 & 3, Ofqual regulated, fully online. No degree, no guesswork, no £29 PDF scams.",
    url: PAGE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function BecomeAPersonalTrainerUkPage() {
  return <VslPage content={VSL_CONTENT.starter} />;
}
