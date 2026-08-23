begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608220001_connect_connections'));

create table if not exists public.fc_connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.fc_profiles(id) on delete cascade,
  recipient_id uuid not null references public.fc_profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> recipient_id)
);

create index if not exists fc_connections_requester_idx on public.fc_connections(requester_id,status,updated_at desc);
create index if not exists fc_connections_recipient_idx on public.fc_connections(recipient_id,status,updated_at desc);
create unique index if not exists fc_connections_active_pair_idx
  on public.fc_connections(least(requester_id,recipient_id),greatest(requester_id,recipient_id))
  where status in ('pending','accepted');

alter table public.fc_connections enable row level security;
revoke all on public.fc_connections from anon,authenticated;
grant select on public.fc_connections to authenticated;
drop policy if exists "participants view connections" on public.fc_connections;
create policy "participants view connections" on public.fc_connections
for select to authenticated
using (requester_id=(select auth.uid()) or recipient_id=(select auth.uid()));

alter table public.fc_conversations add column if not exists connection_id uuid references public.fc_connections(id) on delete set null;
alter table public.fc_conversations drop constraint if exists fc_conversations_connection_id_fkey;
alter table public.fc_conversations add constraint fc_conversations_connection_id_fkey foreign key (connection_id) references public.fc_connections(id) on delete set null;
create unique index if not exists fc_conversations_connection_idx on public.fc_conversations(connection_id) where connection_id is not null;

create or replace function public.fc_connect_people(
  search_term text default null,
  filter_key text default 'for_you',
  requested_before timestamptz default null,
  requested_before_id uuid default null,
  requested_limit integer default 30
)
returns table(
  id uuid, username text, display_name text, age integer, country text, city text,
  verified boolean, premium boolean, created_at timestamptz,
  photo_key text, connection_id uuid, connection_status text, connection_requester_id uuid, connection_is_requester boolean
)
language sql stable security definer set search_path=''
as $$
  with actor as (
    select p.id,p.country
    from public.fc_profiles p
    where p.id=(select auth.uid())
  ), candidates as (
    select p.*,
      (select ph.object_key from public.fc_profile_photos ph
       where ph.user_id=p.id and ph.moderation_status='approved'
       order by ph.position limit 1) as first_photo,
      c.id as active_connection_id,c.status as active_connection_status,c.requester_id as active_requester_id
    from public.fc_profiles p
    cross join actor a
    left join lateral (
      select c0.id,c0.status,c0.requester_id
      from public.fc_connections c0
      where c0.status in ('pending','accepted')
        and ((c0.requester_id=(select auth.uid()) and c0.recipient_id=p.id)
          or (c0.recipient_id=(select auth.uid()) and c0.requester_id=p.id))
      order by case when c0.status='accepted' then 0 else 1 end,c0.updated_at desc
      limit 1
    ) c on true
    where p.id<>(select auth.uid())
      and p.profile_visible
      and p.onboarding_completed
      and (p.suspended_until is null or p.suspended_until<=now())
      and not public.fc_users_blocked((select auth.uid()),p.id)
      and (nullif(trim(search_term),'') is null or p.display_name ilike '%'||trim(search_term)||'%' or p.username ilike '%'||trim(search_term)||'%')
      and (filter_key not in ('new','verified','nearby')
        or (filter_key='new' and p.created_at>now()-interval '7 days')
        or (filter_key='verified' and p.verified)
        or (filter_key='nearby' and a.country is not null and p.country=a.country))
      and (requested_before is null or p.created_at<requested_before
        or (p.created_at=requested_before and p.id<requested_before_id))
  )
  select c.id,c.username,c.display_name,null::integer,c.country,c.city,c.verified,c.premium,c.created_at,
    c.first_photo,c.active_connection_id,c.active_connection_status,c.active_requester_id,c.active_requester_id=(select auth.uid())
  from candidates c
  order by c.created_at desc,c.id desc
  limit greatest(1,least(coalesce(requested_limit,30),50));
$$;
revoke all on function public.fc_connect_people(text,text,timestamptz,uuid,integer) from public,anon;
grant execute on function public.fc_connect_people(text,text,timestamptz,uuid,integer) to authenticated;

create or replace function public.fc_request_connection(target_user uuid)
returns table(connection_id uuid,connection_status text)
language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); existing public.fc_connections;
begin
  if actor is null or target_user is null or actor=target_user then raise exception 'profile unavailable'; end if;
  if not exists(select 1 from public.fc_profiles p where p.id=target_user and p.profile_visible and p.onboarding_completed and (p.suspended_until is null or p.suspended_until<=now()) and not public.fc_users_blocked(actor,target_user)) then raise exception 'profile unavailable'; end if;
  perform pg_advisory_xact_lock(hashtext(least(actor,target_user)::text||':'||greatest(actor,target_user)::text||':connect'));
  select * into existing from public.fc_connections c where c.status in ('pending','accepted') and ((c.requester_id=actor and c.recipient_id=target_user) or (c.requester_id=target_user and c.recipient_id=actor)) limit 1;
  if existing.id is not null then return query select existing.id,existing.status; return; end if;
  insert into public.fc_connections(requester_id,recipient_id) values(actor,target_user) returning id,status into connection_id,connection_status;
  return next;
exception when unique_violation then
  select c.id,c.status into connection_id,connection_status from public.fc_connections c where c.status in ('pending','accepted') and ((c.requester_id=actor and c.recipient_id=target_user) or (c.requester_id=target_user and c.recipient_id=actor)) limit 1;
  if connection_id is null then raise exception 'connection unavailable'; end if;
  return next;
end $$;
revoke all on function public.fc_request_connection(uuid) from public,anon;
grant execute on function public.fc_request_connection(uuid) to authenticated;

create or replace function public.fc_accept_connection(requested_connection uuid)
returns text language plpgsql security definer set search_path=''
as $$
declare updated_status text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if exists(
    select 1
    from public.fc_connections c
    where c.id=requested_connection
      and c.status='pending'
      and public.fc_users_blocked(c.requester_id,c.recipient_id)
  ) then raise exception 'connection unavailable'; end if;
  update public.fc_connections set status='accepted',updated_at=now()
  where id=requested_connection and recipient_id=auth.uid() and status='pending'
  returning status into updated_status;
  if updated_status is null then raise exception 'connection unavailable'; end if;
  return updated_status;
end $$;
revoke all on function public.fc_accept_connection(uuid) from public,anon;
grant execute on function public.fc_accept_connection(uuid) to authenticated;

create or replace function public.fc_decline_connection(requested_connection uuid)
returns text language plpgsql security definer set search_path=''
as $$
declare updated_status text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  update public.fc_connections set status='declined',updated_at=now()
  where id=requested_connection and recipient_id=auth.uid() and status='pending'
  returning status into updated_status;
  if updated_status is null then raise exception 'connection unavailable'; end if;
  return updated_status;
end $$;
revoke all on function public.fc_decline_connection(uuid) from public,anon;
grant execute on function public.fc_decline_connection(uuid) to authenticated;

create or replace function public.fc_get_or_create_connection_conversation(requested_connection uuid)
returns uuid language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); requester uuid; recipient uuid; conversation uuid;
begin
  if actor is null then raise exception 'authentication required'; end if;
  select c.requester_id,c.recipient_id into requester,recipient from public.fc_connections c where c.id=requested_connection and c.status='accepted' and actor in(c.requester_id,c.recipient_id);
  if requester is null then raise exception 'connection unavailable'; end if;
  if public.fc_users_blocked(requester,recipient) then raise exception 'connection unavailable'; end if;
  perform pg_advisory_xact_lock(hashtext(least(requester,recipient)::text||':'||greatest(requester,recipient)::text||':connection-conversation'));
  select c.id
    into conversation
  from public.fc_conversations c
  where exists(select 1 from public.fc_conversation_members cm where cm.conversation_id=c.id and cm.user_id=requester)
    and exists(select 1 from public.fc_conversation_members cm where cm.conversation_id=c.id and cm.user_id=recipient)
    and (select count(*) from public.fc_conversation_members cm where cm.conversation_id=c.id)=2
  order by case when c.connection_id=requested_connection then 0 else 1 end,c.created_at
  limit 1;
  if conversation is null then
    insert into public.fc_conversations(connection_id) values(requested_connection) returning id into conversation;
  else
    update public.fc_conversations
    set connection_id=requested_connection
    where id=conversation and connection_id is null;
  end if;
  insert into public.fc_conversation_members(conversation_id,user_id) values(conversation,requester),(conversation,recipient) on conflict(conversation_id,user_id) do nothing;
  return conversation;
end $$;
revoke all on function public.fc_get_or_create_connection_conversation(uuid) from public,anon;
grant execute on function public.fc_get_or_create_connection_conversation(uuid) to authenticated;

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='fc_connections') then alter publication supabase_realtime add table public.fc_connections; end if;
end $$;

commit;
