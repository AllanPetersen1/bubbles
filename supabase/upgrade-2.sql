-- Bubbles upgrade 2: security hardening. Run in the SQL editor after upgrade-1.sql.
-- Safe to re-run. Adds:
--   * insert column grants on check_ins (no client-chosen created_at / user_id)
--   * path format check on check_ins photos (own folder, hash-named files only)
--   * no direct producer / bottle inserts until an add-bottle UI + moderation exist
--   * per-user rate limit on check-ins
--   * storage: own-folder SELECT and a per-user file quota
-- The browser talks to Supabase directly, so Vercel rate limits do not cover any of this.

-- ------------------------------------------------------- check_ins: inserts
-- Clients choose content only. id, user_id (auth.uid()) and created_at use their defaults,
-- so nobody can back-date or future-date a post to pin it to the top of the feed.
revoke insert on public.check_ins from authenticated;
grant insert (champagne_id, vintage, rating, dosage, note, venue, thumb_path, full_path)
  on public.check_ins to authenticated;

-- Photo paths must be your own hash-named files. Also keeps odd characters out of the
-- PostgREST .or() filter that deleteCheckIn() builds from these values.
alter table public.check_ins drop constraint if exists check_ins_paths_own;
alter table public.check_ins add constraint check_ins_paths_own check (
  (thumb_path is null or thumb_path ~ ('^' || user_id::text || '/[0-9a-f]{16}_(thumb|full|avatar)\.(webp|jpg)$')) and
  (full_path  is null or full_path  ~ ('^' || user_id::text || '/[0-9a-f]{16}_(thumb|full|avatar)\.(webp|jpg)$'))
);

-- ------------------------------------------------ producers / bottles: closed
-- Producers have no status, so anything inserted is public at once (and shows up in
-- suggest_reference). Re-create these policies together with a moderation flow.
drop policy if exists "members add producers" on public.producers;
drop policy if exists "members add pending bottles" on public.champagnes;

-- -------------------------------------------------------------- rate limiting
-- shortcut: fixed 20 check-ins per hour per user, counted live; upgrade to a counter table if it gets hot.
create or replace function public.limit_check_ins()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.check_ins
      where user_id = new.user_id and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'rate limit: too many check-ins' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists check_ins_rate on public.check_ins;
create trigger check_ins_rate before insert on public.check_ins
  for each row execute function public.limit_check_ins();

-- ------------------------------------------------------------------- storage
-- Own-folder SELECT: the bucket is public, so photo URLs need no policy. This one lets
-- the quota below count your files, and stops anyone listing other people's folders.
drop policy if exists "members read own photos" on storage.objects;
create policy "members read own photos" on storage.objects for select to authenticated
  using (bucket_id = 'checkin-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Upload to your own folder, max 300 files per user (free-tier storage is 1 GB).
drop policy if exists "members upload to own folder" on storage.objects;
create policy "members upload to own folder" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'checkin-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (select count(*) from storage.objects o
         where o.bucket_id = 'checkin-photos'
           and (storage.foldername(o.name))[1] = auth.uid()::text) < 300
  );
