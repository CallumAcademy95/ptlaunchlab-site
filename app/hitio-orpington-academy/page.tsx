import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import { hitioOrpingtonAcademy } from "@/app/lib/gyms/hitio-orpington-academy";

const config = hitioOrpingtonAcademy;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
};

export default function HitioOrpingtonAcademyPage() {
  return <GymAcademyPage config={config} />;
}
