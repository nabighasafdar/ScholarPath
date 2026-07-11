-- Tracks whether a user has completed the post-signup onboarding flow
-- (product intro + connect Gmail/Calendar). Safe to re-run.

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;
