// The prefilled WhatsApp enquiry text, as WhatsAppEnquiry composed it before the
// save-first change. No imports so node --test can load it.

export function whatsAppMessage(v: { name: string; email: string; phone: string; interest?: string }): string {
  return (
    `*New PT Launch Lab enquiry*\n\n` +
    `Name: ${v.name}\n` +
    `Email: ${v.email}\n` +
    `Phone: ${v.phone}\n` +
    `Interested in: ${v.interest?.trim() || "Not sure yet"}`
  );
}

export function whatsAppUrl(link: string, text: string): string {
  return `${link}?text=${encodeURIComponent(text)}`;
}
