// tests/readableOn.test.mts
//
// The hero price pill on every gym page is filled with the gym's dark accent.
// It used to carry white type regardless, which put white on white for Ebor
// (1.0:1) and white on bright yellow/orange/gold for ATP, Muscle Makers and
// Imperium (1.6–2.5:1). The pill now takes whichever of white or the hero
// background reads better; this pins that choice for every real gym.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contrastRatio, readableOn } from "../app/lib/readableOn.ts";

const BRANDS: Record<string, { darkAccent?: string | null; primaryColor: string; heroBg?: string | null }> = JSON.parse(
  readFileSync(new URL("../scripts/gym-brands.json", import.meta.url), "utf8"),
);

test("contrastRatio matches the WCAG reference values", () => {
  assert.equal(contrastRatio("#FFFFFF", "#000000").toFixed(2), "21.00");
  assert.equal(contrastRatio("#FFFFFF", "#FFFFFF").toFixed(2), "1.00");
  assert.equal(contrastRatio("#FFFFFF", "#BFA25F").toFixed(2), "2.46");
});

test("readableOn picks dark type on a pale fill and white on a dark one", () => {
  assert.equal(readableOn("#FFFFFF", ["#FFFFFF", "#000000"]), "#000000");
  assert.equal(readableOn("#BFA25F", ["#FFFFFF", "#13100B"]), "#13100B");
  assert.equal(readableOn("#ca1413", ["#FFFFFF", "#000000"]), "#FFFFFF");
});

test("every real gym's hero price pill is readable (4.5:1 or better)", () => {
  for (const [slug, b] of Object.entries(BRANDS)) {
    if (slug === "demo") continue;
    const fill = b.darkAccent || b.primaryColor;
    const ink = readableOn(fill, ["#FFFFFF", b.heroBg || "#000000"]);
    assert.ok(contrastRatio(ink, fill) >= 4.5, `${slug}: ${ink} on ${fill} is ${contrastRatio(ink, fill).toFixed(2)}:1`);
  }
});
