// The WhatsApp line on the home "Book a call" pop-up and the prospectus forms,
// and the version marker those forms send with the lead (extra.wa_consent_copy).
// Leads Central only sends its WhatsApp opener to pop-up/prospectus leads that
// carry the marker, i.e. people who saw this line. /book-call and the quiz have
// always said they'll WhatsApp, so they need no marker.
// No imports so node --test and client components can both load it.
export const WA_CONSENT_COPY_VERSION = "2026-11-20";
export const WA_CONSENT_LINE = "We'll WhatsApp you a quick intro. Reply STOP any time.";

/** A form's `extra` with the marker added. */
export function withWaConsent(extra?: Record<string, unknown>): Record<string, unknown> {
  return { ...(extra ?? {}), wa_consent_copy: WA_CONSENT_COPY_VERSION };
}
