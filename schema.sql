-- Jackson schema. Paste into the Supabase SQL editor.

create extension if not exists "uuid-ossp";

-- Students -----------------------------------------------------------------
create table if not exists public.students (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  grade smallint not null check (grade between 4 and 8),
  parent_email text not null,
  created_at timestamptz not null default now(),
  current_topic_id text
);

-- Progress -----------------------------------------------------------------
-- One row per student per topic. status drives lock/unlock UI on Home.
create table if not exists public.progress (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  topic_id text not null,
  status text not null default 'locked'
    check (status in ('locked', 'unlocked', 'in_progress', 'mastered')),
  mastery_score smallint not null default 0 check (mastery_score between 0 and 100),
  last_practiced_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (student_id, topic_id)
);

create index if not exists progress_student_idx on public.progress(student_id);

-- Sessions -----------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  topic_id text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  engagement_score smallint check (engagement_score between 0 and 100),
  stroke_count integer default 0,
  confident_seconds integer default 0,
  hesitant_seconds integer default 0,
  idle_seconds integer default 0,
  events jsonb not null default '[]'::jsonb,
  notes text,
  parent_report text
);

create index if not exists sessions_student_idx on public.sessions(student_id);
create index if not exists sessions_started_idx on public.sessions(started_at desc);

-- RLS ----------------------------------------------------------------------
-- MVP: app uses the anon key directly. Lock things down before production.
alter table public.students enable row level security;
alter table public.progress enable row level security;
alter table public.sessions enable row level security;

-- Permissive policies for MVP. Tighten with auth once you add parent login.
create policy "students_anon_all" on public.students
  for all using (true) with check (true);
create policy "progress_anon_all" on public.progress
  for all using (true) with check (true);
create policy "sessions_anon_all" on public.sessions
  for all using (true) with check (true);
