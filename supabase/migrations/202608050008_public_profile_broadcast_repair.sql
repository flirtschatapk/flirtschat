begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608050008_public_profile_broadcast_repair'));

-- The project role cannot manage policies on Supabase's realtime.messages
-- table. Broadcast only a non-sensitive profile id over a public channel;
-- public profile data remains available exclusively through the scoped RPCs.
create or replace function public.fc_notify_public_profile_change() returns trigger
language plpgsql security definer set search_path='' as $$
declare changed_id uuid;
begin
  changed_id:=coalesce(new.id,old.id);
  perform realtime.send(
    jsonb_build_object('profile_id',changed_id),
    'changed',
    'public-profile-updates',
    false
  );
  return coalesce(new,old);
end $$;

create or replace function public.fc_notify_public_photo_change() returns trigger
language plpgsql security definer set search_path='' as $$
declare changed_id uuid;
begin
  changed_id:=coalesce(new.user_id,old.user_id);
  perform realtime.send(
    jsonb_build_object('profile_id',changed_id),
    'changed',
    'public-profile-updates',
    false
  );
  return coalesce(new,old);
end $$;

commit;
