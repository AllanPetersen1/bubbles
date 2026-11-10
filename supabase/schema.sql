-- Bubbles: prototype schema
-- Run once in the Supabase SQL editor, then run seed.sql.
-- Scope: producers, champagnes (cuvées), barcodes, profiles, check_ins, photos bucket.
-- Not yet here: follows, likes, comments, venues, flavour tags, reports. See README.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- Immutable wrapper so unaccented text can be stored and indexed ("Crémant" ~ "cremant")
create or replace function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, $1) $$;

-- ---------------------------------------------------------------- profiles

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Taster' check (char_length(display_name) <= 60),
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- One profile per sign-up. No email is copied: profiles are publicly readable.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', 'Taster'), 60),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------------------------- producers

create table public.producers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  country       text,
  region        text,
  -- NM négociant, RM grower-producer, CM cooperative, other
  producer_type text check (producer_type in ('NM', 'RM', 'CM', 'other')),
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);

-- --------------------------------------------------------------- champagnes
-- One row per cuvée. Vintage is chosen at check-in time.

create table public.champagnes (
  id          uuid primary key default gen_random_uuid(),
  producer_id uuid not null references public.producers (id) on delete restrict,
  name        text not null,
  category    text not null default 'Champagne',
  -- user-added bottles start 'pending' and need approving
  status      text not null default 'approved' check (status in ('approved', 'pending', 'rejected')),
  search_text text not null default '',
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (producer_id, name)
);

create index champagnes_search_trgm on public.champagnes using gin (search_text gin_trgm_ops);

create function public.champagnes_set_search_text()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  new.search_text := public.f_unaccent(lower(
    (select p.name from public.producers p where p.id = new.producer_id) || ' ' || new.name
  ));
  return new;
end;
$$;

create trigger champagnes_search_text
  before insert or update of name, producer_id on public.champagnes
  for each row execute function public.champagnes_set_search_text();

-- Renaming a producer refreshes its bottles' search text
create function public.producers_refresh_search()
returns trigger
language plpgsql
as $$
begin
  update public.champagnes set name = name where producer_id = new.id;
  return new;
end;
$$;

create trigger producers_rename
  after update of name on public.producers
  for each row execute function public.producers_refresh_search();

-- ---------------------------------------------------------------- barcodes
-- Deliberately NO unique constraint on ean alone: grower bottles often share
-- distributor barcodes, and one EAN can map to several cuvées.

create table public.barcodes (
  id            uuid primary key default gen_random_uuid(),
  ean           text not null check (ean ~ '^[0-9]{8,14}$'),
  champagne_id  uuid not null references public.champagnes (id) on delete cascade,
  confirmations int not null default 1,
  created_at    timestamptz not null default now(),
  unique (ean, champagne_id)
);
create index barcodes_ean_idx on public.barcodes (ean);

-- One vote per user per (ean, bottle), so confirmations cannot be inflated by repeating
create table public.barcode_votes (
  ean          text not null,
  champagne_id uuid not null references public.champagnes (id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  primary key (ean, champagne_id, user_id)
);

-- ---------------------------------------------------------------- check_ins
-- Rating scheme: half-stars, 0.5 to 5.0. The UI and this constraint agree.

create table public.check_ins (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  champagne_id uuid not null references public.champagnes (id) on delete restrict,
  vintage      smallint check (vintage between 1800 and 2100), -- null = non-vintage
  rating       numeric(2, 1) not null check (rating between 0.5 and 5.0 and rating * 2 = trunc(rating * 2)),
  dosage       text check (dosage in ('Brut Nature', 'Extra Brut', 'Brut', 'Extra Dry', 'Sec', 'Demi-Sec', 'Doux')),
  note         text check (char_length(note) <= 1000),
  venue        text check (char_length(venue) <= 120),
  thumb_path   text,
  full_path    text,
  created_at   timestamptz not null default now()
);

create index check_ins_created_idx on public.check_ins (created_at desc);
create index check_ins_user_created_idx on public.check_ins (user_id, created_at desc);
create index check_ins_champagne_idx on public.check_ins (champagne_id);

-- ---------------------------------------------------------------- functions
-- Shared row shape for the three bottle lookups below.
-- `score` = similarity for search, check-in count for popular, confirmations for EAN.

create function public.search_bottles(q text, lim int default 20)
returns table (id uuid, producer text, name text, category text, region text, score real)
language sql
stable
set search_path = public, extensions
as $$
  with query as (select public.f_unaccent(lower(btrim(q))) as t)
  select c.id, p.name, c.name, c.category, p.region,
         greatest(word_similarity(query.t, c.search_text), similarity(query.t, c.search_text))::real
  from public.champagnes c
  join public.producers p on p.id = c.producer_id
  cross join query
  where c.status = 'approved'
    and char_length(query.t) >= 2
    and (query.t <% c.search_text or c.search_text % query.t or c.search_text like '%' || query.t || '%')
  order by 6 desc, p.name, c.name
  limit least(greatest(lim, 1), 50);
$$;

create function public.popular_bottles(lim int default 8)
returns table (id uuid, producer text, name text, category text, region text, score real)
language sql
stable
set search_path = public
as $$
  select c.id, p.name, c.name, c.category, p.region, count(ci.id)::real
  from public.champagnes c
  join public.producers p on p.id = c.producer_id
  left join public.check_ins ci on ci.champagne_id = c.id
  where c.status = 'approved'
  group by c.id, p.id
  order by 6 desc, p.name, c.name
  limit least(greatest(lim, 1), 50);
$$;

create function public.bottles_by_ean(p_ean text)
returns table (id uuid, producer text, name text, category text, region text, score real)
language sql
stable
set search_path = public
as $$
  select c.id, p.name, c.name, c.category, p.region, b.confirmations::real
  from public.barcodes b
  join public.champagnes c on c.id = b.champagne_id
  join public.producers p on p.id = c.producer_id
  where b.ean = p_ean and c.status = 'approved'
  order by b.confirmations desc, p.name, c.name;
$$;

-- Link a scanned barcode to a bottle. Runs as owner so clients cannot write barcodes directly.
create function public.confirm_barcode(p_ean text, p_champagne_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.barcodes (ean, champagne_id, confirmations)
  values (p_ean, p_champagne_id, 0)
  on conflict (ean, champagne_id) do nothing;

  insert into public.barcode_votes (ean, champagne_id, user_id)
  values (p_ean, p_champagne_id, auth.uid())
  on conflict do nothing;

  update public.barcodes b
  set confirmations = (
    select count(*) from public.barcode_votes v
    where v.ean = b.ean and v.champagne_id = b.champagne_id
  )
  where b.ean = p_ean and b.champagne_id = p_champagne_id;
end;
$$;

revoke execute on function public.confirm_barcode(text, uuid) from public, anon;
grant execute on function public.confirm_barcode(text, uuid) to authenticated;

-- ------------------------------------------------------- row level security

alter table public.profiles       enable row level security;
alter table public.producers      enable row level security;
alter table public.champagnes     enable row level security;
alter table public.barcodes       enable row level security;
alter table public.barcode_votes  enable row level security;
alter table public.check_ins      enable row level security;

-- profiles: public read (the feed shows names), owner edits
create policy "profiles are readable" on public.profiles for select using (true);
create policy "owner edits profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- producers: public read, signed-in users can add (moderation comes later)
create policy "producers are readable" on public.producers for select using (true);
create policy "members add producers" on public.producers for insert to authenticated
  with check (created_by = auth.uid());

-- champagnes: approved are public, your own pending ones are visible to you
create policy "approved bottles are readable" on public.champagnes for select
  using (status = 'approved' or created_by = auth.uid());
create policy "members add pending bottles" on public.champagnes for insert to authenticated
  with check (status = 'pending' and created_by = auth.uid());

-- barcodes: public read, written only through confirm_barcode()
create policy "barcodes are readable" on public.barcodes for select using (true);

-- barcode_votes: a user sees only their own
create policy "own votes are readable" on public.barcode_votes for select to authenticated
  using (user_id = auth.uid());

-- check_ins: public feed, owner-only writes
create policy "check-ins are readable" on public.check_ins for select using (true);
create policy "members post own check-ins" on public.check_ins for insert to authenticated
  with check (user_id = auth.uid());
create policy "owner edits check-in" on public.check_ins for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owner deletes check-in" on public.check_ins for delete to authenticated
  using (user_id = auth.uid());

-- ------------------------------------------------------------------ storage
-- Public bucket: photo URLs work without a SELECT policy, so the bucket cannot be listed.
-- Files must live in a folder named after the uploader's user id.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('checkin-photos', 'checkin-photos', true, 524288, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

create policy "members upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'checkin-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "members delete own photos" on storage.objects for delete to authenticated
  using (bucket_id = 'checkin-photos' and (storage.foldername(name))[1] = auth.uid()::text);
