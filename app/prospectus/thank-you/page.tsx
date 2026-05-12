import type { Metadata } from "next";
import ProspectusThankYouClient from "./ProspectusThankYouClient";

export const metadata: Metadata = {
  title: "Prospectus Sent | PT Launch Lab",
  description: "Your course prospectus is ready. Your £200 discount is unlocked for the next 48 hours.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ProspectusThankYouClient />;
}
