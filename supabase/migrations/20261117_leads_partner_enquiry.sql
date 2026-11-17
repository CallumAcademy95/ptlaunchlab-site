-- Partner-page enquiries and their follow-up emails (17 Nov 2026).
--
-- 1. A new lead intent, 'partner_enquiry': the "send me the details" form on a
--    partner's page (first: PT Mentor Hub). gym_slug carries the partner.
-- 2. Where each lead is in its partner's email sequence (app/lib/partnerNurture.ts):
--    nurture_step = how many emails have gone; nurture_stopped = why it ended
--    early ('unsubscribed', 'enrolled', 'done'); null while running.
--
-- Additive: the constraint swap only widens the allowed list, and the new
-- columns default so every existing row is unaffected.

alter table public.leads drop constraint if exists leads_intent_check;
alter table public.leads add constraint leads_intent_check check (intent in (
  'call','prospectus','quiz','career_planner','gym_callback','whatsapp','live','salary',
  'checkout_start','contact','gym_partnership','partner_enquiry'
));

alter table public.leads
  add column if not exists nurture_step smallint not null default 0,
  add column if not exists nurture_last_sent_at timestamptz,
  add column if not exists nurture_stopped text;

create index if not exists leads_partner_nurture_idx
  on public.leads (created_at)
  where intent = 'partner_enquiry' and nurture_stopped is null;
