begin;

-- Base schema for a brand-new Supabase project. It is derived from the calls
-- in src/** and src/types/database.types.ts, and is intentionally ordered
-- before the 20260903_* migrations. Those migrations own RLS, grants, the
-- is_admin()/RPC functions, rate-limit triggers and the applications/page_views
-- CHECK constraints, so they are not duplicated here.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- id intentionally has no FK to auth.users: team members without a login are
-- created from the admin panel (see fix_team_schema.sql). An auth user that
-- should be able to sign in as admin needs a row here with the same id.
create table if not exists public.profiles (
  id uuid primary key,
  first_name text,
  last_name text,
  position text,
  department text,
  avatar_url text,
  linkedin_url text,
  github_url text,
  instagram_url text,
  role text default 'member',
  is_public boolean not null default true,
  created_at timestamptz default now(),
  constraint profiles_role_check check (role is null or role in ('member', 'admin'))
);

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date timestamptz not null,
  description text,
  location text,
  image_url text,
  type text not null default 'upcoming',
  capacity integer,
  registration_url text,
  gallery_urls text[],
  created_by uuid,
  created_at timestamptz default now(),
  constraint events_type_check check (type in ('featured', 'upcoming', 'past')),
  constraint events_capacity_check check (capacity is null or capacity >= 0),
  constraint events_created_by_fkey
    foreign key (created_by) references public.profiles (id) on delete set null
);

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  github_url text,
  demo_url text,
  image_url text,
  tech_stack text[],
  is_club_project boolean default true,
  status text default 'pending',
  created_by uuid,
  created_at timestamptz default now(),
  constraint projects_status_check
    check (status is null or status in ('pending', 'approved', 'rejected')),
  constraint projects_created_by_fkey
    foreign key (created_by) references public.profiles (id) on delete set null
);

-- ---------------------------------------------------------------------------
-- project_members
-- ---------------------------------------------------------------------------
create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid,
  project_id uuid,
  role text,
  constraint project_members_profile_id_fkey
    foreign key (profile_id) references public.profiles (id) on delete cascade,
  constraint project_members_project_id_fkey
    foreign key (project_id) references public.projects (id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- applications (contact / join / project forms)
-- ---------------------------------------------------------------------------
-- Length/format/type/status CHECKs and the rate-limit trigger are added by
-- 20260903_public_submission_hardening.sql.
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  department text,
  message text not null,
  type text not null,
  status text default 'pending',
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- page_views (anonymous analytics)
-- ---------------------------------------------------------------------------
create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  session_id text not null,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- site_settings (key/value; Settings.tsx upserts on the primary key)
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value text
);

-- ---------------------------------------------------------------------------
-- Indexes for foreign keys and the ORDER BY / filter columns the UI uses
-- ---------------------------------------------------------------------------
create index if not exists events_date_idx on public.events (date);
create index if not exists events_created_by_idx on public.events (created_by);
create index if not exists projects_status_created_at_idx on public.projects (status, created_at desc);
create index if not exists projects_created_by_idx on public.projects (created_by);
create index if not exists project_members_profile_id_idx on public.project_members (profile_id);
create index if not exists project_members_project_id_idx on public.project_members (project_id);
create index if not exists applications_status_idx on public.applications (status);
create index if not exists profiles_created_at_idx on public.profiles (created_at);

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
-- Both buckets are public because the app uses getPublicUrl(). Access control
-- for writes lives in the storage.objects policies of
-- 20260903_admin_authorization and 20260903_storage_upload_hardening.
-- event-covers also holds gallery/ and about/ uploads; project-images also
-- holds team avatars.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('event-covers',   'event-covers',   true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('project-images', 'project-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

commit;

-- ---------------------------------------------------------------------------
-- First admin (NOT executed; run manually after creating the user)
-- ---------------------------------------------------------------------------
-- 1. Authentication > Users > Add user (email + password, auto-confirm).
-- 2. Copy that user's UUID and run in the SQL editor:
--
--   insert into public.profiles (id, first_name, last_name, role, is_public)
--   values ('<AUTH_USER_UUID>', '<Ad>', '<Soyad>', 'admin', false);
--
-- Without this row ProtectedRoute rejects every login (role must be 'admin').
