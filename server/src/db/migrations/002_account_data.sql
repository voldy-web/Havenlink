-- Everything a signed-in person owns: saved homes, viewings, problem reports,
-- shop orders and paid pro unlocks. Rows are deleted with the account.
-- property_id / product_id / provider_id are plain numbers for now; they
-- become links to real tables when properties and products move to the database.

create table saved_homes (
  user_id uuid not null references users (id) on delete cascade,
  property_id integer not null check (property_id > 0),
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);

create table viewings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references users (id) on delete cascade,
  property_id integer not null check (property_id > 0),
  property_title text not null,
  format text not null check (format in ('in-person', 'video')),
  viewing_date date not null,
  viewing_time text not null,
  attendees integer not null check (attendees between 1 and 10),
  name text not null,
  phone text not null,
  email text not null,
  move_in date,
  pet text not null default 'none' check (pet in ('none', 'dog', 'cat', 'other')),
  status text not null default 'Pending' check (status in ('Pending', 'Confirmed', 'Rescheduled', 'Declined', 'Cancelled')),
  created_at timestamptz not null default now()
);
create index viewings_user_idx on viewings (user_id, created_at desc);
-- The same person cannot book the same home at the same time twice.
create unique index viewings_no_double_booking
  on viewings (user_id, property_id, viewing_date, viewing_time) where status <> 'Cancelled';

create table reports (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references users (id) on delete cascade,
  category text not null check (category in ('plumbing', 'electrical', 'hvac', 'appliances', 'structural', 'security')),
  urgency text not null check (urgency in ('low', 'medium', 'urgent')),
  summary text not null,
  description text not null,
  home text not null,
  status text not null default 'Submitted' check (status in ('Submitted', 'Acknowledged', 'In Progress', 'Resolved')),
  created_at timestamptz not null default now()
);
create index reports_user_idx on reports (user_id, created_at desc);

create table report_photos (
  id bigserial primary key,
  report_id uuid not null references reports (id) on delete cascade,
  position integer not null default 0,
  image text not null
);
create index report_photos_report_idx on report_photos (report_id);

create table report_events (
  id bigserial primary key,
  report_id uuid not null references reports (id) on delete cascade,
  status text not null,
  created_at timestamptz not null default now()
);
create index report_events_report_idx on report_events (report_id);

create table orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references users (id) on delete cascade,
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  delivery_fee numeric(12, 2) not null check (delivery_fee >= 0),
  total numeric(12, 2) not null check (total >= 0),
  payment_method text not null,
  paid boolean not null default false,
  status text not null default 'Confirmed' check (status in ('Confirmed', 'Packed', 'Out for Delivery', 'Delivered')),
  delivery_date date not null,
  delivery_window text not null,
  address jsonb not null,
  created_at timestamptz not null default now()
);
create index orders_user_idx on orders (user_id, created_at desc);

create table order_items (
  id bigserial primary key,
  order_id uuid not null references orders (id) on delete cascade,
  product_id integer not null,
  name text not null,
  qty integer not null check (qty between 1 and 10),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  choices jsonb not null default '{}'
);
create index order_items_order_idx on order_items (order_id);

create table order_events (
  id bigserial primary key,
  order_id uuid not null references orders (id) on delete cascade,
  status text not null,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on order_events (order_id);

create table service_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references users (id) on delete cascade,
  provider_id integer not null check (provider_id > 0),
  provider_name text not null,
  service text not null,
  slot text not null check (slot in ('morning', 'afternoon', 'urgent')),
  address text not null,
  note text not null default '',
  fee numeric(12, 2) not null check (fee >= 0),
  method text not null,
  payment_status text not null default 'Paid (demo)',
  created_at timestamptz not null default now()
);
create index service_requests_user_idx on service_requests (user_id, created_at desc);
