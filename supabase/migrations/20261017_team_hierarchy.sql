-- Team hierarchy (organisation chart on /ekibimiz).
--
-- * team_branches: admin-managed list of branches/teams (Mobil Kolu, ...).
--   Admin-only table; visitors only ever see branch name/slug/order through
--   get_public_team_members().
-- * profiles.hierarchy_level: president | vice_president | branch_lead |
--   member (fixed list, the UI logic depends on these four).
-- * profiles.branch_id: optional branch/team of the person.
-- * One-time backfill from the free-text "position" (see
--   supabase/checks/20261017_team_hierarchy_dryrun.sql for the same rules as a
--   read-only preview). Unmatched people stay 'member' without a branch.
-- * get_public_team_members(): return type grows, so it is dropped and
--   recreated. Security settings and grants are identical to before
--   (SECURITY DEFINER, empty search_path, md5 public_id, only is_public rows,
--   execute for anon and authenticated only).
begin;

-- ---------------------------------------------------------------------------
-- team_branches
-- ---------------------------------------------------------------------------
create table if not exists public.team_branches (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  display_order integer not null default 0,
  created_at timestamptz default now(),
  constraint team_branches_slug_key unique (slug),
  constraint team_branches_slug_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  constraint team_branches_name_check check (char_length(btrim(name)) between 1 and 80)
);

alter table public.team_branches enable row level security;

drop policy if exists "Admins can manage team branches" on public.team_branches;
create policy "Admins can manage team branches"
on public.team_branches
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

revoke all privileges on table public.team_branches from public, anon, authenticated;
grant select, insert, update, delete on table public.team_branches to authenticated;

insert into public.team_branches (slug, name, display_order) values
  ('mobil',        'Mobil Kolu',            10),
  ('web',          'Web Geliştirme Kolu',   20),
  ('oyun',         'Oyun Geliştirme Kolu',  30),
  ('blockchain',   'Blockchain Kolu',       40),
  ('sosyal-medya', 'Sosyal Medya Ekibi',    50),
  ('sponsorluk',   'Sponsorluk Ekibi',      60)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- profiles columns
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists hierarchy_level text not null default 'member',
  add column if not exists branch_id uuid;

alter table public.profiles drop constraint if exists profiles_hierarchy_level_check;
alter table public.profiles
  add constraint profiles_hierarchy_level_check
  check (hierarchy_level in ('president', 'vice_president', 'branch_lead', 'member'));

alter table public.profiles drop constraint if exists profiles_branch_id_fkey;
alter table public.profiles
  add constraint profiles_branch_id_fkey
  foreign key (branch_id) references public.team_branches (id) on delete set null;

create index if not exists profiles_branch_id_idx on public.profiles (branch_id);

-- ---------------------------------------------------------------------------
-- One-time backfill from "position" (same rules as the dry-run file)
-- ---------------------------------------------------------------------------
with norm as (
  select
    p.id,
    pg_catalog.lower(pg_catalog.translate(coalesce(p."position", ''), 'İIıŞşĞğÜüÖöÇç', 'iiissgguuoocc')) as n
  from public.profiles as p
),
lvl as (
  select id,
    case
      when n ~ 'baskan\s*yardimci' or n ~ 'bsk\.?\s*yrd' or n ~ 'yardimcisi' then 'vice_president'
      when n ~ 'kol(u)?\s*(baskan|lider)' then 'branch_lead'
      when n ~ '^\s*(kulup\s+|yonetim\s+kurulu\s+)?baskan(i)?\s*$' then 'president'
      else 'member'
    end as level,
    array_remove(array[
      case when n ~ 'mobil' then 'mobil' end,
      case when n ~ 'web' then 'web' end,
      case when n ~ 'oyun|game' then 'oyun' end,
      case when n ~ 'blockchain|block\s*chain|blokzincir' then 'blockchain' end,
      case when n ~ 'sosyal\s*medya' then 'sosyal-medya' end,
      case when n ~ 'sponsor' then 'sponsorluk' end
    ], null) as hits
  from norm
)
update public.profiles as p
set hierarchy_level = l.level,
    branch_id = case
      when l.level in ('president', 'vice_president') then null
      when pg_catalog.cardinality(l.hits) = 1
        then (select b.id from public.team_branches as b where b.slug = l.hits[1])
    end
from lvl as l
where l.id = p.id;

-- ---------------------------------------------------------------------------
-- get_public_team_members(): new fields, same security as before
-- ---------------------------------------------------------------------------
drop function if exists public.get_public_team_members();

create function public.get_public_team_members()
returns table (
  public_id text,
  display_order bigint,
  first_name text,
  last_name text,
  "position" text,
  avatar_url text,
  linkedin_url text,
  instagram_url text,
  github_url text,
  hierarchy_level text,
  branch_slug text,
  branch_name text,
  branch_order integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    pg_catalog.md5(p.id::text) as public_id,
    row_number() over (order by p.display_order, p.created_at nulls last, p.id) as display_order,
    p.first_name::text,
    p.last_name::text,
    p.position::text,
    p.avatar_url::text,
    p.linkedin_url::text,
    p.instagram_url::text,
    p.github_url::text,
    p.hierarchy_level::text,
    b.slug::text as branch_slug,
    b.name::text as branch_name,
    b.display_order as branch_order
  from public.profiles as p
  left join public.team_branches as b on b.id = p.branch_id
  where p.is_public = true
    and p.first_name is not null
    and p.last_name is not null
  order by p.display_order, p.created_at nulls last, p.id;
$$;

revoke all on function public.get_public_team_members()
from public, anon, authenticated;

grant execute on function public.get_public_team_members()
to anon, authenticated;

commit;
