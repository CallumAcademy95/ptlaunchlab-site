import type { Metadata } from "next";
import LocalCoursePage from "@/app/components/local/LocalCoursePage";
import { LOCAL_PAGES, localMetadata } from "@/app/lib/localPages";

// Local course page for Wakefield. Content and facts: app/lib/localPages.ts.
export const metadata: Metadata = localMetadata(LOCAL_PAGES.wakefield);

export default function PersonalTrainerCourseWakefieldPage() {
  return <LocalCoursePage content={LOCAL_PAGES.wakefield} />;
}
