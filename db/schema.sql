-- Hearth schema. Idempotent: apply with `npm run db:migrate`.

-- The family's setup for the daily check-in, plus live call status (single row).
create table if not exists settings (
  id integer primary key default 1 check (id = 1),
  profile jsonb not null,
  configured boolean not null default false,
  call_active boolean not null default false,
  calm_mode boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Long-term memory per person, shared by every companion.
create table if not exists people (
  id text primary key,
  name text not null,
  summary text not null default '',
  facts jsonb not null default '[]',
  follow_ups jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Every call with any companion.
create table if not exists conversations (
  id text primary key,
  person_id text not null references people(id) on delete cascade,
  companion_id text not null,
  at timestamptz not null,
  duration_sec integer not null default 0,
  title text not null,
  summary text not null,
  quote text not null default '',
  urgent boolean not null default false,
  transcript jsonb not null default '[]'
);
create index if not exists conversations_person_at on conversations (person_id, at);

-- The family dashboard: analysed check-in calls and live alerts.
create table if not exists checkins (
  id text primary key,
  created_at timestamptz not null default now(),
  data jsonb not null
);

create table if not exists alerts (
  id text primary key,
  at timestamptz not null,
  reason text not null,
  quote text not null,
  translation text
);
