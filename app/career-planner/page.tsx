import type { Metadata } from "next";
import CareerPlanner from "./CareerPlanner";
import { introHeadlineFor } from "@/app/lib/careerPlannerV2";

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

// Ad-to-page match: a known utm_content from the "Worth it?" ads swaps the H1 for the
// ad's own question. Only fixed strings from introHeadlineFor are ever rendered.
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const content = Array.isArray(sp.utm_content) ? sp.utm_content[0] : sp.utm_content;
  return <CareerPlanner headline={introHeadlineFor(content)} />;
}
