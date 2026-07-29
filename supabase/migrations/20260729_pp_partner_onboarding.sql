-- ─────────────────────────────────────────────────────────────────────────────
-- First-run onboarding.
--
-- A new partner signs in and lands on a page of numbers that mean nothing yet.
-- The walkthrough explains the five sections once and then gets out of the way.
--
-- Stored per user rather than in localStorage so dismissing it on a phone also
-- dismisses it on the laptop — a "welcome" panel that keeps coming back reads
-- as broken, and a gym owner uses both devices.
--
-- Also gives pp_partners a contact email. Nothing recorded who to write to at a
-- gym: the addresses live in email threads and inside signed PDFs, so creating
-- a login means going and finding one each time.
-- ─────────────────────────────────────────────────────────────────────────────

alter table pp_partner_users
  add column if not exists onboarding_dismissed_at timestamptz;

alter table pp_partners
  add column if not exists contact_email text,
  add column if not exists contact_name  text;

comment on column pp_partner_users.onboarding_dismissed_at is
  'Set when the partner dismisses the first-run walkthrough. Null = show it.';
comment on column pp_partners.contact_email is
  'Who to write to at this gym. Not a login — pp_partner_users holds those.';
