begin;

select pg_advisory_xact_lock(hashtext('flirtschat:202608230001_global_posts'));

create table if not exists public.fc_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.fc_profiles(id) on delete cascade,
  body text,
  image_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (body is not null or image_key is not null)
    and (body is null or char_length(btrim(body)) between 1 and 2000)
  ),
  check (image_key is null or image_key like 'global-post-image/' || user_id::text || '/%')
);

create index if not exists fc_posts_created_idx on public.fc_posts(created_at desc, id desc);
create index if not exists fc_posts_user_created_idx on public.fc_posts(user_id, created_at desc, id desc);
create unique index if not exists fc_posts_image_key_unique_idx on public.fc_posts(image_key) where image_key is not null;

alter table public.fc_posts enable row level security;

drop policy if exists "eligible users view global posts" on public.fc_posts;
create policy "eligible users view global posts"
on public.fc_posts
for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.fc_profiles p
    where p.id = fc_posts.user_id
      and p.profile_visible is true
      and p.onboarding_completed is true
      and (p.suspended_until is null or p.suspended_until <= now())
      and not public.fc_users_blocked((select auth.uid()), p.id)
  )
);

drop policy if exists "users create own global posts" on public.fc_posts;
create policy "users create own global posts"
on public.fc_posts
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.fc_profiles p
    where p.id = (select auth.uid())
      and p.profile_visible is true
      and p.onboarding_completed is true
      and (p.suspended_until is null or p.suspended_until <= now())
  )
);

drop policy if exists "users update own global posts" on public.fc_posts;
create policy "users update own global posts"
on public.fc_posts
for update
to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.fc_profiles p
    where p.id = (select auth.uid())
      and p.profile_visible is true
      and p.onboarding_completed is true
      and (p.suspended_until is null or p.suspended_until <= now())
  )
);

drop policy if exists "users delete own global posts" on public.fc_posts;
create policy "users delete own global posts"
on public.fc_posts
for delete
to authenticated
using (user_id = (select auth.uid()));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'fc_posts'
  ) then
    alter publication supabase_realtime add table public.fc_posts;
  end if;
end $$;

commit;
