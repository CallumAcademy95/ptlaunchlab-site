import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import { gymNGoAcademy } from "@/app/lib/gyms/gym-n-go-academy";

// Gym n Go's brand mark is monochrome, so the accent is drawn from their own
// gym imagery — the bright cyan walls on the Forest Hill floor. Worth confirming
// with the gym before launch; it's inferred, not taken from a brand guide.
const config = gymNGoAcademy;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
};

export default function GymNGoAcademyPage() {
  return <GymAcademyPage config={config} />;
}
