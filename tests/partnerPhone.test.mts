// tests/partnerPhone.test.mts
//
// WHAT THIS PROTECTS
//
// Being able to reach a partner, and knowing honestly whether you can.
//
// On 2026-10-06 the question "do we have the gym partners' mobile numbers?"
// could not be answered from the partner records at all: pp_partners has no
// phone column, so three numbers had to be reconstructed by matching back to
// scraped prospect data. Of those three — 01904 611070, 0117 935 3414 and
// 07828 594328 — only one was a mobile, and nothing anywhere said so.
//
// That distinction is the whole point. WhatsApp needs a mobile in E.164 without
// the plus; hand it a landline, or hand it "07828 594328" with the space in,
// and it fails in a way that reads as an outage rather than as a bad number.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normaliseUkPhone,
  isUkMobile,
  toWhatsAppNumber,
  formatUkPhone,
  phoneKind,
  normaliseInstagram,
} from "../app/admin/(shell)/partners/phone.ts";

test("the formats people actually type all reach the same number", () => {
  for (const written of [
    "07828 594328",
    "07828594328",
    "+447828594328",
    "+44 7828 594328",
    "0044 7828 594328",
    "447828594328",
    "(07828) 594328",
    "07828-594328",
  ]) {
    assert.equal(normaliseUkPhone(written), "07828594328", `failed on "${written}"`);
  }
});

test("the three real partner numbers are classified correctly", () => {
  // The actual data behind the question that prompted this.
  assert.equal(phoneKind("07828 594328"), "mobile", "6fit Gyms");
  assert.equal(phoneKind("01904 611070"), "landline", "Ebor Fitness, York");
  assert.equal(phoneKind("0117 935 3414"), "landline", "Ministry of Fitness, Bristol");
});

test("WhatsApp gets the number in the only shape its API accepts", () => {
  assert.equal(toWhatsAppNumber("07828 594328"), "447828594328");
  assert.equal(toWhatsAppNumber("+44 7828 594328"), "447828594328");
});

test("a landline never produces a WhatsApp number", () => {
  // Sending to one fails at the API and reads as an outage. Better to have
  // nothing to send to than something that cannot work.
  assert.equal(toWhatsAppNumber("01904 611070"), null);
  assert.equal(toWhatsAppNumber("0117 935 3414"), null);
});

test("070 is not a mobile however much it looks like one", () => {
  // Personal numbering. It forwards, it costs the caller a fortune, and it
  // will not take WhatsApp. Nothing about the digits says so.
  assert.equal(isUkMobile("07012 345678"), false);
  assert.equal(phoneKind("07012 345678"), "landline");
  assert.equal(toWhatsAppNumber("07012 345678"), null);
});

test("076 is pagers, except the Isle of Man", () => {
  assert.equal(isUkMobile("07612 345678"), false, "pager range");
  assert.equal(isUkMobile("07624 123456"), true, "Isle of Man mobile");
});

test("the ordinary mobile ranges are all accepted", () => {
  for (const prefix of ["071", "072", "073", "074", "075", "077", "078", "079"]) {
    assert.equal(isUkMobile(`${prefix}12345678`), true, `${prefix} should be a mobile`);
  }
});

test("rubbish is called rubbish rather than stored as a number", () => {
  for (const junk of ["", "   ", "not a phone", "12345", "0", "+1 555 0100", "9999999999999"]) {
    assert.equal(normaliseUkPhone(junk), null, `"${junk}" must not normalise`);
    assert.equal(isUkMobile(junk), false);
  }
  assert.equal(phoneKind(""), "none", "empty is absent, not invalid");
  assert.equal(phoneKind("not a phone"), "invalid", "typed and wrong is worth flagging");
});

test("a bare 44 prefix is only dropped when it is a country code", () => {
  // "441234 567890" would be an Oxford landline if the 44 were not a prefix,
  // so the rule only fires when removing it leaves a valid UK number.
  assert.equal(normaliseUkPhone("447828594328"), "07828594328");
  assert.equal(normaliseUkPhone("01442 123456"), "01442123456", "Hemel, untouched");
});

test("a number comes back out readable", () => {
  assert.equal(formatUkPhone("07828594328"), "07828 594328");
  assert.equal(formatUkPhone("+447828594328"), "07828 594328");
  assert.equal(formatUkPhone("rubbish"), null);
});

test("an Instagram handle survives however it was pasted", () => {
  for (const pasted of [
    "6fitgym",
    "@6fitgym",
    "instagram.com/6fitgym",
    "https://www.instagram.com/6fitgym",
    "https://instagram.com/6fitgym/",
    "https://www.instagram.com/6fitgym/?hl=en-gb",
    "  @6FitGym  ",
  ]) {
    assert.equal(normaliseInstagram(pasted), "6fitgym", `failed on "${pasted}"`);
  }
});

test("something that is not a handle is refused", () => {
  assert.equal(normaliseInstagram(""), null);
  assert.equal(normaliseInstagram("two words"), null);
  assert.equal(normaliseInstagram("a".repeat(31)), null, "over Instagram's 30-character limit");
});
