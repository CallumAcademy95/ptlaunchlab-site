import type { MetadataRoute } from "next";
import { hubLocations } from "./lib/ukLocations";

const BASE = "https://ptlaunchlab.co.uk";

// Sole canonical keyword template. All 30 other [location] templates declare
// alternates.canonical pointing here, so the sitemap should only advertise
// these canonical URLs to Google (listing duplicates would waste crawl
// budget and contradict the canonical signal).
const keywordRoutes = [
  "level-3-personal-trainer-course",
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
  { url: `${BASE}/podcast`,                             priority: 0.7,  changeFrequency: "weekly",  lastModified: TODAY },
  { url: `${BASE}/gym-partnership`,                     priority: 0.7,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/personal-trainer-salary-uk`,          priority: 0.7,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/personal-trainer-mentorship-uk`,      priority: 0.7,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/personal-trainer-course-near-me`,     priority: 0.7,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/self-employed-personal-trainer-uk`,   priority: 0.6,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/best-personal-trainer-course-uk`,     priority: 0.7,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/online-personal-trainer-course-uk`,   priority: 0.9,  changeFrequency: "monthly", lastModified: TODAY },
  // Gym partnership landing pages
  { url: `${BASE}/6fit-academy`,                        priority: 0.6,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/muscle-bound-academy`,                priority: 0.6,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/ebor-fitness`,                        priority: 0.6,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/mof-gym`,                             priority: 0.6,  changeFrequency: "monthly", lastModified: TODAY },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Hub locations only — non-hub slugs 301 to their nearest hub, so listing
  // them in the sitemap just wastes crawl budget on redirect chains.
  const locationPages: MetadataRoute.Sitemap = keywordRoutes.flatMap((route) =>
    hubLocations.map((loc) => ({
      url: `${BASE}/${route}/${loc.slug}`,
      priority: 0.7,
      changeFrequency: "monthly" as const,
      lastModified: TODAY,
    }))
  );

  return [...staticPages, ...locationPages];
}
