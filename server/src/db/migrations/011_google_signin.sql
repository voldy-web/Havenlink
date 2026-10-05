-- "Continue with Google": a Google account is remembered by its stable Google id, and such an
-- account may have no password at all until the person chooses one (for example by "Forgot password").
alter table users alter column password_hash drop not null;
alter table users add column google_id text;
create unique index users_google_id_idx on users (google_id) where google_id is not null;
