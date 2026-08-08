begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608080003_profile_details_fields'));

alter table public.fc_profiles
  add column if not exists height_cm integer,
  add column if not exists zodiac text,
  add column if not exists exercise text,
  add column if not exists drinking text,
  add column if not exists smoking text,
  add column if not exists pronouns text,
  add column if not exists children text,
  add column if not exists beliefs text;

do $$
begin
  alter table public.fc_profiles
    add constraint fc_profiles_height_cm_range
    check (height_cm is null or height_cm between 100 and 250);
exception
  when duplicate_object then null;
end $$;

drop function if exists public.fc_public_profile(uuid);

create function public.fc_public_profile(requested_profile uuid)
returns table(
  id uuid,
  username text,
  display_name text,
  bio text,
  gender text,
  date_of_birth date,
  country text,
  city text,
  languages text[],
  interests text[],
  relationship_goal text,
  occupation text,
  education text,
  height_cm integer,
  zodiac text,
  exercise text,
  drinking text,
  smoking text,
  pronouns text,
  children text,
  beliefs text,
  verified boolean,
  premium boolean,
  last_seen_at timestamptz,
  created_at timestamptz,
  photo_keys text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.username,
    p.display_name,
    p.bio,
    p.gender,
    p.date_of_birth,
    p.country,
    p.city,
    p.languages,
    p.interests,
    p.relationship_goal,
    p.occupation,
    p.education,
    p.height_cm,
    p.zodiac,
    p.exercise,
    p.drinking,
    p.smoking,
    p.pronouns,
    p.children,
    p.beliefs,
    p.verified,
    p.premium,
    p.last_seen_at,
    p.created_at,
    coalesce(
      (
        select array_agg(ordered.object_key order by ordered.position)
        from (
          select ph.object_key, ph.position
          from public.fc_profile_photos as ph
          where ph.user_id = p.id
            and ph.moderation_status = 'approved'
          order by ph.position
          limit 5
        ) as ordered
      ),
      '{}'
    ) as photo_keys
  from public.fc_profiles as p
  where p.id = requested_profile
    and p.profile_visible is true
    and p.onboarding_completed is true
    and (p.suspended_until is null or p.suspended_until <= now())
    and not public.fc_users_blocked((select auth.uid()), p.id)
$$;

revoke all on function public.fc_public_profile(uuid) from public;
grant execute on function public.fc_public_profile(uuid) to authenticated;

drop trigger if exists fc_public_profile_updated on public.fc_profiles;
create trigger fc_public_profile_updated
after update of username,display_name,bio,gender,date_of_birth,country,city,languages,interests,relationship_goal,occupation,education,height_cm,zodiac,exercise,drinking,smoking,pronouns,children,beliefs,profile_visible,onboarding_completed,verified,premium,suspended_until
on public.fc_profiles
for each row execute function public.fc_notify_public_profile_change();

commit;
