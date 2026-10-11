-- Homepage "featured event", selected from the admin panel.
--
-- * events.is_homepage_featured: separate from events.type = 'featured', which
--   already drives the hero on the Etkinlikler page.
-- * At most one featured event, enforced by the database (partial unique index).
-- * set_featured_event(): atomically moves the flag. Pass NULL to clear it.
-- Existing RLS policies and grants on public.events are unchanged: visitors
-- can read, only admins (public.is_admin()) can write.
begin;

alter table public.events
  add column if not exists is_homepage_featured boolean not null default false;

-- At most one homepage featured event, enforced by the database.
create unique index if not exists events_single_homepage_featured_idx
  on public.events ((true))
  where is_homepage_featured;

-- Atomically move the "homepage featured" flag. Pass NULL to clear it.
-- SECURITY INVOKER: RLS on events still applies; the explicit check gives
-- a clear error for non-admins.
create or replace function public.set_featured_event(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  update public.events
  set is_homepage_featured = false
  where is_homepage_featured;

  if p_id is not null then
    update public.events
    set is_homepage_featured = true
    where id = p_id;

    if not found then
      raise exception 'event_not_found';
    end if;
  end if;
end;
$$;

revoke all on function public.set_featured_event(uuid) from public, anon;
grant execute on function public.set_featured_event(uuid) to authenticated;

commit;
