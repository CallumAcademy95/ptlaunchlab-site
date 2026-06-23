// ─────────────────────────────────────────────────────────────────────────────
// Live event — single source of truth
//
// EDIT ME EACH MONTH: bump the EVENT object (number, title, topic, ISO
// start/end, hosts, panellists, talkingPoints). Everything else — the human
// date label, the Google Calendar link, the Event schema on /live, and the
// date shown on /ask — derives from this. The stream link itself lives
// server-side in LIVE_STREAM_URL and is returned by /api/live-register.
// ─────────────────────────────────────────────────────────────────────────────

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
    "Callum Brown",
    "Ryan Robinson",
    "Miles Halstead",
  ],
  panellists: [
    "Jerome Scherrer — Muscle Mechanics",
    "Sam Hinks — SJH Coaching",
    "Tom Blackman — Ministry of Fitness",
    "Aaron Caseley — MOFO Body Mechanic",
    "Sohail Rashid — Brawn",
  ],
  talkingPoints: [
    "Is the PT market really saturated — or just full of part-timers?",
    "What's actually filling client rosters in 2026 (and what's dead)",
    "Employed vs self-employed vs online: the honest numbers",
    "Live Q&A — your questions, answered on air",
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

// Google Calendar wants UTC stamps as YYYYMMDDTHHMMSSZ.
const toCalStamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export const calendarUrl =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  `&text=${encodeURIComponent(`PT Launch Lab LIVE — ${EVENT.title}`)}` +
  `&dates=${toCalStamp(start)}/${toCalStamp(end)}` +
  `&details=${encodeURIComponent(`${EVENT.topic}\n\nYour watch link is in your confirmation email.`)}` +
  `&location=${encodeURIComponent("Online (link in your email)")}`;
