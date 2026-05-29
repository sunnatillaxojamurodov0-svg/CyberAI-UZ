-- ── chats table ──────────────────────────────────────────
create table if not exists chats (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null default 'New Chat',
  created_at timestamptz not null default now()
);

create index if not exists idx_chats_user_id on chats(user_id);
create index if not exists idx_chats_created_at on chats(created_at desc);

alter table chats enable row level security;

create policy "Users can select own chats"
  on chats for select
  to authenticated
  using ( (select auth.uid()) = user_id );

create policy "Users can insert own chats"
  on chats for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "Users can update own chats"
  on chats for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

create policy "Users can delete own chats"
  on chats for delete
  to authenticated
  using ( (select auth.uid()) = user_id );

-- ── messages table ──────────────────────────────────────
create table if not exists messages (
  id         uuid primary key default gen_random_uuid(),
  chat_id    uuid not null references chats(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null default '',
  metadata   jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_chat_id on messages(chat_id);
create index if not exists idx_messages_created_at on messages(created_at asc);

alter table messages enable row level security;

create policy "Users can select own messages"
  on messages for select
  to authenticated
  using ( (select auth.uid()) = user_id );

create policy "Users can insert own messages"
  on messages for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "Users can update own messages"
  on messages for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

create policy "Users can delete own messages"
  on messages for delete
  to authenticated
  using ( (select auth.uid()) = user_id );
