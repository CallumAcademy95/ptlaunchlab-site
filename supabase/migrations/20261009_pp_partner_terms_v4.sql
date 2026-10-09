-- Partner platform — v4.0 partner terms (October 2026 price change-over).
--
-- NOT YET APPLIED. Written alongside the code on feat/999-pricing; apply by hand
-- after review. The code is safe to deploy BEFORE this runs: it only reads
-- commission_terms and treats an unrecognised value as "never release early",
-- and nothing writes 'payment_5' until a human sets it on a partner.
--
-- The course is now £999.99 in full or 10 × £99.99 a month. The new gym partner
-- terms (v4.0) are:
--   fee     £250 inc. VAT per learner (was £500)
--   release pay-in-full: 30 days after purchase
--           monthly plan: when the learner's 5th payment clears (the checkout
--           payment counts as payment 1)
--   no clawback once paid
--
-- What this migration does:
--   1. allows commission_terms = 'payment_5' alongside the existing
--      'on_enrolment' and 'instalment_2', which keep working unchanged;
--   2. changes the column DEFAULTS so partners created from now on start on
--      v4.0: fee 25000, terms 'payment_5', pp_sales.commission_pence 25000.
--
-- What it deliberately does NOT do: touch any existing partner row. Each gym is
-- switched by hand after its 30-day notice period. ATP stays at £500.
-- commission_pence on a sale is stamped from the partner's fee at sale time, so
-- existing sales keep the fee they were sold under.

-- 1. The new terms value. The original check was declared inline, so Postgres
--    named it pp_partners_commission_terms_check.
alter table pp_partners
  drop constraint if exists pp_partners_commission_terms_check;

alter table pp_partners
  add constraint pp_partners_commission_terms_check
  check (commission_terms in ('on_enrolment', 'instalment_2', 'payment_5'));

comment on column pp_partners.commission_terms is
  'on_enrolment = grandfathered pre-2026-07-27 terms (30 days after enrolment). '
  'instalment_2 = deposit commission holds until the 2nd instalment clears. '
  'payment_5 = v4.0 (Oct 2026): pay-in-full releases 30 days after purchase; '
  'monthly plan releases when the learner''s 5th payment clears (checkout payment = 1). No clawback.';

-- 2. Defaults for NEW rows only. Existing rows are unchanged by a default change.
alter table pp_partners
  alter column fee_per_learner_pence set default 25000,
  alter column commission_terms set default 'payment_5';

alter table pp_sales
  alter column commission_pence set default 25000;
