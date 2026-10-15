import { test } from "node:test";
import assert from "node:assert/strict";
import { validateLead, processLead, SETTER_INTENTS, type LeadDeps } from "../app/lib/leads.ts";

const GOOD = { name: "Jane Smith", phone: "07700 900123", email: "Jane@Example.com", intent: "call", source: "home-hero", pagePath: "/" };

function fakeDeps(over: Partial<LeadDeps> = {}) {
  const log: string[] = [];
  const updates: Record<string, unknown>[] = [];
  const deps: LeadDeps = {
    insert: async (row) => { log.push("insert"); assert.ok(row.event_id); return { id: "lead-1" }; },
    update: async (_id, patch) => { updates.push(patch); },
    push: async () => { log.push("push"); return { sent: 1 }; },
    setter: async () => { log.push("setter"); },
    zapier: async () => { log.push("zapier"); return "ok"; },
    mailerlite: async () => { log.push("mailerlite"); return "skipped"; },
    capi: async () => { log.push("capi"); return "ok"; },
    newEventId: () => "ev-1",
    ...over,
  };
  return { deps, log, updates };
}

test("validation: name, UK phone and email required; email lower-cased", () => {
  const r = validateLead(GOOD);
  assert.equal(r.ok, true);
  if (r.ok) { assert.equal(r.lead.email, "jane@example.com"); assert.equal(r.lead.phone, "07700900123"); }
  assert.deepEqual(validateLead({ ...GOOD, phone: "" }), { ok: false, field: "phone", message: "Enter a UK phone number." });
  assert.equal(validateLead({ ...GOOD, phone: "12345" }).ok, false);
  assert.equal(validateLead({ ...GOOD, email: "nope" }).ok, false);
  assert.equal(validateLead({ ...GOOD, name: " " }).ok, false);
  assert.equal(validateLead({ ...GOOD, intent: "hack" }).ok, false);
  assert.equal(validateLead({ ...GOOD, phone: "+44 7700 900123" }).ok, true);
});

test("checkout_start does not need a phone", () => {
  assert.equal(validateLead({ ...GOOD, intent: "checkout_start", phone: "" }).ok, true);
});

test("a valid lead is saved before any side effect, then the rest run in after()", async () => {
  const { deps, log, updates } = fakeDeps();
  const r = await processLead({ ...GOOD, intent: "contact" }, deps);
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { ok: true, id: "lead-1", eventId: "ev-1", track: true });
  assert.deepEqual(log, ["insert"], "nothing but the insert before the response");
  await r.after!();
  assert.equal(log[0], "insert");
  assert.ok(log.includes("push") && log.includes("setter") && log.includes("zapier") && log.includes("capi"));
  assert.ok(updates.some((u) => u.push_status === "ok"));
});

test("an insert failure pushes the lead's details and returns 500", async () => {
  const pushed: { title: string; body?: string }[] = [];
  const { deps } = fakeDeps({ insert: async () => ({ error: "db down" }), push: async (p) => { pushed.push(p); return { sent: 1 }; } });
  const r = await processLead(GOOD, deps);
  assert.equal(r.status, 500);
  assert.equal(r.body.ok, false);
  assert.match(pushed[0].title, /NOT SAVED/);
  assert.match(pushed[0].body ?? "", /07700900123/);
});

test("validation failure saves nothing", async () => {
  const { deps, log } = fakeDeps();
  const r = await processLead({ ...GOOD, email: "x" }, deps);
  assert.equal(r.status, 400);
  assert.deepEqual(log, []);
});

test("honeypot and TEST leads are saved but never pushed", async () => {
  for (const raw of [{ ...GOOD, honeypot: "bot" }, { ...GOOD, name: "TEST Jane" }]) {
    const { deps, log } = fakeDeps();
    const r = await processLead(raw, deps);
    assert.equal(r.status, 200);
    await r.after!();
    assert.ok(log.includes("insert"));
    assert.ok(!log.includes("push"), JSON.stringify(raw));
  }
});

test("the setter is called only for contact, prospectus and quiz, with today's payload", async () => {
  assert.deepEqual([...SETTER_INTENTS].sort(), ["contact", "prospectus", "quiz"]);
  const seen: unknown[] = [];
  for (const intent of ["call", "contact", "prospectus", "quiz", "gym_callback", "whatsapp"]) {
    const { deps } = fakeDeps({ setter: async (l) => { seen.push(l); } });
    const r = await processLead({ ...GOOD, intent, question: "hi" }, deps);
    await r.after!();
  }
  assert.deepEqual(seen, [
    { name: "Jane Smith", email: "jane@example.com", message: "hi", source: "contact" },
    { name: "Jane Smith", email: "jane@example.com", source: "prospectus" },
    { name: "Jane Smith", email: "jane@example.com", source: "quiz" },
  ]);
});

test("one failing side effect doesn't stop the others", async () => {
  const { deps, log, updates } = fakeDeps({ zapier: async () => { throw new Error("zap down"); } });
  const r = await processLead({ ...GOOD, intent: "contact" }, deps);
  await r.after!();
  assert.ok(log.includes("push") && log.includes("capi") && log.includes("setter"));
  assert.ok(updates.some((u) => String(u.zapier_status).startsWith("failed")));
});

test("UK phone written forms: +44 (0), 0044 (0) and brackets are accepted", () => {
  const cases: [string, string][] = [
    ["+44 (0)7700 900123", "07700900123"],
    ["0044 (0) 7700 900123", "07700900123"],
    ["(01977) 285014", "01977285014"],
  ];
  for (const [phone, want] of cases) {
    const r = validateLead({ ...GOOD, phone });
    assert.equal(r.ok, true, phone);
    if (r.ok) assert.equal(r.lead.phone, want, phone);
  }
});

test("UK phone length: mobiles must be 11 digits, landlines 10 or 11", () => {
  assert.equal(validateLead({ ...GOOD, phone: "0770090012" }).ok, false);
  assert.deepEqual(validateLead({ ...GOOD, phone: "0770090012" }), { ok: false, field: "phone", message: "Enter a UK phone number." });
  const landline = validateLead({ ...GOOD, phone: "01977285014" });
  assert.equal(landline.ok, true);
});

test("insert throwing (not returning an error) returns 500 and pushes NOT SAVED", async () => {
  const pushed: { title: string; body?: string }[] = [];
  const { deps } = fakeDeps({
    insert: async () => { throw new Error("db exploded"); },
    push: async (p) => { pushed.push(p); return { sent: 1 }; },
  });
  const r = await processLead(GOOD, deps);
  assert.equal(r.status, 500);
  assert.equal(r.body.ok, false);
  assert.equal(pushed.length, 1);
  assert.match(pushed[0].title, /NOT SAVED/);
});

test("a spam lead whose insert fails pushes nothing", async () => {
  let pushes = 0;
  const { deps } = fakeDeps({
    insert: async () => ({ error: "db down" }),
    push: async () => { pushes++; return { sent: 1 }; },
  });
  const r = await processLead({ ...GOOD, honeypot: "bot" }, deps);
  assert.equal(r.status, 500);
  assert.equal(pushes, 0);
});

test("setter throwing records setter_status as failed", async () => {
  const { deps, updates } = fakeDeps({ setter: async () => { throw new Error("setter down"); } });
  const r = await processLead({ ...GOOD, intent: "contact" }, deps);
  await r.after!();
  assert.ok(updates.some((u) => String(u.setter_status).startsWith("failed")));
});

test("a TEST lead never reaches setter, zapier or capi, and their statuses are skipped", async () => {
  const { deps, log, updates } = fakeDeps();
  const r = await processLead({ ...GOOD, intent: "contact", name: "TEST Jane" }, deps);
  await r.after!();
  assert.ok(!log.includes("setter"), "setter called");
  assert.ok(!log.includes("zapier"), "zapier called");
  assert.ok(!log.includes("capi"), "capi called");
  assert.ok(!log.includes("mailerlite"), "mailerlite called");
  assert.ok(updates.some((u) => u.setter_status === "skipped"));
  assert.ok(updates.some((u) => u.zapier_status === "skipped"));
  assert.ok(updates.some((u) => u.mailerlite_status === "skipped"));
  assert.ok(updates.some((u) => u.capi_status === "skipped"));
});

test("a spam lead never pushes or reaches setter, zapier or capi", async () => {
  const { deps, log } = fakeDeps();
  const r = await processLead({ ...GOOD, intent: "contact", honeypot: "bot" }, deps);
  await r.after!();
  assert.ok(log.includes("insert"));
  assert.ok(!log.includes("push"), "push called");
  assert.ok(!log.includes("setter"), "setter called");
  assert.ok(!log.includes("zapier"), "zapier called");
  assert.ok(!log.includes("capi"), "capi called");
});

// ---- final review fixes ----
import { capJson, JSON_FIELD_MAX, pushTone, pushStatus } from "../app/lib/leads.ts";
import { spamReasonFor, type SpamValidators } from "../app/lib/leadSpam.ts";
import { checkHoneypot } from "../app/lib/security/honeypot.ts";
import { validateName, validateBusinessName } from "../app/lib/security/name.ts";

// email.ts needs a JSON import attribute node --test can't supply; this stand-in
// mirrors its role and disposable rules for the cases used here. The real
// function is wired in app/api/lead/route.ts.
const ROLE = new Set(["admin", "info", "support", "test", "noreply"]);
const fakeEmail: SpamValidators["validateEmail"] = (e, opts = {}) => {
  const [local, domain] = String(e).toLowerCase().split("@");
  if (domain === "mailinator.com") return { ok: false, reason: "disposable" };
  if (!opts.allowRole && ROLE.has(local)) return { ok: false, reason: "role" };
  return { ok: true };
};
const V: SpamValidators = {
  checkHoneypot: (s) => checkHoneypot(s),
  gymPartnershipSec: (raw) => {
    const hp = (raw as { _sec?: { hp?: unknown } })?._sec?.hp;
    return typeof hp === "string" && hp ? { ok: false, reason: "honeypot" } : { ok: true };
  },
  validateName: (n) => validateName(n),
  validateBusinessName,
  validateEmail: fakeEmail,
};
const SEC = { hp: "", t: 5000, n: "abcd1234efgh" };

test("spam gates: each intent runs exactly its legacy checks", () => {
  const base = { ...GOOD, intent: "contact", _sec: SEC };
  assert.equal(spamReasonFor(base, V), null);
  assert.equal(spamReasonFor({ ...base, _sec: undefined }, V), "sec:missing");
  assert.equal(spamReasonFor({ ...base, _sec: { ...SEC, n: "" } }, V), "sec:no-js");
  assert.equal(spamReasonFor({ ...base, _sec: { ...SEC, t: 200 } }, V), "sec:too-fast");
  assert.equal(spamReasonFor({ ...base, _sec: { ...SEC, hp: "x" } }, V), "sec:honeypot");
  assert.equal(spamReasonFor({ ...base, name: "Win cash t.me/abc" }, V), "name:url");
  assert.equal(spamReasonFor({ ...base, name: "http://spam" }, V), "name:url");
  assert.equal(spamReasonFor({ ...base, email: "x@mailinator.com" }, V), "email:disposable");
  assert.equal(spamReasonFor({ ...base, email: "info@gym.co.uk" }, V), "email:role");
  for (const intent of ["prospectus", "quiz", "live", "gym_callback"]) {
    assert.equal(spamReasonFor({ ...base, intent }, V), null, intent);
    assert.equal(spamReasonFor({ ...base, intent, _sec: undefined }, V), "sec:missing", intent);
  }
  // Legacy call / salary / WhatsApp had no gates: still none.
  for (const intent of ["call", "salary", "whatsapp", "checkout_start"]) {
    assert.equal(spamReasonFor({ ...base, intent, _sec: undefined, email: "x@mailinator.com" }, V), null, intent);
  }
});

test("spam gates: gym_partnership is honeypot-only and allows role emails, like /api/gym-partnership", () => {
  const p = { ...GOOD, intent: "gym_partnership", email: "info@ironwolf.co.uk", extra: { gymName: "F45" } };
  assert.equal(spamReasonFor(p, V), null, "no _sec, fast or no-js is fine; info@ is fine; F45 is a real gym");
  assert.equal(spamReasonFor({ ...p, _sec: { hp: "x" } }, V), "sec:honeypot");
  assert.equal(spamReasonFor({ ...p, extra: { gymName: "www.spam.com" } }, V), "gym:url");
  assert.equal(spamReasonFor({ ...p, email: "a@mailinator.com" }, V), "email:disposable");
});

test("a spam-gate hit saves the lead with is_spam and spamReason, sends nothing external, track:false", async () => {
  const rows: Record<string, unknown>[] = [];
  const { deps, log } = fakeDeps({
    insert: async (row) => { rows.push(row as unknown as Record<string, unknown>); log.push("insert"); return { id: "lead-1" }; },
    spamCheck: (raw) => spamReasonFor(raw, V),
  });
  const r = await processLead({ ...GOOD, intent: "contact", question: "hi", email: "x@mailinator.com", _sec: SEC }, deps);
  assert.equal(r.status, 200);
  assert.equal((r.body as { track?: boolean }).track, false);
  await r.after!();
  assert.equal(rows[0].is_spam, true);
  assert.equal((rows[0].extra as Record<string, unknown>).spamReason, "email:disposable");
  assert.deepEqual(log, ["insert"], "no push, setter, zapier, mailerlite or capi");
});

test("a clean lead passes the spam gate and runs everything; a TEST lead returns track:false", async () => {
  const { deps, log } = fakeDeps({ spamCheck: (raw) => spamReasonFor(raw, V) });
  const r = await processLead({ ...GOOD, intent: "contact", question: "hi", _sec: SEC }, deps);
  assert.equal((r.body as { track?: boolean }).track, true);
  await r.after!();
  assert.deepEqual(log, ["insert", "push", "setter", "zapier", "mailerlite", "capi"]);
  const t = await processLead({ ...GOOD, name: "TEST Jane", _sec: SEC }, fakeDeps({ spamCheck: (raw) => spamReasonFor(raw, V) }).deps);
  assert.equal((t.body as { track?: boolean }).track, false);
});

test("a throwing spam check never loses the lead", async () => {
  const { deps, log } = fakeDeps({ spamCheck: () => { throw new Error("boom"); } });
  const r = await processLead({ ...GOOD, intent: "contact" }, deps);
  assert.equal(r.status, 200);
  await r.after!();
  assert.ok(log.includes("zapier"));
});

test("extra and utm over 8 KB are replaced by { truncated: true }, never rejected", () => {
  const big = { blob: "x".repeat(JSON_FIELD_MAX) };
  const r = validateLead({ ...GOOD, extra: big, utm: big });
  assert.equal(r.ok, true);
  if (r.ok) { assert.deepEqual(r.lead.extra, { truncated: true }); assert.deepEqual(r.lead.utm, { truncated: true }); }
  const small = validateLead({ ...GOOD, extra: { a: 1 }, utm: { fts: "fb" } });
  if (small.ok) { assert.deepEqual(small.lead.extra, { a: 1 }); assert.deepEqual(small.lead.utm, { fts: "fb" }); }
  assert.deepEqual(capJson({ a: "y".repeat(JSON_FIELD_MAX - 20) }), { a: "y".repeat(JSON_FIELD_MAX - 20) });
});

test("contact always sends the setter a message, even an empty one, as /api/contact did", async () => {
  const seen: unknown[] = [];
  const { deps } = fakeDeps({ setter: async (l) => { seen.push(l); } });
  const r = await processLead({ ...GOOD, intent: "contact" }, deps);
  await r.after!();
  assert.deepEqual(seen, [{ name: "Jane Smith", email: "jane@example.com", message: "", source: "contact" }]);
});

test("gym_partnership: any valid phone (validateAnyPhone) and gymName required", () => {
  const P = { ...GOOD, intent: "gym_partnership", extra: { gymName: "Iron Wolf" } };
  const uk = validateLead(P);
  assert.equal(uk.ok && uk.lead.phone, "07700900123", "UK numbers keep the national form");
  const ie = validateLead({ ...P, phone: "+353 87 123 4567" });
  assert.equal(ie.ok && ie.lead.phone, "+353871234567");
  const us = validateLead({ ...P, phone: "+1 (415) 555-0100" });
  assert.equal(us.ok && us.lead.phone, "+14155550100");
  assert.deepEqual(validateLead({ ...P, phone: "abc" }), { ok: false, field: "phone", message: "Enter a valid phone number." });
  assert.deepEqual(validateLead({ ...P, extra: {} }), { ok: false, field: "gymName", message: "Enter your gym's name." });
  assert.deepEqual(validateLead({ ...P, extra: { gymName: " " } }), { ok: false, field: "gymName", message: "Enter your gym's name." });
  // Other intents still need a UK number.
  assert.equal(validateLead({ ...GOOD, phone: "+353 87 123 4567" }).ok, false);
});

test("push badge colours match the real push_status values", () => {
  assert.equal(pushTone(pushStatus({ sent: 1 })), "green");
  assert.equal(pushTone(pushStatus({ sent: 0 })), "red");
  assert.equal(pushTone(pushStatus({ sent: 0, error: "x" })), "red");
  assert.equal(pushTone("skipped"), "neutral");
  assert.equal(pushTone(null), "neutral");
});

test("extra.stage: the 3 known codes are kept, anything else is dropped, absent is fine", () => {
  for (const code of ["curious", "training_others", "ready_3m"]) {
    const r = validateLead({ ...GOOD, intent: "prospectus", extra: { stage: code, fastSubmit: true } });
    assert.equal(r.ok, true);
    if (r.ok) assert.deepEqual(r.lead.extra, { stage: code, fastSubmit: true });
  }
  for (const bad of ["Curious", "ready", "", 3, null, ["curious"], { a: 1 }]) {
    const r = validateLead({ ...GOOD, intent: "prospectus", extra: { stage: bad, keep: 1 } });
    assert.equal(r.ok, true);
    if (r.ok) assert.deepEqual(r.lead.extra, { keep: 1 });
  }
  const none = validateLead({ ...GOOD, intent: "prospectus" });
  assert.equal(none.ok, true);
  if (none.ok) assert.deepEqual(none.lead.extra, {});
});
