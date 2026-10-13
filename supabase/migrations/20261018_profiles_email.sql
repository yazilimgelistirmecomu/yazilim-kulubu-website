-- Optional public contact e-mail for team members.
--
-- * profiles.email: nullable, simple format check. Filling it in makes it
--   publicly visible on /ekibimiz and the home page team preview.
-- * get_public_team_members(): return type grows, so it is dropped and
--   recreated. Security settings and grants are identical to before
--   (SECURITY DEFINER, empty search_path, md5 public_id, only is_public rows,
--   execute for anon and authenticated only).
-- * profiles table grants are table-level, so the new column needs no extra
--   grant; anon still cannot read the table directly (only the function).
begin;

alter table public.profiles
  add column if not exists email text;

alter table public.profiles drop constraint if exists profiles_email_check;
alter table public.profiles
  add constraint profiles_email_check
  check (email is null or (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'));

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
  email text,
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
    p.email::text,
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
