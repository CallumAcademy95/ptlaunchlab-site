import type { Metadata } from "next";
import YouTubeDiscountClient from "./YouTubeDiscountClient";

export const metadata: Metadata = {
  title: "Subscribe & Save £200 | PT Launch Lab",
  description: "Subscribe to the PT Launch Lab YouTube channel and unlock £200 off the NCFE Level 3 Personal Trainer course.",
  robots: { index: false, follow: true },
};

export default function Page() {
  return <YouTubeDiscountClient />;
}
