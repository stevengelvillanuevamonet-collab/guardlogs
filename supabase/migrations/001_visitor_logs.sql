-- Guardhouse Visitor Logbook schema
-- Run this in the Supabase SQL Editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

create table if not exists public.visitor_logs (
  id uuid primary key default gen_random_uuid(),
  visitor_name text not null,
  plate_number text,
  host_name text not null,
  purpose text not null,
  status text not null default 'Inside Campus'
    check (status in ('Inside Campus', 'Checked Out')),
  time_in timestamptz not null default now(),
  time_out timestamptz,
  logged_by uuid references auth.users (id),        -- guard who checked the visitor in
  checked_out_by uuid references auth.users (id),    -- guard who checked the visitor out
  created_at timestamptz not null default now()
);

-- Keep "currently inside" lookups fast (this is the query the dashboard polls).
create index if not exists visitor_logs_status_idx
  on public.visitor_logs (status);

create index if not exists visitor_logs_time_in_idx
  on public.visitor_logs (time_in desc);

alter table public.visitor_logs enable row level security;

-- Every signed-in guard (any authenticated Supabase Auth user — accounts are
-- created manually by an admin, there is no public sign-up) can read and
-- write log entries. Tighten this further with a role check if you
-- introduce guard vs. admin roles later (e.g. a `guards` table with a
-- `role` column, joined against auth.uid()).
create policy "Authenticated guards can read visitor logs"
  on public.visitor_logs for select
  to authenticated
  using (true);

create policy "Authenticated guards can insert visitor logs"
  on public.visitor_logs for insert
  to authenticated
  with check (true);

create policy "Authenticated guards can update visitor logs"
  on public.visitor_logs for update
  to authenticated
  using (true)
  with check (true);

-- Realtime so the "currently inside" table updates live across tablets.
alter publication supabase_realtime add table public.visitor_logs;
