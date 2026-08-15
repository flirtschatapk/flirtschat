alter table public.fc_messages
  add column if not exists deleted_at timestamptz;

create table if not exists public.fc_message_hidden (
  message_id uuid not null references public.fc_messages(id) on delete cascade,
  user_id uuid not null references public.fc_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

alter table public.fc_message_hidden enable row level security;

drop policy if exists "users manage their hidden messages" on public.fc_message_hidden;

create policy "users manage their hidden messages"
  on public.fc_message_hidden
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "members view messages" on public.fc_messages;

create policy "members view messages"
  on public.fc_messages
  for select to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from public.fc_conversation_members cm
      where cm.conversation_id = fc_messages.conversation_id
        and cm.user_id = (select auth.uid())
    )
    and not exists (
      select 1
      from public.fc_message_hidden hidden
      where hidden.message_id = fc_messages.id
        and hidden.user_id = (select auth.uid())
    )
  );

drop policy if exists "senders update own messages" on public.fc_messages;

create policy "senders update own messages"
  on public.fc_messages
  for update to authenticated
  using (
    sender_id = (select auth.uid())
    and exists (
      select 1
      from public.fc_conversation_members cm
      where cm.conversation_id = fc_messages.conversation_id
        and cm.user_id = (select auth.uid())
    )
  )
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1
      from public.fc_conversation_members cm
      where cm.conversation_id = fc_messages.conversation_id
        and cm.user_id = (select auth.uid())
    )
  );

create index if not exists fc_message_hidden_user_idx
  on public.fc_message_hidden(user_id, message_id);
