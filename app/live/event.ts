// ─────────────────────────────────────────────────────────────────────────────
// Live event — single source of truth
//
// EDIT ME EACH MONTH: bump the EVENT object (number, title, topic, ISO
// start/end, hosts, panellists, talkingPoints). Everything else — the human
// date label, the session label, the Google Calendar link, the Event schema on
// /live, and the date shown on /ask — derives from this. The stream link itself
// lives server-side in LIVE_STREAM_URL and is returned by /api/live-register.
//
// Speaker photos: drop images in /public/live/speakers/ and set `photo` to the
// path (e.g. "/live/speakers/callum.webp"). If `photo` is omitted the page
// renders a clean initials avatar instead — so missing photos never break it.
// ─────────────────────────────────────────────────────────────────────────────

export type Speaker = {
  name: string;
  /** Business / role line shown under the name. */
  org: string;
  /** Optional headshot path under /public. Falls back to initials avatar. */
  photo?: string;
};

export const SERIES_NAME = "PT Launch Lab LIVE";
export const SERIES_TAGLINE = "Monthly live discussions with leading fitness professionals.";

export const EVENT = {
  number: 1,
  title: "The Real State of the PT Industry in 2026",
  topic:
    "Gym owners, coaches and PTs go live on the questions everyone's asking — is the market saturated, what actually fills a client roster now, and where the money really is. Bring your questions for the live Q&A.",
  // ISO 8601 with explicit offset. July = BST (UTC+1). ~1hr: 3×20min segments
  // (topics / submitted Q&A / open Q&A) + welcome + wrap.
  startIso: "2026-07-15T20:00:00+01:00",
  endIso: "2026-07-15T21:15:00+01:00",
  hosts: [
    { name: "Callum Brown", org: "PT Launch Lab", photo: "/callum.webp" },
    { name: "Ryan Robinson", org: "PT Launch Lab", photo: "/ryan.webp" },
    { name: "Miles Halstead", org: "PT Launch Lab", photo: "/miles.webp" },
  ] as Speaker[],
  panellists: [
    { name: "Jonny Grayshon", org: "Vaxa Fitness Transformations", photo: "/live/speakers/jonny-grayshon.png" },
    { name: "Jon Baker", org: "Operations Director, The Gym Group", photo: "/live/speakers/jon-baker.png" },
    { name: "Tom Blackman", org: "Ministry of Fitness", photo: "/live/speakers/tom-blackman.png" },
    { name: "Chris Duffin", org: "Chief Scientific Advisor & Resilience Coach", photo: "/live/speakers/chris-duffin.png" },
    { name: "Sohail Rashid", org: "Brawn", photo: "/live/speakers/sohail-rashid.png" },
  ] as Speaker[],
  // "Questions we'll be discussing" — teasers shown on /live.
  talkingPoints: [
    "Is the PT market saturated?",
    "Are GLP-1 weight-loss drugs a threat or an opportunity for coaches?",
    "Where is the money really being made in fitness right now?",
    "Where is the industry heading next? — plus live audience Q&A",
  ],
};

// ── Derived date helpers ──────────────────────────────────────────────────
const start = new Date(EVENT.startIso);
const end = new Date(EVENT.endIso);

export const whenLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Europe/London",
}).format(start);

// e.g. "July Session"
export const sessionLabel = `${new Intl.DateTimeFormat("en-GB", {
  month: "long",
  timeZone: "Europe/London",
}).format(start)} Session`;

// Google Calendar wants UTC stamps as YYYYMMDDTHHMMSSZ.
const toCalStamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export const calendarUrl =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  `&text=${encodeURIComponent(`${SERIES_NAME} — ${EVENT.title}`)}` +
  `&dates=${toCalStamp(start)}/${toCalStamp(end)}` +
  `&details=${encodeURIComponent(`${EVENT.topic}\n\nYour watch link is in your confirmation email.`)}` +
  `&location=${encodeURIComponent("Online (link in your email)")}`;
