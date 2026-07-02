-- WS2 Intelligence Layer (PTLL Growth OS) — unified visitor profile + event log.
--
-- Turns anonymous events into persistent PEOPLE: one row per visitor (keyed by a
-- first-party anon_id cookie, upgraded with email once known), an append-only
-- event log, a rolling signals counter, derived behaviour tags and a 0–100 lead
-- score. Feeds audience intelligence + the "Time to Trust" engine-health metric.
-- NOTE: never blocks ad spend — it's an intelligence layer, not a gate.
--
-- Mirrors the live_questions/whatsapp_messages pattern: RLS enabled with NO
-- policies, so only the service_role key (server-side) can read/write; the
-- anon/public key is fully blocked.
--
-- Apply manually in the Supabase SQL editor.

-- One persistent profile per visitor.
create table if not exists public.visitor_profiles (
  id              uuid primary key default gen_random_uuid(),
  anon_id         text unique not null,               -- first-party cookie id
  email           text,                               -- set once the visitor identifies
  phone           text,
  name            text,
  inferred_avatar text,                               -- switcher | starter | returner
  first_touch     jsonb not null default '{}'::jsonb, -- {utm_*, referrer, landing, ts}
  last_touch      jsonb not null default '{}'::jsonb,
  signals         jsonb not null default '{}'::jsonb, -- rolling counters (see scoring.ts)
  tags            text[] not null default '{}',       -- derived behaviour tags
  lead_score      integer not null default 0,         -- 0–100
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists visitor_profiles_email_idx      on public.visitor_profiles (email);
create index if not exists visitor_profiles_lead_score_idx on public.visitor_profiles (lead_score desc);
create index if not exists visitor_profiles_updated_at_idx on public.visitor_profiles (updated_at desc);

-- Append-only event log (the raw stream the profile is aggregated from).
create table if not exists public.visitor_events (
  id          uuid primary key default gen_random_uuid(),
  anon_id     text not null,
  email       text,
  type        text not null,                          -- page_view | guide_view | video_progress | quiz_complete | career_planner_complete | book_call_start | checkout_start | objection | download | live_register | live_attend ...
  meta        jsonb not null default '{}'::jsonb,     -- event-specific payload (e.g. {pct:75} for video_progress)
  created_at  timestamptz not null default now()
);

create index if not exists visitor_events_anon_id_idx    on public.visitor_events (anon_id, created_at desc);
create index if not exists visitor_events_type_idx       on public.visitor_events (type);
create index if not exists visitor_events_created_at_idx on public.visitor_events (created_at desc);

alter table public.visitor_profiles enable row level security;
alter table public.visitor_events   enable row level security;
-- No policies on purpose: service_role bypasses RLS, everyone else is denied.
