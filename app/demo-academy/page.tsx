import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import { demoAcademy } from "@/app/lib/gyms/demo-academy";

const config = demoAcademy;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  // A prop, not a page we want ranking against the real gyms.
  robots: { index: false, follow: false },
};

export default function DemoAcademyPage() {
  return <GymAcademyPage config={config} />;
}
