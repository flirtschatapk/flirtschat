begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608220002_connect_relationships_hub'));

create or replace function public.fc_cancel_connection_request(requested_connection uuid)
returns text language plpgsql security definer set search_path=''
as $$
declare next_status text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  update public.fc_connections set status='cancelled',updated_at=now()
  where id=requested_connection and requester_id=auth.uid() and status='pending'
  returning status into next_status;
  if next_status is null then raise exception 'connection unavailable'; end if;
  return next_status;
end;
$$;
revoke all on function public.fc_cancel_connection_request(uuid) from public,anon;
grant execute on function public.fc_cancel_connection_request(uuid) to authenticated;

create or replace function public.fc_my_connections()
returns table(connection_id uuid,profile_id uuid,username text,display_name text,age integer,city text,country text,verified boolean,premium boolean,created_at timestamptz,status text,requester_id uuid,photo_key text)
language sql stable security definer set search_path=''
as $$
  select c.id,case when c.requester_id=(select auth.uid()) then c.recipient_id else c.requester_id end,
    p.username,p.display_name,null::integer,p.city,p.country,p.verified,p.premium,c.created_at,c.status,c.requester_id,
    (select ph.object_key from public.fc_profile_photos ph where ph.user_id=p.id and ph.moderation_status='approved' order by ph.position,ph.created_at limit 1)
  from public.fc_connections c
  join public.fc_profiles p on p.id=case when c.requester_id=(select auth.uid()) then c.recipient_id else c.requester_id end
  where (c.requester_id=(select auth.uid()) or c.recipient_id=(select auth.uid())) and c.status in ('pending','accepted')
    and p.onboarding_completed and (p.suspended_until is null or p.suspended_until<=now())
    and (c.status='accepted' or p.profile_visible)
    and not public.fc_users_blocked((select auth.uid()),p.id)
  order by c.updated_at desc,c.id desc;
$$;
revoke all on function public.fc_my_connections() from public,anon;
grant execute on function public.fc_my_connections() to authenticated;
commit;
