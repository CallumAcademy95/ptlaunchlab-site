import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import { mofGym } from "@/app/lib/gyms/mof-gym";

const config = mofGym;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
};

export default function MofGymAcademyPage() {
  return <GymAcademyPage config={config} />;
}
