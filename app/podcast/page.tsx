import PodcastPage, { type Episode } from "./PodcastPage";
import Breadcrumbs from "../components/Breadcrumbs";

const SPOTIFY_SHOW_URL = "https://open.spotify.com/show/48anYoBnXBDxlwfoSzXEBw";
const APPLE_PODCAST_URL = "https://podcasts.apple.com/podcast/id1896293475";
// Canonical feed. The show moved from Buzzsprout to Riverside, and the old
// Buzzsprout URL now 301s here. Apple, Spotify and Podchaser were all submitted
// with the Buzzsprout address, so THAT REDIRECT MUST STAY ALIVE — letting the
// Buzzsprout account lapse would break every directory listing and every link
// they point at us. Pointing our own pages at the real feed avoids the extra hop.
const RSS_FEED_URL = "https://api.riverside.com/hosting/WXwoGTza.rss";
const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@ptlaunchlab";
const PODCAST_INDEX_URL = "https://podcastindex.org/podcast/7846674";
const PODCHASER_URL = "https://www.podchaser.com/podcasts/pt-launch-lab-podcast-6471336";

export const metadata = {
  title: "The PT Launch Lab Podcast — Real Stories from the Fitness Industry",
  description:
    "Listen to the PT Launch Lab podcast on Spotify, YouTube and Apple Podcasts. Real stories from personal trainers, gym owners and career changers. New episode every week.",
  alternates: {
    canonical: "https://ptlaunchlab.co.uk/podcast",
    types: {
      "application/rss+xml": RSS_FEED_URL,
    },
  },
  openGraph: {
    title: "The PT Launch Lab Podcast",
    description:
      "Real stories from personal trainers, gym owners and career changers. Watch on YouTube, listen on Spotify.",
    url: "https://ptlaunchlab.co.uk/podcast",
    type: "website",
    images: [{ url: "/podcast-thumbnail.jpg" }],
  },
};

const episodes: Episode[] = [
  {
    id: "pekkJVhEY8w",
    slug: "ai-glp-1s-and-the-death-of-the-20-personal-trainer",
    ep: 34,
    title: "AI, GLP-1s and the Death of the £20 Personal Trainer — PT Launch Lab LIVE",
    desc: "Six industry leaders — including the Operations Director of The Gym Group, an independent gym owner and two investors — on whether AI will replace personal trainers, what GLP-1s mean for the industry, and whether becoming a PT is still worth it in 2026.",
    date: "2026-08",
    category: "industry",
  },
  {
    id: "vUaye0j8p34",
    slug: "ridge-holland-on-big-e-rugby-league-and-life-after-wwe",
    ep: 33,
    title: "Ridge Holland on Big E, Rugby League & Life After WWE",
    desc: "Ridge Holland on his journey from rugby league to WWE — wrestling Big E, the highs and lows of pro wrestling, and what life looks like after the ring.",
    date: "2026-05",
    category: "industry",
  },
  {
    id: "-ZHxWBvBYrw",
    slug: "why-in-person-personal-training-will-be-ai-proof-sohail-rashid",
    ep: 32,
    title: "Why In-Person Personal Training Will Be AI-Proof — Sohail Rashid",
    desc: "Sohail Rashid on why in-person personal training is one of the most AI-proof careers in fitness, the GLP-1 (Ozempic) boom, and what it means for the future of the industry.",
    date: "2026-04",
    category: "business",
  },
  {
    id: "l5SsHmySSEs",
    slug: "royal-marines-and-afghanistan-to-personal-trainer-the-truth-about-this-industry",
    ep: 31,
    title: "Royal Marines & Afghanistan to Personal Trainer — The Truth About This Industry",
    desc: "From Royal Marines service and deployment in Afghanistan to building a career as a personal trainer — an honest look at military-to-fitness transitions and the realities of this industry.",
    date: "2026-04",
    category: "transformation",
  },
  {
    id: "vnsAYYOpshg",
    slug: "from-council-estate-to-stage-with-dizzee-rascal-now-im-a-personal-trainer",
    ep: 30,
    title: "From Council Estate to Stage with Dizzee Rascal — Now I'm a Personal Trainer",
    desc: "A remarkable journey — from council estate roots and performing on stage with Dizzee Rascal, to qualifying as a personal trainer and building a fitness career.",
    date: "2026-04",
    category: "transformation",
  },
  {
    id: "n4h2p1eE_Qw",
    slug: "what-90-of-blood-tests-reveal-even-when-you-feel-fine",
    ep: 29,
    title: "What 90% of Blood Tests Reveal (Even When You Feel Fine)",
    desc: "The health markers hiding in plain sight — what routine blood tests reveal about underlying issues, and why personal trainers need to understand the bigger health picture.",
    date: "2026-04",
    category: "industry",
  },
  {
    id: "Z6eogOvRtw0",
    slug: "from-icu-nurse-to-fitness-business-marias-career-change",
    ep: 28,
    title: "From ICU Nurse to Fitness Business: Maria's Career Change",
    desc: "Nurse prescriber Maria shares how she transitioned from intensive care to building a biohacking fitness business.",
    date: "2026-03",
    category: "transformation",
  },
  {
    id: "bpESntFMy0w",
    slug: "from-addiction-to-full-time-boxing-coach-pembos-story",
    ep: 27,
    title: "From Addiction to Full-Time Boxing Coach: Pembo's Story",
    desc: "Raw conversation on transformation — from army and addiction to community boxing coach and fitness business owner.",
    date: "2026-02",
    category: "transformation",
  },
  {
    id: "tgDP_hoObwM",
    slug: "building-a-martial-arts-gym-from-scratch-ty-harrison",
    ep: 26,
    title: "Building a Martial Arts Gym from Scratch — Ty Harrison",
    desc: "Ty Harrison on the story behind Sengoku Martial Arts, growing kids and adults programmes, and family-first culture.",
    date: "2026-01",
    category: "industry",
  },
  {
    id: "C8t9nC2HxOM",
    slug: "world-class-dancer-to-yoga-studio-owner-lauras-story",
    ep: 25,
    title: "World-Class Dancer to Yoga Studio Owner: Laura's Story",
    desc: "Laura's transition from world-class competitive dancer to launching Vibe Yoga in Pontefract.",
    date: "2026-01",
    category: "transformation",
  },
  {
    id: "agtjiOXMKOg",
    slug: "from-46-stone-to-qualified-personal-trainer-jack-atkinson",
    ep: 24,
    title: "From 46 Stone to Qualified Personal Trainer — Jack Atkinson",
    desc: "Jack Atkinson's raw, powerful journey battling food addiction and rebuilding confidence to qualify as a personal trainer.",
    date: "2026-01",
    category: "transformation",
  },
  {
    id: "70EkHHRizj8",
    slug: "the-reality-of-running-multiple-fitness-businesses",
    ep: 23,
    title: "The Reality of Running Multiple Fitness Businesses",
    desc: "Callum and Ryan on shutting down businesses, launching new ventures, and the real rollercoaster of fitness entrepreneurship.",
    date: "2026-01",
    category: "business",
  },
  {
    id: "4jITjBvGXXU",
    slug: "british-powerlifting-champion-to-bodybuilding-burnout-sam-hincks",
    ep: 22,
    title: "British Powerlifting Champion to Bodybuilding Burnout — Sam Hincks",
    desc: "Decorated powerlifter and former British & World Champion Sam Hincks on pressure, burnout, and personal evolution in fitness.",
    date: "2025-12",
    category: "industry",
  },
  {
    id: "NrV3eqA3S5Q",
    slug: "what-most-pts-get-wrong-about-movement-kim-tomlin",
    ep: 21,
    title: "What Most PTs Get Wrong About Movement — Kim Tomlin",
    desc: "Biomechanics coach Kim Tomlin on movement, training for health vs aesthetics, and what most personal trainers miss.",
    date: "2025-12",
    category: "industry",
  },
  {
    id: "oQhgsNsLd-8",
    slug: "how-max-clark-opened-his-own-boxing-gym-at-18",
    ep: 20,
    title: "How Max Clark Opened His Own Boxing Gym at 18",
    desc: "From footballer to dedicated boxer — how Max Clark opened Clark's Boxing Academy in Normanton at just 18 years old.",
    date: "2025-11",
    category: "industry",
  },
  {
    id: "gfA-LCPXpBM",
    slug: "super-league-debut-to-heart-surgery-kiels-story",
    ep: 19,
    title: "Super League Debut to Heart Surgery — Kiel's Story",
    desc: "Kiel opens up about adversity at every stage — Super League debut, heart surgery, and a pancreatic diagnosis. A story of resilience.",
    date: "2025-11",
    category: "transformation",
  },
  {
    id: "8477A4T4HBQ",
    slug: "how-to-scale-your-pt-business-online-with-miles",
    ep: 16,
    title: "How to Scale Your PT Business Online — with Miles",
    desc: "How to become an online personal trainer, find your niche, and real industry insights from Miles, a seasoned fitness professional.",
    date: "2025-10",
    category: "business",
  },
  {
    id: "4r_4ZegftMY",
    slug: "from-addiction-to-personal-trainer-marcus-mean-and-clean",
    ep: 15,
    title: "From Addiction to Personal Trainer — Marcus, Mean and Clean",
    desc: "Marcus's raw and honest journey through addiction, recovery, and how he built Mean and Clean around his transformation.",
    date: "2025-10",
    category: "transformation",
  },
  {
    id: "d8PxJsyje-o",
    slug: "3-things-i-wish-i-knew-before-becoming-a-personal-trainer-luke-mccarthy",
    ep: 14,
    title: "3 Things I Wish I Knew Before Becoming a Personal Trainer — Luke McCarthy",
    desc: "Luke McCarthy, Head Hybrid Coach at BoFitFam, on the hard lessons from his fitness career and what he'd do differently.",
    date: "2025-10",
    category: "business",
  },
  {
    id: "IDkRUIeXU4E",
    slug: "how-personal-training-made-me-a-better-racing-driver-zak-meakin",
    ep: 13,
    title: "How Personal Training Made Me a Better Racing Driver — Zak Meakin",
    desc: "How Zak Meakin bridged motorsport and fitness, and what personal training gave him as a competitive racing driver.",
    date: "2025-09",
    category: "industry",
  },
  {
    id: "pAm1jvDKRM0",
    slug: "how-gemma-left-her-corporate-job-to-become-a-personal-trainer",
    ep: 12,
    title: "How Gemma Left Her Corporate Job to Become a Personal Trainer",
    desc: "Gemma from Saddleworth on leaving a stable corporate career and building a PT business from scratch.",
    date: "2025-09",
    category: "transformation",
  },
  {
    id: "ZlZxHBwliIk",
    slug: "how-running-saved-me-from-addiction-matty-bell",
    ep: 11,
    title: "How Running Saved Me from Addiction — Matty Bell",
    desc: "Matty Bell on how running became his recovery tool, and how PT Launch Lab helped him channel that into a career in fitness.",
    date: "2025-09",
    category: "transformation",
  },
  {
    id: "S9zcs6P5mn8",
    slug: "why-i-shut-down-my-500k-online-pt-business-the-honest-story",
    ep: 10,
    title: "Why I Shut Down My £500K Online PT Business — The Honest Story",
    desc: "Callum and Ryan on Shred Lifestyle — what it was, why it worked, and why they chose to shut it down at its peak.",
    date: "2025-08",
    category: "business",
  },
  {
    id: "I1Yrhd9GZZU",
    slug: "how-we-scaled-pt-launch-lab-courses-with-sam-merve-edtech",
    ep: 9,
    title: "How We Scaled PT Launch Lab Courses — with Sam, Merve EdTech",
    desc: "Sam from Merve EdTech on the intersection of education technology and fitness, and how it changed PT Launch Lab's course delivery.",
    date: "2025-08",
    category: "business",
  },
  {
    id: "t8yzdFTxZss",
    slug: "what-puregym-looks-for-when-hiring-personal-trainers-mac-livock",
    ep: 8,
    title: "What PureGym Looks for When Hiring Personal Trainers — Mac Livock",
    desc: "PureGym Regional Manager Mac Livock on career growth, what makes a great PT, and what gym employers actually look for.",
    date: "2025-08",
    category: "industry",
  },
  {
    id: "brMSj4dfdBE",
    slug: "is-becoming-a-personal-trainer-still-worth-it-the-honest-answer",
    ep: 7,
    title: "Is Becoming a Personal Trainer Still Worth It? The Honest Answer",
    desc: "Callum and Ryan tackle the question head-on — is the PT market saturated, can you make a real living, and is the career still worth it?",
    date: "2025-08",
    category: "business",
  },
  {
    id: "1HK7woXEWhI",
    slug: "how-i-built-an-online-pt-business-to-500k-ryans-full-story",
    ep: 6,
    title: "How I Built an Online PT Business to £500K — Ryan's Full Story",
    desc: "Ryan goes back to the beginning — how he built an online PT business from nothing to £500K, and what he'd do differently.",
    date: "2025-07",
    category: "business",
  },
  {
    id: "0rhp9fkBFsU",
    slug: "sick-of-the-9-5-how-to-build-a-fitness-career-you-actually-want",
    ep: null,
    title: "Sick of the 9–5? How to Build a Fitness Career You Actually Want",
    desc: "How to become an online personal trainer with full mentorship — and why escaping the rat race through fitness is more achievable than you think.",
    date: "2025-10",
    category: "business",
  },
  {
    id: "CDR39D_Esg8",
    slug: "good-clients-vs-nightmare-clients-what-every-pt-needs-to-know",
    ep: null,
    title: "Good Clients vs Nightmare Clients — What Every PT Needs to Know",
    desc: "Callum and Ryan break down the difference between great clients and difficult ones — and how to attract the right people from day one.",
    date: "2025-07",
    category: "business",
  },
  {
    id: "gqp9Grs1rF0",
    slug: "will-ai-replace-personal-trainers-the-honest-answer",
    ep: null,
    title: "Will AI Replace Personal Trainers? The Honest Answer",
    desc: "A genuine look at AI in personal training — where it helps, where it falls short, and why the human element will never be replaced.",
    date: "2025-07",
    category: "business",
  },
  {
    id: "LlPK2PzCrRA",
    slug: "the-brutal-reality-of-a-personal-trainers-working-hours",
    ep: null,
    title: "The Brutal Reality of a Personal Trainer's Working Hours",
    desc: "The unsociable hours, the grind, and the reality of being a PT that nobody talks about — honest takes from people who've lived it.",
    date: "2025-07",
    category: "business",
  },
  {
    id: "of0Zf6Jscgo",
    slug: "why-most-fitness-influencers-are-lying-to-you",
    ep: null,
    title: "Why Most Fitness Influencers Are Lying to You",
    desc: "Callum and Ryan on the problem with fitness influencer culture — and how to pick real role models when you're building a PT career.",
    date: "2025-07",
    category: "industry",
  },
];

const podcastSeriesSchema = {
  "@context": "https://schema.org",
  "@type": "PodcastSeries",
  name: "The PT Launch Lab Podcast",
  alternateName: "PT Launch Lab Podcast",
  description:
    "Real stories from personal trainers, gym owners and career changers in the UK fitness industry. Hosted by Callum Brown, Ryan Robinson and Miles. Career-change journeys, PT business building, and the honest side of the industry.",
  url: "https://ptlaunchlab.co.uk/podcast",
  webFeed: RSS_FEED_URL,
  image: "https://ptlaunchlab.co.uk/podcast-thumbnail.jpg",
  inLanguage: "en-GB",
  numberOfEpisodes: episodes.length,
  author: [
    { "@type": "Person", name: "Callum Brown" },
    { "@type": "Person", name: "Ryan Robinson" },
  ],
  publisher: {
    "@type": "Organization",
    name: "PT Launch Lab",
    url: "https://ptlaunchlab.co.uk",
    logo: {
      "@type": "ImageObject",
      url: "https://ptlaunchlab.co.uk/logo.png",
    },
  },
  sameAs: [
    SPOTIFY_SHOW_URL,
    APPLE_PODCAST_URL,
    YOUTUBE_CHANNEL_URL,
    PODCAST_INDEX_URL,
    PODCHASER_URL,
  ],
};

const episodeListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "PT Launch Lab Podcast Episodes",
  description:
    "Real stories from personal trainers, gym owners and career changers. New episode every week.",
  url: "https://ptlaunchlab.co.uk/podcast",
  itemListElement: episodes.map((ep, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "PodcastEpisode",
      name: ep.title,
      description: ep.desc,
      url: `https://www.youtube.com/watch?v=${ep.id}`,
      datePublished: `${ep.date}-01T12:00:00Z`,
      ...(ep.ep ? { episodeNumber: ep.ep } : {}),
      partOfSeries: {
        "@type": "PodcastSeries",
        name: "The PT Launch Lab Podcast",
        url: "https://ptlaunchlab.co.uk/podcast",
        webFeed: RSS_FEED_URL,
      },
      associatedMedia: {
        "@type": "VideoObject",
        name: ep.title,
        description: ep.desc,
        thumbnailUrl: `https://i.ytimg.com/vi/${ep.id}/hqdefault.jpg`,
        uploadDate: `${ep.date}-01T12:00:00Z`,
        contentUrl: `https://www.youtube.com/watch?v=${ep.id}`,
        embedUrl: `https://www.youtube.com/embed/${ep.id}`,
      },
      publisher: {
        "@type": "Organization",
        name: "PT Launch Lab",
        url: "https://ptlaunchlab.co.uk",
      },
    },
  })),
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(podcastSeriesSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(episodeListSchema) }}
      />
      <Breadcrumbs trail={[{ name: "Podcast", url: "https://ptlaunchlab.co.uk/podcast" }]} />
      <PodcastPage
        episodes={episodes}
        spotifyUrl={SPOTIFY_SHOW_URL}
        appleUrl={APPLE_PODCAST_URL}
        youtubeUrl={YOUTUBE_CHANNEL_URL}
        rssUrl={RSS_FEED_URL}
      />
    </>
  );
}
