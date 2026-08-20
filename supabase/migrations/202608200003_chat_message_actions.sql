begin;

create table if not exists public.fc_message_reactions (
  message_id uuid not null references public.fc_messages(id) on delete cascade,
  user_id uuid not null references public.fc_profiles(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists fc_message_reactions_message_idx
  on public.fc_message_reactions(message_id);

alter table public.fc_message_reactions enable row level security;

drop policy if exists "conversation members view message reactions" on public.fc_message_reactions;
create policy "conversation members view message reactions"
  on public.fc_message_reactions for select to authenticated
  using (exists (
    select 1 from public.fc_messages m
    join public.fc_conversation_members cm on cm.conversation_id = m.conversation_id
    where m.id = fc_message_reactions.message_id
      and m.deleted_at is null
      and cm.user_id = (select auth.uid())
  ));

drop policy if exists "users manage their message reactions" on public.fc_message_reactions;
create policy "users manage their message reactions"
  on public.fc_message_reactions for all to authenticated
  using (user_id = (select auth.uid()) and exists (
    select 1 from public.fc_messages m
    join public.fc_conversation_members cm on cm.conversation_id = m.conversation_id
    where m.id = fc_message_reactions.message_id
      and m.deleted_at is null
      and cm.user_id = (select auth.uid())
  ))
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.fc_messages m
    join public.fc_conversation_members cm on cm.conversation_id = m.conversation_id
    where m.id = fc_message_reactions.message_id
      and m.deleted_at is null
      and cm.user_id = (select auth.uid())
  ));

create table if not exists public.fc_message_pins (
  message_id uuid not null references public.fc_messages(id) on delete cascade,
  user_id uuid not null references public.fc_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists fc_message_pins_message_idx
  on public.fc_message_pins(message_id);

alter table public.fc_message_pins enable row level security;

drop policy if exists "conversation members view message pins" on public.fc_message_pins;
create policy "conversation members view message pins"
  on public.fc_message_pins for select to authenticated
  using (exists (
    select 1 from public.fc_messages m
    join public.fc_conversation_members cm on cm.conversation_id = m.conversation_id
    where m.id = fc_message_pins.message_id
      and m.deleted_at is null
      and cm.user_id = (select auth.uid())
  ));

drop policy if exists "users manage their message pins" on public.fc_message_pins;
create policy "users manage their message pins"
  on public.fc_message_pins for all to authenticated
  using (user_id = (select auth.uid()) and exists (
    select 1 from public.fc_messages m
    join public.fc_conversation_members cm on cm.conversation_id = m.conversation_id
    where m.id = fc_message_pins.message_id
      and m.deleted_at is null
      and cm.user_id = (select auth.uid())
  ))
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.fc_messages m
    join public.fc_conversation_members cm on cm.conversation_id = m.conversation_id
    where m.id = fc_message_pins.message_id
      and m.deleted_at is null
      and cm.user_id = (select auth.uid())
  ));

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'fc_message_reactions'
  ) then alter publication supabase_realtime add table public.fc_message_reactions; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'fc_message_pins'
  ) then alter publication supabase_realtime add table public.fc_message_pins; end if;
end $$;

commit;
