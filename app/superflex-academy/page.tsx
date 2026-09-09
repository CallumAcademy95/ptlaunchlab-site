import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import { superflexAcademy } from "@/app/lib/gyms/superflex-academy";

const config = superflexAcademy;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
};

export default function SuperflexAcademyPage() {
  return <GymAcademyPage config={config} />;
}
