// The course price. ONE place, from the October 2026 change-over.
//
// Two ways to pay, nothing else:
//   - £999.99 in full, or
//   - 10 monthly payments of £99.99 (the first taken at checkout).
//
// No promo codes, no discounts, no dated offers, for anyone — direct, funnel or
// partner gym. Enrolment is rolling: there are no intakes or closing dates.
//
// Money is held in PENCE everywhere. £999.99 is not a whole number of pounds,
// so anything that rounds to pounds (Math.round(p / 100)) will print £1,000.
// Format with formatPence() below.
//
// No imports on purpose: pages, API routes, scripts and tests all read this.

export const COURSE_PRICE_PENCE = 99_999;
export const MONTHLY_PRICE_PENCE = 9_999;
export const MONTHLY_PAYMENTS = 10;
/** What the monthly plan collects in total: 10 × £99.99 = £999.90. */
export const MONTHLY_PLAN_TOTAL_PENCE = MONTHLY_PRICE_PENCE * MONTHLY_PAYMENTS;

/** Gym partner fee per learner from v4.0 terms, inclusive of VAT. */
export const PARTNER_FEE_PENCE = 25_000;
/** The learner's Nth monthly payment that releases the partner fee. */
export const PARTNER_FEE_RELEASE_PAYMENT = 5;

/** "£999.99", "£99.99", "£250" — pence to pounds, keeping pence only when non-zero. */
export function formatPence(pence: number): string {
  const pounds = pence / 100;
  const whole = Number.isInteger(pounds);
  return (
    "£" +
    pounds.toLocaleString("en-GB", {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    })
  );
}

export const COURSE_PRICE_LABEL = formatPence(COURSE_PRICE_PENCE); // £999.99
export const MONTHLY_PRICE_LABEL = formatPence(MONTHLY_PRICE_PENCE); // £99.99
/** "10 × £99.99" */
export const MONTHLY_PLAN_LABEL = `${MONTHLY_PAYMENTS} × ${MONTHLY_PRICE_LABEL}`;
