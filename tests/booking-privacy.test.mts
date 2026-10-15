// tests/booking-privacy.test.mts
//
// WHAT THIS PROTECTS
// Booking links carry secrets: ?t= (signed lead link) and /book/manage/<token>.
// GA4, the Meta Pixel and Clarity never load or fire on /book/*, and Vercel
// Analytics only ever sees a scrubbed URL. Layout guards are source checks.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isBookingPath, scrubBookingUrl, BOOKING_PATH_RE_SRC } from "../app/lib/booking/privacy.ts";

test("isBookingPath: /book and everything under it, nothing else", () => {
  for (const p of ["/book", "/book/", "/book/consultation", "/book/gym-partner", "/book/manage/abc123"]) assert.equal(isBookingPath(p), true, p);
  for (const p of ["/", "/book-call", "/booking", "/bookings/x", "/admin/crm/calls", "", null]) assert.equal(isBookingPath(p), false, String(p));
});

test("scrubBookingUrl: drops ?t= and masks the manage token, leaves other pages alone", () => {
  assert.equal(scrubBookingUrl("https://ptlaunchlab.co.uk/book/consultation?t=abc.def&utm_source=wa"), "https://ptlaunchlab.co.uk/book/consultation?utm_source=wa");
  assert.equal(scrubBookingUrl("https://ptlaunchlab.co.uk/book/consultation?t=abc"), "https://ptlaunchlab.co.uk/book/consultation");
  assert.equal(scrubBookingUrl("https://ptlaunchlab.co.uk/book/manage/SECRETTOKEN"), "https://ptlaunchlab.co.uk/book/manage/[token]");
  assert.equal(scrubBookingUrl("https://ptlaunchlab.co.uk/quiz?t=keep"), "https://ptlaunchlab.co.uk/quiz?t=keep");
  assert.equal(scrubBookingUrl("not a url"), "not a url");
});

const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
// The layout's inline scripts can't import, so they use this plain-string test;
// it must agree with isBookingPath.
const ON_BOOK = "var p=location.pathname;return p==='/book'||p.indexOf('/book/')===0;";
test("layout: every tag script uses the same /book test, which agrees with isBookingPath", () => {
  assert.equal(BOOKING_PATH_RE_SRC, String.raw`^\/book(\/|$)`);
  const inline = new Function("location", ON_BOOK) as (l: { pathname: string }) => boolean;
  for (const p of ["/", "/book", "/book/", "/book/x", "/book-call", "/booking", "/book/manage/abc"]) assert.equal(inline({ pathname: p }), isBookingPath(p), p);
  assert.equal(layout.split(ON_BOOK).length - 1, 3, "GA, Clarity and Pixel scripts each carry it");
});
test("layout: GA config is never queued on /book (start function gated at parse time)", () => {
  const ga = layout.slice(layout.indexOf("window.__ptllStartGa=function"), layout.indexOf("function loadGa"));
  assert.match(ga, /g\('config','G-90W2KGSL55'/);
  assert.match(layout, /var off=onBook\(\);\s*window\['ga-disable-G-90W2KGSL55'\]=off;/);
  assert.match(layout, /if\(!off\) window\.__ptllStartGa\(\);/);
});
test("layout: Pixel and Clarity loaders refuse /book", () => {
  const px = layout.slice(layout.indexOf("window.__ptllLoadPixel=function"), layout.indexOf("fbevents.js"));
  assert.match(px, /if\(onBook\(\)\) return;/);
  const cl = layout.slice(layout.indexOf("window.__ptllLoadClarity=function"), layout.indexOf("cookieyes_consent_update", layout.indexOf("window.__ptllLoadClarity=function")));
  assert.match(cl, /if\(onBook\(\)\) return;/);
});
test("Tracking: no Pixel PageView on /book; route guard re-enables tags off /book", () => {
  const t = readFileSync(new URL("../app/components/Tracking.tsx", import.meta.url), "utf8");
  assert.match(t, /if \(isBookingPath\(pathname\)\) return;/);
  assert.match(t, /\["ga-disable-G-90W2KGSL55"\] = off/);
  assert.match(t, /__ptllStartGa/);
});
test("BookingFlow strips t from the address bar after mount", () => {
  const f = readFileSync(new URL("../app/book/BookingFlow.tsx", import.meta.url), "utf8");
  assert.match(f, /searchParams\.delete\("t"\)/);
  assert.match(f, /history\.replaceState/);
});
