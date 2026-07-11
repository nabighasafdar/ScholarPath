-- Profiles: 1:1 with auth.users, auto-created on signup.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Paper sessions: one per research idea a student is iterating on.
create table if not exists public.paper_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  idea_text text not null,
  uniqueness_score integer,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.paper_sessions enable row level security;

create policy "Users can manage their own paper sessions"
  on public.paper_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Score attempts: history of uniqueness scores for a session (Phase 3).
create table if not exists public.score_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.paper_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  score integer not null,
  explanation jsonb,
  created_at timestamptz not null default now()
);

alter table public.score_attempts enable row level security;

create policy "Users can manage their own score attempts"
  on public.score_attempts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
