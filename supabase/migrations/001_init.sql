-- ScholarPath Postgres schema (see ARCHITECTURE.md + lib/action-result.ts)
-- Run in Supabase Dashboard → SQL Editor → New query → Run
--
-- Fresh install: run this file only.
-- Existing DB (old 001 without pipeline columns): run 002_pipeline.sql instead.

-- ---------------------------------------------------------------------------
-- profiles — 1:1 with auth.users, auto-created on signup
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- paper_sessions — research workspace (idea → venue → outline → coaching → readiness)
-- ---------------------------------------------------------------------------
create table if not exists public.paper_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  idea_text text not null,
  uniqueness_score integer check (uniqueness_score is null or uniqueness_score between 0 and 100),
  status text not null default 'draft' check (status in (
    'draft',
    'scoring',
    'scored',
    'archived',
    'venue_selected',
    'outline_ready',
    'coaching',
    'readiness_checked'
  )),
  -- Pipeline payloads (written by dashboard server actions)
  selected_venue jsonb,
  outline jsonb,
  section_feedback jsonb,
  readiness jsonb,
  deadline_tracking jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.paper_sessions.selected_venue is
  'Chosen conference/venue (ConferenceVenue + selectedAt)';
comment on column public.paper_sessions.outline is
  'Venue-specific outline (PaperOutline + generatedAt/degraded/edited)';
comment on column public.paper_sessions.section_feedback is
  'Array of section coaching results (max 20 entries, appended by coaching action)';
comment on column public.paper_sessions.readiness is
  'Latest submission readiness report (ReadinessReport + checkedAt/degraded)';
comment on column public.paper_sessions.deadline_tracking is
  'Deadline milestones: venueId, deadline, acknowledgedMilestones[], updatedAt';

create index if not exists paper_sessions_user_id_idx
  on public.paper_sessions (user_id);

create index if not exists paper_sessions_user_updated_idx
  on public.paper_sessions (user_id, updated_at desc);

alter table public.paper_sessions enable row level security;

drop policy if exists "Users can manage their own paper sessions" on public.paper_sessions;
create policy "Users can manage their own paper sessions"
  on public.paper_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Keep updated_at in sync on every edit.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists paper_sessions_set_updated_at on public.paper_sessions;
create trigger paper_sessions_set_updated_at
  before update on public.paper_sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- score_attempts — uniqueness score history per session
-- ---------------------------------------------------------------------------
create table if not exists public.score_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.paper_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  score integer not null check (score between 0 and 100),
  explanation jsonb,
  created_at timestamptz not null default now()
);

comment on column public.score_attempts.explanation is
  'UniquenessExplanation + candidates[] + meta { corpusEmpty, explanationDegraded, warnings }';

create index if not exists score_attempts_session_id_idx
  on public.score_attempts (session_id);

create index if not exists score_attempts_user_id_idx
  on public.score_attempts (user_id);

create index if not exists score_attempts_session_created_idx
  on public.score_attempts (session_id, created_at desc);

alter table public.score_attempts enable row level security;

drop policy if exists "Users can manage their own score attempts" on public.score_attempts;
create policy "Users can manage their own score attempts"
  on public.score_attempts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Grants — allow authenticated users to use the tables (RLS still applies)
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.paper_sessions to authenticated;
grant select, insert, update, delete on public.score_attempts to authenticated;
