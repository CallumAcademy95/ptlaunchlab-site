-- ─────────────────────────────────────────────────────────────────────────────
-- Ad-hoc playbook entries.
--
-- The curated playbook stays as committed markdown in /partner-playbook — it is
-- rewritten constantly and a database would turn every copy tweak into a data
-- migration. This table is for the other kind of entry: a seasonal post, a
-- document someone wants shared this week, anything that shouldn't wait for a
-- deploy.
--
-- Both sources render identically at /partners/playbook. A repo entry wins on a
-- slug clash, so the reviewed version can never be silently overridden by an
-- upload.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists pp_playbook_entries (
  id            uuid primary key default gen_random_uuid(),

  -- Matches the filename convention of the repo entries, and is what a clash is
  -- resolved on.
  slug          text not null unique,
  title         text not null,

  type          text not null
                  check (type in ('social', 'email', 'script', 'campaign', 'idea')),

  channel       text,                       -- free text chip: "Instagram", "In gym"
  when_to_use   text,
  sort_order    integer not null default 100,

  -- Authored by an admin, rendered as markdown. Not user input.
  body_markdown text,

  -- Optional attachment in the private `partner-resources` bucket, under a
  -- playbook/ prefix — same bucket, same signed-URL rules, one less thing to
  -- configure and secure.
  storage_path  text,
  external_url  text,
  mime          text,
  file_size     bigint,

  created_at    timestamptz not null default now(),

  constraint pp_playbook_has_content
    check (body_markdown is not null or storage_path is not null or external_url is not null)
);

create index if not exists pp_playbook_entries_type_idx
  on pp_playbook_entries (type, sort_order);

-- Same posture as the other pp_ tables: service role does the reading, RLS is a
-- second belt so an anon-keyed query returns nothing rather than everything.
alter table pp_playbook_entries enable row level security;

create policy pp_playbook_entries_read on pp_playbook_entries
  for select using (pp_current_partner_id() is not null);
