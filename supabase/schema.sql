-- Run in Supabase SQL editor

create table if not exists public.user_resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Resume Draft',
  resume_data jsonb not null,
  content_hash text,
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

alter table public.user_resumes enable row level security;
alter table public.user_analysis enable row level security;

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

-- ============================================================
-- Deduplication: content_hash columns + unique constraints
-- Run this block in the Supabase SQL editor if the tables
-- already exist (i.e. upgrading an existing database).
-- ============================================================
alter table public.user_resumes
  add column if not exists content_hash text;

alter table public.user_analysis
  add column if not exists content_hash text;

-- Unique constraint: one resume per (user, content) pair
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

-- Unique constraint: one analysis per (user, content) pair
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
