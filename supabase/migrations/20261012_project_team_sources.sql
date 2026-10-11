-- Project team members can come from two sources:
--   * public.developers  (non-club / member projects, entered by admins)
--   * public.profiles    (club projects: the existing Team/Management people)
--
-- Design notes
-- * project_developers gets a nullable profile_id; exactly one of
--   developer_id / profile_id must be set. Existing rows are untouched.
-- * profiles is NOT opened to visitors. Visitors read the team only through
--   get_project_team(), a SECURITY DEFINER function that returns a fixed set of
--   public fields for approved projects (profiles only when is_public = true).
-- * Because the real profile id must never leak, the anon SELECT policies and
--   privileges on project_developers AND developers are removed. All public
--   reads go through get_project_team(); only admins touch the tables.
-- * save_project() saves the project, its team and the featured flag in one
--   transaction.
begin;

-- ---------------------------------------------------------------------------
-- developers: optional Instagram
-- ---------------------------------------------------------------------------
alter table public.developers
  add column if not exists instagram_url text;

alter table public.developers drop constraint if exists developers_instagram_url_check;
alter table public.developers
  add constraint developers_instagram_url_check
  check (instagram_url is null or (char_length(instagram_url) <= 2048 and instagram_url ~* '^https?://'));

-- ---------------------------------------------------------------------------
-- project_developers: developer OR profile
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'project_developers'
      and column_name = 'id'
  ) then
    alter table public.project_developers
      add column id uuid not null default gen_random_uuid();
    alter table public.project_developers
      drop constraint project_developers_pkey;
    alter table public.project_developers
      add primary key (id);
  end if;
end
$$;

alter table public.project_developers
  alter column developer_id drop not null;

alter table public.project_developers
  add column if not exists profile_id uuid
  references public.profiles (id) on delete cascade;

alter table public.project_developers drop constraint if exists project_developers_one_person_check;
alter table public.project_developers
  add constraint project_developers_one_person_check
  check (num_nonnulls(developer_id, profile_id) = 1);

create unique index if not exists project_developers_project_developer_key
  on public.project_developers (project_id, developer_id)
  where developer_id is not null;

create unique index if not exists project_developers_project_profile_key
  on public.project_developers (project_id, profile_id)
  where profile_id is not null;

create index if not exists project_developers_profile_id_idx
  on public.project_developers (profile_id)
  where profile_id is not null;

-- ---------------------------------------------------------------------------
-- RLS: public reads go through get_project_team() only
-- ---------------------------------------------------------------------------
drop policy if exists "Public can read developers of approved projects" on public.developers;
drop policy if exists "Public can read links of approved projects" on public.project_developers;

revoke select on table public.developers from anon;
revoke select on table public.project_developers from anon;

-- ---------------------------------------------------------------------------
-- get_project_team(): the only public read path for a project's team
-- ---------------------------------------------------------------------------
create or replace function public.get_project_team(p_project_id uuid)
returns table (
  member_key text,
  source text,
  full_name text,
  avatar_url text,
  role text,
  email text,
  linkedin_url text,
  github_url text,
  instagram_url text,
  website_url text,
  sort_order integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    pg_catalog.md5('developer:' || d.id::text) as member_key,
    'developer'::text as source,
    d.full_name::text as full_name,
    d.avatar_url::text as avatar_url,
    nullif(pg_catalog.btrim(pd.role), '')::text as role,
    d.email::text as email,
    d.linkedin_url::text as linkedin_url,
    d.github_url::text as github_url,
    d.instagram_url::text as instagram_url,
    d.website_url::text as website_url,
    pd.sort_order as sort_order
  from public.project_developers as pd
  join public.projects as pr
    on pr.id = pd.project_id
   and pr.status = 'approved'
  join public.developers as d
    on d.id = pd.developer_id
  where pd.project_id = p_project_id

  union all

  select
    pg_catalog.md5('profile:' || p.id::text),
    'profile'::text,
    pg_catalog.btrim(p.first_name || ' ' || p.last_name)::text,
    p.avatar_url::text,
    coalesce(
      nullif(pg_catalog.btrim(pd.role), ''),
      nullif(pg_catalog.btrim(p.position), '')
    )::text,
    null::text,
    nullif(pg_catalog.btrim(p.linkedin_url), '')::text,
    nullif(pg_catalog.btrim(p.github_url), '')::text,
    nullif(pg_catalog.btrim(p.instagram_url), '')::text,
    null::text,
    pd.sort_order
  from public.project_developers as pd
  join public.projects as pr
    on pr.id = pd.project_id
   and pr.status = 'approved'
  join public.profiles as p
    on p.id = pd.profile_id
  where pd.project_id = p_project_id
    and p.is_public = true
    and p.first_name is not null
    and p.last_name is not null

  order by 11, 3, 1;
$$;

revoke all on function public.get_project_team(uuid) from public, anon, authenticated;
grant execute on function public.get_project_team(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- save_project(): project + team + featured flag in ONE transaction
--
--   p_id          null = create, otherwise update that project
--   p_project     jsonb of project fields. On update only keys that are present
--                 are changed. Allowed keys: title, description, is_club_project,
--                 status, demo_url, github_url, tech_stack, image_url,
--                 show_on_homepage, homepage_order, slug, summary, content_md,
--                 created_by. Anything else is ignored.
--   p_assignments jsonb array of {"kind":"developer"|"profile","id":uuid,"role":text}
--                 in display order. null = leave the team unchanged.
--   p_featured    true / false = set / clear the featured flag; null = unchanged
--
-- SECURITY INVOKER: admin RLS still applies; the explicit check gives a clear
-- error. Existing assignments are never dropped implicitly: the team is only
-- replaced when p_assignments is supplied.
-- ---------------------------------------------------------------------------
create or replace function public.save_project(
  p_id uuid,
  p_project jsonb,
  p_assignments jsonb default null,
  p_featured boolean default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := p_id;
  r public.projects;
  cur public.projects;
begin
  if not (select public.is_admin()) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  if p_project is null or jsonb_typeof(p_project) <> 'object' then
    raise exception 'invalid_project_payload';
  end if;

  r := jsonb_populate_record(null::public.projects, p_project);

  if v_id is null then
    insert into public.projects (
      title, description, is_club_project, status, demo_url, github_url,
      tech_stack, image_url, show_on_homepage, homepage_order,
      slug, summary, content_md, created_by
    )
    values (
      r.title, r.description, coalesce(r.is_club_project, true),
      coalesce(r.status, 'pending'), r.demo_url, r.github_url,
      r.tech_stack, r.image_url, coalesce(r.show_on_homepage, false),
      r.homepage_order, r.slug, r.summary, r.content_md, r.created_by
    )
    returning id into v_id;
  else
    update public.projects p
    set
      title            = case when p_project ? 'title'            then r.title            else p.title end,
      description      = case when p_project ? 'description'      then r.description      else p.description end,
      is_club_project  = case when p_project ? 'is_club_project'  then r.is_club_project  else p.is_club_project end,
      status           = case when p_project ? 'status'           then r.status           else p.status end,
      demo_url         = case when p_project ? 'demo_url'         then r.demo_url         else p.demo_url end,
      github_url       = case when p_project ? 'github_url'       then r.github_url       else p.github_url end,
      tech_stack       = case when p_project ? 'tech_stack'       then r.tech_stack       else p.tech_stack end,
      image_url        = case when p_project ? 'image_url'        then r.image_url        else p.image_url end,
      show_on_homepage = case when p_project ? 'show_on_homepage' then coalesce(r.show_on_homepage, false) else p.show_on_homepage end,
      homepage_order   = case when p_project ? 'homepage_order'   then r.homepage_order   else p.homepage_order end,
      slug             = case when p_project ? 'slug'             then r.slug             else p.slug end,
      summary          = case when p_project ? 'summary'          then r.summary          else p.summary end,
      content_md       = case when p_project ? 'content_md'       then r.content_md       else p.content_md end,
      created_by       = case when p_project ? 'created_by'       then r.created_by       else p.created_by end
    where p.id = v_id;

    if not found then
      raise exception 'project_not_found';
    end if;
  end if;

  -- Team (replace as a whole, inside this transaction)
  if p_assignments is not null then
    if jsonb_typeof(p_assignments) <> 'array' then
      raise exception 'invalid_assignments_payload';
    end if;

    if exists (
      select 1
      from jsonb_array_elements(p_assignments) as a
      where coalesce(a ->> 'kind', '') not in ('developer', 'profile')
         or (a ->> 'id') is null
    ) then
      raise exception 'invalid_assignment';
    end if;

    if exists (
      select 1
      from jsonb_array_elements(p_assignments) as a
      group by a ->> 'kind', a ->> 'id'
      having count(*) > 1
    ) then
      raise exception 'duplicate_assignment';
    end if;

    delete from public.project_developers where project_id = v_id;

    insert into public.project_developers (project_id, developer_id, profile_id, role, sort_order)
    select
      v_id,
      case when a.item ->> 'kind' = 'developer' then (a.item ->> 'id')::uuid end,
      case when a.item ->> 'kind' = 'profile'   then (a.item ->> 'id')::uuid end,
      nullif(pg_catalog.btrim(a.item ->> 'role'), ''),
      (a.ord - 1)::integer
    from jsonb_array_elements(p_assignments) with ordinality as a(item, ord);
  end if;

  -- Featured club project (single, enforced by a unique index as well)
  if p_featured is false then
    update public.projects set is_featured_club_project = false where id = v_id;
  end if;

  select * into cur from public.projects where id = v_id;

  if p_featured is true or cur.is_featured_club_project then
    if cur.status is distinct from 'approved' or cur.is_club_project is distinct from true then
      raise exception 'featured_requires_approved_club_project';
    end if;
  end if;

  if p_featured is true then
    update public.projects set is_featured_club_project = false
    where is_featured_club_project and id <> v_id;
    update public.projects set is_featured_club_project = true where id = v_id;
  end if;

  return v_id;
end;
$$;

revoke all on function public.save_project(uuid, jsonb, jsonb, boolean) from public, anon;
grant execute on function public.save_project(uuid, jsonb, jsonb, boolean) to authenticated;

commit;
