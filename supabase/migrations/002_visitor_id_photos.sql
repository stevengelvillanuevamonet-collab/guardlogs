-- ID photo capture for surrendered visitor IDs.
-- Run this after 001_visitor_logs.sql, in the same SQL Editor.

alter table public.visitor_logs
  add column if not exists id_photo_path text;

-- Private bucket — ID photos are sensitive, so we never expose a permanent
-- public URL. The app generates short-lived signed URLs on demand instead
-- (see getActiveVisitors / getRecentLogs in lib/actions.ts).
insert into storage.buckets (id, name, public)
values ('visitor-ids', 'visitor-ids', false)
on conflict (id) do nothing;

-- Only signed-in guards can upload, view, or delete files in this bucket —
-- mirrors the visitor_logs table policies.
create policy "Authenticated guards can upload ID photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'visitor-ids');

create policy "Authenticated guards can view ID photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'visitor-ids');

create policy "Authenticated guards can delete ID photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'visitor-ids');
