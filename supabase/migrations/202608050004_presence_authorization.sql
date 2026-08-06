begin;

select pg_advisory_xact_lock(
  hashtext('flirtschat:202608050004_presence_authorization')
);

-- ============================================================
-- FLIRTSCHAT REALTIME PRESENCE / TYPING MIGRATION
-- ============================================================
--
-- This project database role is not the owner of Supabase's
-- managed realtime.messages table.
--
-- Therefore this migration intentionally does NOT:
--   - ALTER realtime.messages
--   - CREATE/DROP POLICY on realtime.messages
--   - GRANT/REVOKE on realtime.messages
--   - change ownership of any realtime schema object
--
-- Presence and typing channels must temporarily operate as
-- public Realtime channels from the application.
--
-- Important:
-- Public channels must contain transient, non-sensitive data only.
-- Message and conversation access remains protected by the normal
-- public-schema tables and their RLS policies.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Ensure last_seen_at exists on the canonical profile table
-- ------------------------------------------------------------

alter table public.fc_profiles
  add column if not exists last_seen_at timestamptz;


-- ------------------------------------------------------------
-- 2. Enable RLS on fc_profiles
-- ------------------------------------------------------------

alter table public.fc_profiles enable row level security;


-- ------------------------------------------------------------
-- 3. Owner may read their complete profile
-- ------------------------------------------------------------

drop policy if exists
  "fc_profiles_select_own"
  on public.fc_profiles;

create policy
  "fc_profiles_select_own"
on public.fc_profiles
for select
to authenticated
using (
  id = (select auth.uid())
);


-- ------------------------------------------------------------
-- 4. Authenticated users may read eligible public profiles
--    This controls database profile visibility, not Presence
--    channel access.
-- ------------------------------------------------------------

drop policy if exists
  "fc_profiles_select_visible_profiles"
  on public.fc_profiles;

create policy
  "fc_profiles_select_visible_profiles"
on public.fc_profiles
for select
to authenticated
using (
  id <> (select auth.uid())
  and profile_visible is true
  and onboarding_completed is true
  and (
    suspended_until is null
    or suspended_until <= now()
  )
  and not public.fc_users_blocked(
    (select auth.uid()),
    id
  )
);


-- ------------------------------------------------------------
-- 5. Authenticated user may insert only their own profile
-- ------------------------------------------------------------

drop policy if exists
  "fc_profiles_insert_own"
  on public.fc_profiles;

create policy
  "fc_profiles_insert_own"
on public.fc_profiles
for insert
to authenticated
with check (
  id = (select auth.uid())
);


-- ------------------------------------------------------------
-- 6. Authenticated user may update only their own profile
-- ------------------------------------------------------------

drop policy if exists
  "fc_profiles_update_own"
  on public.fc_profiles;

create policy
  "fc_profiles_update_own"
on public.fc_profiles
for update
to authenticated
using (
  id = (select auth.uid())
)
with check (
  id = (select auth.uid())
);


-- ------------------------------------------------------------
-- 7. Optional RPC for safely updating last_seen_at
-- ------------------------------------------------------------

create or replace function public.fc_touch_last_seen()
returns timestamptz
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  update public.fc_profiles
  set
    last_seen_at = v_now,
    updated_at = v_now
  where id = auth.uid();

  if not found then
    raise exception 'Profile not found'
      using errcode = 'P0002';
  end if;

  return v_now;
end;
$$;


revoke all
on function public.fc_touch_last_seen()
from public;

grant execute
on function public.fc_touch_last_seen()
to authenticated;


-- ------------------------------------------------------------
-- 8. Conversation membership helper
--    This may be used by normal API/RLS code before allowing
--    a client to join a public typing channel.
-- ------------------------------------------------------------

create or replace function public.fc_is_conversation_member(
  p_conversation_id uuid
)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select
    auth.uid() is not null
    and exists (
      select 1
      from public.fc_conversation_members cm
      where cm.conversation_id = p_conversation_id
        and cm.user_id = auth.uid()
    );
$$;


revoke all
on function public.fc_is_conversation_member(uuid)
from public;

grant execute
on function public.fc_is_conversation_member(uuid)
to authenticated;


-- ------------------------------------------------------------
-- 9. Documentation comments
-- ------------------------------------------------------------

comment on function public.fc_touch_last_seen()
is
  'Updates last_seen_at for the currently authenticated Flirtschat user.';


comment on function public.fc_is_conversation_member(uuid)
is
  'Returns whether the authenticated user belongs to the specified conversation.';


commit;