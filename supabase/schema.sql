-- Mot-à-Mot user progress (run in Supabase SQL Editor)

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  toolbox jsonb not null default '[]'::jsonb,
  search_history jsonb not null default '[]'::jsonb,
  practice_history jsonb not null default '[]'::jsonb,
  ratings_cache jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

create policy "Users can read own progress"
  on public.user_progress
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.user_progress
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.user_progress
  for update
  using (auth.uid() = user_id);
