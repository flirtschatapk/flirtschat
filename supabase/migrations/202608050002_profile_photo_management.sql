begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608050002_profile_photo_management'));

create or replace function public.fc_move_own_profile_photo(photo_id uuid,new_position smallint)
returns void language plpgsql security invoker set search_path='' as $$
declare uid uuid:=auth.uid(); old_position smallint;
begin
  if uid is null then raise exception 'authentication required'; end if;
  select position into old_position from public.fc_profile_photos where id=photo_id and user_id=uid;
  if not found then raise exception 'photo not found'; end if;
  if new_position<0 or new_position>5 then raise exception 'invalid photo position'; end if;
  update public.fc_profile_photos
  set position=case
    when id=photo_id then new_position
    when new_position<old_position and position>=new_position and position<old_position then position+1
    when new_position>old_position and position>old_position and position<=new_position then position-1
    else position end
  where user_id=uid;
end $$;

revoke all on function public.fc_move_own_profile_photo(uuid,smallint) from public;
grant execute on function public.fc_move_own_profile_photo(uuid,smallint) to authenticated;

commit;
