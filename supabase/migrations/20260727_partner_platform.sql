-- ─────────────────────────────────────────────────────────────────────────────
-- Gym Partner Platform — core schema
-- Plan: PARTNER-PLATFORM-PLAN.md
--
-- Phase 0 + 1 tables. pp_sales/pp_payouts are created here so the Stripe
-- webhook can start writing sales rows (Phase 3) without a second migration,
-- but nothing reads them until the tracking UI lands.
--
-- Access model: all reads/writes go through the service-role client, filtered
-- by the partner_id resolved from the Supabase Auth session. RLS below is a
-- second belt, never the only one.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Partners ────────────────────────────────────────────────────────────────
create table if not exists pp_partners (
  id                    uuid primary key default gen_random_uuid(),

  -- Stable join key. Matches PartnerConfig.gymSlug in the enrol pages and the
  -- gym_slug written into Stripe session metadata. NEVER change one once live.
  slug                  text not null unique,

  -- Historical free-text gymReferral display names ("Xcelerate Gyms Edgware").
  -- Sales made before 2026-07-27 carry only these, so backfill matches on them.
  legacy_referral_names text[] not null default '{}',

  gym_name              text not null,
  status                text not null default 'active'
                          check (status in ('active', 'paused')),

  landing_page_path     text,                    -- '/6fit-academy'
  promo_code            text,
  logo_url              text,
  primary_color         text,

  fee_per_learner_pence integer not null default 50000,

  -- Commission release terms. Partners signed before the 2026-07-27 variation
  -- keep 'on_enrolment' (30 days, no instalment condition) — they are
  -- contractually owed the original deal. New partners get 'instalment_2'.
  -- See PARTNER-PLATFORM-PLAN.md §6.1.
  commission_terms      text not null default 'instalment_2'
                          check (commission_terms in ('on_enrolment', 'instalment_2')),
  payout_terms_days     integer not null default 30,
  agreement_signed_at   timestamptz,
  agreement_version     text,

  created_at            timestamptz not null default now()
);

comment on column pp_partners.commission_terms is
  'on_enrolment = grandfathered pre-2026-07-27 terms. instalment_2 = deposit commission holds until the 2nd instalment clears.';

-- ─── Partner users ───────────────────────────────────────────────────────────
create table if not exists pp_partner_users (
  id                   uuid primary key,          -- = auth.users.id
  partner_id           uuid not null references pp_partners(id) on delete cascade,
  email                text not null,
  full_name            text,
  role                 text not null default 'owner'
                         check (role in ('owner', 'staff')),
  must_change_password boolean not null default true,
  last_login_at        timestamptz,
  created_at           timestamptz not null default now()
);

create index if not exists pp_partner_users_partner_idx on pp_partner_users (partner_id);
create unique index if not exists pp_partner_users_email_idx on pp_partner_users (lower(email));

-- ─── Payouts ─────────────────────────────────────────────────────────────────
create table if not exists pp_payouts (
  id             uuid primary key default gen_random_uuid(),
  partner_id     uuid not null references pp_partners(id) on delete cascade,
  period_label   text not null,                  -- 'July 2026'
  total_pence    integer not null default 0,
  status         text not null default 'draft'
                   check (status in ('draft', 'approved', 'paid')),
  invoice_number text,
  invoice_url    text,
  reference      text,
  paid_at        timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists pp_payouts_partner_idx on pp_payouts (partner_id, created_at desc);

-- ─── Sales ───────────────────────────────────────────────────────────────────
create table if not exists pp_sales (
  id                    uuid primary key default gen_random_uuid(),
  partner_id            uuid not null references pp_partners(id) on delete restrict,

  -- Idempotency key. The Stripe webhook is at-least-once; upsert on this.
  stripe_session_id     text not null unique,

  learner_name          text,
  -- Stored for reconciliation and support. NEVER rendered in /partners — the
  -- partner-facing queries select an explicit column list that omits it.
  -- See PARTNER-PLATFORM-PLAN.md §6.2.
  learner_email         text,

  plan_type             text not null check (plan_type in ('PIF', 'deposit')),
  amount_paid_pence     integer not null default 0,   -- grows as instalments land
  amount_due_pence      integer not null default 159900,
  promo_code            text,

  status                text not null default 'confirmed'
                          check (status in ('confirmed', 'cancelled', 'refunded')),

  commission_pence      integer not null default 50000,
  commission_status     text not null default 'accruing'
                          check (commission_status in ('accruing', 'due', 'paid', 'voided')),
  -- When commission becomes payable. Set at sale time for PIF; for deposits on
  -- 'instalment_2' terms it stays null until the 2nd instalment clears, then is
  -- stamped by the invoice.paid handler.
  commission_release_at timestamptz,

  payout_id             uuid references pp_payouts(id) on delete set null,
  enrolled_at           timestamptz not null default now(),
  created_at            timestamptz not null default now()
);

create index if not exists pp_sales_partner_idx on pp_sales (partner_id, enrolled_at desc);
create index if not exists pp_sales_commission_idx on pp_sales (commission_status, commission_release_at);

-- ─── Resources (the drive/hub) ───────────────────────────────────────────────
create table if not exists pp_resources (
  id            uuid primary key default gen_random_uuid(),
  -- NULL = shared with every partner. Set = that partner only.
  partner_id    uuid references pp_partners(id) on delete cascade,

  category      text not null
                  check (category in ('branding', 'print', 'digital', 'learner', 'legal', 'training')),
  title         text not null,
  description   text,

  -- Object in the private `partner-resources` bucket. Downloads are served as
  -- short-lived signed URLs from a server action — never a public URL.
  storage_path  text,
  external_url  text,                            -- escape hatch (Drive/Canva/YouTube)

  mime          text,
  file_size     bigint,
  version       text,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),

  constraint pp_resources_has_target check (storage_path is not null or external_url is not null)
);

create index if not exists pp_resources_lookup_idx on pp_resources (partner_id, category, sort_order);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Service role bypasses all of this; these policies exist so that a mistakenly
-- anon-keyed query returns nothing rather than everything.
alter table pp_partners      enable row level security;
alter table pp_partner_users enable row level security;
alter table pp_sales         enable row level security;
alter table pp_payouts       enable row level security;
alter table pp_resources     enable row level security;

create or replace function pp_current_partner_id() returns uuid
language sql stable security definer set search_path = public as $$
  select partner_id from pp_partner_users where id = auth.uid()
$$;

create policy pp_partners_own on pp_partners
  for select using (id = pp_current_partner_id());

create policy pp_partner_users_own on pp_partner_users
  for select using (partner_id = pp_current_partner_id());

create policy pp_sales_own on pp_sales
  for select using (partner_id = pp_current_partner_id());

create policy pp_payouts_own on pp_payouts
  for select using (partner_id = pp_current_partner_id());

create policy pp_resources_own on pp_resources
  for select using (partner_id is null or partner_id = pp_current_partner_id());

-- ─── Seed the 8 existing partners ────────────────────────────────────────────
-- slug values MUST match PartnerConfig.gymSlug in app/<gym>/enrol/page.tsx, and
-- promo_code must match GymConfig.promoCode in app/<gym>/page.tsx — the portal
-- shows it to the partner as their member discount code.
--
-- Ebor Fitness has showDiscount: false and no code, so its promo_code stays
-- null and the portal simply omits that block for them.
--
-- All 8 signed before the 2026-07-27 variation → grandfathered 'on_enrolment'.
insert into pp_partners (slug, gym_name, landing_page_path, promo_code, legacy_referral_names, commission_terms)
values
  ('6fit',         '6fit Gyms',            '/6fit-academy',          '6FITPTDISCOUNT', array['6fit Gyms'],             'on_enrolment'),
  ('xcelerate',    'Xcelerate Gyms',       '/xcelerate-academy',     'XCELERATEPT',    array['Xcelerate Gyms Edgware'],'on_enrolment'),
  ('gym-n-go',     'Gym n Go',             '/gym-n-go-academy',      'GYMNGOPT',       array['Gym n Go Forest Hill'],  'on_enrolment'),
  ('superflex',    'Superflex 2.0 Gym',    '/superflex-academy',     'SUPERFLEXPT',    array['Superflex 2.0 Gym'],     'on_enrolment'),
  ('ebor',         'Ebor Fitness',         '/ebor-fitness',          null,             array['Ebor Fitness'],          'on_enrolment'),
  ('muscle-bound', 'Muscle Bound Gym',     '/muscle-bound-academy',  'MBGPTDISCOUNT',  array['Muscle Bound Gym'],      'on_enrolment'),
  ('mof',          'Ministry of Fitness',  '/mof-gym',               'MOFPTDISCOUNT',  array['Ministry of Fitness'],   'on_enrolment'),
  ('ironwolf',     'Iron Wolf Gym',        '/ironwolf-gym',          'IWGPTDISCOUNT',  array['Iron Wolf Gym'],         'on_enrolment')
on conflict (slug) do nothing;
