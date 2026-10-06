// UK phone numbers, stored once and read in every format we need.
//
// WHY THIS IS NOT JUST A TEXT COLUMN
//
// The reason to hold a partner's number at all is to reach them, and the two
// channels that matter need different things from it:
//
//   - WhatsApp's Send API wants E.164 WITHOUT the plus: 447828594328. Hand it
//     "07828 594328" and it fails, or worse, sends nowhere quietly.
//   - Whether WhatsApp is possible at all depends on the number being a MOBILE.
//     Three of the nine partner numbers recovered on 2026-10-06 were 01904,
//     0117 and 07828 — two landlines and one mobile — and nothing on screen
//     distinguished them.
//
// So the number is normalised on the way in and classified, rather than stored
// as whatever someone happened to type and re-guessed at every call site.

/** Digits only, with +44 / 0044 / 44 collapsed to a single leading 0. */
export function normaliseUkPhone(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;

  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("+44")) d = "0" + d.slice(3);
  else if (d.startsWith("0044")) d = "0" + d.slice(4);
  // A bare 44 prefix is only a country code if what follows starts a UK number.
  // "441234..." is also a perfectly good Oxford landline, so this only fires
  // when dropping it leaves something that starts 07 or 01/02/03.
  else if (d.startsWith("44") && /^44[1-9]\d{9}$/.test(d)) d = "0" + d.slice(2);

  d = d.replace(/\D/g, "");
  if (!d.startsWith("0")) return null;
  if (d.length < 10 || d.length > 11) return null;
  return d;
}

/**
 * Is this a number a person carries?
 *
 * 071-075 and 077-079 are mobile ranges. Two deliberate exclusions:
 *   - 070 is personal numbering, which looks like a mobile and is not one. It
 *     forwards, costs the caller a great deal, and will not take WhatsApp.
 *   - 076 is pagers, except 07624 which is Isle of Man mobile.
 */
export function isUkMobile(input: string | null | undefined): boolean {
  const d = normaliseUkPhone(input);
  if (!d || d.length !== 11 || !d.startsWith("07")) return false;
  if (d.startsWith("070")) return false;
  if (d.startsWith("076")) return d.startsWith("07624");
  return true;
}

/**
 * The form WhatsApp's Send API wants: country code, no plus, no spaces.
 *
 * Returns null for anything that is not a mobile, because sending a WhatsApp
 * to a landline is not a thing — better to have no number to send to than a
 * number that fails at the API and looks like an outage.
 */
export function toWhatsAppNumber(input: string | null | undefined): string | null {
  if (!isUkMobile(input)) return null;
  const d = normaliseUkPhone(input)!;
  return "44" + d.slice(1);
}

/** How a UK number is normally written down. */
export function formatUkPhone(input: string | null | undefined): string | null {
  const d = normaliseUkPhone(input);
  if (!d) return null;
  if (d.startsWith("07") && d.length === 11) return `${d.slice(0, 5)} ${d.slice(5)}`;
  if (d.startsWith("020") || d.startsWith("011") || d.startsWith("0121")) {
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  }
  return `${d.slice(0, 5)} ${d.slice(5)}`;
}

export type PhoneKind = "mobile" | "landline" | "invalid" | "none";

/** One word for what we are holding, for the badge next to it. */
export function phoneKind(input: string | null | undefined): PhoneKind {
  if (!(input ?? "").trim()) return "none";
  if (isUkMobile(input)) return "mobile";
  return normaliseUkPhone(input) ? "landline" : "invalid";
}

/**
 * An Instagram handle, however it was pasted.
 *
 * People paste @handle, instagram.com/handle, the full https URL with a
 * tracking query on the end, or just the handle. All four mean the same thing
 * and only one of them is a key you can look anything up by.
 */
export function normaliseInstagram(input: string | null | undefined): string | null {
  let s = (input ?? "").trim();
  if (!s) return null;
  s = s.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  s = s.replace(/^instagram\.com\//i, "");
  s = s.split(/[?#]/)[0];
  s = s.replace(/^@/, "").replace(/\/+$/, "");
  if (!/^[A-Za-z0-9._]{1,30}$/.test(s)) return null;
  return s.toLowerCase();
}
