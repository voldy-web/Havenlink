-- Owner listings: uploaded photos, and the review trail for homes that owners post.
-- Photos are kept in the database for now (each is resized small by the website
-- before upload). They can move to a file service later without changing the pages.
create table images (
  id bigint generated always as identity primary key,
  owner_id uuid not null references users (id) on delete cascade,
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp')),
  bytes bytea not null check (octet_length(bytes) between 1 and 700000),
  created_at timestamptz not null default now()
);
create index images_owner_idx on images (owner_id);

alter table properties
  add column review_note text not null default '',
  add column reviewed_by uuid references users (id) on delete set null,
  add column reviewed_at timestamptz;
create index properties_owner_idx on properties (owner_id);
