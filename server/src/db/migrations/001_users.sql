-- Accounts for residents, owners, service pros, vendors and admins.
-- Passwords are never stored, only a one-way hash of them.
create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  role text not null check (role in ('resident', 'owner', 'pro', 'vendor', 'admin')),
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- One account per email address, ignoring upper/lower case.
create unique index users_email_lower_idx on users (lower(email));
