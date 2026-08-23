begin;

select pg_advisory_xact_lock(hashtext('flirtschat:202608230002_global_post_interactions'));

create or replace function public.fc_can_view_global_post(requested_post uuid)
returns boolean
language sql stable security definer set search_path=''
as $$
  select exists(
    select 1
    from public.fc_posts post
    join public.fc_profiles author on author.id=post.user_id
    where post.id=requested_post
      and (
        post.user_id=(select auth.uid())
        or (
          author.profile_visible is true
          and author.onboarding_completed is true
          and (author.suspended_until is null or author.suspended_until<=now())
          and not public.fc_users_blocked((select auth.uid()),author.id)
        )
      )
  );
$$;

revoke all on function public.fc_can_view_global_post(uuid) from public;
grant execute on function public.fc_can_view_global_post(uuid) to authenticated;

create or replace function public.fc_can_interact_global()
returns boolean
language sql stable security definer set search_path=''
as $$
  select exists(
    select 1
    from public.fc_profiles profile
    where profile.id=(select auth.uid())
      and profile.profile_visible is true
      and profile.onboarding_completed is true
      and (profile.suspended_until is null or profile.suspended_until<=now())
  );
$$;

revoke all on function public.fc_can_interact_global() from public,anon,authenticated;

create table if not exists public.fc_post_likes (
  post_id uuid not null references public.fc_posts(id) on delete cascade,
  user_id uuid not null references public.fc_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(post_id,user_id)
);

create table if not exists public.fc_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.fc_posts(id) on delete cascade,
  user_id uuid not null references public.fc_profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fc_post_comments_post_created_idx on public.fc_post_comments(post_id,created_at desc,id desc);

create table if not exists public.fc_post_shares (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.fc_posts(id) on delete cascade,
  user_id uuid not null references public.fc_profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists fc_post_shares_post_created_idx on public.fc_post_shares(post_id,created_at desc);

create table if not exists public.fc_post_saves (
  post_id uuid not null references public.fc_posts(id) on delete cascade,
  user_id uuid not null references public.fc_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(post_id,user_id)
);

alter table public.fc_post_likes enable row level security;
alter table public.fc_post_comments enable row level security;
alter table public.fc_post_shares enable row level security;
alter table public.fc_post_saves enable row level security;

create policy "eligible viewers read post likes" on public.fc_post_likes for select to authenticated using(
  public.fc_can_view_global_post(post_id)
  and exists(select 1 from public.fc_profiles actor where actor.id=fc_post_likes.user_id and actor.profile_visible is true and actor.onboarding_completed is true and (actor.suspended_until is null or actor.suspended_until<=now()) and not public.fc_users_blocked((select auth.uid()),actor.id))
);
create policy "eligible users create own post likes" on public.fc_post_likes for insert to authenticated with check(
  user_id=(select auth.uid())
  and public.fc_can_view_global_post(post_id)
  and exists(select 1 from public.fc_profiles actor where actor.id=(select auth.uid()) and actor.profile_visible is true and actor.onboarding_completed is true and (actor.suspended_until is null or actor.suspended_until<=now()))
);
create policy "users delete own post likes" on public.fc_post_likes for delete to authenticated using(user_id=(select auth.uid()));

create policy "eligible viewers read post comments" on public.fc_post_comments for select to authenticated using(
  public.fc_can_view_global_post(post_id)
  and exists(select 1 from public.fc_profiles commenter where commenter.id=fc_post_comments.user_id and commenter.onboarding_completed is true and (commenter.suspended_until is null or commenter.suspended_until<=now()) and not public.fc_users_blocked((select auth.uid()),commenter.id))
);
create policy "eligible users create own post comments" on public.fc_post_comments for insert to authenticated with check(
  user_id=(select auth.uid())
  and public.fc_can_view_global_post(post_id)
  and exists(select 1 from public.fc_profiles commenter where commenter.id=(select auth.uid()) and commenter.profile_visible is true and commenter.onboarding_completed is true and (commenter.suspended_until is null or commenter.suspended_until<=now()))
);
create policy "users delete own post comments" on public.fc_post_comments for delete to authenticated using(user_id=(select auth.uid()));

create policy "eligible viewers read post shares" on public.fc_post_shares for select to authenticated using(
  public.fc_can_view_global_post(post_id)
  and exists(select 1 from public.fc_profiles actor where actor.id=fc_post_shares.user_id and actor.profile_visible is true and actor.onboarding_completed is true and (actor.suspended_until is null or actor.suspended_until<=now()) and not public.fc_users_blocked((select auth.uid()),actor.id))
);
create policy "eligible users create post shares" on public.fc_post_shares for insert to authenticated with check(
  user_id=(select auth.uid())
  and public.fc_can_view_global_post(post_id)
  and exists(select 1 from public.fc_profiles actor where actor.id=(select auth.uid()) and actor.profile_visible is true and actor.onboarding_completed is true and (actor.suspended_until is null or actor.suspended_until<=now()))
);
create policy "users read own post saves" on public.fc_post_saves for select to authenticated using(user_id=(select auth.uid()));
create policy "eligible users create own post saves" on public.fc_post_saves for insert to authenticated with check(
  user_id=(select auth.uid())
  and public.fc_can_view_global_post(post_id)
  and exists(select 1 from public.fc_profiles actor where actor.id=(select auth.uid()) and actor.profile_visible is true and actor.onboarding_completed is true and (actor.suspended_until is null or actor.suspended_until<=now()))
);
create policy "users delete own post saves" on public.fc_post_saves for delete to authenticated using(user_id=(select auth.uid()));

alter table public.fc_notifications drop constraint if exists fc_notifications_type_check;
alter table public.fc_notifications add constraint fc_notifications_type_check check(type in ('likes','super_like','messages','gift','visitor','match','system','security','premium','mentions','connection_accepted','post_comment'));

create or replace function public.fc_get_post_interaction_summary(requested_posts uuid[])
returns table(post_id uuid,heart_count bigint,comment_count bigint,share_count bigint,hearted_by_me boolean,saved_by_me boolean)
language sql stable security definer set search_path=''
as $$
  select post.id,
    (select count(*) from public.fc_post_likes like_row join public.fc_profiles actor on actor.id=like_row.user_id where like_row.post_id=post.id and actor.profile_visible is true and actor.onboarding_completed is true and (actor.suspended_until is null or actor.suspended_until<=now()) and not public.fc_users_blocked((select auth.uid()),actor.id)),
    (select count(*) from public.fc_post_comments comment_row join public.fc_profiles commenter on commenter.id=comment_row.user_id where comment_row.post_id=post.id and commenter.onboarding_completed is true and (commenter.suspended_until is null or commenter.suspended_until<=now()) and not public.fc_users_blocked((select auth.uid()),commenter.id)),
    (select count(*) from public.fc_post_shares share_row join public.fc_profiles actor on actor.id=share_row.user_id where share_row.post_id=post.id and actor.profile_visible is true and actor.onboarding_completed is true and (actor.suspended_until is null or actor.suspended_until<=now()) and not public.fc_users_blocked((select auth.uid()),actor.id)),
    exists(select 1 from public.fc_post_likes mine where mine.post_id=post.id and mine.user_id=(select auth.uid())),
    exists(select 1 from public.fc_post_saves mine where mine.post_id=post.id and mine.user_id=(select auth.uid()))
  from public.fc_posts post
  where post.id=any(requested_posts) and public.fc_can_view_global_post(post.id);
$$;

revoke all on function public.fc_get_post_interaction_summary(uuid[]) from public;
grant execute on function public.fc_get_post_interaction_summary(uuid[]) to authenticated;

create or replace function public.fc_toggle_post_like(requested_post uuid)
returns table(hearted boolean,heart_count bigint)
language plpgsql security definer set search_path=''
as $$
declare uid uuid:=(select auth.uid()); owner_id uuid; actor_name text; next_state boolean;
begin
  if uid is null then raise exception 'post unavailable'; end if;
  perform pg_advisory_xact_lock(hashtextextended('post-like:'||requested_post::text||':'||uid::text,0));
  if not public.fc_can_interact_global() or not public.fc_can_view_global_post(requested_post) then raise exception 'post unavailable'; end if;
  select user_id into owner_id from public.fc_posts where id=requested_post;
  if exists(select 1 from public.fc_post_likes where post_id=requested_post and user_id=uid) then
    delete from public.fc_post_likes where post_id=requested_post and user_id=uid;
    delete from public.fc_notifications where user_id=owner_id and actor_user_id=uid and reference_id=requested_post and type='likes' and dedupe_key='post-like:'||requested_post::text||':'||uid::text;
    next_state:=false;
  else
    insert into public.fc_post_likes(post_id,user_id) values(requested_post,uid) on conflict do nothing;
    select display_name into actor_name from public.fc_profiles where id=uid;
    if owner_id<>uid then
      insert into public.fc_notifications(user_id,actor_user_id,reference_id,type,title,body,href,dedupe_key)
      values(owner_id,uid,requested_post,'likes',coalesce(actor_name,'Someone')||' liked your post',null,'/global/post/'||requested_post::text,'post-like:'||requested_post::text||':'||uid::text)
      on conflict(user_id,dedupe_key) where dedupe_key is not null do update set created_at=now(),read_at=null;
    end if;
    next_state:=true;
  end if;
  return query select next_state,(select count(*) from public.fc_post_likes like_row join public.fc_profiles actor on actor.id=like_row.user_id where like_row.post_id=requested_post and actor.profile_visible is true and actor.onboarding_completed is true and (actor.suspended_until is null or actor.suspended_until<=now()) and not public.fc_users_blocked(uid,actor.id));
end;
$$;

revoke all on function public.fc_toggle_post_like(uuid) from public;
grant execute on function public.fc_toggle_post_like(uuid) to authenticated;

create or replace function public.fc_toggle_post_save(requested_post uuid)
returns boolean
language plpgsql security definer set search_path=''
as $$
declare uid uuid:=(select auth.uid()); next_state boolean;
begin
  if uid is null then raise exception 'post unavailable'; end if;
  perform pg_advisory_xact_lock(hashtextextended('post-save:'||requested_post::text||':'||uid::text,0));
  if not public.fc_can_interact_global() or not public.fc_can_view_global_post(requested_post) then raise exception 'post unavailable'; end if;
  if exists(select 1 from public.fc_post_saves where post_id=requested_post and user_id=uid) then delete from public.fc_post_saves where post_id=requested_post and user_id=uid;next_state:=false;
  else insert into public.fc_post_saves(post_id,user_id) values(requested_post,uid) on conflict do nothing;next_state:=true; end if;
  return next_state;
end;
$$;

revoke all on function public.fc_toggle_post_save(uuid) from public;
grant execute on function public.fc_toggle_post_save(uuid) to authenticated;

create or replace function public.fc_create_post_comment(requested_post uuid,comment_body text)
returns uuid
language plpgsql security definer set search_path=''
as $$
declare uid uuid:=(select auth.uid()); comment_id uuid; owner_id uuid; actor_name text; cleaned text:=btrim(comment_body);
begin
  if uid is null or not public.fc_can_view_global_post(requested_post) or char_length(cleaned) not between 1 and 1000 then raise exception 'invalid comment'; end if;
  if not exists(select 1 from public.fc_profiles where id=uid and profile_visible is true and onboarding_completed is true and (suspended_until is null or suspended_until<=now())) then raise exception 'commenting unavailable'; end if;
  insert into public.fc_post_comments(post_id,user_id,body) values(requested_post,uid,cleaned) returning id into comment_id;
  select user_id into owner_id from public.fc_posts where id=requested_post;
  if owner_id<>uid then
    select display_name into actor_name from public.fc_profiles where id=uid;
    insert into public.fc_notifications(user_id,actor_user_id,reference_id,type,title,body,href,dedupe_key)
    values(owner_id,uid,comment_id,'post_comment',coalesce(actor_name,'Someone')||' commented on your post',left(cleaned,160),'/global/post/'||requested_post::text,'post-comment:'||comment_id::text);
  end if;
  return comment_id;
end;
$$;

revoke all on function public.fc_create_post_comment(uuid,text) from public;
grant execute on function public.fc_create_post_comment(uuid,text) to authenticated;

create or replace function public.fc_record_post_share(requested_post uuid)
returns bigint
language plpgsql security definer set search_path=''
as $$
declare uid uuid:=(select auth.uid());
begin
  if uid is null or not public.fc_can_interact_global() or not public.fc_can_view_global_post(requested_post) then raise exception 'post unavailable'; end if;
  insert into public.fc_post_shares(post_id,user_id) values(requested_post,uid);
  return (select count(*)
    from public.fc_post_shares share_row
    join public.fc_profiles actor on actor.id=share_row.user_id
    where share_row.post_id=requested_post
      and actor.profile_visible is true
      and actor.onboarding_completed is true
      and (actor.suspended_until is null or actor.suspended_until<=now())
      and not public.fc_users_blocked(uid,actor.id));
end;
$$;

revoke all on function public.fc_record_post_share(uuid) from public;
grant execute on function public.fc_record_post_share(uuid) to authenticated;

do $$
declare table_name text;
begin
  for table_name in select unnest(array['fc_post_likes','fc_post_comments','fc_post_shares']) loop
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=table_name) then
      execute format('alter publication supabase_realtime add table public.%I',table_name);
    end if;
  end loop;
end $$;

commit;
