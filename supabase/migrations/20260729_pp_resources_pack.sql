-- ─────────────────────────────────────────────────────────────────────────────
-- Campaign packs.
--
-- A gym owner doesn't want thirty story templates. They want January handled.
-- The playbook already describes nine campaigns week by week; what's missing is
-- the artwork attached to the campaign that needs it, so a partner opens one
-- card and finds the poster, the screen slide and the story templates already
-- there.
--
-- `pack` holds the slug of the playbook entry a resource belongs to — e.g.
-- 'campaign-january-new-career'. Null means it's a standalone resource, which is
-- most of them.
--
-- Deliberately a plain text column and not a foreign key: playbook entries live
-- in the repo as markdown, so there is no table to point at. A pack naming a
-- campaign that no longer exists simply stops being shown.
-- ─────────────────────────────────────────────────────────────────────────────

alter table pp_resources
  add column if not exists pack text;

create index if not exists pp_resources_pack_idx
  on pp_resources (pack)
  where pack is not null;

comment on column pp_resources.pack is
  'Slug of the playbook entry this belongs to, e.g. campaign-january-new-career. Null = standalone.';
