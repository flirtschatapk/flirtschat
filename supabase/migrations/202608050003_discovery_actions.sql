begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608050003_discovery_actions'));

create table if not exists public.fc_discovery_usage (
  user_id uuid not null references public.fc_profiles(id) on delete cascade,
  usage_date date not null default current_date,
  super_likes_used smallint not null default 0 check(super_likes_used>=0),
  rewinds_used smallint not null default 0 check(rewinds_used>=0),
  primary key(user_id,usage_date)
);
create table if not exists public.fc_profile_boosts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.fc_profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  cooldown_until timestamptz not null,
  created_at timestamptz not null default now(),
  check(expires_at>started_at),check(cooldown_until>=expires_at)
);
create index if not exists fc_profile_boosts_user_started_idx on public.fc_profile_boosts(user_id,started_at desc);

alter table public.fc_discovery_usage enable row level security;
alter table public.fc_profile_boosts enable row level security;
revoke insert,update,delete on public.fc_swipes from authenticated;
do $$ begin create policy "users read own discovery usage" on public.fc_discovery_usage for select to authenticated using(user_id=(select auth.uid())); exception when duplicate_object then null; end $$;
do $$ begin create policy "users read own boosts" on public.fc_profile_boosts for select to authenticated using(user_id=(select auth.uid())); exception when duplicate_object then null; end $$;

create or replace function public.fc_swipe_and_match(target uuid,swipe_action public.fc_swipe_action)
returns table(matched boolean,match_id uuid)
language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); pair_a uuid; pair_b uuid; found_match uuid; is_premium boolean; prior_action public.fc_swipe_action;
begin
  if actor is null or target is null or actor=target then raise exception 'invalid swipe'; end if;
  if not exists(select 1 from public.fc_profiles where id=target and profile_visible and onboarding_completed and suspended_until is null) or public.fc_users_blocked(actor,target) then raise exception 'profile unavailable'; end if;
  select premium into is_premium from public.fc_profiles where id=actor for update;
  select action into prior_action from public.fc_swipes where actor_id=actor and target_id=target;
  if swipe_action='super_like' and prior_action is distinct from 'super_like' and not coalesce(is_premium,false) then
    insert into public.fc_discovery_usage(user_id,usage_date) values(actor,current_date) on conflict do nothing;
    update public.fc_discovery_usage set super_likes_used=super_likes_used+1 where user_id=actor and usage_date=current_date and super_likes_used<1;
    if not found then raise exception using errcode='P0001',message='SUPER_LIKE_LIMIT'; end if;
  end if;
  insert into public.fc_swipes(actor_id,target_id,action) values(actor,target,swipe_action)
    on conflict(actor_id,target_id) do update set action=excluded.action,created_at=now();
  if swipe_action in ('like','super_like') then
    insert into public.fc_notifications(user_id,type,title,body,href,dedupe_key)
      values(target,'likes',case when swipe_action='super_like' then 'You received a Super Like' else 'Someone likes you' end,null,'/notifications','swipe:'||actor::text||':'||target::text)
      on conflict(user_id,dedupe_key) where dedupe_key is not null do update set title=excluded.title,created_at=now(),read_at=null;
  end if;
  if swipe_action not in ('like','super_like') or not exists(select 1 from public.fc_swipes where actor_id=target and target_id=actor and action in ('like','super_like')) then return query select false,null::uuid;return;end if;
  pair_a:=least(actor,target);pair_b:=greatest(actor,target);
  insert into public.fc_matches(user_a,user_b) values(pair_a,pair_b) on conflict(user_a,user_b) do update set unmatched_at=null returning id into found_match;
  insert into public.fc_notifications(user_id,type,title,body,href,dedupe_key)
    select recipient,'match','It''s a match!','Someone you liked also liked you.','/matches','match:'||found_match::text from unnest(array[actor,target]) recipient
    on conflict(user_id,dedupe_key) where dedupe_key is not null do nothing;
  return query select true,found_match;
end $$;
revoke all on function public.fc_swipe_and_match(uuid,public.fc_swipe_action) from public;
grant execute on function public.fc_swipe_and_match(uuid,public.fc_swipe_action) to authenticated;

create or replace function public.fc_rewind_latest_swipe()
returns table(profile_id uuid) language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); swipe_record record; is_premium boolean;
begin
  if actor is null then raise exception 'authentication required'; end if;
  select premium into is_premium from public.fc_profiles where id=actor for update;
  select s.target_id,s.created_at into swipe_record from public.fc_swipes s
    where s.actor_id=actor and s.created_at>now()-interval '24 hours'
      and not exists(select 1 from public.fc_matches m where actor in(m.user_a,m.user_b) and s.target_id in(m.user_a,m.user_b) and m.unmatched_at is null)
    order by s.created_at desc limit 1 for update;
  if not found then raise exception using errcode='P0001',message='NO_REWIND_AVAILABLE'; end if;
  if not coalesce(is_premium,false) then
    insert into public.fc_discovery_usage(user_id,usage_date) values(actor,current_date) on conflict do nothing;
    update public.fc_discovery_usage set rewinds_used=rewinds_used+1 where user_id=actor and usage_date=current_date and rewinds_used<1;
    if not found then raise exception using errcode='P0001',message='REWIND_LIMIT'; end if;
  end if;
  delete from public.fc_swipes where actor_id=actor and target_id=swipe_record.target_id;
  return query select swipe_record.target_id::uuid;
end $$;
revoke all on function public.fc_rewind_latest_swipe() from public;
grant execute on function public.fc_rewind_latest_swipe() to authenticated;

create or replace function public.fc_activate_profile_boost()
returns table(started_at timestamptz,expires_at timestamptz,cooldown_until timestamptz) language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); started timestamptz:=now(); previous_cooldown timestamptz;
begin
  if actor is null then raise exception 'authentication required'; end if;
  if not exists(select 1 from public.fc_profiles where id=actor and premium) then raise exception using errcode='P0001',message='BOOST_PREMIUM_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtext(actor::text||':boost'));
  select b.cooldown_until into previous_cooldown from public.fc_profile_boosts b where b.user_id=actor order by b.started_at desc limit 1;
  if previous_cooldown>started then raise exception using errcode='P0001',message='BOOST_COOLDOWN'; end if;
  insert into public.fc_profile_boosts(user_id,started_at,expires_at,cooldown_until) values(actor,started,started+interval '30 minutes',started+interval '24 hours');
  return query select started,started+interval '30 minutes',started+interval '24 hours';
end $$;
revoke all on function public.fc_activate_profile_boost() from public;
grant execute on function public.fc_activate_profile_boost() to authenticated;

create or replace function public.fc_discovery_action_state()
returns table(premium boolean,super_likes_remaining integer,rewinds_remaining integer,can_rewind boolean,boost_started_at timestamptz,boost_expires_at timestamptz,boost_cooldown_until timestamptz)
language sql stable security definer set search_path='' as $$
  select p.premium,case when p.premium then 2147483647 else greatest(0,1-coalesce(u.super_likes_used,0)) end,
    case when p.premium then 2147483647 else greatest(0,1-coalesce(u.rewinds_used,0)) end,
    exists(select 1 from public.fc_swipes s where s.actor_id=p.id and s.created_at>now()-interval '24 hours' and not exists(select 1 from public.fc_matches m where p.id in(m.user_a,m.user_b) and s.target_id in(m.user_a,m.user_b) and m.unmatched_at is null)),
    b.started_at,b.expires_at,b.cooldown_until
  from public.fc_profiles p left join public.fc_discovery_usage u on u.user_id=p.id and u.usage_date=current_date
  left join lateral(select started_at,expires_at,cooldown_until from public.fc_profile_boosts where user_id=p.id order by started_at desc limit 1)b on true
  where p.id=auth.uid()
$$;
revoke all on function public.fc_discovery_action_state() from public;
grant execute on function public.fc_discovery_action_state() to authenticated;

create or replace function public.fc_discover_profiles() returns table(id uuid,display_name text,bio text,gender text,date_of_birth date,country text,city text,languages text[],interests text[],relationship_goal text,verified boolean,premium boolean,last_seen_at timestamptz,created_at timestamptz,photo_keys text[]) language sql stable security definer set search_path='' as $$
  select p.id,p.display_name,p.bio,p.gender,p.date_of_birth,p.country,p.city,p.languages,p.interests,p.relationship_goal,p.verified,p.premium,p.last_seen_at,p.created_at,
    coalesce(array_agg(ph.object_key order by ph.position) filter(where ph.object_key is not null),'{}')
  from public.fc_profiles p left join public.fc_profile_photos ph on ph.user_id=p.id and ph.moderation_status='approved'
  where p.id<>auth.uid() and p.profile_visible and p.onboarding_completed and p.suspended_until is null and not public.fc_users_blocked(auth.uid(),p.id)
    and not exists(select 1 from public.fc_swipes s where s.actor_id=auth.uid() and s.target_id=p.id)
  group by p.id
  order by exists(select 1 from public.fc_profile_boosts b where b.user_id=p.id and b.expires_at>now()) desc,p.last_seen_at desc;
$$;
grant execute on function public.fc_discover_profiles() to authenticated;

do $$ declare table_name text;begin
  foreach table_name in array array['fc_swipes','fc_profile_boosts'] loop
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=table_name) then execute format('alter publication supabase_realtime add table public.%I',table_name);end if;
  end loop;
end $$;
commit;
