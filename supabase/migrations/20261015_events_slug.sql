-- Event detail pages: slug column on events.
--
-- * events.slug: nullable text, unique when present, URL-safe format.
--   Existing rows get a slug generated from their title (Turkish characters
--   transliterated), same approach as projects (20261011).
-- * RLS policies and grants on public.events are unchanged: visitors read,
--   admins write via public.is_admin().
begin;

alter table public.events
  add column if not exists slug text;

-- Backfill slugs for existing rows.
with base as (
  select
    id,
    coalesce(
      nullif(
        left(
          trim(both '-' from regexp_replace(
            lower(translate(title, 'İıŞşĞğÜüÖöÇç', 'iissgguuoocc')),
            '[^a-z0-9]+', '-', 'g'
          )),
          100
        ),
        ''
      ),
      'etkinlik'
    ) as base_slug
  from public.events
  where slug is null
),
numbered as (
  select
    id,
    base_slug,
    row_number() over (partition by base_slug order by id) as rn
  from base
)
update public.events e
set slug = case
  when n.rn = 1 then n.base_slug
  else left(n.base_slug, 93) || '-' || substr(e.id::text, 1, 6)
end
from numbered n
where e.id = n.id
  and e.slug is null;

-- Trimming to 100 chars can leave a trailing '-'; clean it up.
update public.events
set slug = trim(both '-' from slug)
where slug is not null and slug <> trim(both '-' from slug);

alter table public.events drop constraint if exists events_slug_format_check;
alter table public.events
  add constraint events_slug_format_check
  check (slug is null or (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100));

create unique index if not exists events_slug_key
  on public.events (slug)
  where slug is not null;

commit;
