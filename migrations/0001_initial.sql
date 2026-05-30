create table if not exists chat_sessions (
  id text primary key,
  user_id text,
  title text not null default 'New Chat',
  created_at integer not null default (unixepoch()),
  updated_at integer not null default (unixepoch())
);

create table if not exists chat_messages (
  id text primary key,
  session_id text not null references chat_sessions(id) on delete cascade,
  role text not null check(role in ('user','assistant')),
  content text not null,
  created_at integer not null default (unixepoch())
);

create index if not exists idx_chat_messages_session on chat_messages(session_id);

create table if not exists users (
  id text primary key,
  email text unique not null,
  name text,
  avatar_url text,
  created_at integer not null default (unixepoch())
);

create table if not exists feedback (
  id text primary key,
  user_id text references users(id),
  message text not null,
  page text,
  created_at integer not null default (unixepoch())
);
