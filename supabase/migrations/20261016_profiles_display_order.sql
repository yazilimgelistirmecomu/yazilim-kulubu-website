-- Admin-controlled ordering of team members.
--
-- * profiles.display_order: explicit position in the team list. Existing rows
--   are backfilled in created_at order, so the current order does not change.
--   New rows get the next value from a sequence, i.e. they are appended to the
--   end of the list.
-- * get_public_team_members(): same signature, security settings and grants as
--   before (SECURITY DEFINER, empty search_path, execute for anon and
--   authenticated only). It now orders by profiles.display_order; the returned
--   display_order stays a contiguous 1..n over the public rows.
-- * move_team_member(p_id, p_direction): swaps a member with the neighbouring
--   one ('up' / 'down') in one statement. SECURITY INVOKER: RLS still applies,
--   and the explicit check gives non-admins a clear error.
begin;

create sequence if not exists public.profiles_display_order_seq;

alter table public.profiles
  add column if not exists display_order bigint;

-- Backfill in the current (created_at) order. Only rows without a value.
with ordered as (
  select id, row_number() over (order by created_at nulls last, id) as rn
  from public.profiles
  where display_order is null
)
update public.profiles p
set display_order = o.rn
from ordered o
where p.id = o.id;

-- Continue the sequence after the highest existing value.
select setval(
  'public.profiles_display_order_seq',
  greatest((select coalesce(max(display_order), 0) from public.profiles), 1),
  (select coalesce(max(display_order), 0) from public.profiles) > 0
);

alter table public.profiles
  alter column display_order set default nextval('public.profiles_display_order_seq'),
  alter column display_order set not null;

alter sequence public.profiles_display_order_seq owned by public.profiles.display_order;

-- Inserts from the admin panel run as `authenticated` and evaluate the default.
grant usage on sequence public.profiles_display_order_seq to authenticated;

create index if not exists profiles_display_order_idx
  on public.profiles (display_order, id);

-- Same signature and security as 20260903_public_profile_privacy.sql.
create or replace function public.get_public_team_members()
returns table (
  public_id text,
  display_order bigint,
  first_name text,
  last_name text,
  "position" text,
  avatar_url text,
  linkedin_url text,
  instagram_url text,
  github_url text
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
    p.github_url::text
  from public.profiles as p
  where p.is_public = true
    and p.first_name is not null
    and p.last_name is not null
  order by p.display_order, p.created_at nulls last, p.id;
$$;

revoke all on function public.get_public_team_members()
from public, anon, authenticated;

grant execute on function public.get_public_team_members()
to anon, authenticated;

-- Move a member one step up or down by swapping display_order with the neighbour.
create or replace function public.move_team_member(p_id uuid, p_direction text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  cur_order bigint;
  nb_id uuid;
  nb_order bigint;
begin
  if not (select public.is_admin()) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  if p_direction not in ('up', 'down') then
    raise exception 'invalid_direction';
  end if;

  select display_order into cur_order from public.profiles where id = p_id;
  if not found then
    raise exception 'member_not_found';
  end if;

  if p_direction = 'up' then
    select id, display_order into nb_id, nb_order
    from public.profiles
    where (display_order, id) < (cur_order, p_id)
    order by display_order desc, id desc
    limit 1;
  else
    select id, display_order into nb_id, nb_order
    from public.profiles
    where (display_order, id) > (cur_order, p_id)
    order by display_order asc, id asc
    limit 1;
  end if;

  -- Already first / last: nothing to do.
  if nb_id is null then
    return;
  end if;

  update public.profiles
  set display_order = case id when p_id then nb_order else cur_order end
  where id in (p_id, nb_id);
end;
$$;

revoke all on function public.move_team_member(uuid, text) from public, anon;
grant execute on function public.move_team_member(uuid, text) to authenticated;

commit;
