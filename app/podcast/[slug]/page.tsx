import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import Breadcrumbs from "../../components/Breadcrumbs";
import MidContentCTA from "../../components/MidContentCTA";
import { episodesIndex, getEpisodeIndex } from "../transcripts/_index";

// Canonical feed — see the note in ../page.tsx. The Buzzsprout URL 301s here and
// must keep doing so, because the directories were submitted with it.
const RSS_FEED_URL = "https://api.riverside.com/hosting/WXwoGTza.rss";
const SPOTIFY_SHOW_URL = "https://open.spotify.com/show/48anYoBnXBDxlwfoSzXEBw";
const APPLE_PODCAST_URL = "https://podcasts.apple.com/podcast/id1896293475";

export const dynamicParams = false;

export async function generateStaticParams() {
  return episodesIndex.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ep = getEpisodeIndex(slug);
  if (!ep) return {};
  const url = `https://ptlaunchlab.co.uk/podcast/${slug}`;
  return {
    title: `${ep.title} | PT Launch Lab Podcast${ep.ep ? ` Ep.${ep.ep}` : ""}`,
    description: `Full transcript of "${ep.title}" — ${ep.wordCount.toLocaleString()} words. ${ep.category === "transformation" ? "Real career-change story" : ep.category === "business" ? "PT business insights" : "Industry interview"} from the PT Launch Lab podcast.`,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: ep.title,
      url,
      images: [{ url: `https://i.ytimg.com/vi/${ep.id}/maxresdefault.jpg` }],
    },
  };
}

type Transcript = {
  id: string;
  slug: string;
  ep: number | null;
  title: string;
  date: string;
  category: string;
  wordCount: number;
  paragraphs: string[];
  // Optional. Offsets are on the PUBLISHED VIDEO's timeline, which may differ
  // from the audio master if a hook was prepended — see the episode's SEO pack.
  chapters?: { start: number; end: number; title: string }[];
  // Optional. MUST also be rendered visibly on the page — Google's structured
  // data guidelines prohibit FAQPage markup for content the user can't see.
  faqs?: { q: string; a: string }[];
};

async function loadTranscript(slug: string): Promise<Transcript | null> {
  try {
    const data = (await import(`../transcripts/${slug}.json`)).default;
    return data as Transcript;
  } catch {
    return null;
  }
}

export default async function EpisodePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = getEpisodeIndex(slug);
  if (!meta) notFound();
  const transcript = await loadTranscript(slug);
  if (!transcript) notFound();

  const url = `https://ptlaunchlab.co.uk/podcast/${slug}`;
  const ytUrl = `https://www.youtube.com/watch?v=${meta.id}`;
  const ytEmbedUrl = `https://www.youtube.com/embed/${meta.id}`;
  const ytThumbnail = `https://i.ytimg.com/vi/${meta.id}/maxresdefault.jpg`;
  const datePublished = `${meta.date}T12:00:00Z`;

  // PodcastEpisode + Article schema (the page is BOTH a podcast episode
  // AND an article with the transcript — that's the citation play).
  const podcastSchema = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: meta.title,
    url,
    datePublished,
    ...(meta.ep ? { episodeNumber: meta.ep } : {}),
    inLanguage: "en-GB",
    partOfSeries: {
      "@type": "PodcastSeries",
      name: "The PT Launch Lab Podcast",
      url: "https://ptlaunchlab.co.uk/podcast",
      webFeed: RSS_FEED_URL,
    },
    associatedMedia: {
      "@type": "VideoObject",
      name: meta.title,
      thumbnailUrl: ytThumbnail,
      uploadDate: datePublished,
      contentUrl: ytUrl,
      embedUrl: ytEmbedUrl,
      // Chapters as Clips. This is what makes the episode citable at passage
      // level rather than as one 90-minute blob, and it feeds Google's
      // key-moments treatment.
      ...(transcript.chapters?.length
        ? {
            hasPart: transcript.chapters.map((c) => ({
              "@type": "Clip",
              name: c.title,
              startOffset: c.start,
              endOffset: c.end,
              url: `${ytUrl}&t=${c.start}s`,
            })),
          }
        : {}),
    },
    transcript: transcript.paragraphs.join("\n\n"),
    publisher: {
      "@type": "Organization",
      name: "PT Launch Lab",
      url: "https://ptlaunchlab.co.uk",
    },
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    description: `Full episode transcript of ${meta.title} from the PT Launch Lab podcast. ${meta.wordCount.toLocaleString()} words.`,
    url,
    datePublished,
    dateModified: datePublished,
    inLanguage: "en-GB",
    author: { "@type": "Organization", name: "PT Launch Lab" },
    publisher: {
      "@type": "Organization",
      name: "PT Launch Lab",
      url: "https://ptlaunchlab.co.uk",
      logo: {
        "@type": "ImageObject",
        url: "https://ptlaunchlab.co.uk/logo.png",
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: { "@type": "ImageObject", url: ytThumbnail, width: 1280, height: 720 },
    wordCount: meta.wordCount,
  };

  // Only emitted when the episode actually has FAQs, and the same copy is
  // rendered visibly below — schema-only FAQs breach Google's guidelines.
  const faqSchema = transcript.faqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: transcript.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  // Surface the next + previous episodes for internal linking
  const idx = episodesIndex.findIndex((e) => e.slug === slug);
  const prev = idx > 0 ? episodesIndex[idx - 1] : null;
  const next = idx < episodesIndex.length - 1 ? episodesIndex[idx + 1] : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(podcastSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      <Breadcrumbs
        trail={[
          { name: "Podcast", url: "https://ptlaunchlab.co.uk/podcast" },
          { name: meta.title, url },
        ]}
      />
      <Nav />
      <main className="pt-[72px]">

        {/* HERO */}
        <section className="bg-base py-14 md:py-20 px-6 relative overflow-hidden">
          <div className="absolute -left-48 top-0 w-[500px] h-[500px] rounded-full bg-gold opacity-[0.04] blur-3xl pointer-events-none" />
          <div className="relative max-w-4xl mx-auto">
            <Link href="/podcast" className="text-gold text-xs font-semibold tracking-widest uppercase mb-4 inline-block hover:underline">
              ← All episodes
            </Link>
            <div className="flex flex-wrap items-center gap-3 text-soft/60 text-xs font-semibold tracking-widest uppercase mb-3">
              {meta.ep && <span className="text-gold">EP.{meta.ep}</span>}
              <span>·</span>
              <span>
                {new Date(meta.date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}
              </span>
              <span>·</span>
              <span className="capitalize">
                {meta.category === "transformation" ? "Career-change story" : meta.category === "business" ? "PT business" : "Industry interview"}
              </span>
              <span>·</span>
              <span>{meta.wordCount.toLocaleString()} words</span>
            </div>
            <h1 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-tight tracking-tight mb-6">
              {meta.title}
            </h1>
            <div className="flex flex-wrap gap-3 mb-2">
              <a
                href={ytUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF0000] text-white font-bold text-sm hover:brightness-110 transition-all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                Watch on YouTube
              </a>
              <a
                href={SPOTIFY_SHOW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1DB954] text-black font-bold text-sm hover:brightness-110 transition-all"
              >
                Listen on Spotify
              </a>
              <a
                href={APPLE_PODCAST_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#822CEC] to-[#D444F1] text-white font-bold text-sm hover:brightness-110 transition-all"
              >
                Apple Podcasts
              </a>
            </div>
          </div>
        </section>

        {/* VIDEO EMBED */}
        <section className="bg-surface py-10 px-6 border-y border-blue/15">
          <div className="max-w-4xl mx-auto">
            <div className="aspect-video rounded-2xl overflow-hidden border border-white/[0.07] bg-card">
              <iframe
                src={ytEmbedUrl}
                title={meta.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                className="w-full h-full"
              />
            </div>
          </div>
        </section>

        {/* KEY QUESTIONS — visible counterpart to the FAQPage schema above */}
        {transcript.faqs?.length ? (
          <section className="bg-surface py-14 md:py-20 px-6 border-t border-blue/15">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display font-extrabold text-2xl md:text-4xl text-white leading-none tracking-tight mb-8">
                Key questions answered in this episode
              </h2>
              <div className="space-y-7">
                {transcript.faqs.map((f) => (
                  <div key={f.q}>
                    <h3 className="text-white font-semibold text-lg mb-2">{f.q}</h3>
                    <p className="text-soft/85 text-base leading-relaxed">{f.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* TRANSCRIPT */}
        <section className="bg-base py-14 md:py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-baseline justify-between mb-8 flex-wrap gap-2">
              <h2 className="font-display font-extrabold text-2xl md:text-4xl text-white leading-none tracking-tight">
                Full transcript
              </h2>
              <p className="text-soft/50 text-xs font-semibold tracking-widest uppercase">
                Auto-captioned
              </p>
            </div>
            <div className="prose-invert space-y-5 text-soft/85 text-base leading-relaxed">
              {(() => {
                // Inject the mid-content CTA after the paragraph nearest 50% of
                // the transcript, but only on long-enough episodes (≥ 6 paras)
                // so it doesn't hijack the first read on short clips.
                const paras = transcript.paragraphs;
                const mid = paras.length >= 6 ? Math.floor(paras.length / 2) : -1;
                const elements: React.ReactNode[] = [];
                paras.forEach((p, i) => {
                  elements.push(<p key={`p-${i}`}>{p}</p>);
                  if (i === mid) {
                    elements.push(
                      <MidContentCTA
                        key="mid-cta"
                        headline="Liked what you heard? See if you'd suit it."
                        body={`This episode is one of ${episodesIndex.length} on the PT Launch Lab podcast — all hosted by gym owners who run the academy. Take the 60-second quiz to find out if becoming a personal trainer is right for you.`}
                        ctaText="Take the 60-Second Quiz →"
                        ctaHref="/quiz"
                        secondary={{
                          text: "Compare UK PT Courses",
                          href: "/online-personal-trainer-course-uk",
                        }}
                      />
                    );
                  }
                });
                return elements;
              })()}
            </div>
          </div>
        </section>

        {/* INTERNAL LINKS / RELATED */}
        <section className="bg-surface py-12 px-6 border-t border-blue/15">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {prev && (
                <Link
                  href={`/podcast/${prev.slug}`}
                  className="rounded-2xl border border-white/[0.07] bg-card p-5 hover:border-gold/40 transition-all"
                >
                  <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-2">← Previous episode</p>
                  <p className="text-white font-bold text-base mb-1">{prev.title}</p>
                  <p className="text-soft/50 text-sm">{prev.wordCount.toLocaleString()} words</p>
                </Link>
              )}
              {next && (
                <Link
                  href={`/podcast/${next.slug}`}
                  className={`rounded-2xl border border-white/[0.07] bg-card p-5 hover:border-gold/40 transition-all ${prev ? "" : "md:col-start-2"}`}
                >
                  <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-2">Next episode →</p>
                  <p className="text-white font-bold text-base mb-1">{next.title}</p>
                  <p className="text-soft/50 text-sm">{next.wordCount.toLocaleString()} words</p>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-base py-16 px-6 text-center border-t border-blue/15">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-2xl md:text-4xl text-white leading-none tracking-tight mb-4">
              Thinking about becoming a personal trainer?
            </h2>
            <p className="text-soft/70 text-base md:text-lg mb-6">
              We&apos;re the PT academy run by the gym owners interviewed on this podcast. Take the 60-second quiz to find out if our NCFE Level 3 course is the right fit.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/quiz"
                className="px-7 py-3.5 rounded-full bg-gold text-deep font-bold text-sm hover:brightness-110 transition-all"
              >
                Take the 60-Second Quiz →
              </Link>
              <Link
                href="/online-personal-trainer-course-uk"
                className="px-7 py-3.5 rounded-full border border-gold text-gold font-semibold text-sm hover:bg-gold hover:text-deep transition-all"
              >
                Compare UK PT Courses
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
