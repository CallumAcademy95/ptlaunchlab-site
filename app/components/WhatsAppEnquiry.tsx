"use client";

import LeadForm from "@/app/components/LeadForm";
import { WHATSAPP_LINK } from "@/app/lib/contactDetails";
import { whatsAppMessage, whatsAppUrl } from "@/app/lib/whatsappMessage";

// ─────────────────────────────────────────────────────────────────────────────
// WhatsAppEnquiry — save first, then open WhatsApp.
// The enquiry is saved through /api/lead (intent "whatsapp") so it is never
// lost if the visitor doesn't press send in WhatsApp. On success it opens the
// visitor's WhatsApp addressed to the Cloud-API line, so the message also lands
// in Leads Central. The Pixel Lead fires from submitLead, after the save.
// ─────────────────────────────────────────────────────────────────────────────

const INTERESTS = [
  "Changing career into PT",
  "Getting started / gym enthusiast",
  "Already in fitness",
  "Gym partnership (I own/run a gym)",
  "Not sure yet",
];

function openWhatsApp(text: string) {
  const url = whatsAppUrl(WHATSAPP_LINK, text);
  // Opened after an await, so a popup blocker may refuse a new tab: fall back to this tab.
  // (No "noopener" feature: with it window.open always returns null.)
  const w = window.open(url, "_blank");
  if (w) w.opener = null;
  else window.location.href = url;
}

export default function WhatsAppEnquiry() {
  return (
    <div>
      <LeadForm
        intent="whatsapp"
        source="whatsapp-page"
        tone="dark"
        question={{ label: "What's it about? (optional)", options: INTERESTS, required: false }}
        submitLabel="Message us on WhatsApp"
        successMessage="Opening WhatsApp with your details ready to send. If it didn't open, message us on WhatsApp directly."
        onSuccess={(_r, v) => openWhatsApp(whatsAppMessage({ name: v.name, email: v.email, phone: v.phone, interest: v.question }))}
        footnote="Opens WhatsApp with your details ready to send — a real person replies, usually within a few hours."
      />
    </div>
  );
}
