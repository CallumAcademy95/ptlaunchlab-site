import type { Metadata } from "next";
import ProspectusThankYouClient from "./ProspectusThankYouClient";

export const metadata: Metadata = {
  title: "Prospectus Sent | PT Launch Lab",
  description: "Your course prospectus is ready, with the full module breakdown and payment options.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ProspectusThankYouClient />;
}
