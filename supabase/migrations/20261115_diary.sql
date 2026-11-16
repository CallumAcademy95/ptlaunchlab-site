-- PA diary (CRM Week page). New tables only. Spec: 2026-11-15-crm-week-page-design.md
create sequence if not exists public.diary_task_ref_seq;

create table if not exists public.diary_tasks (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default ('T' || lpad(nextval('public.diary_task_ref_seq')::text, 3, '0')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null check (char_length(title) between 1 and 200),
  area text not null default 'PTLL' check (area in ('PTLL','Praxel','AlbaCo','USA','Personal')),
  category text not null check (category in ('Sales','Outreach','Scaling','Praxel','Content','Podcast','SEO','Admin','Review','Fixed')),
  estimate_min int check (estimate_min is null or estimate_min between 5 and 600),
  deadline date,
  owner text not null default 'Callum' check (owner in ('Callum','Claude')),
  status text not null default 'inbox' check (status in ('inbox','placed','done','approved','dropped')),
  kind text not null default 'task' check (kind in ('task','fixed')),
  start_at timestamptz,
  end_at timestamptz,
  event_id text,
  source text not null default 'typed' check (source in ('typed','screenshot','claude','import')),
  notes text check (notes is null or char_length(notes) <= 1000),
  check (kind = 'fixed' or estimate_min is not null),
  check ((start_at is null) = (end_at is null)),
  check (end_at is null or end_at > start_at)
);
create index if not exists diary_tasks_status_idx on public.diary_tasks (status);
create index if not exists diary_tasks_start_idx on public.diary_tasks (start_at);
alter table public.diary_tasks enable row level security;
grant select, insert, update, delete on public.diary_tasks to service_role;
grant usage, select on sequence public.diary_task_ref_seq to service_role;

create table if not exists public.diary_settings (
  id int primary key check (id = 1),
  template jsonb not null,
  buffer_min int not null default 30 check (buffer_min between 0 and 120),
  updated_at timestamptz not null default now()
);
alter table public.diary_settings enable row level security;
grant select, insert, update on public.diary_settings to service_role;

insert into public.diary_settings (id, template) values (1, '[
  {"day":1,"start":"10:00","end":"11:00","category":"Praxel","title":"Praxel marking"},
  {"day":1,"start":"11:00","end":"11:30","category":"Sales","title":"Leads/CRM replies"},
  {"day":1,"start":"11:30","end":"15:00","category":"Scaling","title":"Scaling: partners, offers, funnel"},
  {"day":1,"start":"15:00","end":"15:30","category":"Sales","title":"Leads/CRM replies + tomorrow check"},
  {"day":2,"start":"09:00","end":"10:30","category":"Outreach","title":"LinkedIn gym owners + partner follow-ups"},
  {"day":2,"start":"10:30","end":"12:00","category":"Content","title":"Content batch"},
  {"day":2,"start":"12:00","end":"15:00","category":"Content","title":"Content/Podcast"},
  {"day":2,"start":"15:00","end":"15:30","category":"Sales","title":"Leads/CRM replies"},
  {"day":3,"start":"09:00","end":"10:30","category":"Praxel","title":"Praxel marking + learner support"},
  {"day":3,"start":"10:30","end":"12:00","category":"Podcast","title":"Podcast: edit, promo pack, OpusClip"},
  {"day":3,"start":"12:00","end":"15:00","category":"Scaling","title":"Scaling / Praxel product"},
  {"day":3,"start":"15:00","end":"15:30","category":"Sales","title":"Leads/CRM replies"},
  {"day":4,"start":"12:00","end":"13:00","category":"Sales","title":"Leads + the day''s one must-do"},
  {"day":5,"start":"09:00","end":"09:30","category":"Review","title":"Week review + next-week plan"},
  {"day":5,"start":"09:30","end":"10:30","category":"Admin","title":"Admin: Stripe, MailerLite, task list"},
  {"day":5,"start":"10:30","end":"12:00","category":"SEO","title":"SEO: one fix or one page"},
  {"day":5,"start":"12:00","end":"14:30","category":"Admin","title":"Admin overflow / urgent"}
]'::jsonb) on conflict (id) do nothing;
