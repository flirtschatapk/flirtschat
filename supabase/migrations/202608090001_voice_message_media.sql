alter table public.fc_messages
  add column if not exists media_mime_type text,
  add column if not exists media_size_bytes integer,
  add column if not exists media_duration_seconds integer;

alter table public.fc_messages
  drop constraint if exists fc_messages_voice_media_duration_check;

alter table public.fc_messages
  add constraint fc_messages_voice_media_duration_check
  check (media_duration_seconds is null or media_duration_seconds between 1 and 300);

alter table public.fc_messages
  drop constraint if exists fc_messages_voice_media_size_check;

alter table public.fc_messages
  add constraint fc_messages_voice_media_size_check
  check (media_size_bytes is null or media_size_bytes between 1 and 10485760);

drop policy if exists "members send messages" on public.fc_messages;

create policy "members send messages" on public.fc_messages
  for insert to authenticated
  with check(
    sender_id=(select auth.uid())
    and exists(
      select 1
      from public.fc_conversation_members cm
      where cm.conversation_id=fc_messages.conversation_id
        and cm.user_id=(select auth.uid())
    )
    and not exists(
      select 1
      from public.fc_conversation_members other_member
      where other_member.conversation_id=fc_messages.conversation_id
        and other_member.user_id<>(select auth.uid())
        and public.fc_users_blocked((select auth.uid()),other_member.user_id)
    )
    and (
      kind<>'voice'
      or (
        media_path is not null
        and media_path ~ ('^chat-voice/'||conversation_id::text||'/'||(select auth.uid())::text||'/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(webm|ogg)$')
        and media_mime_type in ('audio/webm','audio/webm;codecs=opus','audio/ogg','audio/ogg;codecs=opus')
        and ((media_path ~ '\.(webm)$' and media_mime_type in ('audio/webm','audio/webm;codecs=opus')) or (media_path ~ '\.(ogg)$' and media_mime_type in ('audio/ogg','audio/ogg;codecs=opus')))
        and media_size_bytes between 1 and 10485760
        and media_duration_seconds between 1 and 300
      )
    )
  );
