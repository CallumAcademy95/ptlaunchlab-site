-- Partner platform — somewhere to put a partner's contact details.
--
-- pp_partners held contact_name and contact_email and nothing else, so the
-- question "do we have the gym partners' mobile numbers?" could not be answered
-- from the partner records at all. The answer had to be reconstructed by
-- matching partners back to scraped gym_prospects rows, and came out at three
-- numbers for nine partners, only one of which was a mobile.
--
-- Seven of the nine also have no contact_email: the addresses on screen come
-- from pp_partner_users, which are login accounts rather than contact records.
--
-- A landline and a mobile are kept apart on purpose. Only one of them can take
-- a WhatsApp, and 01904 611070 and 07828 594328 in a single column leaves every
-- caller to work out which is which.

alter table pp_partners
  add column if not exists contact_phone     text,
  add column if not exists contact_mobile    text,
  add column if not exists contact_instagram text,
  add column if not exists contact_updated_at timestamptz,
  add column if not exists contact_updated_by text;

comment on column pp_partners.contact_mobile is
  'UK mobile, digits only with a leading 0 (07828594328). Normalised on save by app/admin/(shell)/partners/phone.ts; WhatsApp needs it as 44... without the plus.';
comment on column pp_partners.contact_phone is
  'Landline or main gym number. Kept apart from contact_mobile because only a mobile can take a WhatsApp.';
comment on column pp_partners.contact_instagram is
  'Handle only, lower case, no @ and no URL.';

-- The three numbers recovered on 2026-10-06, so the work is not lost.
-- Matched by gym name against gym_prospects; safe to overwrite by hand.
update pp_partners set contact_mobile = '07828594328', contact_updated_at = now(),
  contact_updated_by = 'migration 20261006 (recovered from gym_prospects)'
  where gym_name = '6fit Gyms' and contact_mobile is null;

update pp_partners set contact_phone = '01904611070', contact_updated_at = now(),
  contact_updated_by = 'migration 20261006 (recovered from gym_prospects)'
  where gym_name = 'Ebor Fitness' and contact_phone is null;

update pp_partners set contact_phone = '01179353414', contact_updated_at = now(),
  contact_updated_by = 'migration 20261006 (recovered from gym_prospects)'
  where gym_name = 'Ministry of Fitness' and contact_phone is null;

update pp_partners set contact_instagram = '6fitgym', contact_updated_at = now()
  where gym_name = '6fit Gyms' and contact_instagram is null;

update pp_partners set contact_instagram = 'mofgym', contact_updated_at = now()
  where gym_name = 'Ministry of Fitness' and contact_instagram is null;
