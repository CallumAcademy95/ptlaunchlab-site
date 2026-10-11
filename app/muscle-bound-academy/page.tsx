import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import { muscleBoundAcademy } from "@/app/lib/gyms/muscle-bound-academy";

const config = muscleBoundAcademy;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
  robots: { index: false, follow: true },
};

export default function MuscleBoundAcademyPage() {
  return <GymAcademyPage config={config} />;
}
