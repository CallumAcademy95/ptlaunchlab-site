import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import { mclubAcademy } from "@/app/lib/gyms/mclub-academy";

const config = mclubAcademy;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
  robots: { index: false, follow: true },
};

export default function MClubAcademyPage() {
  return <GymAcademyPage config={config} />;
}
