// tests/callPrep.test.mts
//
// WHAT THIS PROTECTS
// The page someone sees straight after booking a course call (app/book/CallPrep.tsx,
// copy in app/lib/booking/callPrep.ts). It must: show a video only when a usable URL
// is configured (never a broken embed), keep the existing move/cancel and calendar
// links, keep the Career Planner's Schedule tracking, and follow the PTLL copy rules.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { callPrepVideo, moveCallMessage, whatsappMoveHref, PREP_COPY, PRICE_LINE } from "../app/lib/booking/callPrep.ts";
import { CALL_TYPES } from "../app/lib/booking/callTypes.ts";
import { CALLER_DISPLAY, WHATSAPP_LINK } from "../app/lib/contactDetails.ts";

const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const EMBED = (id: string) => `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;

test("callPrepVideo: unset, blank or junk means no video block", () => {
  for (const v of [undefined, null, "", "   ", "not a url", "http://youtu.be/TsOwZ1E2Syg", "https://vimeo.com/123456",
    "https://www.youtube.com/watch?v=short", "https://www.youtube.com/channel/UC123", "https://example.com/page", "javascript:alert(1)"]) {
    assert.equal(callPrepVideo(v as string | undefined), null, String(v));
  }
});

test("callPrepVideo: every YouTube link shape becomes a www.youtube.com embed (the only frame-src the CSP allows)", () => {
  for (const v of ["https://www.youtube.com/watch?v=TsOwZ1E2Syg", "https://youtube.com/watch?v=TsOwZ1E2Syg&t=3s", "https://m.youtube.com/watch?v=TsOwZ1E2Syg",
    "https://youtu.be/TsOwZ1E2Syg", "https://youtu.be/TsOwZ1E2Syg?si=abc", "https://www.youtube.com/shorts/TsOwZ1E2Syg", "https://www.youtube.com/embed/TsOwZ1E2Syg",
    "https://www.youtube-nocookie.com/embed/TsOwZ1E2Syg", "  https://youtu.be/TsOwZ1E2Syg  "]) {
    assert.deepEqual(callPrepVideo(v), { kind: "youtube", src: EMBED("TsOwZ1E2Syg") }, v);
  }
  const csp = src("next.config.ts");
  assert.match(csp, /"frame-src www\.youtube\.com /, "embed host must stay allowed by the CSP");
});

test("callPrepVideo: an https video file plays in a <video> tag", () => {
  assert.deepEqual(callPrepVideo("https://cdn.example.com/prep/callum.mp4"), { kind: "file", src: "https://cdn.example.com/prep/callum.mp4" });
  assert.deepEqual(callPrepVideo("https://x.supabase.co/storage/v1/object/public/v/prep.webm"), { kind: "file", src: "https://x.supabase.co/storage/v1/object/public/v/prep.webm" });
  assert.equal(callPrepVideo("http://cdn.example.com/prep.mp4"), null);
});

test("WhatsApp move link carries only the call time", () => {
  const label = "Tuesday 2 December, 6:30pm";
  assert.equal(moveCallMessage(label), "Hi Callum, I need to move my call on Tuesday 2 December, 6:30pm. Which other times have you got?");
  const href = whatsappMoveHref(WHATSAPP_LINK, label);
  assert.ok(href.startsWith(`${WHATSAPP_LINK}?text=`));
  assert.equal(decodeURIComponent(href.split("?text=")[1]), moveCallMessage(label));
});

function allCopy(): string {
  const parts: string[] = [];
  for (const v of Object.values(PREP_COPY)) {
    if (typeof v === "string") parts.push(v);
    else if (typeof v === "function") parts.push(v("07123 456789"));
    else for (const x of v as readonly unknown[]) parts.push(typeof x === "string" ? x : Object.values(x as object).join(" "));
  }
  return parts.join("\n");
}

test("copy rules: not free, not a consultation, no em dashes, nothing on how payments are taken", () => {
  const copy = allCopy() + "\n" + CALL_TYPES.consultation.title;
  assert.ok(copy.length > 500, "copy was collected");
  assert.doesNotMatch(copy, /\bfree\b/i);
  assert.doesNotMatch(copy, /consultation/i);
  assert.doesNotMatch(copy, /—/);
  assert.doesNotMatch(copy, /gocardless|stripe|direct debit|debit card|credit card|klarna|checkout/i);
  assert.doesNotMatch(copy, /only \d+ (spots|places)|spaces left|hurry|ends (tonight|soon)|limited/i);
  assert.doesNotMatch(copy, /earn|£\d+k|guaranteed (job|income)/i);
});

test("copy: the price is stated plainly, from pricing.ts, with who rings and from which number", () => {
  assert.equal(PRICE_LINE, "£999.99 in full, or £99.99 a month for 10 months.");
  assert.ok(PREP_COPY.agenda.some((a) => a.body === PRICE_LINE));
  assert.match(allCopy(), /If it's not right for you, I'll tell you/);
  assert.equal(PREP_COPY.whoLine("07123 456789"), `Callum will ring you on 07123 456789 from ${CALLER_DISPLAY}.`);
  assert.equal(CALLER_DISPLAY, "07822 012186");
  assert.match(PREP_COPY.agendaIntro, /15 to 20 minutes/);
});

test("wiring: course bookings show CallPrep; the gym partner card, calendar and move links stay", () => {
  const flow = src("app/book/BookingFlow.tsx");
  assert.match(flow, /if \(callType === "consultation"\) return <CallPrep label=\{done\.label\} phone=\{done\.phone\} manageUrl=\{done\.manageUrl\} \/>;/);
  assert.match(flow, /onBooked\?\.\(\{ label: r\.label \}\)/, "the Career Planner's Schedule event still fires");
  assert.match(flow, /Move or cancel/, "gym partner card unchanged");
  const prep = src("app/book/CallPrep.tsx");
  assert.match(prep, /href=\{`\/api\/booking\/ics\?token=\$\{manageToken\}`\}/);
  assert.match(prep, /href=\{manageUrl\}/);
  assert.match(prep, /\{VIDEO && \(/, "no video block unless one is configured");
  assert.match(prep, /callPrepVideo\(process\.env\.NEXT_PUBLIC_CALL_PREP_VIDEO_URL\)/, "literal env read so Next inlines it");
  assert.match(prep, /referrerPolicy="strict-origin"/, "YouTube needs a referrer; /book sends none by default");
  const planner = src("app/career-planner/NextStep.tsx");
  assert.match(planner, /window\.fbq\("track", "Schedule"/);
});
