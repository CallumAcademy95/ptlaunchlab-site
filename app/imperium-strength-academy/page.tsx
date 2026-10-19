import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import { imperiumStrengthAcademy } from "@/app/lib/gyms/imperium-strength-academy";

const config = imperiumStrengthAcademy;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
  robots: { index: false, follow: true },
};

export default function ImperiumStrengthAcademyPage() {
  return <GymAcademyPage config={config} />;
}
