import type { Metadata } from "next";
import YouTubeThankYouClient from "./YouTubeThankYouClient";

export const metadata: Metadata = {
  title: "Discount Unlocked | PT Launch Lab",
  description: "Your £200 discount is unlocked for the next 48 hours.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <YouTubeThankYouClient />;
}
