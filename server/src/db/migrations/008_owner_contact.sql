-- Owners can now be reached. A conversation about an owner's home goes to that owner's account
-- (kind 'owner'), and viewing requests for that home are answered by the owner.
alter table conversations drop constraint conversations_kind_check;
alter table conversations
  add column owner_id uuid references users (id) on delete cascade,
  add constraint conversations_kind_check check (kind in ('agent', 'support', 'owner')),
  add constraint conversations_owner_check check ((kind = 'owner') = (owner_id is not null));
create index conversations_owner_idx on conversations (owner_id, last_message_at desc);

-- Who wrote each message. Older messages (before owners could reply) have no sender;
-- they were written by the person who started the conversation, or by the demo tool.
alter table messages add column sender_id uuid references users (id) on delete set null;

-- What the owner said about a viewing request (for example the reason for declining).
alter table viewings
  add column owner_note text not null default '',
  add column responded_at timestamptz;
