import { episodesIndex, getEpisodeIndex } from "../../transcripts/_index";

// Plain-text transcript for each episode, served at /podcast/<slug>/transcript.
//
// No .txt extension — the <podcast:transcript> tag declares type="text/plain"
// explicitly, and an extensionless segment also stays inside the middleware
// matcher, which skips any path containing a dot.
//
// This exists so the RSS feed can carry a Podcasting 2.0 <podcast:transcript>
// tag per episode. Podcast apps (and the AI crawlers that read them) can then
// reach the full transcript without rendering the episode page. The words are
// already on the page — this is the machine-readable copy.
//
// Riverside holds the feed, so pointing each episode's transcript tag at its
// URL here is a dashboard step, not a code one. See PODCAST-FEED-SETUP.md.

export const dynamicParams = false;

export async function generateStaticParams() {
  return episodesIndex.map((e) => ({ slug: e.slug }));
}

type Transcript = { title: string; date: string; paragraphs: string[] };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!getEpisodeIndex(slug)) {
    return new Response("Not found", { status: 404 });
  }

  let transcript: Transcript;
  try {
    transcript = (await import(`../../transcripts/${slug}.json`)).default as Transcript;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const body = [
    transcript.title,
    `The PT Launch Lab Podcast — ${transcript.date}`,
    `https://ptlaunchlab.co.uk/podcast/${slug}`,
    "",
    ...transcript.paragraphs,
  ].join("\n\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
