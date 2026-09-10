import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import { eborFitness } from "@/app/lib/gyms/ebor-fitness";

const config = eborFitness;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
};

export default function EborFitnessAcademyPage() {
  return <GymAcademyPage config={config} />;
}
