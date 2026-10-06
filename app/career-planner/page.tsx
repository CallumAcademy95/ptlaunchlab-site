import type { Metadata } from "next";
import CareerPlanner from "./CareerPlanner";

export const metadata: Metadata = {
  title: "Free PT Career Plan | PT Launch Lab",
  description:
    "Answer 9 quick questions and get a free PT career plan: your route, your timeline, and what you'd get to help you get there.",
  alternates: { canonical: "https://ptlaunchlab.co.uk/career-planner" },
  openGraph: {
    title: "Your free PT Career Plan | PT Launch Lab",
    description:
      "Get a free, personalised plan to become a personal trainer: your route, your timeline, and what you'd get to help you get there.",
    url: "https://ptlaunchlab.co.uk/career-planner",
    type: "website",
  },
};

export default function Page() {
  return <CareerPlanner />;
}
