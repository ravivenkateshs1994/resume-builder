-- Comprehensive Supabase schema for the current app
-- Includes only the tables the app actually uses.

create table if not exists public.user_resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Resume Draft',
  resume_data jsonb not null,
  content_hash text,
  template_id text,
  template_name text,
  template_accent_color text,
  template_color_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_role text not null default '',
  job_description text not null,
  resume_snapshot jsonb not null,
  analysis_result jsonb not null,
  content_hash text,
  created_at timestamptz not null default now()
);

create index if not exists user_resumes_user_id_idx on public.user_resumes(user_id, updated_at desc);
create index if not exists user_analysis_user_id_idx on public.user_analysis(user_id, created_at desc);
create index if not exists user_resumes_template_id_idx on public.user_resumes(template_id);

alter table public.user_resumes enable row level security;
alter table public.user_analysis enable row level security;

-- user_resumes policies
drop policy if exists "user_resumes_select_own" on public.user_resumes;
create policy "user_resumes_select_own"
on public.user_resumes for select
using (auth.uid() = user_id);

drop policy if exists "user_resumes_insert_own" on public.user_resumes;
create policy "user_resumes_insert_own"
on public.user_resumes for insert
with check (auth.uid() = user_id);

drop policy if exists "user_resumes_update_own" on public.user_resumes;
create policy "user_resumes_update_own"
on public.user_resumes for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_resumes_delete_own" on public.user_resumes;
create policy "user_resumes_delete_own"
on public.user_resumes for delete
using (auth.uid() = user_id);

-- user_analysis policies
drop policy if exists "user_analysis_select_own" on public.user_analysis;
create policy "user_analysis_select_own"
on public.user_analysis for select
using (auth.uid() = user_id);

drop policy if exists "user_analysis_insert_own" on public.user_analysis;
create policy "user_analysis_insert_own"
on public.user_analysis for insert
with check (auth.uid() = user_id);

drop policy if exists "user_analysis_delete_own" on public.user_analysis;
create policy "user_analysis_delete_own"
on public.user_analysis for delete
using (auth.uid() = user_id);

-- Profiles table: used by the career-stage helper
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  career_stage text not null default 'FRESHER',
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_id_idx on public.profiles(id);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Upgrade-safe column additions for existing databases
alter table public.profiles
  add column if not exists career_stage text not null default 'FRESHER';

update public.profiles
set career_stage = 'FRESHER'
where career_stage is null;

alter table public.user_resumes
  add column if not exists content_hash text;

alter table public.user_resumes
  add column if not exists template_id text;

alter table public.user_resumes
  add column if not exists template_name text;

alter table public.user_resumes
  add column if not exists template_accent_color text;

alter table public.user_resumes
  add column if not exists template_color_name text;

create index if not exists user_resumes_template_id_idx on public.user_resumes(template_id);

alter table public.user_analysis
  add column if not exists content_hash text;

-- Uniqueness guards for deduplication

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_resumes_user_id_content_hash_key'
  ) then
    alter table public.user_resumes
      add constraint user_resumes_user_id_content_hash_key
      unique (user_id, content_hash);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_analysis_user_id_content_hash_key'
  ) then
    alter table public.user_analysis
      add constraint user_analysis_user_id_content_hash_key
      unique (user_id, content_hash);
  end if;
end $$;

create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_key text not null,
  source text not null default 'seed',
  job_snapshot jsonb not null,
  match_score numeric not null default 0,
  match_reason text,
  status text not null default 'saved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists saved_jobs_user_job_key_idx on public.saved_jobs(user_id, job_key);
create index if not exists saved_jobs_user_id_idx on public.saved_jobs(user_id, updated_at desc);

create table if not exists public.job_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_key text not null,
  source text not null default 'seed',
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists job_interactions_user_id_idx on public.job_interactions(user_id, created_at desc);
create index if not exists job_interactions_job_key_idx on public.job_interactions(job_key);

alter table public.saved_jobs enable row level security;
alter table public.job_interactions enable row level security;

-- saved_jobs policies
drop policy if exists "saved_jobs_select_own" on public.saved_jobs;
create policy "saved_jobs_select_own"
on public.saved_jobs for select
using (auth.uid() = user_id);

drop policy if exists "saved_jobs_insert_own" on public.saved_jobs;
create policy "saved_jobs_insert_own"
on public.saved_jobs for insert
with check (auth.uid() = user_id);

drop policy if exists "saved_jobs_update_own" on public.saved_jobs;
create policy "saved_jobs_update_own"
on public.saved_jobs for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "saved_jobs_delete_own" on public.saved_jobs;
create policy "saved_jobs_delete_own"
on public.saved_jobs for delete
using (auth.uid() = user_id);

-- job_interactions policies
drop policy if exists "job_interactions_select_own" on public.job_interactions;
create policy "job_interactions_select_own"
on public.job_interactions for select
using (auth.uid() = user_id);

drop policy if exists "job_interactions_insert_own" on public.job_interactions;
create policy "job_interactions_insert_own"
on public.job_interactions for insert
with check (auth.uid() = user_id);

drop policy if exists "job_interactions_delete_own" on public.job_interactions;
create policy "job_interactions_delete_own"
on public.job_interactions for delete
using (auth.uid() = user_id);
