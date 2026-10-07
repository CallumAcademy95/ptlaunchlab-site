// tests/interviewGuarantee.test.mts
//
// WHAT THIS PROTECTS
//
// The site promised "a guaranteed gym interview" in 60 places, including the
// Organization schema, the terms of service and the sales agent's script.
// An interview is the gym's decision. The current partnership agreement
// (v3.0) puts no interview obligation on any gym: clause 7.1 disclaims an
// employment relationship, and employing a learner is written as "an
// intended outcome" — permitted, not required. The old v1.0 WAS the
// "guaranteed interview" agreement and has been replaced.
//
// What PT Launch Lab can honour unilaterally is the introduction: approach a
// gym on the learner's behalf. That is what the copy now promises.
//
// This test fails if the interview promise comes back. It is deliberately
// broad, because the clean-up needed four passes — the first grep was
// case-sensitive and matched one phrase, and each later sweep found wordings
// the previous one had missed ("we arrange at least one interview",
// "Interview guarantee on qualifying", "warm-introduction interviews").
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}

// The one file allowed to say it: the agreement module's header comment
// records why the v1.0 wording caused a problem, and deleting that history
// would invite the mistake again.
const ALLOWED = ["partnershipAgreement.ts"];

// Phrasings that promise PT Launch Lab will DELIVER an interview.
const FORBIDDEN: [RegExp, string][] = [
  // Only qualifiers may sit between the two words, so "what we cannot
  // guarantee IS THE interview" — which is the correct copy — does not trip.
  [
    /guarantee[ds]?\s+(?:a |an |the |your |gym |warm[- ]introduction |first )*interview/i,
    "guarantees an interview",
  ],
  [/interview\s+guarantee/i, "calls it an interview guarantee"],
  [/arrange[sd]?\s+(\w+\s+){0,4}interview/i, "promises to arrange an interview"],
  [/warm-introduction\s+interview/i, "warm-introduction interview"],
  [/interview\s+access/i, "promises interview access"],
  // The same promise in the passive, which the active-voice pattern above
  // missed on every partner page: "at least one interview is arranged for
  // you", "At least one interview arranged on qualifying".
  [/interviews?\s+(?:is |are |will be |gets? |being )?arranged/i, "promises an interview will be arranged"],
];

test("nothing on the site promises to deliver a gym interview", () => {
  const offenders: string[] = [];
  for (const file of walk("app")) {
    if (ALLOWED.some((a) => file.endsWith(a))) continue;
    const src = readFileSync(file, "utf8");
    for (const [re, why] of FORBIDDEN) {
      const m = src.match(re);
      if (m) offenders.push(`${file.replace(/\\/g, "/")} — ${why}: "${m[0]}"`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `the interview promise is back:\n  ${offenders.join("\n  ")}\n\nPromise the introduction, which is ours to make. The interview is the gym's decision.`,
  );
});

test("the terms still guarantee something concrete", () => {
  // Softening must not become promising nothing — the introduction is a real
  // commitment and the terms should still carry it.
  const terms = readFileSync(join("app", "terms", "page.tsx"), "utf8");
  assert.match(terms, /Introduction Guarantee/i, "the guarantee clause has gone missing");
  assert.match(
    terms,
    /approach at least one gym on your behalf/i,
    "the terms no longer say what PT Launch Lab will actually do",
  );
});

test("the agreement module keeps its historical note", () => {
  const agreement = readFileSync(join("app", "lib", "partnershipAgreement.ts"), "utf8");
  assert.match(
    agreement,
    /"guaranteed interview" agreement/,
    "the note explaining why v1.0 caused a problem has been deleted",
  );
});
