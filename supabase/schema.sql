-- Wingman database schema. Run this in the Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.reminders (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(title) between 1 and 120),
  description  text not null default '',
  -- Time of day in 24h "HH:MM" local time.
  time         time not null,
  -- 'daily' = every day, 'weekdays' = Mon-Fri, 'custom' = the days in days_of_week, 'once' = only on one_time_date
  recurrence   text not null default 'daily' check (recurrence in ('daily', 'weekdays', 'custom', 'once')),
  -- ISO weekday numbers used by 'custom': 1 = Monday ... 7 = Sunday
  days_of_week smallint[] not null default '{}',
  one_time_date date,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reminders_set_updated_at on public.reminders;
create trigger reminders_set_updated_at
  before update on public.reminders
  for each row execute function public.set_updated_at();

-- The app talks to Supabase only from server-side API routes using the
-- service role key, so Row Level Security is enabled with no public policies.
alter table public.reminders enable row level security;
