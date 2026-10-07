import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import { atpFelixstoweAcademy } from "@/app/lib/gyms/atp-felixstowe-academy";

const config = atpFelixstoweAcademy;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
};

export default function AtpFelixstoweAcademyPage() {
  return <GymAcademyPage config={config} />;
}
