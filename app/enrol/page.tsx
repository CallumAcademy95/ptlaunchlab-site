import type { Metadata } from "next";
import EnrolmentFlow from "./EnrolmentFlow";
import Breadcrumbs from "../components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Enrol | PT Launch Lab",
  description: "Enrol on the £1,599 NCFE Level 2 & 3 PT qualification. Includes our £500 business mentorship community, personal tutor, and guaranteed gym interviews — bundled, no paid upgrades. Tutor assigned within 24 hours.",
  alternates: { canonical: "https://ptlaunchlab.co.uk/enrol" },
};

export default function EnrolPage() {
  return (
    <>
      <Breadcrumbs trail={[{ name: "Enrol", url: "https://ptlaunchlab.co.uk/enrol" }]} />
      <EnrolmentFlow />
    </>
  );
}
