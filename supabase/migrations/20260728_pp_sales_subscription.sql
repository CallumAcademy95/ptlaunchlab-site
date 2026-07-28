-- ─────────────────────────────────────────────────────────────────────────────
-- pp_sales → Stripe subscription link.
--
-- Deposit learners pay £599 up front then 5 × £200 on a subscription. The money
-- after the deposit arrives as `invoice.paid` events which carry a subscription
-- id and nothing else — no checkout session. Without this column there is no
-- way to find the pp_sales row an instalment belongs to, so neither the payment
-- progress nor the instalment-2 commission release can be updated.
--
-- Nullable: pay-in-full sales have no subscription.
-- ─────────────────────────────────────────────────────────────────────────────

alter table pp_sales
  add column if not exists stripe_subscription_id text;

-- Unique but nullable: many PIF rows hold null, and Postgres treats nulls as
-- distinct, so this constrains only the rows that actually have a subscription.
create unique index if not exists pp_sales_subscription_idx
  on pp_sales (stripe_subscription_id)
  where stripe_subscription_id is not null;

comment on column pp_sales.stripe_subscription_id is
  'Set for deposit plans only. How invoice.paid finds the sale to credit.';
