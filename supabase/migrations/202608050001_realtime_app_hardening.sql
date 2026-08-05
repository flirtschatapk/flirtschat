begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608050001_realtime_app_hardening'));

create table if not exists public.fc_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.fc_profiles(id) on delete cascade,
  type text not null check (type in ('likes','messages','gift','visitor','match','system','security','premium','mentions')),
  title text not null check (char_length(title) between 1 and 160),
  body text,
  href text,
  dedupe_key text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists fc_notifications_user_created_idx on public.fc_notifications(user_id,created_at desc);
create unique index if not exists fc_notifications_user_dedupe_idx on public.fc_notifications(user_id,dedupe_key) where dedupe_key is not null;

alter table public.fc_profiles enable row level security;
alter table public.fc_profile_photos enable row level security;
alter table public.fc_swipes enable row level security;
alter table public.fc_matches enable row level security;
alter table public.fc_conversations enable row level security;
alter table public.fc_conversation_members enable row level security;
alter table public.fc_messages enable row level security;
alter table public.fc_blocks enable row level security;
alter table public.fc_reports enable row level security;
alter table public.fc_notifications enable row level security;

do $$ begin create policy "users read own notifications" on public.fc_notifications for select to authenticated using (user_id=(select auth.uid())); exception when duplicate_object then null; end $$;
do $$ begin create policy "users update own notifications" on public.fc_notifications for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid())); exception when duplicate_object then null; end $$;
do $$ begin create policy "users delete own notifications" on public.fc_notifications for delete to authenticated using (user_id=(select auth.uid())); exception when duplicate_object then null; end $$;

create or replace function public.fc_swipe_and_match(target uuid,swipe_action public.fc_swipe_action)
returns table(matched boolean,match_id uuid)
language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); pair_a uuid; pair_b uuid; found_match uuid;
begin
  if actor is null or target is null or actor=target then raise exception 'invalid swipe'; end if;
  if not exists(select 1 from public.fc_profiles where id=target and profile_visible and onboarding_completed) then raise exception 'profile unavailable'; end if;
  if public.fc_users_blocked(actor,target) then raise exception 'profile unavailable'; end if;
  insert into public.fc_swipes(actor_id,target_id,action) values(actor,target,swipe_action)
    on conflict(actor_id,target_id) do update set action=excluded.action,created_at=now();
  if swipe_action not in ('like','super_like') or not exists(
    select 1 from public.fc_swipes where actor_id=target and target_id=actor and action in ('like','super_like')
  ) then return query select false,null::uuid; return; end if;
  pair_a:=least(actor,target);pair_b:=greatest(actor,target);
  insert into public.fc_matches(user_a,user_b) values(pair_a,pair_b)
    on conflict(user_a,user_b) do update set unmatched_at=null returning id into found_match;
  insert into public.fc_notifications(user_id,type,title,body,href,dedupe_key)
    values(target,'match','It''s a match!','Someone you liked also liked you.','/matches','match:'||found_match::text)
    on conflict(user_id,dedupe_key) where dedupe_key is not null do nothing;
  return query select true,found_match;
end $$;
revoke all on function public.fc_swipe_and_match(uuid,public.fc_swipe_action) from public;
grant execute on function public.fc_swipe_and_match(uuid,public.fc_swipe_action) to authenticated;

create or replace function public.fc_my_matches()
returns table(match_id uuid,profile_id uuid,display_name text,username text,last_seen_at timestamptz,verified boolean,premium boolean,matched_at timestamptz,photo_key text)
language sql stable security definer set search_path=''
as $$
  select m.id,p.id,p.display_name,p.username,p.last_seen_at,p.verified,p.premium,m.created_at,
    (select ph.object_key from public.fc_profile_photos ph where ph.user_id=p.id and ph.moderation_status='approved' order by ph.position limit 1)
  from public.fc_matches m
  join public.fc_profiles p on p.id=case when m.user_a=auth.uid() then m.user_b else m.user_a end
  where auth.uid() in(m.user_a,m.user_b) and m.unmatched_at is null
  order by m.created_at desc
$$;
revoke all on function public.fc_my_matches() from public;
grant execute on function public.fc_my_matches() to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array['fc_profiles','fc_profile_photos','fc_matches','fc_conversations','fc_messages','fc_notifications'] loop
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=table_name) then
      execute format('alter publication supabase_realtime add table public.%I',table_name);
    end if;
  end loop;
end $$;

commit;
