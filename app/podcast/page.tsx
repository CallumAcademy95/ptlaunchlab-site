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
    id: "oznEK8qJLEw",
    slug: "what-every-new-personal-trainer-gets-wrong-about-money",
    ep: 36,
    title: "What Every New Personal Trainer Gets Wrong About Money",
    desc: "Jay Johnston is 22, a qualified accountant and a coach, and now The Fitness Accountant. He walks through what he sees when personal trainers hand him their books: the first three financial things to do on day one, why cash in hand bites the moment you want a mortgage, sole trader versus limited company, whether VAT is a badge of honour or a tax on your prices, what you can genuinely put through the business, and the line between tax efficiency and tax avoidance that HMRC eventually finds.",
    date: "2026-09",
    category: "business",
  },
  {
    id: "BWEaeD3ygp4",
    slug: "how-much-should-a-personal-trainer-charge",
    ep: 35,
    title: "How Much Should A Personal Trainer Charge?",
    desc: "Ryan went from £10 an hour at seventeen to £40 a session, raising his price at milestones rather than dates. He explains what happened when a client asked him to match a £20 gym, and why he said no. Plus coaching as a diagnostic, why comparing yourself to who you used to be is the thief of all progression, and what GLP-1s and steroids will not do for you.",
    date: "2026-08",
    category: "business",
  },
  {
    id: "pekkJVhEY8w",
    slug: "ai-glp-1s-and-the-death-of-the-20-personal-trainer",
    ep: 34,
    title: "AI, GLP-1s and the Death of the £20 Personal Trainer",
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
    title: "Why In-Person Personal Training Is AI-Proof — Sohail Rashid, Brawn",
    desc: "Sohail Rashid on why in-person personal training is one of the most AI-proof careers in fitness, the GLP-1 (Ozempic) boom, and what it means for the future of the industry.",
    date: "2026-04",
    category: "business",
  },
  {
    id: "l5SsHmySSEs",
    slug: "royal-marines-and-afghanistan-to-personal-trainer-the-truth-about-this-industry",
    ep: 31,
    title: "Royal Marines & Afghanistan to Personal Trainer — The Truth About This Industry",
    desc: "Jerome Scherrer spent most of his 20s and 30s in the Royal Marines, then worked for the American government in Afghanistan before walking away from the money to become a personal trainer. His Neverland Theory of leaving the military bubble, the six pillars framework he uses with every client, and three tips every new PT needs to hear.",
    date: "2026-04",
    category: "transformation",
  },
  {
    id: "vnsAYYOpshg",
    slug: "from-council-estate-to-stage-with-dizzee-rascal-now-im-a-personal-trainer",
    ep: 30,
    title: "From the Army to Dizzee Rascal's Stage to Personal Trainer — Kav",
    desc: "Kav grew up on the Gipton estate in Leeds, spent five years in the Army, then a viral TikTok freestyle put him on stage with Dizzee Rascal. He talks about losing his purpose after the Army, how training pulled him back, and his plans now he's a newly qualified personal trainer.",
    date: "2026-04",
    category: "transformation",
  },
  {
    id: "n4h2p1eE_Qw",
    slug: "what-90-of-blood-tests-reveal-even-when-you-feel-fine",
    ep: 29,
    title: "What Can a Blood Test Reveal When You Feel Fine?",
    desc: "The health markers hiding in plain sight — what routine blood tests reveal about underlying issues, and why personal trainers need to understand the bigger health picture.",
    date: "2026-04",
    category: "industry",
  },
  {
    id: "Z6eogOvRtw0",
    slug: "from-icu-nurse-to-fitness-business-marias-career-change",
    ep: 28,
    title: "From ICU Nurse to Fitness Business: Maria's Career Change",
    desc: "Maria, a registered nurse and independent nurse prescriber, on going from intensive care to building her own aesthetics business through daily self-promotion. How she uses blood work and functional medicine with clients, the risks of GLP-1s without support, her tips for lowering cortisol, and what she wants from a personal trainer.",
    date: "2026-03",
    category: "transformation",
  },
  {
    id: "bpESntFMy0w",
    slug: "from-addiction-to-full-time-boxing-coach-pembos-story",
    ep: 27,
    title: "How Pembo Got Sober and Became a Full-Time Boxing Coach",
    desc: "Raw conversation on transformation — from army and addiction to community boxing coach and fitness business owner.",
    date: "2026-02",
    category: "transformation",
  },
  {
    id: "tgDP_hoObwM",
    slug: "building-a-martial-arts-gym-from-scratch-ty-harrison",
    ep: 26,
    title: "How to Open a Martial Arts School: Ty Harrison's Story",
    desc: "Ty Harrison on the story behind Sengoku Martial Arts, growing kids and adults programmes, and family-first culture.",
    date: "2026-01",
    category: "industry",
  },
  {
    id: "C8t9nC2HxOM",
    slug: "world-class-dancer-to-yoga-studio-owner-lauras-story",
    ep: 25,
    title: "From Competitive Dancer to Opening a Yoga Studio — Laura's Story",
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
    title: "New Year Fitness Goals and How to Start the Gym Without Burning Out",
    desc: "Callum and Ryan look back on a year of closing and opening businesses and set their goals for the year out loud. Then the practical part: why beginners should start with one small habit instead of overhauling everything in January, and why new PTs shouldn't beast January clients or drop their prices.",
    date: "2026-01",
    category: "business",
  },
  {
    id: "4jITjBvGXXU",
    slug: "british-powerlifting-champion-to-bodybuilding-burnout-sam-hincks",
    ep: 22,
    title: "Powerlifter to Bodybuilder: The Prep That Broke Sam Hincks",
    desc: "Decorated powerlifter and former British & World Champion Sam Hincks on pressure, burnout, and personal evolution in fitness.",
    date: "2025-12",
    category: "industry",
  },
  {
    id: "NrV3eqA3S5Q",
    slug: "what-most-pts-get-wrong-about-movement-kim-tomlin",
    ep: 21,
    title: "Biomechanics for Personal Trainers — Kim Tomlin on Primal Flows",
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
    slug: "from-super-league-debut-to-open-heart-surgery-keals-story",
    ep: 19,
    title: "From Super League Debut to Open-Heart Surgery — Keal's Story",
    desc: "Keal made his Super League debut at 17 with Bradford Bulls, then a mid-game collapse revealed a heart valve problem that led to open-heart surgery. He opens up about coming back, building his own business after full-time rugby, and the pancreatic tumour diagnosed at 35. A story of resilience.",
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
    title: "From Addiction to Fitness: How Marcus Built Mean and Clean",
    desc: "Marcus's raw and honest journey through addiction, recovery, and how he built Mean and Clean around his transformation.",
    date: "2025-10",
    category: "transformation",
  },
  {
    id: "d8PxJsyje-o",
    slug: "3-things-i-wish-i-knew-before-becoming-a-personal-trainer-luke-mccarthy",
    ep: 14,
    title: "3 Things I Wish I Knew Before Becoming a Personal Trainer — Luke McCarthy",
    desc: "Luke McCarthy, a Hyrox athlete who has just turned pro, on six years in the Leeds United academy, growing up dyslexic, quitting drinking, the training week he programmes for himself, and how all of it shapes the way he coaches.",
    date: "2025-10",
    category: "business",
  },
  {
    id: "IDkRUIeXU4E",
    slug: "from-go-karts-to-british-gt4-champion-zac-meakin",
    ep: 13,
    title: "From Go-Karts to British GT4 Champion — Zac Meakin's Story",
    desc: "Zac Meakin, the racing driver Ryan has trained for around five years, on going from go-karts in Pontefract to winning the British GT4 Championship with McLaren, and why he's working through his Level 3 personal training qualification alongside racing.",
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
    desc: "Matty Bell on how running became his recovery tool after addiction, the running club that gave him a community, and why he qualified as a personal trainer to offer strength and conditioning for runners.",
    date: "2025-09",
    category: "transformation",
  },
  {
    id: "S9zcs6P5mn8",
    slug: "why-personal-trainers-quit-in-the-first-two-years",
    ep: 10,
    title: "Why Personal Trainers Quit in the First Two Years",
    desc: "Why do so many personal trainers quit within their first two years? Callum and Ryan break down the reasons, from inconsistent income and tax surprises to underpricing and burnout, and how to go self-employed without losing your safety net. Plus why Ryan is closing the Shred fat-loss challenges after 10 years.",
    date: "2025-08",
    category: "business",
  },
  {
    id: "I1Yrhd9GZZU",
    slug: "how-we-scaled-pt-launch-lab-courses-with-sam-merve-edtech",
    ep: 9,
    title: "Mistakes to Avoid When Starting a Business — Sam, Merve EdTech",
    desc: "Sam, founder of Axol and Merve EdTech, the course platform PT Launch Lab was the first to go live on, shares the startup mistakes he wouldn't repeat, why honesty and low costs matter in any business, and what he looks for in a personal trainer as a client.",
    date: "2025-08",
    category: "business",
  },
  {
    id: "t8yzdFTxZss",
    slug: "what-puregym-looks-for-when-hiring-personal-trainers-mac-livock",
    ep: 8,
    title: "What PureGym Looks for When Hiring Personal Trainers — Mac Livock",
    desc: "PureGym manager Mac Livock, once the first self-employed PT at Ryan's gym, on filling a diary from the gym floor, what new trainers should charge, and the two qualities he looks for when hiring: resilience and people skills.",
    date: "2025-08",
    category: "industry",
  },
  {
    id: "brMSj4dfdBE",
    slug: "is-becoming-a-personal-trainer-still-worth-it-the-honest-answer",
    ep: 7,
    title: "Is Becoming a Personal Trainer Worth It? Is the UK Market Saturated?",
    desc: "Callum and Ryan tackle the question head-on — is the PT market saturated, can you make a real living, and is the career still worth it?",
    date: "2025-08",
    category: "business",
  },
  {
    id: "1HK7woXEWhI",
    slug: "how-ryan-built-an-online-fitness-business-from-a-weight-loss-challenge",
    ep: 6,
    title: "How Ryan Built an Online Fitness Business From a Weight Loss Challenge",
    desc: "Ryan goes back to where his online business began: a £30-a-head weight loss challenge that went online in lockdown and sold over a thousand places overnight. Then practical advice on building an online PT business, from answering price questions to why you should never discount.",
    date: "2025-07",
    category: "business",
  },
  {
    id: "0rhp9fkBFsU",
    slug: "sick-of-the-9-5-how-to-build-a-fitness-career-you-actually-want",
    ep: null,
    title: "How to Become a Personal Trainer in the UK — Our Online Course",
    desc: "Stuck in a 9–5? Callum explains how PT Launch Lab's fully online, NCFE-accredited course gets people into the fitness industry and keeps them there, with business mentorship included, plus price, payment options and how to book a call.",
    date: "2025-10",
    category: "business",
  },
  {
    id: "CDR39D_Esg8",
    slug: "good-clients-vs-nightmare-clients-what-every-pt-needs-to-know",
    ep: null,
    title: "Good vs Bad Personal Training Clients: The Red Flags Every PT Meets",
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
    title: "PT's Brutal Hours: Real Talk on the Grind in the Fitness Industry",
    desc: "The unsociable hours, the grind, and the reality of being a PT that nobody talks about — honest takes from people who've lived it.",
    date: "2025-07",
    category: "business",
  },
  {
    id: "of0Zf6Jscgo",
    slug: "why-most-fitness-influencers-are-lying-to-you",
    ep: null,
    title: "Are Fitness Influencers Good Role Models for New Personal Trainers?",
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
