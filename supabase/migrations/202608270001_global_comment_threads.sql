begin;

select pg_advisory_xact_lock(hashtext('flirtschat:202608270001_global_comment_threads'));

alter table public.fc_post_comments add column if not exists parent_comment_id uuid references public.fc_post_comments(id) on delete cascade;
alter table public.fc_post_comments add column if not exists edited_at timestamptz;
create index if not exists fc_post_comments_thread_idx on public.fc_post_comments(post_id,parent_comment_id,created_at,id);

drop policy if exists "eligible viewers read post comments" on public.fc_post_comments;
create policy "eligible viewers read post comments" on public.fc_post_comments for select to authenticated using(
  public.fc_can_view_global_post(post_id)
  and exists(select 1 from public.fc_profiles commenter where commenter.id=fc_post_comments.user_id and commenter.profile_visible is true and commenter.onboarding_completed is true and (commenter.suspended_until is null or commenter.suspended_until<=now()) and not public.fc_users_blocked((select auth.uid()),commenter.id))
);
drop policy if exists "eligible users create own post comments" on public.fc_post_comments;
create policy "eligible users create own post comments" on public.fc_post_comments for insert to authenticated with check(
  user_id=(select auth.uid())
  and public.fc_can_view_global_post(post_id)
  and exists(select 1 from public.fc_profiles commenter where commenter.id=(select auth.uid()) and commenter.profile_visible is true and commenter.onboarding_completed is true and (commenter.suspended_until is null or commenter.suspended_until<=now()))
  and (parent_comment_id is null or exists(select 1 from public.fc_post_comments parent where parent.id=fc_post_comments.parent_comment_id and parent.post_id=fc_post_comments.post_id and parent.parent_comment_id is null))
);

create table if not exists public.fc_comment_reactions (
  comment_id uuid not null references public.fc_post_comments(id) on delete cascade,
  user_id uuid not null references public.fc_profiles(id) on delete cascade,
  reaction text not null check (reaction in ('heart','haha','fire','love')),
  created_at timestamptz not null default now(),
  primary key(comment_id,user_id)
);
create index if not exists fc_comment_reactions_comment_idx on public.fc_comment_reactions(comment_id);
alter table public.fc_comment_reactions enable row level security;

drop policy if exists "eligible viewers read comment reactions" on public.fc_comment_reactions;
create policy "eligible viewers read comment reactions" on public.fc_comment_reactions
for select to authenticated using(
  exists(
    select 1 from public.fc_post_comments comment_row
    where comment_row.id=fc_comment_reactions.comment_id
      and public.fc_can_view_global_post(comment_row.post_id)
  )
  and exists(
    select 1 from public.fc_profiles actor
    where actor.id=fc_comment_reactions.user_id
      and actor.profile_visible is true
      and actor.onboarding_completed is true
      and (actor.suspended_until is null or actor.suspended_until<=now())
      and not public.fc_users_blocked((select auth.uid()),actor.id)
  )
);
drop policy if exists "eligible users create comment reactions" on public.fc_comment_reactions;
create policy "eligible users create comment reactions" on public.fc_comment_reactions
for insert to authenticated with check(
  user_id=(select auth.uid())
  and exists(select 1 from public.fc_profiles actor where actor.id=(select auth.uid()) and actor.profile_visible is true and actor.onboarding_completed is true and (actor.suspended_until is null or actor.suspended_until<=now()))
  and exists(select 1 from public.fc_post_comments comment_row where comment_row.id=fc_comment_reactions.comment_id and public.fc_can_view_global_post(comment_row.post_id))
);
drop policy if exists "users delete own comment reactions" on public.fc_comment_reactions;
create policy "users delete own comment reactions" on public.fc_comment_reactions for delete to authenticated using(user_id=(select auth.uid()));

drop policy if exists "users update own post comments" on public.fc_post_comments;

create or replace function public.fc_create_post_comment(requested_post uuid,comment_body text,requested_parent uuid default null)
returns uuid language plpgsql security definer set search_path=''
as $$
declare uid uuid:=(select auth.uid()); comment_id uuid; owner_id uuid; parent_owner uuid; parent_post uuid; parent_root uuid; actor_name text; cleaned text:=btrim(comment_body); root_id uuid:=requested_parent;
begin
  if uid is null or not public.fc_can_view_global_post(requested_post) or char_length(cleaned) not between 1 and 1000 then raise exception 'invalid comment'; end if;
  if not exists(select 1 from public.fc_profiles where id=uid and profile_visible is true and onboarding_completed is true and (suspended_until is null or suspended_until<=now())) then raise exception 'commenting unavailable'; end if;
  if requested_parent is not null then
    select c.user_id,c.post_id,c.parent_comment_id into parent_owner,parent_post,parent_root from public.fc_post_comments c where c.id=requested_parent;
    if parent_post is null or parent_post<>requested_post then raise exception 'comment unavailable'; end if;
    root_id:=coalesce(parent_root,requested_parent);
    if not public.fc_can_view_global_post(parent_post) then raise exception 'comment unavailable'; end if;
  end if;
  insert into public.fc_post_comments(post_id,user_id,body,parent_comment_id) values(requested_post,uid,cleaned,root_id) returning id into comment_id;
  select user_id into owner_id from public.fc_posts where id=requested_post;
  select display_name into actor_name from public.fc_profiles where id=uid;
  if requested_parent is not null and parent_owner is not null and parent_owner<>uid and parent_owner<>owner_id then
    insert into public.fc_notifications(user_id,actor_user_id,reference_id,type,title,body,href,dedupe_key) values(parent_owner,uid,comment_id,'post_comment_reply',coalesce(actor_name,'Someone')||' replied to your comment',left(cleaned,160),'/global/post/'||requested_post::text,'post-comment-reply:'||comment_id::text);
  elsif owner_id<>uid then
    insert into public.fc_notifications(user_id,actor_user_id,reference_id,type,title,body,href,dedupe_key) values(owner_id,uid,comment_id,'post_comment',coalesce(actor_name,'Someone')||' commented on your post',left(cleaned,160),'/global/post/'||requested_post::text,'post-comment:'||comment_id::text);
  end if;
  return comment_id;
end;
$$;

revoke all on function public.fc_create_post_comment(uuid,text,uuid) from public,anon;
grant execute on function public.fc_create_post_comment(uuid,text,uuid) to authenticated;

create or replace function public.fc_create_post_comment(requested_post uuid,comment_body text)
returns uuid language sql security definer set search_path=''
as $$ select public.fc_create_post_comment(requested_post,comment_body,null::uuid); $$;
revoke all on function public.fc_create_post_comment(uuid,text) from public,anon;
grant execute on function public.fc_create_post_comment(uuid,text) to authenticated;

create or replace function public.fc_edit_post_comment(requested_comment uuid,requested_body text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare uid uuid:=(select auth.uid()); cleaned text:=btrim(requested_body); result_id uuid;
begin
  if uid is null or char_length(cleaned) not between 1 and 1000 then raise exception 'invalid comment'; end if;
  update public.fc_post_comments c set body=cleaned,updated_at=now(),edited_at=now()
  where c.id=requested_comment and c.user_id=uid and public.fc_can_view_global_post(c.post_id)
    and exists(select 1 from public.fc_profiles p where p.id=uid and p.profile_visible is true and p.onboarding_completed is true and (p.suspended_until is null or p.suspended_until<=now()))
  returning c.id into result_id;
  if result_id is null then raise exception 'comment unavailable'; end if;
  return result_id;
end;
$$;
revoke all on function public.fc_edit_post_comment(uuid,text) from public,anon;
grant execute on function public.fc_edit_post_comment(uuid,text) to authenticated;

create or replace function public.fc_toggle_comment_reaction(requested_comment uuid,requested_reaction text)
returns table(reaction text,reaction_counts jsonb)
language plpgsql security definer set search_path=''
as $$
declare uid uuid:=(select auth.uid()); current_reaction text; next_reaction text;
begin
  if uid is null or requested_reaction not in ('heart','haha','fire','love') or not public.fc_can_interact_global() then raise exception 'reaction unavailable'; end if;
  if not exists(select 1 from public.fc_post_comments c where c.id=requested_comment and public.fc_can_view_global_post(c.post_id)) then raise exception 'comment unavailable'; end if;
  perform pg_advisory_xact_lock(hashtextextended('comment-reaction:'||requested_comment::text||':'||uid::text,0));
  select cr.reaction into current_reaction from public.fc_comment_reactions cr where cr.comment_id=requested_comment and cr.user_id=uid;
  if current_reaction=requested_reaction then delete from public.fc_comment_reactions where comment_id=requested_comment and user_id=uid;next_reaction:=null;
  else insert into public.fc_comment_reactions(comment_id,user_id,reaction) values(requested_comment,uid,requested_reaction) on conflict(comment_id,user_id) do update set reaction=excluded.reaction,created_at=now();next_reaction:=requested_reaction;end if;
  if next_reaction is not null and exists(select 1 from public.fc_post_comments c where c.id=requested_comment and c.user_id<>uid) then
    insert into public.fc_notifications(user_id,actor_user_id,reference_id,type,title,body,href,dedupe_key)
    select c.user_id,uid,requested_comment,'comment_reaction',coalesce(p.display_name,'Someone')||' reacted to your comment',requested_reaction,'/global/post/'||c.post_id::text,'comment-reaction:'||requested_comment::text||':'||uid::text
    from public.fc_post_comments c join public.fc_profiles p on p.id=uid where c.id=requested_comment
    on conflict(user_id,dedupe_key) where dedupe_key is not null do update set created_at=now(),read_at=null;
  end if;
  return query select next_reaction,(select jsonb_object_agg(x.reaction,x.total) from (select cr.reaction,count(*) total from public.fc_comment_reactions cr join public.fc_post_comments c on c.id=cr.comment_id join public.fc_profiles p on p.id=cr.user_id where cr.comment_id=requested_comment and p.profile_visible is true and p.onboarding_completed is true and (p.suspended_until is null or p.suspended_until<=now()) and not public.fc_users_blocked(uid,p.id) group by cr.reaction)x);
end;
$$;
revoke all on function public.fc_toggle_comment_reaction(uuid,text) from public,anon;
grant execute on function public.fc_toggle_comment_reaction(uuid,text) to authenticated;

alter table public.fc_reports add column if not exists comment_id uuid references public.fc_post_comments(id) on delete cascade;
create index if not exists fc_reports_comment_idx on public.fc_reports(comment_id,created_at desc) where comment_id is not null;
drop policy if exists "users create reports" on public.fc_reports;
create policy "users create reports" on public.fc_reports for insert to authenticated with check(
  reporter_id=(select auth.uid())
  and ((post_id is null and comment_id is null) or (post_id is not null and comment_id is null and exists(select 1 from public.fc_posts post where post.id=fc_reports.post_id and post.user_id=fc_reports.reported_id and post.user_id<>(select auth.uid()) and public.fc_can_view_global_post(post.id)))
  or (comment_id is not null and exists(select 1 from public.fc_post_comments c where c.id=fc_reports.comment_id and c.post_id=fc_reports.post_id and c.user_id=fc_reports.reported_id and c.user_id<>(select auth.uid()) and public.fc_can_view_global_post(c.post_id))))
);

create or replace function public.fc_report_post_comment(requested_comment uuid,report_category text,report_details text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare uid uuid:=(select auth.uid()); report_id uuid; owner_id uuid; post_id uuid;
begin
  select c.user_id,c.post_id into owner_id,post_id from public.fc_post_comments c where c.id=requested_comment;
  if uid is null or owner_id is null or owner_id=uid or not public.fc_can_view_global_post(post_id) then raise exception 'comment unavailable'; end if;
  insert into public.fc_reports(reporter_id,reported_id,post_id,comment_id,category,details) values(uid,owner_id,post_id,requested_comment,report_category,left(report_details,2000)) returning id into report_id;
  return report_id;
end;
$$;
revoke all on function public.fc_report_post_comment(uuid,text,text) from public,anon;
grant execute on function public.fc_report_post_comment(uuid,text,text) to authenticated;

alter table public.fc_notifications drop constraint if exists fc_notifications_type_check;
alter table public.fc_notifications add constraint fc_notifications_type_check check(type in ('likes','super_like','messages','gift','visitor','match','system','security','premium','mentions','connection_accepted','post_comment','post_comment_reply','comment_reaction'));

create or replace function public.fc_get_post_interaction_summary(requested_posts uuid[])
returns table(post_id uuid,heart_count bigint,comment_count bigint,share_count bigint,hearted_by_me boolean,saved_by_me boolean)
language sql stable security definer set search_path=''
as $$
  select post.id,
    (select count(*) from public.fc_post_likes l join public.fc_profiles p on p.id=l.user_id where l.post_id=post.id and p.profile_visible is true and p.onboarding_completed is true and (p.suspended_until is null or p.suspended_until<=now()) and not public.fc_users_blocked((select auth.uid()),p.id)),
    (select count(*) from public.fc_post_comments c join public.fc_profiles p on p.id=c.user_id where c.post_id=post.id and p.profile_visible is true and p.onboarding_completed is true and (p.suspended_until is null or p.suspended_until<=now()) and not public.fc_users_blocked((select auth.uid()),p.id)),
    (select count(*) from public.fc_post_shares s join public.fc_profiles p on p.id=s.user_id where s.post_id=post.id and p.profile_visible is true and p.onboarding_completed is true and (p.suspended_until is null or p.suspended_until<=now()) and not public.fc_users_blocked((select auth.uid()),p.id)),
    exists(select 1 from public.fc_post_likes l where l.post_id=post.id and l.user_id=(select auth.uid())),exists(select 1 from public.fc_post_saves s where s.post_id=post.id and s.user_id=(select auth.uid()))
  from public.fc_posts post where post.id=any(requested_posts) and public.fc_can_view_global_post(post.id);
$$;
revoke all on function public.fc_get_post_interaction_summary(uuid[]) from public,anon;
grant execute on function public.fc_get_post_interaction_summary(uuid[]) to authenticated;

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='fc_comment_reactions') then alter publication supabase_realtime add table public.fc_comment_reactions; end if;
end $$;

commit;
