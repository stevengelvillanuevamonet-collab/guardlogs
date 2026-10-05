-- Admin role, guard profiles and guard applications.
-- Run this after 001 and 002, in the same Supabase SQL Editor.
--
-- How roles work:
--   * The source of truth for access control is the user's `app_metadata.role`
--     ('admin' or 'guard'). Only the service role key can write app_metadata,
--     so a signed-in user can never promote themselves.
--   * `public.profiles` mirrors that role plus display info (name, phone,
--     active flag) so the admin panel can list people.
--   * Accounts with no role at all (every guard created before this migration)
--     are treated as guards, so nothing breaks for existing users.

-- ───────────────────────── profiles ─────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'guard' check (role in ('admin', 'guard')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

alter table public.profiles enable row level security;

-- True when the signed-in user's JWT carries app_metadata.role = 'admin'.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- Everyone can read their own profile; admins can read all of them.
-- There are intentionally no insert/update/delete policies: profiles are
-- only written by the server using the service role key.
drop policy if exists "Read own profile or admin reads all" on public.profiles;
create policy "Read own profile or admin reads all"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

-- Every new auth user (dashboard, CLI script or admin panel) gets a profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when new.raw_app_meta_data ->> 'role' = 'admin' then 'admin' else 'guard' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: every account that already exists is a guard until promoted.
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  case when u.raw_app_meta_data ->> 'role' = 'admin' then 'admin' else 'guard' end
from auth.users u
on conflict (id) do nothing;

-- ───────────────────── guard applications ─────────────────────

create table if not exists public.guard_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  address text,
  years_experience integer not null default 0 check (years_experience between 0 and 60),
  license_no text,                       -- security guard license number, if any
  shift_preference text not null default 'Any'
    check (shift_preference in ('Day', 'Night', 'Any')),
  about text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  review_note text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  guard_user_id uuid references auth.users (id) on delete set null,  -- account created on approval
  created_at timestamptz not null default now()
);

create index if not exists guard_applications_status_idx
  on public.guard_applications (status, created_at desc);

-- One open application per email address.
create unique index if not exists guard_applications_one_pending_per_email
  on public.guard_applications (lower(email))
  where status = 'pending';

alter table public.guard_applications enable row level security;

-- Applicants are not signed in, so the public form submits through a server
-- action that uses the service role key (no anonymous insert policy needed).
-- Only admins can read or review applications from the browser session.
drop policy if exists "Admins can read applications" on public.guard_applications;
create policy "Admins can read applications"
  on public.guard_applications for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can review applications" on public.guard_applications;
create policy "Admins can review applications"
  on public.guard_applications for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ───────────────────── creating the first admin ─────────────────────
-- Easiest: node --env-file=.env.local scripts/create-admin.mjs <email> <password> "Full Name"
--
-- Or promote an existing account in SQL (the person must sign out and back in):
--   update auth.users
--      set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'
--    where email = 'you@example.com';
--   update public.profiles set role = 'admin' where email = 'you@example.com';
