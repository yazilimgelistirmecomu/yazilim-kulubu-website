-- Project detail pages, featured club project and developers.
--
-- * projects: slug, summary, Markdown content, single "featured club project".
--   All new columns are nullable / defaulted, so existing rows stay valid.
--   Existing rows get a slug generated from their title.
-- * developers: separate table (NOT profiles) holding admin-entered public
--   contact details. Developers can belong to many projects.
-- * project_developers: project <-> developer link with per-project role.
-- * RLS: visitors read only; writes are admin-only via public.is_admin().
begin;

-- ---------------------------------------------------------------------------
-- projects: new columns
-- ---------------------------------------------------------------------------
alter table public.projects
  add column if not exists slug text,
  add column if not exists summary text,
  add column if not exists content_md text,
  add column if not exists is_featured_club_project boolean not null default false;

-- Backfill slugs for existing rows (Turkish characters transliterated).
with base as (
  select
    id,
    coalesce(
      nullif(
        trim(both '-' from regexp_replace(
          lower(translate(title, 'İıŞşĞğÜüÖöÇç', 'iissgguuoocc')),
          '[^a-z0-9]+', '-', 'g'
        )),
        ''
      ),
      'proje'
    ) as base_slug
  from public.projects
  where slug is null
),
numbered as (
  select
    id,
    base_slug,
    row_number() over (partition by base_slug order by id) as rn
  from base
)
update public.projects p
set slug = case
  when n.rn = 1 then n.base_slug
  else n.base_slug || '-' || substr(p.id::text, 1, 6)
end
from numbered n
where p.id = n.id
  and p.slug is null;

alter table public.projects drop constraint if exists projects_slug_format_check;
alter table public.projects
  add constraint projects_slug_format_check
  check (slug is null or (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100));

alter table public.projects drop constraint if exists projects_summary_length_check;
alter table public.projects
  add constraint projects_summary_length_check
  check (summary is null or char_length(summary) <= 400);

alter table public.projects drop constraint if exists projects_content_md_length_check;
alter table public.projects
  add constraint projects_content_md_length_check
  check (content_md is null or char_length(content_md) <= 50000);

create unique index if not exists projects_slug_key
  on public.projects (slug)
  where slug is not null;

-- At most one featured club project, enforced by the database.
create unique index if not exists projects_single_featured_club_project_idx
  on public.projects ((true))
  where is_featured_club_project;

-- Atomically move the "featured" flag. Pass NULL to clear it.
-- SECURITY INVOKER: RLS on projects still applies; the explicit check gives
-- a clear error for non-admins.
create or replace function public.set_featured_club_project(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  update public.projects
  set is_featured_club_project = false
  where is_featured_club_project;

  if p_id is not null then
    update public.projects
    set is_featured_club_project = true
    where id = p_id
      and status = 'approved';

    if not found then
      raise exception 'project_not_found_or_not_approved';
    end if;
  end if;
end;
$$;

revoke all on function public.set_featured_club_project(uuid) from public, anon;
grant execute on function public.set_featured_club_project(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- developers
-- ---------------------------------------------------------------------------
create table if not exists public.developers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  avatar_url text,
  email text,
  linkedin_url text,
  github_url text,
  website_url text,
  created_at timestamptz not null default now(),
  constraint developers_full_name_check
    check (char_length(btrim(full_name)) between 1 and 120),
  constraint developers_email_check
    check (email is null or (char_length(email) <= 254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  constraint developers_avatar_url_check
    check (avatar_url is null or (char_length(avatar_url) <= 2048 and avatar_url ~* '^https?://')),
  constraint developers_linkedin_url_check
    check (linkedin_url is null or (char_length(linkedin_url) <= 2048 and linkedin_url ~* '^https?://')),
  constraint developers_github_url_check
    check (github_url is null or (char_length(github_url) <= 2048 and github_url ~* '^https?://')),
  constraint developers_website_url_check
    check (website_url is null or (char_length(website_url) <= 2048 and website_url ~* '^https?://'))
);

-- ---------------------------------------------------------------------------
-- project_developers
-- ---------------------------------------------------------------------------
create table if not exists public.project_developers (
  project_id uuid not null references public.projects (id) on delete cascade,
  developer_id uuid not null references public.developers (id) on delete cascade,
  role text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (project_id, developer_id),
  constraint project_developers_role_check
    check (role is null or char_length(role) <= 120)
);

create index if not exists project_developers_developer_id_idx
  on public.project_developers (developer_id);
create index if not exists project_developers_project_sort_idx
  on public.project_developers (project_id, sort_order);

-- ---------------------------------------------------------------------------
-- RLS + grants
-- ---------------------------------------------------------------------------
alter table public.developers enable row level security;
alter table public.project_developers enable row level security;

revoke all privileges on table public.developers from anon, authenticated;
revoke all privileges on table public.project_developers from anon, authenticated;

grant select on table public.developers to anon;
grant select, insert, update, delete on table public.developers to authenticated;
grant select on table public.project_developers to anon;
grant select, insert, update, delete on table public.project_developers to authenticated;

drop policy if exists "Public can read developers of approved projects" on public.developers;
drop policy if exists "Admins can manage developers" on public.developers;
drop policy if exists "Public can read links of approved projects" on public.project_developers;
drop policy if exists "Admins can manage project developers" on public.project_developers;

-- Contact details are public, so only developers attached to at least one
-- approved project are readable by visitors. Admins see everyone.
create policy "Public can read developers of approved projects"
on public.developers
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.project_developers pd
    join public.projects p on p.id = pd.project_id
    where pd.developer_id = developers.id
      and p.status = 'approved'
  )
);

create policy "Admins can manage developers"
on public.developers
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Public can read links of approved projects"
on public.project_developers
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_developers.project_id
      and p.status = 'approved'
  )
);

create policy "Admins can manage project developers"
on public.project_developers
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

commit;
