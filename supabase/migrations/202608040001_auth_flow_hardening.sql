begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608040001_auth_flow_hardening'));

create unique index if not exists fc_profiles_username_lower_unique on public.fc_profiles (lower(username));

create or replace function public.fc_is_username_available(candidate text,excluded_user uuid default null)
returns boolean language sql stable security definer set search_path='' as $$
  select candidate=lower(candidate) and candidate ~ '^[a-z0-9_]{3,24}$'
    and not exists(select 1 from public.fc_profiles where lower(username)=lower(candidate) and (excluded_user is null or id<>excluded_user));
$$;
revoke all on function public.fc_is_username_available(text,uuid) from public;
grant execute on function public.fc_is_username_available(text,uuid) to anon,authenticated;

commit;
