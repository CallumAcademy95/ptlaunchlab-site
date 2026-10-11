import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import { sixFitAcademy } from "@/app/lib/gyms/6fit-academy";

const config = sixFitAcademy;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
  robots: { index: false, follow: true },
};

export default function SixFitAcademyPage() {
  return <GymAcademyPage config={config} />;
}
