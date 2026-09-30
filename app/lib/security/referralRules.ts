// The two decisions in a referral that cost money if they're wrong.
//
// Kept in their own module, free of any dependency, for one practical reason:
// `validate.ts` pulls in the disposable-email-domains JSON list, which can't be
// imported by the unit-test runner without an import attribute. Rather than
// change production imports to suit a test, the rules that actually need
// regression cover live here where they can be tested directly.
//
// A referral is a payment promise — £200 to the referrer once the person they
// named enrols — so both of these are about not creating a debt we can't
// honour or shouldn't owe.

/**
 * Can we actually reach the person being referred?
 *
 * A referral with a name and nothing else is not actionable: we can't contact
 * them, they can't enrol, and the referrer is left expecting £200 that will
 * never arrive. Either contact method is enough — plenty of people know a
 * friend's number but not the email they'd sign up with.
 */
export function hasReachableContact(
  email: string | null | undefined,
  phone: string | null | undefined
): boolean {
  return !!String(email ?? "").trim() || !!String(phone ?? "").trim();
}

/**
 * Is somebody referring themselves?
 *
 * Case- and whitespace-insensitive, because `Learner@Example.com ` and
 * `learner@example.com` are the same inbox and the £200 would be a payment to
 * someone for enrolling themselves.
 *
 * A blank referred email is not a self-referral — that's the phone-only case,
 * which is legitimate.
 */
export function isSelfReferral(
  referrerEmail: string | null | undefined,
  referredEmail: string | null | undefined
): boolean {
  const a = String(referrerEmail ?? "").trim().toLowerCase();
  const b = String(referredEmail ?? "").trim().toLowerCase();
  if (!a || !b) return false;
  return a === b;
}
