-- PostgreSQL-ready schema for a future Supabase or managed Postgres deployment.
-- The current app runs in Sample Dataset Mode and does not require a database.

create table teams (
  id text primary key,
  name text not null,
  code text not null unique,
  confederation text not null,
  group_code text not null,
  elo_seed integer not null,
  attack numeric(5, 3) not null,
  defense numeric(5, 3) not null,
  form numeric(5, 2) not null,
  world_cup_pedigree numeric(5, 3) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table historical_results (
  id bigserial primary key,
  match_date date not null,
  home_team_id text not null,
  away_team_id text not null,
  home_goals integer not null check (home_goals >= 0),
  away_goals integer not null check (away_goals >= 0),
  neutral boolean not null default true,
  competition text not null check (
    competition in ('world_cup', 'continental', 'qualifier', 'friendly')
  ),
  source text not null default 'sample',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tournament_groups (
  id bigserial primary key,
  tournament_year integer not null default 2026,
  group_code text not null,
  team_id text not null references teams(id),
  unique (tournament_year, group_code, team_id)
);

create table dataset_versions (
  id uuid primary key default gen_random_uuid(),
  dataset_key text not null unique,
  dataset_mode text not null,
  source_label text not null,
  version_label text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table fixtures (
  id uuid primary key default gen_random_uuid(),
  match_number integer not null unique,
  stage text not null,
  group_code text,
  home_team_slug text not null,
  away_team_slug text not null,
  venue text not null,
  host_city text not null,
  kickoff_time_local timestamptz,
  status text not null check (status in ('scheduled', 'completed', 'simulated')),
  source_label text not null,
  dataset_version_id uuid references dataset_versions(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table matches (
  id text primary key,
  tournament_year integer not null default 2026,
  stage text not null,
  group_code text,
  home_team_id text references teams(id),
  away_team_id text references teams(id),
  scheduled_at timestamptz,
  home_goals integer check (home_goals >= 0),
  away_goals integer check (away_goals >= 0),
  data_mode text not null default 'sample',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table predictions (
  id uuid primary key default gen_random_uuid(),
  home_team_id text not null references teams(id),
  away_team_id text not null references teams(id),
  home_win_probability numeric(6, 5) not null,
  draw_probability numeric(6, 5) not null,
  away_win_probability numeric(6, 5) not null,
  confidence numeric(6, 5) not null,
  model_version text not null,
  explanation jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table simulations (
  id uuid primary key default gen_random_uuid(),
  iterations integer not null check (iterations > 0),
  seed text not null,
  model_version text not null,
  summary jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table model_runs (
  id uuid primary key default gen_random_uuid(),
  model_version text not null,
  dataset_version_id uuid references dataset_versions(id),
  simulation_count integer not null check (simulation_count > 0),
  seed text not null,
  generated_at timestamptz not null,
  summary jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_brackets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  display_name text not null,
  champion_team_id text not null references teams(id),
  finalist_team_id text references teams(id),
  bracket_json jsonb not null default '{}'::jsonb,
  score integer not null default 0,
  mode text not null default 'demo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  user_bracket_id uuid references user_brackets(id) on delete cascade,
  display_name text not null,
  score integer not null default 0,
  champion_team_id text not null references teams(id),
  finalist_team_id text references teams(id),
  mode text not null default 'demo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index historical_results_date_idx on historical_results(match_date);
create index predictions_match_idx on predictions(home_team_id, away_team_id);
create index fixtures_stage_idx on fixtures(stage, group_code);
create index fixtures_kickoff_idx on fixtures(kickoff_time_local);
create index simulations_created_at_idx on simulations(created_at desc);
create index model_runs_created_at_idx on model_runs(created_at desc);
create index user_brackets_score_idx on user_brackets(score desc);
create index leaderboard_entries_score_idx on leaderboard_entries(score desc);

-- Supabase RLS-ready notes:
-- alter table user_brackets enable row level security;
-- alter table leaderboard_entries enable row level security;
-- Public read policies can expose leaderboard rows, while insert/update policies
-- should require auth.uid() ownership once real authentication is connected.
