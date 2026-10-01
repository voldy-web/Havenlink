-- Messages. A conversation belongs to one signed-in person (user_id) and has a
-- counterpart: a property agent (kind 'agent', counterpart_id = the agent's
-- number) or Haven Link Support (kind 'support'). Agents and support do not have
-- sign-ins yet, so their replies come from the testing tool for now; when they
-- get accounts this table gets a counterpart_user_id column.
create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  kind text not null check (kind in ('agent', 'support')),
  counterpart_id integer check (counterpart_id > 0),
  counterpart_name text not null,
  subject text not null,
  property_id integer check (property_id > 0),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create index conversations_user_idx on conversations (user_id, last_message_at desc);

create table messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references conversations (id) on delete cascade,
  from_me boolean not null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index messages_conversation_idx on messages (conversation_id, created_at, id);
