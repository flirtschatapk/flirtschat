begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608080001_publish_legacy_profile_photos'));

-- Profile uploads are currently validated by the upload-completion endpoint and
-- there is no asynchronous moderation worker. Publish those legacy rows so the
-- public profile RPC reflects the product's immediate-visibility behavior.
-- Rejected rows are intentionally never changed.
update public.fc_profile_photos as ph
set moderation_status = 'approved'
from public.fc_profiles as p
where p.id = ph.user_id
  and ph.moderation_status = 'pending'
  and p.profile_visible is true
  and p.onboarding_completed is true
  and (p.suspended_until is null or p.suspended_until <= now())
  and ph.object_key ~ '^profiles/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$';

commit;
