create table if not exists gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  equipment text[],
  class_types text[],
  style_notes text,
  created_at timestamptz default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid references gyms(id),
  name text not null,
  goal text not null,
  fitness_level text not null,
  injuries text,
  created_at timestamptz default now()
);

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id),
  gym_id uuid references gyms(id),
  videos jsonb not null,
  status text default 'pending',
  created_at timestamptz default now()
);
