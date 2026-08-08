begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608080004_global_profile_unlike'));

create or replace function public.fc_unlike_profile(target uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if auth.uid() is null or target is null or target=auth.uid() then
    raise exception 'invalid unlike';
  end if;
  delete from public.fc_swipes
  where actor_id=auth.uid() and target_id=fc_unlike_profile.target
    and action in ('like','super_like');
end $$;

revoke all on function public.fc_unlike_profile(uuid) from public;
grant execute on function public.fc_unlike_profile(uuid) to authenticated;

commit;
