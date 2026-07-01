import type { Metadata } from "next";
import CareerPlanner from "./CareerPlanner";

export const metadata: Metadata = {
  title: "PT Career Escape Plan — Free Calculator | PT Launch Lab",
  description:
    "Thinking of becoming a personal trainer? Answer 8 quick questions for a realistic plan: when you could go full-time, what you could earn, and the exact route to get there. Free.",
  alternates: { canonical: "https://ptlaunchlab.co.uk/career-planner" },
  openGraph: {
    title: "Your PT Career Escape Plan — Free Calculator",
    description:
      "When could you quit? What could you earn? Get a realistic, personalised plan to become a personal trainer in 60 seconds.",
    url: "https://ptlaunchlab.co.uk/career-planner",
    type: "website",
  },
};

export default function Page() {
  return <CareerPlanner />;
}
