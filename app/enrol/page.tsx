import type { Metadata } from "next";
import EnrolmentFlow from "./EnrolmentFlow";
import Breadcrumbs from "../components/Breadcrumbs";
import { COURSE_PRICE_LABEL, MONTHLY_PLAN_LABEL } from "../lib/pricing";

export const metadata: Metadata = {
  title: "Enrol | PT Launch Lab",
  description: `Enrol on the NCFE Level 2 & 3 PT qualification — ${COURSE_PRICE_LABEL} in full or ${MONTHLY_PLAN_LABEL} a month. Business mentorship community, personal tutor and a guaranteed gym introduction included — no paid upgrades. Tutor assigned within 24 hours.`,
  alternates: { canonical: "https://ptlaunchlab.co.uk/enrol" },
};

// Rolling enrolment, one price for everyone: there are no offers, intakes or
// ?offer= switches. Any query string is ignored.
export default function EnrolPage() {
  return (
    <>
      <Breadcrumbs trail={[{ name: "Enrol", url: "https://ptlaunchlab.co.uk/enrol" }]} />
      <EnrolmentFlow />
    </>
  );
}
