-- supabase/migrations/20261011_leads.sql
-- One row per website lead, saved BEFORE any alert/Zapier/MailerLite/CAPI.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 120),
  phone text,
  email text not null check (char_length(email) between 3 and 254),
  question text check (question is null or char_length(question) <= 1000),
  intent text not null check (intent in ('call','prospectus','quiz','career_planner','gym_callback','whatsapp','live','salary','checkout_start','contact','gym_partnership')),
  source text not null,
  page_path text,
  gym_slug text,
  extra jsonb not null default '{}',
  utm jsonb not null default '{}',
  referrer text,
  event_id text,
  is_test boolean not null default false,
  is_spam boolean not null default false,
  push_status text,
  setter_status text,
  zapier_status text,
  mailerlite_status text,
  capi_status text
);
create index if not exists leads_created_at_idx on public.leads (created_at desc);
alter table public.leads enable row level security;
-- No public policies. The service role bypasses RLS but still needs table grants
-- (Ultimate Shred's gym_leads 403'd without them).
grant select, insert, update on public.leads to service_role;
