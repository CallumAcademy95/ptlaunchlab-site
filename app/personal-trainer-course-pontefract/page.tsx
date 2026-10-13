import type { Metadata } from "next";
import LocalCoursePage from "@/app/components/local/LocalCoursePage";
import { LOCAL_PAGES, localMetadata } from "@/app/lib/localPages";

// Local course page for Pontefract. Content and facts: app/lib/localPages.ts.
export const metadata: Metadata = localMetadata(LOCAL_PAGES.pontefract);

export default function PersonalTrainerCoursePontefractPage() {
  return <LocalCoursePage content={LOCAL_PAGES.pontefract} />;
}
