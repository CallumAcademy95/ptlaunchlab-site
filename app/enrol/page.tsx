import type { Metadata } from "next";
import EnrolmentFlow from "./EnrolmentFlow";
import Breadcrumbs from "../components/Breadcrumbs";
import { isSeptemberOfferOpen } from "../lib/septemberOffer";
import { isOctoberOfferOpen } from "../lib/octoberOffer";
import { isBlackFridayOpen } from "../lib/blackFridayOffer";

export const metadata: Metadata = {
  title: "Enrol | PT Launch Lab",
  description: "Enrol on the £1,599 NCFE Level 2 & 3 PT qualification. Includes our £500 business mentorship community, personal tutor, and a guaranteed gym introduction — bundled, no paid upgrades. Tutor assigned within 24 hours.",
  alternates: { canonical: "https://ptlaunchlab.co.uk/enrol" },
};

// The September offer changes what this page renders, so it cannot be cached.
export const dynamic = "force-dynamic";

export default async function EnrolPage({
  searchParams,
}: {
  searchParams: Promise<{ offer?: string }>;
}) {
  const { offer } = await searchParams;

  // `?offer=sept99` is honoured only while the offer is actually open. Checked
  // here as well as in /api/checkout because a page that still shows a £99
  // button after midnight — even one whose checkout would refuse — is a page
  // that takes someone's details and then tells them no.
  const septemberOffer = offer === "sept99" && isSeptemberOfferOpen();
  // Same rule as September: the query parameter is honoured only inside the
  // window, so a forwarded link cannot open a closed offer.
  const octoberOffer = offer === "oct99" && isOctoberOfferOpen();
  const blackFriday = offer === "bf2026" && isBlackFridayOpen();

  return (
    <>
      <Breadcrumbs trail={[{ name: "Enrol", url: "https://ptlaunchlab.co.uk/enrol" }]} />
      <EnrolmentFlow
        offer={
          septemberOffer ? "sept99" : octoberOffer ? "oct99" : blackFriday ? "bf2026" : undefined
        }
      />
    </>
  );
}
