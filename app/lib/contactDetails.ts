/**
 * Single source of truth for the public phone number.
 *
 * Change PHONE_NATIONAL and nothing else. The tel: and schema.org forms are
 * derived from it, so the page and the LocalBusiness JSON-LD cannot drift
 * apart — a mismatch there weakens the local listing, and Google cross-checks
 * the two.
 *
 * History: the old landline (01977 365001) went dead in August 2026 while
 * hardcoded in 16 files, including Stripe receipts, enrolment PDFs and the
 * partner bank-change fraud warning. Hence this file.
 *
 * Covers UK numbers grouped 5+6 (07xxx xxxxxx mobiles, 01977 xxxxxx and most
 * other 5-digit area codes). A 3- or 4-digit area code such as 020 or 0113
 * would need the grouping in PHONE_SCHEMA revisited.
 *
 * Two places are NOT wired to this file and need updating by hand, because
 * they are standalone and cannot import it:
 *   - scripts/announce-partner-portal.mts
 *   - scripts/partner-backlink-email.html
 * Everything else in app/ derives from here. Also update the Google Business
 * Profile, which is the source of truth Google cross-checks the site against.
 */

/** National format, exactly as printed on the site. The one line to change. */
export const PHONE_NATIONAL = "01977 285014";

/** E.164, for href="tel:" — dials correctly from outside the UK. */
export const PHONE_TEL = `+44${PHONE_NATIONAL.replace(/\s/g, "").replace(/^0/, "")}`;

/** Spaced international form, for schema.org `telephone`. */
export const PHONE_SCHEMA = PHONE_TEL.replace(/^(\+44)(\d{4})(\d{6})$/, "$1 $2 $3");

/**
 * WhatsApp number — deliberately SEPARATE from PHONE_NATIONAL.
 *
 * These two are the same today, but they diverge the moment the 01977 landline
 * goes live: a geographic landline cannot receive WhatsApp. Do not collapse
 * them into one constant, and do not update these when the landline changes.
 */
export const WHATSAPP_DISPLAY = "+44 7822 012186";
export const WHATSAPP_LINK = "https://wa.me/447822012186";

/** Public contact inbox, repeated in the same templates as the phone. */
export const CONTACT_EMAIL = "info@ptlaunchlab.co.uk";

/** Registered trading address, as printed in email and PDF footers. */
export const ADDRESS_ONE_LINE =
  "Unit 3, Royals Business Park, Pontefract WF8 4AH";
