import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import { ironwolfGym } from "@/app/lib/gyms/ironwolf-gym";

const config = ironwolfGym;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
};

export default function IronWolfGymAcademyPage() {
  return <GymAcademyPage config={config} />;
}
