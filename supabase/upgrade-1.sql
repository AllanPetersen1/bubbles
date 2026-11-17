-- Bubbles upgrade 1. Run once in the SQL editor after schema.sql (before seed-reference.sql).
-- Safe to re-run. Adds:
--   * quarter-star ratings
--   * custom display name / avatar that override the Google values
--   * reference data (appellations, producer village/sub-region) and the search/suggest functions on it
--   * storage policies so photo and avatar uploads work (they were failing without them)
--   * column-level update rights, so owners can edit a check-in's content but not its owner, bottle or date

-- ------------------------------------------------------------------ ratings
-- 0.25 to 5.00 in quarter steps (was half steps). Existing half-star rows still satisfy it.

alter table public.check_ins alter column rating type numeric(3, 2);
alter table public.check_ins drop constraint if exists check_ins_rating_check;
alter table public.check_ins add constraint check_ins_rating_check
  check (rating between 0.25 and 5.0 and rating * 4 = trunc(rating * 4));

-- ----------------------------------------------------------------- profiles
-- display_name / avatar_url stay the Google snapshot taken at sign-up.
-- The app shows custom_* when set and falls back to the snapshot when null.

alter table public.profiles
  add column if not exists custom_display_name text
    check (char_length(custom_display_name) between 1 and 60),
  add column if not exists custom_avatar_url text;

-- A storage path inside your own folder, never an arbitrary URL (profiles are public).
alter table public.profiles drop constraint if exists profiles_custom_avatar_own;
alter table public.profiles add constraint profiles_custom_avatar_own
  check (custom_avatar_url is null or custom_avatar_url like id::text || '/%');

-- ---------------------------------------------------------- reference data

create table if not exists public.appellations (
  id      uuid primary key default gen_random_uuid(),
  name    text not null unique,
  country text not null,
  region  text,
  kind    text not null check (kind in ('AOC', 'DOCG', 'DOC', 'DO', 'PDO', 'other'))
);

alter table public.appellations enable row level security;
drop policy if exists "appellations are readable" on public.appellations;
create policy "appellations are readable" on public.appellations for select using (true);

alter table public.producers
  add column if not exists village   text, -- e.g. Aÿ, Le Mesnil-sur-Oger
  add column if not exists subregion text; -- e.g. Côte des Blancs (growers only: houses blend across areas)

alter table public.champagnes
  add column if not exists appellation_id uuid references public.appellations (id) on delete set null;
create index if not exists champagnes_appellation_idx on public.champagnes (appellation_id);

-- search_text now also carries village, sub-region, region and appellation,
-- so "Côte des Blancs" or "Franciacorta" finds bottles with the existing search_bottles().
create or replace function public.champagnes_set_search_text()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
declare
  words text;
begin
  select concat_ws(' ', p.name, new.name, p.village, p.subregion, p.region, a.name)
  into words
  from public.producers p
  left join public.appellations a on a.id = new.appellation_id
  where p.id = new.producer_id;
  new.search_text := public.f_unaccent(lower(words));
  return new;
end;
$$;

drop trigger if exists champagnes_search_text on public.champagnes;
create trigger champagnes_search_text
  before insert or update of name, producer_id, appellation_id on public.champagnes
  for each row execute function public.champagnes_set_search_text();

-- shortcut: renaming an appellation does not refresh bottles; touch champagnes.name to rebuild.
drop trigger if exists producers_rename on public.producers;
create trigger producers_rename
  after update of name, village, subregion, region on public.producers
  for each row execute function public.producers_refresh_search();

-- Autocomplete for the things that are not a bottle: producers, appellations, areas.
-- Cuvées are already returned (with their producer) by search_bottles().
-- shortcut: scans the small reference tables per call; add trigram indexes past ~10k rows.
create or replace function public.suggest_reference(q text, lim int default 8)
returns table (kind text, label text, detail text)
language sql
stable
set search_path = public, extensions
as $$
  with query as (select public.f_unaccent(lower(btrim(q))) as t),
  cand as (
    select 'producer'::text as kind, p.name as label, concat_ws(' · ', p.village, p.region) as detail
      from public.producers p
    union all
    select 'appellation', a.name, concat_ws(' · ', a.region, a.country)
      from public.appellations a
    union all
    select 'area', x.area, max(x.country)
      from (
        select subregion as area, country from public.producers
        union all select village, country from public.producers
        union all select region, country from public.producers
      ) x
      where x.area is not null
      group by x.area
  ),
  scored as (
    select cand.*, word_similarity(query.t, public.f_unaccent(lower(cand.label))) as score
    from cand cross join query
    where char_length(query.t) >= 2
  ),
  ranked as (
    select scored.*, row_number() over (partition by kind order by score desc, label) as rn
    from scored
    where score >= 0.4
  )
  select kind, label, detail
  from ranked
  where rn <= 3
  order by score desc, kind, label
  limit least(greatest(lim, 1), 20);
$$;

-- ---------------------------------------------------- photo and avatar uploads
-- The app uploads with upsert (same bytes, same name: re-uploading is harmless), and Storage
-- needs select + update permission for that, not only insert. With only the insert and
-- delete policies from schema.sql every upload fails with
-- "new row violates row-level security policy". Both new policies stay inside your own folder.
-- The bucket is public, so image URLs do not depend on them.

drop policy if exists "members read own photos" on storage.objects;
create policy "members read own photos" on storage.objects for select to authenticated
  using (bucket_id = 'checkin-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "members update own photos" on storage.objects;
create policy "members update own photos" on storage.objects for update to authenticated
  using (bucket_id = 'checkin-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'checkin-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ------------------------------------------------------ owner-only editing
-- RLS already limits updates to your own rows. Column grants additionally stop
-- an owner from moving a check-in to another bottle, back-dating it or swapping its photo.

revoke update on public.check_ins from authenticated;
grant update (vintage, rating, dosage, note, venue) on public.check_ins to authenticated;

revoke update on public.profiles from authenticated;
grant update (custom_display_name, custom_avatar_url) on public.profiles to authenticated;

-- Rebuild search_text for existing bottles
update public.champagnes set name = name;
