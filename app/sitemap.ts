import type { MetadataRoute } from "next";
import { ukLocations } from "./lib/ukLocations";

const BASE = "https://ptlaunchlab.co.uk";

// All keyword route slugs that have a [location] sub-route
const keywordRoutes = [
  "level-3-personal-trainer-course",
  "personal-trainer-certification",
  "accredited-personal-trainer-course",
  "personal-trainer-diploma",
  "ncfe-level-3-pt-qualification",
  "ofqual-regulated-personal-trainer-course",
  "best-online-personal-trainer-course",
  "best-personal-trainer-course-uk",
  "online-personal-training-course",
  "online-pt-qualification-uk",
  "online-coaching-course",
  "flexible-personal-trainer-course",
  "fast-track-personal-trainer-course",
  "level-2-3-personal-training",
  "level-3-gym-instructing-and-personal-training-diploma",
  "personal-trainer-courses-online-uk",
  "personal-trainer-course-with-business-support",
  "personal-training-course-with-business-support",
  "personal-training-course-with-mentorship",
  "pt-courses-with-business-training",
  "pt-course-payment-plan",
  "become-a-qualified-personal-trainer",
  "become-a-personal-trainer-online",
  "start-your-own-personal-training-business",
  "quit-9-5-become-a-personal-trainer",
  "career-change-personal-trainer",
  "how-to-become-a-personal-trainer",
  "gym-floor-personal-trainer",
  "hybrid-personal-trainer",
  "personal-trainer-qualification-recognised-by-uk-gyms",
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

export default function sitemap(): MetadataRoute.Sitemap {
  // Keyword root pages (no location)
  const keywordRoots: MetadataRoute.Sitemap = keywordRoutes.map((route) => ({
    url: `${BASE}/${route}`,
    priority: 0.8,
    changeFrequency: "monthly" as const,
    lastModified: TODAY,
  }));

  // All keyword + location combinations
  const locationPages: MetadataRoute.Sitemap = keywordRoutes.flatMap((route) =>
    ukLocations.map((loc) => ({
      url: `${BASE}/${route}/${loc.slug}`,
      priority: 0.6,
      changeFrequency: "monthly" as const,
      lastModified: TODAY,
    }))
  );

  return [...staticPages, ...keywordRoots, ...locationPages];
}
