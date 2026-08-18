-- A seventh resource category. The guide explains the course a learner is on --
-- the opposite end of the journey from 'training', which is "Selling the course".
--
-- Dropped by name, not by position: pp_resources carries a second check
-- (pp_resources_has_target) and dropping the wrong one silently removes the
-- guard that every resource has either a storage path or an external URL.
alter table pp_resources drop constraint if exists pp_resources_category_check;
alter table pp_resources add constraint pp_resources_category_check
  check (category in ('branding', 'print', 'digital', 'learner', 'legal', 'training', 'delivery'));
