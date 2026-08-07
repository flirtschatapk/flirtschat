begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608050009_conversation_membership_rls_repair'));

-- This helper is used by the fc_conversation_members SELECT policy itself.
-- SECURITY INVOKER would recursively apply that policy while querying the
-- same table. SECURITY DEFINER avoids the recursion while returning only a
-- boolean for the authenticated user; it never exposes membership rows.
create or replace function public.fc_is_conversation_member(
  p_conversation_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.fc_conversation_members as cm
      where cm.conversation_id = p_conversation_id
        and cm.user_id = auth.uid()
    );
$$;

revoke all on function public.fc_is_conversation_member(uuid) from public;
grant execute on function public.fc_is_conversation_member(uuid) to authenticated;

drop policy if exists "members view memberships" on public.fc_conversation_members;
drop policy if exists "participants view conversation memberships" on public.fc_conversation_members;
create policy "participants view conversation memberships"
on public.fc_conversation_members
for select
to authenticated
using (public.fc_is_conversation_member(conversation_id));

commit;
