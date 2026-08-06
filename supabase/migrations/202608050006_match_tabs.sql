begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608050006_match_tabs'));

create table if not exists public.fc_match_views (
  match_id uuid not null references public.fc_matches(id) on delete cascade,
  user_id uuid not null references public.fc_profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key(match_id,user_id)
);

alter table public.fc_match_views enable row level security;
drop policy if exists "users view own match views" on public.fc_match_views;
create policy "users view own match views" on public.fc_match_views
for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists "users insert own match views" on public.fc_match_views;
create policy "users insert own match views" on public.fc_match_views
for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists "users update own match views" on public.fc_match_views;
create policy "users update own match views" on public.fc_match_views
for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

create or replace function public.fc_my_matches_with_status()
returns table(
  match_id uuid,profile_id uuid,display_name text,username text,last_seen_at timestamptz,
  verified boolean,premium boolean,matched_at timestamptz,photo_key text,is_new boolean,is_super_like boolean
) language sql stable security definer set search_path='' as $$
  select m.id,p.id,p.display_name,p.username,p.last_seen_at,p.verified,p.premium,m.created_at,
    (select ph.object_key from public.fc_profile_photos ph where ph.user_id=p.id and ph.moderation_status='approved' order by ph.position limit 1),
    not exists(select 1 from public.fc_match_views mv where mv.match_id=m.id and mv.user_id=(select auth.uid())),
    exists(
      select 1 from public.fc_swipes s
      where s.action='super_like'
        and ((s.actor_id=m.user_a and s.target_id=m.user_b) or (s.actor_id=m.user_b and s.target_id=m.user_a))
    )
  from public.fc_matches m
  join public.fc_profiles p on p.id=case when m.user_a=(select auth.uid()) then m.user_b else m.user_a end
  where (select auth.uid()) in(m.user_a,m.user_b) and m.unmatched_at is null
  order by m.created_at desc
$$;
revoke all on function public.fc_my_matches_with_status() from public;
grant execute on function public.fc_my_matches_with_status() to authenticated;

create or replace function public.fc_mark_match_viewed(requested_match uuid)
returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=(select auth.uid());
begin
  if uid is null then raise exception 'authentication required'; end if;
  if not exists(select 1 from public.fc_matches where id=requested_match and uid in(user_a,user_b) and unmatched_at is null) then
    raise exception 'match unavailable';
  end if;
  insert into public.fc_match_views(match_id,user_id) values(requested_match,uid)
  on conflict(match_id,user_id) do update set viewed_at=excluded.viewed_at;
end $$;
revoke all on function public.fc_mark_match_viewed(uuid) from public;
grant execute on function public.fc_mark_match_viewed(uuid) to authenticated;

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='fc_match_views') then
    alter publication supabase_realtime add table public.fc_match_views;
  end if;
end $$;
commit;
