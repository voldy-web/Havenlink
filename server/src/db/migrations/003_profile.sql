-- Profile & settings: an emergency contact, privacy choices, and the time the
-- password last changed (login tokens issued before that stop working).
alter table users
  add column emergency_name text not null default '',
  add column emergency_phone text not null default '',
  add column privacy jsonb not null default '{"maskContact":true,"anonymousReviews":false,"residentDirectory":false}'::jsonb,
  add column password_changed_at timestamptz not null default now();

-- Existing accounts: treat the password as unchanged since sign-up, so nobody
-- is signed out by this update.
update users set password_changed_at = created_at;
