begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608020003_application_integration_hardening'));

alter table public.fc_reports add column if not exists evidence_object_key text;
alter table public.fc_profiles add column if not exists suspended_until timestamptz;

create or replace function public.fc_is_admin() returns boolean language sql stable security definer set search_path='' as $$
  select coalesce((auth.jwt()->'app_metadata'->>'role') in ('admin','moderator','super_admin'),false)
$$;
grant execute on function public.fc_is_admin() to authenticated;

create or replace function public.fc_users_blocked(a uuid,b uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.fc_blocks where (blocker_id=a and blocked_id=b) or (blocker_id=b and blocked_id=a))
$$;
grant execute on function public.fc_users_blocked(uuid,uuid) to authenticated;

create or replace function public.fc_record_profile_visit(viewed uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();
begin
  if uid is null or uid=viewed then return false; end if;
  if public.fc_users_blocked(uid,viewed) then return false; end if;
  if not exists(select 1 from public.fc_profiles where id=viewed and profile_visible) then return false; end if;
  if exists(select 1 from public.fc_profile_visits where viewer_id=uid and viewed_id=viewed and viewed_at>now()-interval '15 minutes') then return false; end if;
  insert into public.fc_profile_visits(viewer_id,viewed_id) values(uid,viewed); return true;
end $$;
grant execute on function public.fc_record_profile_visit(uuid) to authenticated;

create or replace function public.fc_discover_profiles() returns table(id uuid,display_name text,bio text,gender text,date_of_birth date,country text,city text,languages text[],interests text[],relationship_goal text,verified boolean,premium boolean,last_seen_at timestamptz,created_at timestamptz,photo_keys text[]) language sql stable security definer set search_path='' as $$
  select p.id,p.display_name,p.bio,p.gender,p.date_of_birth,p.country,p.city,p.languages,p.interests,p.relationship_goal,p.verified,p.premium,p.last_seen_at,p.created_at,
    coalesce(array_agg(ph.object_key order by ph.position) filter(where ph.object_key is not null),'{}')
  from public.fc_profiles p left join public.fc_profile_photos ph on ph.user_id=p.id and ph.moderation_status='approved'
  where p.id<>auth.uid() and p.profile_visible and p.suspended_until is null and not public.fc_users_blocked(auth.uid(),p.id)
  group by p.id;
$$;
grant execute on function public.fc_discover_profiles() to authenticated;

create or replace function public.fc_admin_review_report(report_id uuid,new_status text) returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.fc_is_admin() then raise exception 'admin required'; end if;
  if new_status not in ('reviewing','resolved','dismissed') then raise exception 'invalid status'; end if;
  update public.fc_reports set status=new_status,updated_at=now() where id=report_id;
  if not found then raise exception 'report not found'; end if;
  insert into public.fc_admin_audit_logs(actor_id,action,entity_type,entity_id,metadata) values(auth.uid(),'report.'||new_status,'report',report_id::text,jsonb_build_object('status',new_status));
end $$;
create or replace function public.fc_admin_moderate_photo(photo_id uuid,new_status text,notes text default null) returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.fc_is_admin() then raise exception 'admin required'; end if;
  if new_status not in ('approved','rejected') then raise exception 'invalid status'; end if;
  update public.fc_profile_photos set moderation_status=new_status,moderator_notes=left(notes,1000),reviewed_at=now() where id=photo_id;
  if not found then raise exception 'photo not found'; end if;
  insert into public.fc_admin_audit_logs(actor_id,action,entity_type,entity_id,metadata) values(auth.uid(),'photo.'||new_status,'profile_photo',photo_id::text,jsonb_build_object('notes',left(notes,1000)));
end $$;
create or replace function public.fc_admin_suspend_user(target uuid,until_at timestamptz,reason text) returns void language plpgsql security definer set search_path='' as $$
begin if not public.fc_is_admin() then raise exception 'admin required'; end if; update public.fc_profiles set suspended_until=until_at where id=target; if not found then raise exception 'user not found'; end if; insert into public.fc_admin_audit_logs(actor_id,action,entity_type,entity_id,metadata) values(auth.uid(),'user.suspended','user',target::text,jsonb_build_object('until',until_at,'reason',left(reason,500))); end $$;
create or replace function public.fc_admin_adjust_coins(target uuid,delta integer,reason text) returns integer language plpgsql security definer set search_path='' as $$
declare new_balance integer;begin if not public.fc_is_admin() then raise exception 'admin required'; end if;if delta=0 then raise exception 'non-zero adjustment required';end if;insert into public.fc_coin_wallets(user_id,balance) values(target,greatest(delta,0)) on conflict(user_id) do update set balance=public.fc_coin_wallets.balance+delta,updated_at=now() where public.fc_coin_wallets.balance+delta>=0 returning balance into new_balance;if new_balance is null then raise exception 'adjustment would create negative balance';end if;insert into public.fc_coin_transactions(user_id,amount,kind,description) values(target,delta,'admin_adjustment',left(reason,500));insert into public.fc_admin_audit_logs(actor_id,action,entity_type,entity_id,metadata) values(auth.uid(),'coins.adjusted','wallet',target::text,jsonb_build_object('delta',delta,'reason',left(reason,500)));return new_balance;end $$;
create or replace function public.fc_admin_update_gift(gift text,cost integer,premium boolean,enabled boolean) returns void language plpgsql security definer set search_path='' as $$
begin if not public.fc_is_admin() then raise exception 'admin required'; end if;if cost<=0 then raise exception 'invalid cost';end if;update public.fc_gifts set coin_cost=cost,premium_only=premium,active=enabled where id=gift;if not found then raise exception 'gift not found';end if;insert into public.fc_admin_audit_logs(actor_id,action,entity_type,entity_id,metadata) values(auth.uid(),'gift.updated','gift',gift,jsonb_build_object('cost',cost,'premium',premium,'active',enabled));end $$;
grant execute on function public.fc_admin_review_report(uuid,text) to authenticated;
grant execute on function public.fc_admin_moderate_photo(uuid,text,text) to authenticated;
grant execute on function public.fc_admin_suspend_user(uuid,timestamptz,text) to authenticated;
grant execute on function public.fc_admin_adjust_coins(uuid,integer,text) to authenticated;
grant execute on function public.fc_admin_update_gift(text,integer,boolean,boolean) to authenticated;

drop policy if exists "members send messages" on public.fc_messages;
create policy "members send messages" on public.fc_messages for insert to authenticated with check(
  sender_id=(select auth.uid()) and exists(select 1 from public.fc_conversation_members cm where cm.conversation_id=fc_messages.conversation_id and cm.user_id=(select auth.uid()))
  and not exists(select 1 from public.fc_conversation_members other_member where other_member.conversation_id=fc_messages.conversation_id and other_member.user_id<>(select auth.uid()) and public.fc_users_blocked((select auth.uid()),other_member.user_id))
);
drop policy if exists "authenticated users view profile photos" on public.fc_profile_photos;
create policy "authenticated users view approved profile photos" on public.fc_profile_photos for select to authenticated using(moderation_status='approved' or user_id=(select auth.uid()) or public.fc_is_admin());
do $$ begin create policy "admins view reports" on public.fc_reports for select to authenticated using(public.fc_is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "admins view moderation photos" on public.fc_profile_photos for select to authenticated using(public.fc_is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "admins view audit logs" on public.fc_admin_audit_logs for select to authenticated using(public.fc_is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "admins view coin transactions" on public.fc_coin_transactions for select to authenticated using(public.fc_is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy "admins view all gifts" on public.fc_gifts for select to authenticated using(public.fc_is_admin()); exception when duplicate_object then null; end $$;

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='fc_daily_rewards') then alter publication supabase_realtime add table public.fc_daily_rewards; end if;
end $$;
commit;
