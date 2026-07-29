-- ─────────────────────────────────────────────────────────────────────────────
-- Demo partners.
--
-- A demonstration portal needs sales, payouts and commission that look real, so
-- it needs rows in the same tables as everything else. Which means the £2,500
-- of invented commission would otherwise land in "released and unpaid across
-- all partners" on the admin page, and in every audit total.
--
-- is_demo keeps the demo complete for the person being shown it while keeping
-- it out of anything anyone makes a decision from.
-- ─────────────────────────────────────────────────────────────────────────────

alter table pp_partners
  add column if not exists is_demo boolean not null default false;

create index if not exists pp_partners_is_demo_idx
  on pp_partners (is_demo)
  where is_demo;

comment on column pp_partners.is_demo is
  'True for demonstration accounts. Exclude from money totals and reporting.';
