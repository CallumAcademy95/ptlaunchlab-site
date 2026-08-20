import crypto from "node:crypto";

// The site's half of the Praxel enrolment hand-off.
//
// A buyer pays here and enrols on Praxel. This module produces the signed link
// that carries them across, and the signed body that tells Praxel a sale
// happened at all.
//
// CROSS-REPO CONTRACT: this MUST stay byte-for-byte compatible with
// albaco-lms/lib/enrolment/invite-token.ts. The HMAC is taken over the encoded
// string exactly as it appears in the URL, never over re-serialised JSON, whose
// key order is not guaranteed to survive a round trip through another runtime.
// tests/enrolmentInvite.test.mts pins the encoding to fixed values on this side
// and scripts/test-invite-token.mjs pins the same ones on the other.
export type InvitePayload = {
  sid: string;              // Stripe checkout session id
  email: string;
  name: string;
  plan: "PIF" | "deposit";  // the SHAPE of the sale, never derived from amount
  amount: number;           // pounds, as charged
  gym?: string;
  promo?: string;
  ts: number;               // ms epoch, when the invite was minted
};

function encode(p: InvitePayload): string {
  return Buffer.from(JSON.stringify(p), "utf8").toString("base64url");
}

function sign(value: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

// The link that goes in the buyer's email. Praxel verifies the signature and
// trusts the contents, so this link alone is enough to enrol — it does not
// depend on the POST below having landed.
export function buildInviteUrl(origin: string, p: InvitePayload, secret: string): string {
  const d = encode(p);
  return `${origin.replace(/\/+$/, "")}/enrol/complete?d=${d}&t=${sign(d, secret)}`;
}

// The POST that records the sale in Praxel. Signed over its own raw text,
// because that is what the receiving route reads before it parses anything.
export function invitePostBody(p: InvitePayload, secret: string): { body: string; signature: string } {
  const body = JSON.stringify({ d: encode(p) });
  return { body, signature: sign(body, secret) };
}
