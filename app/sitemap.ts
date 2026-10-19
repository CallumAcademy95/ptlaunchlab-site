import type { MetadataRoute } from "next";
import { episodesIndex } from "./podcast/transcripts/_index.ts";

const BASE = "https://ptlaunchlab.co.uk";

// Static, not computed. Previously this was new Date() at build time, so every
// deploy told Google that every URL on the site had changed that day. A lastmod
// that is always "today" is noise, and Google learns to ignore the whole file.
// Bump this by hand when pages are genuinely revised.
const TODAY = "2026-07-27";

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
  { url: `${BASE}/gym-partnership`,                     priority: 0.7,  changeFrequency: "monthly", lastModified: "2026-10-19" },
  { url: `${BASE}/how-to-add-a-pt-academy-to-your-gym`, priority: 0.7,  changeFrequency: "monthly", lastModified: "2026-10-19" },
  { url: `${BASE}/personal-trainer-salary-uk`,          priority: 0.7,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/pt-salary-calculator`,                priority: 0.7,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/career-planner`,                      priority: 0.8,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/career-blueprint`,                    priority: 0.9,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/graduates`,                           priority: 0.7,  changeFrequency: "weekly",  lastModified: TODAY },
  { url: `${BASE}/hub`,                                  priority: 0.8,  changeFrequency: "weekly",  lastModified: TODAY },
  { url: `${BASE}/personal-trainer-mentorship-uk`,      priority: 0.7,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/personal-trainer-course-near-me`,     priority: 0.7,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/self-employed-personal-trainer-uk`,   priority: 0.6,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/best-personal-trainer-course-uk`,     priority: 0.7,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/online-personal-trainer-course-uk`,   priority: 0.9,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/how-to-become-a-personal-trainer-uk`, priority: 0.9,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/too-old-to-become-a-personal-trainer`, priority: 0.7,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/are-online-pt-qualifications-recognised-by-uk-gyms`, priority: 0.7, changeFrequency: "monthly", lastModified: TODAY },
  // Avatar long-form sales/VSL pages (canonical targets). The bare-slug cold
  // ad pages are short-form quiz funnels that canonical here, so only the
  // /vsl/* twins are advertised to Google.
  { url: `${BASE}/vsl/become-a-personal-trainer-uk`,      priority: 0.8,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/vsl/career-change-to-personal-trainer`, priority: 0.8,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/vsl/retrain-as-a-personal-trainer`,     priority: 0.8,  changeFrequency: "monthly", lastModified: TODAY },
  // Gym partnership landing pages
  { url: `${BASE}/6fit-academy`,                        priority: 0.6,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/muscle-bound-academy`,                priority: 0.6,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/ebor-fitness`,                        priority: 0.6,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/mof-gym`,                             priority: 0.6,  changeFrequency: "monthly", lastModified: TODAY },
  { url: `${BASE}/ironwolf-gym`,                        priority: 0.6,  changeFrequency: "monthly", lastModified: TODAY },
  // Real local course pages (Phase 4b). They replace the 31 templated
  // /<template>/<town> doorway routes, which now 308 to these or /courses.
  { url: `${BASE}/personal-trainer-course-pontefract`,     priority: 0.8, changeFrequency: "monthly", lastModified: "2026-10-13" },
  { url: `${BASE}/personal-trainer-course-west-yorkshire`, priority: 0.8, changeFrequency: "monthly", lastModified: "2026-10-13" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Per-episode podcast pages — full transcripts on each, deep crawlable
  // resources for AI-search citation.
  const podcastEpisodes: MetadataRoute.Sitemap = episodesIndex.map((e) => ({
    url: `${BASE}/podcast/${e.slug}`,
    priority: 0.6,
    changeFrequency: "yearly" as const,
    lastModified: e.date,
  }));

  return [...staticPages, ...podcastEpisodes];
}
