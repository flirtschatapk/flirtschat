begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608190001_chat_menu_preferences'));

alter table public.fc_conversation_members
  add column if not exists muted_until timestamptz,
  add column if not exists pinned_at timestamptz,
  add column if not exists cleared_at timestamptz,
  add column if not exists hidden_at timestamptz,
  add column if not exists chat_locked boolean not null default false;

alter table public.fc_conversations
  add column if not exists disappearing_seconds integer;

do $$ begin
  alter table public.fc_conversations
    add constraint fc_conversations_disappearing_seconds_check
    check (disappearing_seconds is null or disappearing_seconds in (86400, 604800, 2592000));
exception when duplicate_object then null;
end $$;

drop policy if exists "members update conversation disappearing setting" on public.fc_conversations;

create or replace function public.fc_set_disappearing_messages(
  requested_conversation uuid,
  requested_seconds integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if not public.fc_is_conversation_member(requested_conversation) then
    raise exception 'conversation unavailable';
  end if;
  if requested_seconds is not null and requested_seconds not in (86400, 604800, 2592000) then
    raise exception 'invalid disappearing message duration';
  end if;

  update public.fc_conversations
  set disappearing_seconds = requested_seconds
  where id = requested_conversation;
end;
$$;

revoke all on function public.fc_set_disappearing_messages(uuid, integer) from public;
grant execute on function public.fc_set_disappearing_messages(uuid, integer) to authenticated;

commit;
