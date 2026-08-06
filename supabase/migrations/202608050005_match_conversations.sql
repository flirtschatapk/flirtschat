begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608050005_match_conversations'));

create or replace function public.fc_get_or_create_match_conversation(requested_match uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); member_a uuid; member_b uuid; conversation uuid;
begin
  if uid is null then raise exception 'authentication required'; end if;
  select user_a,user_b into member_a,member_b from public.fc_matches where id=requested_match and uid in(user_a,user_b) and unmatched_at is null;
  if not found then raise exception 'match unavailable'; end if;
  perform pg_advisory_xact_lock(hashtext(requested_match::text||':conversation'));
  insert into public.fc_conversations(match_id) values(requested_match) on conflict(match_id) do update set match_id=excluded.match_id returning id into conversation;
  insert into public.fc_conversation_members(conversation_id,user_id) values(conversation,member_a),(conversation,member_b) on conflict(conversation_id,user_id) do nothing;
  return conversation;
end $$;
revoke all on function public.fc_get_or_create_match_conversation(uuid) from public;
grant execute on function public.fc_get_or_create_match_conversation(uuid) to authenticated;

create or replace function public.fc_touch_conversation_on_message() returns trigger language plpgsql security definer set search_path='' as $$
begin update public.fc_conversations set updated_at=new.created_at where id=new.conversation_id;return new;end $$;
drop trigger if exists fc_touch_conversation_after_message on public.fc_messages;
create trigger fc_touch_conversation_after_message after insert on public.fc_messages for each row execute function public.fc_touch_conversation_on_message();

drop policy if exists "members view memberships" on public.fc_conversation_members;
drop policy if exists "participants view conversation memberships" on public.fc_conversation_members;
create policy "participants view conversation memberships" on public.fc_conversation_members
for select to authenticated using(public.fc_is_conversation_member(conversation_id));

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='fc_conversation_members') then alter publication supabase_realtime add table public.fc_conversation_members;end if;
end $$;
commit;
