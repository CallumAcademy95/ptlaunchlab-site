import { test } from "node:test";
import assert from "node:assert/strict";
import { adMarkup } from "../scripts/lib/ad-markup.mjs";

const BRAND = { gymName: "Test Gym", primaryColor: "#FF0000", darkAccent: null, heroBg: "#000000", logoHasAlpha: true };
const TEXT = { eyebrow: "TEST ACADEMY", headline: ["LINE ONE", "LINE TWO"], accentLine: "ACCENT.", sub: "Subtitle.", footer: "Footer." };

test("renders every line of copy into the markup", () => {
  const html = adMarkup(BRAND, TEXT, { w: 1080, h: 1080, photo: null, logoUrl: "file:///logo.png" });
  for (const line of ["TEST ACADEMY", "LINE ONE", "LINE TWO", "ACCENT.", "Subtitle.", "Footer."]) {
    assert.ok(html.includes(line), `missing: ${line}`);
  }
});

test("sets the canvas to the size it was asked for", () => {
  const html = adMarkup(BRAND, TEXT, { w: 1080, h: 1920, photo: null, logoUrl: "file:///logo.png" });
  assert.ok(html.includes("width:1080px"), "width not set");
  assert.ok(html.includes("height:1920px"), "height not set");
});

test("omits the photo layer when there is no photo", () => {
  const html = adMarkup(BRAND, TEXT, { w: 1080, h: 1080, photo: null, logoUrl: "file:///logo.png" });
  assert.ok(!html.includes('class="photo"'), "photo layer rendered with no photo");
});
