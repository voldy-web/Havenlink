-- One-time links for choosing a new password. Only a hash of each link's secret is stored,
-- so a database leak cannot be used to reset anyone's password.
create table password_resets (
  id          bigserial primary key,
  user_id     uuid not null references users (id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index password_resets_user_idx on password_resets (user_id);
