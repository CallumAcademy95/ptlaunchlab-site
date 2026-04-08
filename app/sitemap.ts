import type { MetadataRoute } from "next";
import { hubLocations } from "./lib/ukLocations";

const BASE = "https://ptlaunchlab.co.uk";

// Tier-1 keyword routes only — genuinely distinct search intent.
// Lower-priority variants are excluded to preserve crawl budget and avoid
// near-duplicate content diluting indexing of these core pages.
const keywordRoutes = [
  "level-3-personal-trainer-course",
  "personal-trainer-course-with-business-support",
  "how-to-become-a-personal-trainer",
  "career-change-personal-trainer",
  "online-pt-qualification-uk",
  "ncfe-level-3-pt-qualification",
  "quit-9-5-become-a-personal-trainer",
];

const TODAY = new Date().toISOString().split("T")[0];

// Static pages
const staticPages: MetadataRoute.Sitemap = [
  { url: BASE,                                          priority: 1.0,  changeFrequency: "weekly",  lastModified: TODAY },
  { url: `${BASE}/courses`,                             priority: 0.9,  changeFrequency: "weekly",  lastModified: TODAY },
  { url: `${BASE}/enrol`,                               priority: 0.9,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/book-call`,                           priority: 0.8,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/about`,                               priority: 0.7,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/quiz`,                                priority: 0.7,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/contact`,                             priority: 0.6,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/blog`,                                priority: 0.6,  changeFrequency: "weekly",  lastModified: TODAY },
  { url: `${BASE}/podcast`,                             priority: 0.7,  changeFrequency: "weekly",  lastModified: TODAY },
  { url: `${BASE}/personal-trainer-salary-uk`,          priority: 0.7,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/personal-trainer-mentorship-uk`,      priority: 0.7,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/personal-trainer-course-near-me`,     priority: 0.7,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/self-employed-personal-trainer-uk`,   priority: 0.6,  changeFrequency: "monthly", lastModified: TODAY },
];

// Only routes that have an actual root page.tsx (not just [location] sub-routes)
const routesWithRootPage = new Set([
  "personal-trainer-course-with-business-support",
]);

export default function sitemap(): MetadataRoute.Sitemap {
  // Keyword root pages — only include if a root page.tsx actually exists
  const keywordRoots: MetadataRoute.Sitemap = keywordRoutes
    .filter((route) => routesWithRootPage.has(route))
    .map((route) => ({
      url: `${BASE}/${route}`,
      priority: 0.8,
      changeFrequency: "monthly" as const,
      lastModified: TODAY,
    }));

  // Hub locations only — non-hub slugs 301 to their nearest hub, so listing
  // them in the sitemap just wastes crawl budget on redirect chains.
  const locationPages: MetadataRoute.Sitemap = keywordRoutes.flatMap((route) =>
    hubLocations.map((loc) => ({
      url: `${BASE}/${route}/${loc.slug}`,
      priority: 0.6,
      changeFrequency: "monthly" as const,
      lastModified: TODAY,
    }))
  );

  return [...staticPages, ...keywordRoots, ...locationPages];
}
