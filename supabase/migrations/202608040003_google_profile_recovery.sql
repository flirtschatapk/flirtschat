begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608040003_google_profile_recovery'));

-- Recreate the auth hook idempotently so Google users receive a clean profile
-- even before the callback/API recovery path runs.
create or replace function public.fc_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  candidate_name text;
begin
  candidate_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    ''
  );
  insert into public.fc_profiles(id,username,display_name,onboarding_completed)
  values(new.id,'user_'||substr(replace(new.id::text,'-',''),1,12),left(candidate_name,100),false)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists fc_on_auth_user_created on auth.users;
create trigger fc_on_auth_user_created
after insert on auth.users
for each row execute procedure public.fc_handle_new_user();

alter table public.fc_profiles enable row level security;

drop policy if exists "users create own profile" on public.fc_profiles;
create policy "users create own profile"
on public.fc_profiles for insert to authenticated
with check (id=(select auth.uid()) and onboarding_completed=false);

drop policy if exists "users update own profile" on public.fc_profiles;
create policy "users update own profile"
on public.fc_profiles for update to authenticated
using (id=(select auth.uid()))
with check (id=(select auth.uid()));

do $$ begin
  create policy "users view own full profile"
  on public.fc_profiles for select to authenticated
  using (id=(select auth.uid()));
exception when duplicate_object then null;
end $$;

commit;
