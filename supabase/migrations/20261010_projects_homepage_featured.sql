-- Homepage "featured projects" selection, managed from the admin panel.
-- Existing RLS policies and grants on public.projects are unchanged:
-- visitors can only read approved rows, only admins can write.
begin;

alter table public.projects
  add column if not exists show_on_homepage boolean not null default false,
  add column if not exists homepage_order integer;

create index if not exists projects_homepage_order_idx
  on public.projects (homepage_order)
  where show_on_homepage;

commit;
