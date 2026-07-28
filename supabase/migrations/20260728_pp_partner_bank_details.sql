-- ─────────────────────────────────────────────────────────────────────────────
-- Partner bank details.
--
-- These currently live in email threads, because the agreement says details are
-- "supplied in writing". A database is strictly better than an inbox for this,
-- but the storage is the least interesting part — the controls are:
--
--   1. Never rendered in full. Partner and admin both see ••••1234; the admin
--      reveal is an explicit action, not a page load.
--   2. Any change emails the partner's address on file AND the admin. Bank
--      detail redirection is the fraud that matters here: quietly swap the
--      account, collect the next £500. A notification turns a silent compromise
--      into an obvious one.
--   3. bank_details_updated_at is the audit trail — a payment run should look
--      twice at details changed in the last few days.
--
-- Deliberately NOT card data, so no PCI scope. Still treat it as the most
-- sensitive thing in the pp_* tables.
-- ─────────────────────────────────────────────────────────────────────────────

alter table pp_partners
  add column if not exists bank_account_name    text,
  add column if not exists bank_sort_code       text,
  add column if not exists bank_account_number  text,
  add column if not exists bank_details_updated_at timestamptz,
  -- Which partner user last changed them. Null = set by an admin.
  add column if not exists bank_details_updated_by uuid;

-- Digits only, normalised on write — "12-34-56" and "123456" are the same sort
-- code and storing both spellings makes every later comparison a guess.
alter table pp_partners
  drop constraint if exists pp_partners_sort_code_format;
alter table pp_partners
  add constraint pp_partners_sort_code_format
  check (bank_sort_code is null or bank_sort_code ~ '^[0-9]{6}$');

alter table pp_partners
  drop constraint if exists pp_partners_account_number_format;
alter table pp_partners
  add constraint pp_partners_account_number_format
  check (bank_account_number is null or bank_account_number ~ '^[0-9]{8}$');

comment on column pp_partners.bank_account_number is
  'Never render in full. Mask to the last 4 everywhere except an explicit admin reveal.';
