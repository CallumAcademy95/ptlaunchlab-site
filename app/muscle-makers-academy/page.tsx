import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import { muscleMakersAcademy } from "@/app/lib/gyms/muscle-makers-academy";

const config = muscleMakersAcademy;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
  robots: { index: false, follow: true },
};

export default function MuscleMakersAcademyPage() {
  return <GymAcademyPage config={config} />;
}
