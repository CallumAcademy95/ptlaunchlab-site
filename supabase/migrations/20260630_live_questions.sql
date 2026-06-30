-- Live panel audience questions (the /ask page → /api/live-question).
-- Stored here so the host can read + triage them on /admin/live-questions
-- before going live. Mirrors the whatsapp_messages pattern: RLS enabled with
-- NO policies, so only the service_role key (server-side) can read/write —
-- the anon/public key is fully blocked.
--
-- Apply manually in the Supabase SQL editor (project rbbudrdryuokujlsvwgm).

create table if not exists public.live_questions (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  email       text not null,
  question    text not null,
  event       text,                                  -- e.g. "#1 — The Real State of the PT Industry in 2026"
  source      text not null default 'live-question',
  status      text not null default 'new',           -- new | starred | answered | hidden
  ip          text,
  created_at  timestamptz not null default now()
);

create index if not exists live_questions_created_at_idx
  on public.live_questions (created_at desc);

create index if not exists live_questions_status_idx
  on public.live_questions (status);

alter table public.live_questions enable row level security;
-- No policies on purpose: service_role bypasses RLS, everyone else is denied.
