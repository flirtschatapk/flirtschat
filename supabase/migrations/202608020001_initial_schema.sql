begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608020001_initial_schema'));

create extension if not exists pgcrypto;

create table if not exists public.fc_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null default '',
  bio text not null default '',
  gender text,
  interested_in text,
  date_of_birth date,
  country text,
  city text,
  languages text[] not null default '{}',
  interests text[] not null default '{}',
  relationship_goal text,
  min_age smallint not null default 18 check (min_age between 18 and 80),
  max_age smallint not null default 35 check (max_age between 18 and 80 and max_age >= min_age),
  max_distance smallint not null default 50 check (max_distance between 1 and 200),
  show_me text not null default 'Everyone' check (show_me in ('Women','Men','Everyone')),
  notifications_enabled boolean not null default true,
  location_permission boolean not null default false,
  profile_visible boolean not null default true,
  onboarding_completed boolean not null default false,
  verified boolean not null default false,
  premium boolean not null default false,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fc_profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.fc_profiles(id) on delete cascade,
  object_key text not null unique,
  position smallint not null check (position between 0 and 5),
  created_at timestamptz not null default now(),
  unique(user_id,position)
);

do $$ begin
  create type public.fc_swipe_action as enum ('like','pass','super_like');
exception when duplicate_object then null;
end $$;
create table if not exists public.fc_swipes (
  actor_id uuid not null references public.fc_profiles(id) on delete cascade,
  target_id uuid not null references public.fc_profiles(id) on delete cascade,
  action public.fc_swipe_action not null,
  created_at timestamptz not null default now(),
  primary key(actor_id,target_id),
  check(actor_id<>target_id)
);

create table if not exists public.fc_matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.fc_profiles(id) on delete cascade,
  user_b uuid not null references public.fc_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unmatched_at timestamptz,
  check(user_a<user_b),
  unique(user_a,user_b)
);

create table if not exists public.fc_conversations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid unique references public.fc_matches(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.fc_conversation_members (
  conversation_id uuid not null references public.fc_conversations(id) on delete cascade,
  user_id uuid not null references public.fc_profiles(id) on delete cascade,
  last_read_at timestamptz,
  primary key(conversation_id,user_id)
);
create table if not exists public.fc_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.fc_conversations(id) on delete cascade,
  sender_id uuid not null references public.fc_profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  kind text not null default 'text' check (kind in ('text','image','voice','file')),
  media_path text,
  reply_to uuid references public.fc_messages(id) on delete set null,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.fc_blocks (
  blocker_id uuid not null references public.fc_profiles(id) on delete cascade,
  blocked_id uuid not null references public.fc_profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  primary key(blocker_id,blocked_id),
  check(blocker_id<>blocked_id)
);
create table if not exists public.fc_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.fc_profiles(id) on delete cascade,
  reported_id uuid not null references public.fc_profiles(id) on delete cascade,
  category text not null,
  details text,
  status text not null default 'pending' check(status in ('pending','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists fc_profiles_discovery_idx on public.fc_profiles(profile_visible,gender,country,created_at desc);
create index if not exists fc_messages_conversation_idx on public.fc_messages(conversation_id,created_at desc);
create index if not exists fc_conversation_members_user_idx on public.fc_conversation_members(user_id,conversation_id);
create index if not exists fc_swipes_target_idx on public.fc_swipes(target_id,action);

create or replace function public.fc_handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.fc_profiles(id,username,display_name)
  values(new.id,lower(coalesce(new.raw_user_meta_data->>'username','user_'||substr(new.id::text,1,8))),coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end; $$;
do $$ begin
  create trigger fc_on_auth_user_created after insert on auth.users for each row execute procedure public.fc_handle_new_user();
exception when duplicate_object then null;
end $$;

create or replace function public.fc_is_username_available(candidate text) returns boolean language sql stable security definer set search_path='' as $$
  select candidate ~ '^[a-z0-9_]{3,30}$' and not exists(select 1 from public.fc_profiles where username=lower(candidate));
$$;
grant execute on function public.fc_is_username_available(text) to anon,authenticated;

alter table public.fc_profiles enable row level security;
alter table public.fc_profile_photos enable row level security;
alter table public.fc_swipes enable row level security;
alter table public.fc_matches enable row level security;
alter table public.fc_conversations enable row level security;
alter table public.fc_conversation_members enable row level security;
alter table public.fc_messages enable row level security;
alter table public.fc_blocks enable row level security;
alter table public.fc_reports enable row level security;

do $$ begin create policy "authenticated users view visible profiles" on public.fc_profiles for select to authenticated using (profile_visible or id=(select auth.uid())); exception when duplicate_object then null; end $$;
do $$ begin create policy "users update own profile" on public.fc_profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid())); exception when duplicate_object then null; end $$;
do $$ begin create policy "users manage own photos" on public.fc_profile_photos for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid())); exception when duplicate_object then null; end $$;
do $$ begin create policy "authenticated users view profile photos" on public.fc_profile_photos for select to authenticated using(true); exception when duplicate_object then null; end $$;
do $$ begin create policy "users manage own swipes" on public.fc_swipes for all to authenticated using(actor_id=(select auth.uid())) with check(actor_id=(select auth.uid())); exception when duplicate_object then null; end $$;
do $$ begin create policy "participants view matches" on public.fc_matches for select to authenticated using((select auth.uid()) in (user_a,user_b)); exception when duplicate_object then null; end $$;
do $$ begin create policy "members view conversations" on public.fc_conversations for select to authenticated using(exists(select 1 from public.fc_conversation_members cm where cm.conversation_id=id and cm.user_id=(select auth.uid()))); exception when duplicate_object then null; end $$;
do $$ begin create policy "members view memberships" on public.fc_conversation_members for select to authenticated using(user_id=(select auth.uid())); exception when duplicate_object then null; end $$;
do $$ begin create policy "members update own membership" on public.fc_conversation_members for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid())); exception when duplicate_object then null; end $$;
do $$ begin create policy "members view messages" on public.fc_messages for select to authenticated using(exists(select 1 from public.fc_conversation_members cm where cm.conversation_id=fc_messages.conversation_id and cm.user_id=(select auth.uid()))); exception when duplicate_object then null; end $$;
do $$ begin create policy "members send messages" on public.fc_messages for insert to authenticated with check(sender_id=(select auth.uid()) and exists(select 1 from public.fc_conversation_members cm where cm.conversation_id=fc_messages.conversation_id and cm.user_id=(select auth.uid()))); exception when duplicate_object then null; end $$;
do $$ begin create policy "senders update own messages" on public.fc_messages for update to authenticated using(sender_id=(select auth.uid())) with check(sender_id=(select auth.uid())); exception when duplicate_object then null; end $$;
do $$ begin create policy "users manage own blocks" on public.fc_blocks for all to authenticated using(blocker_id=(select auth.uid())) with check(blocker_id=(select auth.uid())); exception when duplicate_object then null; end $$;
do $$ begin create policy "users create reports" on public.fc_reports for insert to authenticated with check(reporter_id=(select auth.uid())); exception when duplicate_object then null; end $$;
do $$ begin create policy "users view own reports" on public.fc_reports for select to authenticated using(reporter_id=(select auth.uid())); exception when duplicate_object then null; end $$;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='fc_conversations') then
    alter publication supabase_realtime add table public.fc_conversations;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='fc_messages') then
    alter publication supabase_realtime add table public.fc_messages;
  end if;
end $$;

commit;
