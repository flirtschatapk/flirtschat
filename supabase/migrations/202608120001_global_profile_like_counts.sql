begin;

create table if not exists public.fc_profile_like_counts (
  target_id uuid primary key references public.fc_profiles(id) on delete cascade,
  like_count bigint not null default 0 check (like_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.fc_profile_like_counts enable row level security;

do $$ begin
  create policy "authenticated users view profile like counts"
    on public.fc_profile_like_counts for select to authenticated using (true);
exception when duplicate_object then null; end $$;

revoke insert, update, delete on public.fc_profile_like_counts from authenticated;

insert into public.fc_profile_like_counts(target_id, like_count)
select target_id, count(*)::bigint
from public.fc_swipes
where action = 'like'
group by target_id
on conflict (target_id) do update
set like_count = excluded.like_count, updated_at = now();

create or replace function public.fc_sync_profile_like_count()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  affected_target uuid;
begin
  if tg_op <> 'INSERT' then
    affected_target := old.target_id;
    insert into public.fc_profile_like_counts(target_id, like_count, updated_at)
    values (
      affected_target,
      (select count(*)::bigint from public.fc_swipes where target_id = affected_target and action = 'like'),
      now()
    )
    on conflict (target_id) do update
      set like_count = excluded.like_count, updated_at = excluded.updated_at;
  end if;

  if tg_op <> 'DELETE' then
    affected_target := new.target_id;
    insert into public.fc_profile_like_counts(target_id, like_count, updated_at)
    values (
      affected_target,
      (select count(*)::bigint from public.fc_swipes where target_id = affected_target and action = 'like'),
      now()
    )
    on conflict (target_id) do update
      set like_count = excluded.like_count, updated_at = excluded.updated_at;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists fc_swipes_sync_profile_like_count on public.fc_swipes;
create trigger fc_swipes_sync_profile_like_count
after insert or update or delete on public.fc_swipes
for each row execute function public.fc_sync_profile_like_count();

create or replace function public.fc_global_like_states(target_ids uuid[])
returns table(target_id uuid, like_count bigint, liked_by_me boolean)
language sql
stable
security definer
set search_path=''
as $$
  select requested.target_id,
    coalesce(counts.like_count, 0)::bigint,
    exists(
      select 1 from public.fc_swipes own_like
      where own_like.actor_id = auth.uid()
        and own_like.target_id = requested.target_id
        and own_like.action = 'like'
    )
  from unnest(coalesce(target_ids, '{}'::uuid[])) as requested(target_id)
  join public.fc_profiles profile on profile.id = requested.target_id
    and profile.profile_visible
    and profile.onboarding_completed
    and profile.id <> auth.uid()
    and not public.fc_users_blocked(auth.uid(), profile.id)
  left join public.fc_profile_like_counts counts on counts.target_id = requested.target_id
  where auth.uid() is not null
  group by requested.target_id, counts.like_count;
$$;

revoke all on function public.fc_sync_profile_like_count() from public;
revoke execute on function public.fc_sync_profile_like_count() from anon, authenticated;
revoke all on function public.fc_global_like_states(uuid[]) from public;
grant execute on function public.fc_global_like_states(uuid[]) to authenticated;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'fc_profile_like_counts'
  ) then
    alter publication supabase_realtime add table public.fc_profile_like_counts;
  end if;
end $$;

commit;
