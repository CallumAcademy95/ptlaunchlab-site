import type { Metadata } from "next";
import GymAcademyPage from "@/app/components/GymAcademyPage";
import { xcelerateAcademy } from "@/app/lib/gyms/xcelerate-academy";

// Palette taken from Xcelerate's own brand mark — an X running from deep navy
// through purple into crimson — rather than from their site CSS, which is
// mostly Wix editor chrome shared with every other Wix site.
const config = xcelerateAcademy;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `https://ptlaunchlab.co.uk${config.canonicalPath}` },
};

export default function XcelerateAcademyPage() {
  return <GymAcademyPage config={config} />;
}
