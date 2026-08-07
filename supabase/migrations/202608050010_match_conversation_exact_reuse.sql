begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608050010_match_conversation_exact_reuse'));

create or replace function public.fc_get_or_create_match_conversation(requested_match uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  member_a uuid;
  member_b uuid;
  conversation uuid;
begin
  if uid is null then
    raise exception 'authentication required';
  end if;

  select m.user_a, m.user_b
    into member_a, member_b
  from public.fc_matches as m
  where m.id = requested_match
    and uid in (m.user_a, m.user_b)
    and m.unmatched_at is null;

  if not found then
    raise exception 'match unavailable';
  end if;

  if member_a = member_b then
    raise exception 'self conversation unavailable';
  end if;

  perform pg_advisory_xact_lock(hashtext(least(member_a, member_b)::text || ':' || greatest(member_a, member_b)::text || ':conversation'));

  select c.id
    into conversation
  from public.fc_conversations as c
  where c.match_id = requested_match
    or (
      exists (
        select 1
        from public.fc_conversation_members as cm
        where cm.conversation_id = c.id
          and cm.user_id = member_a
      )
      and exists (
        select 1
        from public.fc_conversation_members as cm
        where cm.conversation_id = c.id
          and cm.user_id = member_b
      )
      and (
        select count(*)
        from public.fc_conversation_members as cm
        where cm.conversation_id = c.id
      ) = 2
    )
  order by case when c.match_id = requested_match then 0 else 1 end, c.created_at
  limit 1;

  if conversation is null then
    insert into public.fc_conversations(match_id)
    values (requested_match)
    on conflict (match_id) do update set match_id = excluded.match_id
    returning id into conversation;
  else
    update public.fc_conversations
       set match_id = requested_match
     where id = conversation
       and match_id is null;
  end if;

  insert into public.fc_conversation_members(conversation_id, user_id)
  values (conversation, member_a), (conversation, member_b)
  on conflict (conversation_id, user_id) do nothing;

  return conversation;
end
$$;

revoke all on function public.fc_get_or_create_match_conversation(uuid) from public;
grant execute on function public.fc_get_or_create_match_conversation(uuid) to authenticated;

commit;
