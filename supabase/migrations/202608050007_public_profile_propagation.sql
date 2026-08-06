begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608050007_public_profile_propagation'));

alter table public.fc_profiles add column if not exists profile_banner_dismissed_at timestamptz;

create or replace function public.fc_public_profiles()
returns table(id uuid,username text,display_name text,bio text,gender text,date_of_birth date,country text,city text,languages text[],interests text[],relationship_goal text,verified boolean,premium boolean,last_seen_at timestamptz,created_at timestamptz,photo_keys text[])
language sql stable security definer set search_path='' as $$
  select p.id,p.username,p.display_name,p.bio,p.gender,p.date_of_birth,p.country,p.city,p.languages,p.interests,p.relationship_goal,p.verified,p.premium,p.last_seen_at,p.created_at,
    coalesce(array_agg(ph.object_key order by ph.position) filter(where ph.object_key is not null),'{}')
  from public.fc_profiles p left join public.fc_profile_photos ph on ph.user_id=p.id and ph.moderation_status='approved'
  where p.id<>(select auth.uid()) and p.profile_visible and p.onboarding_completed
    and (p.suspended_until is null or p.suspended_until<=now())
    and not public.fc_users_blocked((select auth.uid()),p.id)
    and not exists(select 1 from public.fc_swipes s where s.actor_id=(select auth.uid()) and s.target_id=p.id)
  group by p.id
  order by p.last_seen_at desc
$$;
revoke all on function public.fc_public_profiles() from public;
grant execute on function public.fc_public_profiles() to authenticated;

create or replace function public.fc_public_profile(requested_profile uuid)
returns table(id uuid,username text,display_name text,bio text,gender text,date_of_birth date,country text,city text,languages text[],interests text[],relationship_goal text,verified boolean,premium boolean,last_seen_at timestamptz,created_at timestamptz,photo_keys text[])
language sql stable security definer set search_path='' as $$
  select p.id,p.username,p.display_name,p.bio,p.gender,p.date_of_birth,p.country,p.city,p.languages,p.interests,p.relationship_goal,p.verified,p.premium,p.last_seen_at,p.created_at,
    coalesce(array_agg(ph.object_key order by ph.position) filter(where ph.object_key is not null),'{}')
  from public.fc_profiles p left join public.fc_profile_photos ph on ph.user_id=p.id and ph.moderation_status='approved'
  where p.id=requested_profile and p.profile_visible and p.onboarding_completed
    and (p.suspended_until is null or p.suspended_until<=now())
    and not public.fc_users_blocked((select auth.uid()),p.id)
  group by p.id
$$;
revoke all on function public.fc_public_profile(uuid) from public;
grant execute on function public.fc_public_profile(uuid) to authenticated;

create or replace function public.fc_my_conversation_profiles()
returns table(id uuid,username text,display_name text,last_seen_at timestamptz,verified boolean,photo_key text)
language sql stable security definer set search_path='' as $$
  select distinct p.id,p.username,p.display_name,p.last_seen_at,p.verified,
    (select ph.object_key from public.fc_profile_photos ph where ph.user_id=p.id and ph.moderation_status='approved' order by ph.position limit 1)
  from public.fc_conversation_members mine
  join public.fc_conversation_members other on other.conversation_id=mine.conversation_id and other.user_id<>mine.user_id
  join public.fc_profiles p on p.id=other.user_id
  where mine.user_id=(select auth.uid()) and not public.fc_users_blocked((select auth.uid()),p.id)
$$;
revoke all on function public.fc_my_conversation_profiles() from public;
grant execute on function public.fc_my_conversation_profiles() to authenticated;

create or replace function public.fc_notify_public_profile_change() returns trigger
language plpgsql security definer set search_path='' as $$
declare changed_id uuid;
begin
  changed_id:=coalesce(new.id,old.id);
  perform realtime.send(jsonb_build_object('profile_id',changed_id),'changed','public-profile-updates',false);
  return coalesce(new,old);
end $$;
drop trigger if exists fc_public_profile_changed on public.fc_profiles;
drop trigger if exists fc_public_profile_updated on public.fc_profiles;
create trigger fc_public_profile_changed after insert or delete on public.fc_profiles for each row execute function public.fc_notify_public_profile_change();
create trigger fc_public_profile_updated after update of username,display_name,bio,gender,date_of_birth,country,city,languages,interests,relationship_goal,profile_visible,onboarding_completed,verified,premium,suspended_until on public.fc_profiles for each row execute function public.fc_notify_public_profile_change();

create or replace function public.fc_notify_public_photo_change() returns trigger
language plpgsql security definer set search_path='' as $$
declare changed_id uuid;
begin
  changed_id:=coalesce(new.user_id,old.user_id);
  perform realtime.send(jsonb_build_object('profile_id',changed_id),'changed','public-profile-updates',false);
  return coalesce(new,old);
end $$;
drop trigger if exists fc_public_photo_changed on public.fc_profile_photos;
drop trigger if exists fc_public_photo_updated on public.fc_profile_photos;
create trigger fc_public_photo_changed after insert or delete on public.fc_profile_photos for each row execute function public.fc_notify_public_photo_change();
create trigger fc_public_photo_updated after update of object_key,position,moderation_status on public.fc_profile_photos for each row execute function public.fc_notify_public_photo_change();

commit;
