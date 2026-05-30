-- Migration: Add template metadata columns to user_resumes
-- Run this in the Supabase SQL editor or via psql against your project DB.

BEGIN;

ALTER TABLE public.user_resumes
  ADD COLUMN IF NOT EXISTS template_id text;

ALTER TABLE public.user_resumes
  ADD COLUMN IF NOT EXISTS template_name text;

ALTER TABLE public.user_resumes
  ADD COLUMN IF NOT EXISTS template_accent_color text;

ALTER TABLE public.user_resumes
  ADD COLUMN IF NOT EXISTS template_color_name text;

CREATE INDEX IF NOT EXISTS user_resumes_template_id_idx ON public.user_resumes(template_id);

COMMIT;
