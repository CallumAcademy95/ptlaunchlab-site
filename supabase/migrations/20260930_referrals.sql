-- =========================================================================
-- Learner referrals — £200 for a referral who enrols.
-- -------------------------------------------------------------------------
-- The 52-week enrolled-learner nurture asks for a referral in every third
-- email. Until now the only route was "WhatsApp us or reply", which leaves no
-- record: nobody could answer who referred whom, whether we paid them, or
-- whether the scheme works at all.
--
-- WHY A TABLE AND NOT A ZAPIER WEBHOOK
--
-- The contact form posts to Zapier → Google Sheets. That is acceptable for an
-- enquiry, which is disposable. A referral is a PAYMENT PROMISE: someone is
-- owed £200 if the person they named enrols. It has to survive, be queryable,
-- and carry its own money trail. Sheets is already one of six systems that
-- disagree with each other about PTLL customers; this must not be a seventh.
--
-- STATUS, AND WHY THE MONEY IS SEPARATE FROM THE OUTCOME
--
--   new        — submitted, nobody has looked yet
--   contacted  — we have spoken to the referred person
--   enrolled   — they bought. This is what triggers the £200
--   declined   — they are not going ahead
--   duplicate  — already known to us from another source
--
-- reward_status tracks the payment independently, because "they enrolled" and
-- "we paid the referrer" are different facts and conflating them is how people
-- get missed.
--
-- NO FOREIGN KEY TO THE REFERRER
--
-- The referrer is identified by email, not a profile id. Learners live in the
-- LMS database (a different Supabase project), so a real FK is impossible
-- here. Email is what the nurture email knows about them anyway.
-- =========================================================================

create table if not exists public.referrals (
  id                 uuid primary key default gen_random_uuid(),

  -- Who is referring. Email only — see note above.
  referrer_email     text not null,
  referrer_name      text,

  -- Who they are referring.
  referred_name      text not null,
  referred_email     text,
  referred_phone     text,
  note               text,

  status             text not null default 'new'
                       check (status in ('new','contacted','enrolled','declined','duplicate')),

  -- The money. Kept separate from status on purpose.
  reward_pence       integer not null default 20000,
  reward_status      text not null default 'pending'
                       check (reward_status in ('pending','due','paid','void')),
  reward_paid_at     timestamptz,
  reward_reference   text,

  -- Light attribution so we can tell a nurture referral from a portal one.
  source             text not null default 'nurture-email',

  admin_note         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists referrals_status_idx        on public.referrals (status);
create index if not exists referrals_reward_status_idx on public.referrals (reward_status);
create index if not exists referrals_referrer_idx      on public.referrals (lower(referrer_email));
create index if not exists referrals_created_idx       on public.referrals (created_at desc);

-- One person should not be referred twice by the same referrer. Partial, so
-- rows without a referred email (phone-only) are still allowed.
create unique index if not exists referrals_unique_pair_idx
  on public.referrals (lower(referrer_email), lower(referred_email))
  where referred_email is not null;

comment on table public.referrals is
  'Learner referrals. £200 to the referrer when the referred person enrols. reward_status is deliberately independent of status.';
comment on column public.referrals.reward_pence is
  'What the referrer is owed on enrolment, in pence. Stored per row so changing the scheme does not rewrite history.';

-- RLS on, no policies: this table is service-role only. The public form writes
-- through the API route with the service key; nothing client-side reads it.
alter table public.referrals enable row level security;
