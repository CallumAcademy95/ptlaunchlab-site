// tests/booking-caller.test.mts
//
// WHAT THIS PROTECTS
// Callum rings booked calls from his mobile, not the WhatsApp business number,
// so every place that tells someone they'll be rung also says which number.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { CALLER_LINE, CALLER_NUMBER } from "../app/lib/booking/callTypes.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const src = (p: string) => readFileSync(join(ROOT, p), "utf8");

test("the caller line names Callum's mobile", () => {
  assert.equal(CALLER_NUMBER, "+44 7822 012186");
  assert.equal(CALLER_LINE, "The call will come from Callum on +44 7822 012186.");
});

test("every 'Callum will ring you' on the booking pages and invite is followed by the caller line", () => {
  for (const f of ["app/book/BookingFlow.tsx", "app/book/ManageBooking.tsx", "app/book/[type]/page.tsx", "app/api/booking/ics/route.ts"]) {
    const s = src(f);
    const rings = s.match(/Callum will ring you[^\n]*/g) ?? [];
    assert.ok(rings.length > 0, `${f} still tells them they'll be rung`);
    for (const line of rings) assert.match(line, /CALLER_LINE/, `${f}: ${line.slice(0, 80)}`);
  }
});
