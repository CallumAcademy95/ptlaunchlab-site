// ATP Fitness Felixstowe's ladder prices — DISPLAY-SAFE.
//
// Split out of ./partnerCommission.ts so the enrol page (a client component)
// can show these figures without pulling ATP's member codes into the browser
// bundle. Codes and coupons stay server-side in partnerCommission.ts.
// No imports on purpose.

/** 6-month plan: £599 today, then 5 × £200 starting 30 days later — £1,599. */
export const ATP_SIX_MONTH = {
  depositPence: 59_900,
  instalmentPence: 20_000,
  instalments: 5,
  contractPence: 159_900,
  trialDays: 30,
} as const;

/** Pay in full before any member code. */
export const ATP_PIF_FULL_PENCE = 159_900;

export const ATP_GYM_SLUG = "atp-felixstowe";
