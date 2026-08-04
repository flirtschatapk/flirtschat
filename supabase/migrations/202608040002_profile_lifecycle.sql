begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608040002_profile_lifecycle'));

alter table public.fc_profiles add column if not exists occupation text;
alter table public.fc_profiles add column if not exists education text;

alter table public.fc_profile_photos drop constraint if exists fc_profile_photos_user_id_position_key;
do $$ begin
alter table public.fc_profile_photos add constraint fc_profile_photos_user_id_position_key unique(user_id,position) deferrable initially deferred;
exception when duplicate_object then null;
end $$;

drop policy if exists "authenticated users view visible profiles" on public.fc_profiles;
do $$ begin create policy "users view own full profile" on public.fc_profiles for select to authenticated using(id=(select auth.uid())); exception when duplicate_object then null; end $$;
do $$ begin create policy "admins view profiles" on public.fc_profiles for select to authenticated using(public.fc_is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "users view own photos" on public.fc_profile_photos for select to authenticated using(user_id=(select auth.uid())); exception when duplicate_object then null; end $$;

create or replace function public.fc_complete_onboarding(profile_payload jsonb,photo_keys text[])
returns void language plpgsql security invoker set search_path='' as $$
declare uid uuid:=auth.uid(); key_count integer;
begin
  if uid is null then raise exception 'authentication required'; end if;
  if coalesce(array_length(photo_keys,1),0)<1 or coalesce(array_length(photo_keys,1),0)>6 then raise exception 'profile photo required'; end if;
  select count(*) into key_count from public.fc_profile_photos where user_id=uid and object_key=any(photo_keys);
  if key_count<>array_length(photo_keys,1) then raise exception 'invalid profile photo'; end if;

  delete from public.fc_profile_photos where user_id=uid and object_key<>all(photo_keys);

  update public.fc_profiles set
    display_name=coalesce(profile_payload->>'display_name',display_name),
    bio=coalesce(profile_payload->>'bio',bio),gender=nullif(profile_payload->>'gender',''),
    interested_in=nullif(profile_payload->>'interested_in',''),date_of_birth=nullif(profile_payload->>'date_of_birth','')::date,
    country=nullif(profile_payload->>'country',''),city=nullif(profile_payload->>'city',''),
    languages=coalesce(array(select jsonb_array_elements_text(profile_payload->'languages')),languages),
    interests=coalesce(array(select jsonb_array_elements_text(profile_payload->'interests')),interests),
    relationship_goal=nullif(profile_payload->>'relationship_goal',''),occupation=nullif(profile_payload->>'occupation',''),education=nullif(profile_payload->>'education',''),
    min_age=coalesce((profile_payload->>'min_age')::smallint,min_age),max_age=coalesce((profile_payload->>'max_age')::smallint,max_age),
    max_distance=coalesce((profile_payload->>'max_distance')::smallint,max_distance),show_me=coalesce(profile_payload->>'show_me',show_me),
    notifications_enabled=coalesce((profile_payload->>'notifications_enabled')::boolean,notifications_enabled),
    location_permission=coalesce((profile_payload->>'location_permission')::boolean,location_permission),profile_visible=coalesce((profile_payload->>'profile_visible')::boolean,profile_visible),
    onboarding_completed=true,updated_at=now()
  where id=uid;
  if not found then raise exception 'profile not found'; end if;

  update public.fc_profile_photos p set position=x.position
  from (select key,ordinality-1 as position from unnest(photo_keys) with ordinality as value(key,ordinality)) x
  where p.user_id=uid and p.object_key=x.key;
end $$;
revoke all on function public.fc_complete_onboarding(jsonb,text[]) from public;
grant execute on function public.fc_complete_onboarding(jsonb,text[]) to authenticated;

create or replace function public.fc_discover_profiles() returns table(id uuid,display_name text,bio text,gender text,date_of_birth date,country text,city text,languages text[],interests text[],relationship_goal text,verified boolean,premium boolean,last_seen_at timestamptz,created_at timestamptz,photo_keys text[]) language sql stable security definer set search_path='' as $$
  select p.id,p.display_name,p.bio,p.gender,p.date_of_birth,p.country,p.city,p.languages,p.interests,p.relationship_goal,p.verified,p.premium,p.last_seen_at,p.created_at,
    coalesce(array_agg(ph.object_key order by ph.position) filter(where ph.object_key is not null),'{}')
  from public.fc_profiles p left join public.fc_profile_photos ph on ph.user_id=p.id and ph.moderation_status='approved'
  where p.id<>auth.uid() and p.profile_visible and p.onboarding_completed and p.suspended_until is null and not public.fc_users_blocked(auth.uid(),p.id)
  group by p.id;
$$;
grant execute on function public.fc_discover_profiles() to authenticated;

drop policy if exists "users manage own photos" on public.fc_profile_photos;
create policy "users insert own photos" on public.fc_profile_photos for insert to authenticated with check(user_id=(select auth.uid()));
create policy "users update own photos" on public.fc_profile_photos for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "users delete own photos" on public.fc_profile_photos for delete to authenticated using(user_id=(select auth.uid()));

commit;
