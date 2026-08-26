begin;

select pg_advisory_xact_lock(hashtext('flirtschat:202608250001_global_post_actions'));

create table if not exists public.fc_post_hides (
  post_id uuid not null references public.fc_posts(id) on delete cascade,
  user_id uuid not null references public.fc_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(post_id,user_id)
);

create index if not exists fc_post_hides_user_idx on public.fc_post_hides(user_id,created_at desc);

alter table public.fc_post_hides enable row level security;

drop policy if exists "users read own post hides" on public.fc_post_hides;
create policy "users read own post hides" on public.fc_post_hides
for select to authenticated using(user_id=(select auth.uid()));

drop policy if exists "users hide posts for themselves" on public.fc_post_hides;
create policy "users hide posts for themselves" on public.fc_post_hides
for insert to authenticated with check(
  user_id=(select auth.uid())
  and public.fc_can_view_global_post(post_id)
);

drop policy if exists "users remove own post hides" on public.fc_post_hides;
create policy "users remove own post hides" on public.fc_post_hides
for delete to authenticated using(user_id=(select auth.uid()));

create or replace function public.fc_hide_global_post(requested_post uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare uid uuid:=(select auth.uid());
begin
  if uid is null or not public.fc_can_view_global_post(requested_post) then
    raise exception 'post unavailable';
  end if;
  insert into public.fc_post_hides(post_id,user_id)
  values(requested_post,uid)
  on conflict(post_id,user_id) do nothing;
end;
$$;

revoke all on function public.fc_hide_global_post(uuid) from public;
grant execute on function public.fc_hide_global_post(uuid) to authenticated;

create or replace function public.fc_get_global_posts(
  requested_limit integer,
  cursor_created_at timestamptz default null,
  cursor_id uuid default null
)
returns table(id uuid,user_id uuid,body text,image_key text,created_at timestamptz)
language sql
stable
security definer
set search_path=''
as $$
  select post.id,post.user_id,post.body,post.image_key,post.created_at
  from public.fc_posts post
  join public.fc_profiles author on author.id=post.user_id
  where (select auth.uid()) is not null
  and (
    post.user_id=(select auth.uid())
    or (
      author.profile_visible is true
      and author.onboarding_completed is true
      and (author.suspended_until is null or author.suspended_until<=now())
      and not public.fc_users_blocked((select auth.uid()),author.id)
    )
  )
  and not exists(
    select 1
    from public.fc_post_hides hidden
    where hidden.post_id=post.id
      and hidden.user_id=(select auth.uid())
  )
  and (
    cursor_created_at is null
    or cursor_id is null
    or post.created_at<cursor_created_at
    or (post.created_at=cursor_created_at and post.id<cursor_id)
  )
  order by post.created_at desc,post.id desc
  limit greatest(1,least(coalesce(requested_limit,30),50));
$$;

revoke all on function public.fc_get_global_posts(integer,timestamptz,uuid) from public;
grant execute on function public.fc_get_global_posts(integer,timestamptz,uuid) to authenticated;

alter table public.fc_reports add column if not exists post_id uuid references public.fc_posts(id) on delete cascade;
create index if not exists fc_reports_post_idx on public.fc_reports(post_id,created_at desc) where post_id is not null;

drop policy if exists "users create reports" on public.fc_reports;
create policy "users create reports" on public.fc_reports
for insert to authenticated with check(
  reporter_id=(select auth.uid())
  and (
    post_id is null
    or exists(
      select 1
      from public.fc_posts post
      where post.id=fc_reports.post_id
        and post.user_id=fc_reports.reported_id
        and post.user_id<>(select auth.uid())
        and public.fc_can_view_global_post(post.id)
    )
  )
);

commit;
