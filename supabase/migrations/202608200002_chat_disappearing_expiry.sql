begin;

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
    and (
      exists (
        select 1
        from public.fc_conversations c
        where c.id = fc_messages.conversation_id
          and c.disappearing_seconds is null
      )
      or exists (
        select 1
        from public.fc_conversations c
        where c.id = fc_messages.conversation_id
          and fc_messages.created_at > now() - make_interval(secs => c.disappearing_seconds)
      )
    )
  );

commit;
