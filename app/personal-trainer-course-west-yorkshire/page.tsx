import type { Metadata } from "next";
import LocalCoursePage from "@/app/components/local/LocalCoursePage";
import { LOCAL_PAGES, localMetadata } from "@/app/lib/localPages";

// Local course page for West Yorkshire. Content and facts: app/lib/localPages.ts.
export const metadata: Metadata = localMetadata(LOCAL_PAGES.westYorkshire);

export default function PersonalTrainerCourseWestYorkshirePage() {
  return <LocalCoursePage content={LOCAL_PAGES.westYorkshire} />;
}
