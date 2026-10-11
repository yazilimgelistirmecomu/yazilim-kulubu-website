-- Unify the two "featured" concepts on events.
--
-- Until now events.type = 'featured' drove the hero on the Etkinlikler page,
-- while events.is_homepage_featured (20261013) drives the homepage card. From
-- now on is_homepage_featured is the single source of truth for both, managed
-- from one place in the admin panel.
--
-- 1. Keep the current hero visible: if no event is flagged yet, flag the
--    nearest future event that has type = 'featured'.
-- 2. Move every remaining type = 'featured' row to 'upcoming' (future date) or
--    'past' (date already passed). No rows are deleted.
-- 3. Narrow events_type_check to ('upcoming', 'past').
-- RLS policies and grants on public.events are unchanged.
begin;

-- 1. Preserve the hero (the partial unique index allows only one flagged row).
update public.events
set is_homepage_featured = true
where id = (
  select id
  from public.events
  where type = 'featured'
    and date > now()
  order by date asc
  limit 1
)
and not exists (
  select 1 from public.events where is_homepage_featured
);

-- 2. Re-type old featured rows by date.
update public.events
set type = case when date > now() then 'upcoming' else 'past' end
where type = 'featured';

-- 3. Narrow the constraint (no 'featured' rows are left at this point).
alter table public.events drop constraint if exists events_type_check;
alter table public.events
  add constraint events_type_check check (type in ('upcoming', 'past'));

commit;
