// tests/crm-wa-ticks.test.mts
// WHAT THIS PROTECTS: the WhatsApp ticks on messages in the CRM conversation.
// Ticks only on WhatsApp messages we sent, read beats delivered, a failure is
// always shown in red with Meta's reason, and an old message with no receipt
// shows nothing rather than a guess.
import { test } from "node:test";
import assert from "node:assert/strict";
import { whatsappTicks } from "../app/admin/(shell)/crm/crm.ts";

const out = (meta: unknown, channel = "whatsapp") => ({ direction: "outbound", channel, status: "sent", meta });

test("read, delivered and sent states", () => {
  assert.equal(whatsappTicks(out({ wa_status: "read", wa_read_at: "2026-11-16T09:12:00Z" }))?.state, "read");
  assert.match(whatsappTicks(out({ wa_status: "read", wa_read_at: "T" }), (i) => `at ${i}`)!.title, /Read at T/);
  assert.equal(whatsappTicks(out({ wa_status: "delivered" }))?.label, "Delivered");
  assert.equal(whatsappTicks(out({ wa_status: "sent" }))?.state, "sent");
});

test("failed shows Meta's reason and code", () => {
  const t = whatsappTicks(out({ wa_status: "failed", wa_error: { code: 131049, title: "Not delivered to maintain ecosystem engagement" } }))!;
  assert.equal(t.state, "failed");
  assert.equal(t.label, "Not delivered");
  assert.match(t.title, /131049/);
});

test("no ticks for inbound, email, or messages without a receipt", () => {
  assert.equal(whatsappTicks({ direction: "inbound", channel: "whatsapp", meta: { wa_status: "read" } }), null);
  assert.equal(whatsappTicks(out({ wa_status: "read" }, "email")), null);
  assert.equal(whatsappTicks(out({ via: "crm_owner" })), null);
  assert.equal(whatsappTicks(out(null)), null);
});
