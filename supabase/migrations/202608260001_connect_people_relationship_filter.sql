begin;

select pg_advisory_xact_lock(hashtext('flirtschat:202608260001_connect_people_relationship_filter'));

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
       order by ph.position limit 1) as first_photo
    from public.fc_profiles p
    cross join actor a
    where (select auth.uid()) is not null
      and p.id<>(select auth.uid())
      and p.profile_visible
      and p.onboarding_completed
      and (p.suspended_until is null or p.suspended_until<=now())
      and not public.fc_users_blocked((select auth.uid()),p.id)
      and not exists(
        select 1
        from public.fc_connections c
        where c.status in ('pending','accepted')
          and ((c.requester_id=(select auth.uid()) and c.recipient_id=p.id)
            or (c.recipient_id=(select auth.uid()) and c.requester_id=p.id))
      )
      and (nullif(trim(search_term),'') is null or p.display_name ilike '%'||trim(search_term)||'%' or p.username ilike '%'||trim(search_term)||'%')
      and (filter_key not in ('new','verified','nearby')
        or (filter_key='new' and p.created_at>now()-interval '7 days')
        or (filter_key='verified' and p.verified)
        or (filter_key='nearby' and a.country is not null and p.country=a.country))
      and (
        (requested_before is null and requested_before_id is null)
        or (
          requested_before is not null
          and requested_before_id is not null
          and (
            p.created_at<requested_before
            or (p.created_at=requested_before and p.id<requested_before_id)
          )
        )
      )
  )
  select c.id,c.username,c.display_name,null::integer,c.country,c.city,c.verified,c.premium,c.created_at,
    c.first_photo,null::uuid,null::text,null::uuid,false
  from candidates c
  order by c.created_at desc,c.id desc
  limit greatest(1,least(coalesce(requested_limit,30),50));
$$;

revoke all on function public.fc_connect_people(text,text,timestamptz,uuid,integer) from public,anon;
grant execute on function public.fc_connect_people(text,text,timestamptz,uuid,integer) to authenticated;

commit;
