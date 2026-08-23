begin;

select pg_advisory_xact_lock(hashtext('flirtschat:202608220003_connect_notifications'));

alter table public.fc_notifications drop constraint if exists fc_notifications_type_check;
alter table public.fc_notifications add constraint fc_notifications_type_check
  check (type in ('likes','super_like','messages','gift','visitor','match','system','security','premium','mentions','connection_accepted'));

create or replace function public.fc_accept_connection(requested_connection uuid)
returns text language plpgsql security definer set search_path=''
as $$
declare
  actor uuid:=auth.uid();
  requester uuid;
  recipient uuid;
  updated_status text;
begin
  if actor is null then raise exception 'authentication required'; end if;

  select c.requester_id,c.recipient_id into requester,recipient
  from public.fc_connections c
  where c.id=requested_connection
    and c.recipient_id=actor
    and c.status='pending'
  for update;

  if requester is null or public.fc_users_blocked(requester,recipient) then
    raise exception 'connection unavailable';
  end if;

  update public.fc_connections
  set status='accepted',updated_at=now()
  where id=requested_connection and recipient_id=actor and status='pending'
  returning status into updated_status;

  if updated_status is null then raise exception 'connection unavailable'; end if;

  insert into public.fc_notifications(user_id,actor_user_id,reference_id,type,title,body,href,dedupe_key)
    values(requester,actor,requested_connection,'connection_accepted','Connection accepted',
      'You can now connect in your Connections hub.','/matches','connection-accepted:'||requested_connection::text)
    on conflict(user_id,dedupe_key) where dedupe_key is not null do nothing;

  return updated_status;
end $$;

revoke all on function public.fc_accept_connection(uuid) from public,anon;
grant execute on function public.fc_accept_connection(uuid) to authenticated;

commit;
