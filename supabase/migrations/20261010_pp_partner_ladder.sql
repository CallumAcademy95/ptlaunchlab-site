-- Partner platform — the v4.1 sales ladder.
--
-- NOT YET APPLIED. Written on feat/partner-ladder; apply by hand after review,
-- and BEFORE deploying the branch: the portal, admin and payout code on that
-- branch select the new pp_sales columns, and PostgREST errors on a column
-- that does not exist.
--
-- Safe to run whether or not 20261009_pp_partner_terms_v4.sql has run: the
-- constraint is dropped and re-created with every value either file allows.
--
-- What this migration does:
--   1. allows pp_partners.commission_terms = 'ladder' alongside on_enrolment,
--      instalment_2 and payment_5, which keep working unchanged;
--   2. makes 'ladder' the DEFAULT for partners created from now on;
--   3. adds to pp_sales:
--        rung                    what was sold (pif, monthly, six_month,
--                                pif_1599, pif_1399, pif_1099); null on every
--                                sale made before this
--        member_saving_pence     a gym-funded member saving on pay-in-full
--        member_code             the ATP member code used, if any
--        volume_bonus_pence      the quarterly volume top-up, written by
--                                scripts/partner-quarter-topup.mts
--        volume_bonus_payout_id  the payout that settled that bonus. Separate
--                                from payout_id because a bonus is written
--                                after the quarter ends — often after the sale's
--                                own commission has already been paid.
--
-- What it deliberately does NOT do: touch any existing row. Every new column
-- has a default (0 / null) that leaves existing sales exactly as they are, and
-- no partner's commission_terms is changed — gyms move to 'ladder' when they
-- sign v4.1 (app/lib/partnerTermsSwitch.ts).

-- 1. The new terms value.
alter table pp_partners
  drop constraint if exists pp_partners_commission_terms_check;

alter table pp_partners
  add constraint pp_partners_commission_terms_check
  check (commission_terms in ('on_enrolment', 'instalment_2', 'payment_5', 'ladder'));

comment on column pp_partners.commission_terms is
  'on_enrolment = grandfathered pre-2026-07-27 terms (30 days after enrolment). '
  'instalment_2 = deposit commission holds until the 2nd instalment clears. '
  'payment_5 = v4.0 (Oct 2026): pay-in-full releases 30 days after purchase; '
  'monthly plan releases when the learner''s 5th payment clears (checkout payment = 1). No clawback. '
  'ladder = v4.1: release timing as payment_5; commission by plan (PIF £400 less any member saving, '
  'monthly £250) plus a quarterly volume top-up. See app/lib/partnerCommission.ts.';

-- 2. Default for NEW rows only. Existing rows are unchanged by a default change.
alter table pp_partners
  alter column commission_terms set default 'ladder';

-- 3. Sale columns.
alter table pp_sales
  add column if not exists rung text,
  add column if not exists member_saving_pence integer not null default 0,
  add column if not exists member_code text,
  add column if not exists volume_bonus_pence integer not null default 0,
  add column if not exists volume_bonus_payout_id uuid references pp_payouts(id) on delete set null;

alter table pp_sales
  drop constraint if exists pp_sales_rung_check;
alter table pp_sales
  add constraint pp_sales_rung_check
  check (rung is null or rung in ('pif', 'monthly', 'six_month', 'pif_1599', 'pif_1399', 'pif_1099'));

alter table pp_sales
  drop constraint if exists pp_sales_member_saving_check;
alter table pp_sales
  add constraint pp_sales_member_saving_check
  check (member_saving_pence between 0 and 10000);

alter table pp_sales
  drop constraint if exists pp_sales_volume_bonus_check;
alter table pp_sales
  add constraint pp_sales_volume_bonus_check
  check (volume_bonus_pence >= 0);

comment on column pp_sales.rung is
  'What was sold, from Checkout Session metadata.rung. Null on sales made before the v4.1 ladder.';
comment on column pp_sales.member_saving_pence is
  'Gym-funded saving given on a nine-gym pay-in-full (0–£100). Already deducted from commission_pence.';
comment on column pp_sales.member_code is
  'ATP member code applied at checkout (ATPPT / ATP500), if any.';
comment on column pp_sales.volume_bonus_pence is
  'Quarterly volume top-up on a ladder sale (+£100 PIF / +£50 monthly), written after the quarter ends.';
comment on column pp_sales.volume_bonus_payout_id is
  'The payout that settled volume_bonus_pence. Null = bonus not yet paid.';

-- The quarter count reads sales by partner and enrolment date; the existing
-- pp_sales_partner_idx (partner_id, enrolled_at desc) already serves it.
