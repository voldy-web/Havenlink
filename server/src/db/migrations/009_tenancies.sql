-- Tenancies: an owner offers a home to someone who viewed it, the resident accepts, and the
-- tenancy then has a move-in report, repairs that reach the owner, and a move-out settlement.
-- (Rent and deposit are recorded here. Real payments are a separate step.)
create table tenancies (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  property_id integer not null check (property_id > 0),
  property_title text not null,
  owner_id uuid not null references users (id) on delete cascade,
  resident_id uuid not null references users (id) on delete cascade,
  status text not null default 'Offered' check (status in ('Offered', 'Active', 'Notice given', 'Ended', 'Declined', 'Withdrawn')),
  monthly_rent numeric(12, 2) not null check (monthly_rent > 0),
  deposit numeric(12, 2) not null check (deposit >= 0),
  start_date date not null,
  term_months integer not null check (term_months between 1 and 60),
  move_out_date date,
  notice_given_at timestamptz,
  move_in_submitted_at timestamptz,
  move_in_acknowledged_at timestamptz,
  settlement jsonb,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (owner_id <> resident_id)
);
create index tenancies_owner_idx on tenancies (owner_id, created_at desc);
create index tenancies_resident_idx on tenancies (resident_id, created_at desc);
-- A home can have only one tenancy that is still going (offered, active or ending).
create unique index tenancies_one_live_per_home on tenancies (property_id) where status in ('Offered', 'Active', 'Notice given');

-- The condition of each room at move-in (written by the resident) and at move-out (by the owner).
create table condition_items (
  id bigint generated always as identity primary key,
  tenancy_id uuid not null references tenancies (id) on delete cascade,
  stage text not null check (stage in ('move_in', 'move_out')),
  room text not null,
  condition text not null check (condition in ('Good', 'Fair', 'Poor')),
  note text not null default '',
  unique (tenancy_id, stage, room)
);

-- Repair reports from a resident with a tenancy go to that home's owner, who can add a note at each stage.
alter table reports add column tenancy_id uuid references tenancies (id) on delete set null;
create index reports_tenancy_idx on reports (tenancy_id);
alter table report_events add column note text not null default '';
