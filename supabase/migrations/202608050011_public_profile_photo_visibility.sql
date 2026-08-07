begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608050011_public_profile_photo_visibility'));

drop policy if exists "authenticated users view profile photos" on public.fc_profile_photos;
drop policy if exists "authenticated users view approved profile photos" on public.fc_profile_photos;
drop policy if exists "users view own photos" on public.fc_profile_photos;
drop policy if exists "admins view moderation photos" on public.fc_profile_photos;
drop policy if exists "authenticated users view eligible profile photos" on public.fc_profile_photos;

create policy "authenticated users view eligible profile photos"
on public.fc_profile_photos
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.fc_is_admin()
  or (
    moderation_status = 'approved'
    and exists (
      select 1
      from public.fc_profiles as p
      where p.id = fc_profile_photos.user_id
        and p.profile_visible is true
        and p.onboarding_completed is true
        and (p.suspended_until is null or p.suspended_until <= now())
        and not public.fc_users_blocked((select auth.uid()), p.id)
    )
  )
);

create or replace function public.fc_public_profile(requested_profile uuid)
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

commit;
