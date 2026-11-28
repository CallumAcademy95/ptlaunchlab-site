// app/lib/booking/callPrep.ts
// What someone sees straight after booking a course call: a "prepare for your
// call" page rather than a bare "Booked". Spec: ACTIONS 2026-11-28 item 2.
//
// Pure and client-safe: no "@/" imports, so node --test and the browser both load
// it. All the user-facing copy lives here as data so tests/callPrep.test.mts can
// hold it to the PTLL copy rules (no "free", no "consultation", no em dashes, no
// word on how payments are taken, prices from pricing.ts).
import { COURSE_PRICE_LABEL, MONTHLY_PRICE_LABEL, MONTHLY_PAYMENTS } from "../pricing.ts";
import { CALLER_DISPLAY } from "../contactDetails.ts";

/** How a configured prep video is shown, or null for no video block at all. */
export type PrepVideo = { kind: "youtube"; src: string } | { kind: "file"; src: string } | null;

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Turn NEXT_PUBLIC_CALL_PREP_VIDEO_URL into something safe to render.
 *
 * Unset, blank or unrecognised means NO video block, never a broken embed. Two
 * kinds are accepted because the site CSP allows exactly these: frame-src is
 * www.youtube.com only, and media-src allows https: files.
 *   - any YouTube link (watch, youtu.be, shorts, embed) -> www.youtube.com/embed/<id>
 *   - an https .mp4 / .webm / .mov file -> a <video> tag
 */
export function callPrepVideo(raw: string | null | undefined): PrepVideo {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  let u: URL;
  try { u = new URL(s); } catch { return null; }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^(www\.|m\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") id = u.searchParams.get("v");
    else {
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/);
      id = m ? m[1] : null;
    }
  }
  if (id !== null) return YT_ID.test(id) ? { kind: "youtube", src: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1` } : null;
  if (/\.(mp4|webm|mov)$/i.test(u.pathname)) return { kind: "file", src: u.toString() };
  return null;
}

/** Pre-filled WhatsApp text for moving the call. Only the call time goes in it. */
export function moveCallMessage(label: string): string {
  return `Hi Callum, I need to move my call on ${label}. Which other times have you got?`;
}

export function whatsappMoveHref(waLink: string, label: string): string {
  return `${waLink}?text=${encodeURIComponent(moveCallMessage(label))}`;
}

export const PRICE_LINE = `${COURSE_PRICE_LABEL} in full, or ${MONTHLY_PRICE_LABEL} a month for ${MONTHLY_PAYMENTS} months.`;

export const PREP_COPY = {
  eyebrow: "You're booked",
  heading: "Your call with Callum",
  whoLine: (phone: string) => `Callum will ring you on ${phone} from ${CALLER_DISPLAY}.`,
  saveNumber: `Save ${CALLER_DISPLAY} in your phone as "Callum, PT Launch Lab" so you know it's him.`,
  videoHeading: "A minute from Callum before your call",
  agendaHeading: "What happens on the call",
  agendaIntro: "About 15 to 20 minutes, on the phone. Here's what we'll cover:",
  agenda: [
    { title: "You and your goals", body: "Why you want to become a PT, where you are now, and your Career Planner answers if you've done it." },
    { title: "The route", body: "How the NCFE Level 2 and 3 works, what you'll do each week, and how long it takes. Most people finish in 8 to 16 weeks, around their job." },
    { title: "The price, plainly", body: PRICE_LINE },
    { title: "Your questions", body: "Anything you want to ask. Nothing is off limits." },
    { title: "No pressure to decide", body: "You don't have to decide anything on the call. In Callum's words: \"If it's not right for you, I'll tell you.\"" },
  ],
  prepareHeading: "How to get the most from it",
  prepare: [
    `Save ${CALLER_DISPLAY}, so you pick up when Callum rings.`,
    "Jot down your questions beforehand. Time, cost, how the assessments work: whatever is on your mind.",
    "Be somewhere quiet with good signal for about 20 minutes.",
  ],
  moveHeading: "Need to move it?",
  moveBody: "No problem. Pick a new time yourself, or message us on WhatsApp and we'll sort it.",
  moveLink: "Move or cancel my call",
  calendarLink: "Add to my calendar",
  whatsappLink: "Message us on WhatsApp",
} as const;
