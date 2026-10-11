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
  assert.deepEqual(r.body, { ok: true, id: "lead-1", eventId: "ev-1" });
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
