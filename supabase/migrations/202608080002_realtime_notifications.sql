begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608080002_realtime_notifications'));

alter table public.fc_notifications add column if not exists actor_user_id uuid references public.fc_profiles(id) on delete set null;
alter table public.fc_notifications add column if not exists reference_id uuid;
alter table public.fc_notifications drop constraint if exists fc_notifications_type_check;
alter table public.fc_notifications add constraint fc_notifications_type_check check (type in ('likes','super_like','messages','gift','visitor','match','system','security','premium','mentions'));
create index if not exists fc_notifications_recipient_created_idx on public.fc_notifications(user_id,created_at desc);
create unique index if not exists fc_notifications_user_dedupe_idx on public.fc_notifications(user_id,dedupe_key) where dedupe_key is not null;

create or replace function public.fc_notify_message() returns trigger
language plpgsql security definer set search_path='' as $$
declare recipient uuid;
begin
  for recipient in
    select cm.user_id from public.fc_conversation_members cm
    where cm.conversation_id=new.conversation_id and cm.user_id<>new.sender_id
      and not public.fc_users_blocked(new.sender_id,cm.user_id)
  loop
    insert into public.fc_notifications(user_id,actor_user_id,reference_id,type,title,body,href,dedupe_key)
      values(recipient,new.sender_id,new.id,'messages','New message',left(new.body,160),'/chats/'||new.conversation_id::text,'message:'||new.id::text)
      on conflict(user_id,dedupe_key) where dedupe_key is not null do nothing;
  end loop;
  return new;
end $$;
revoke all on function public.fc_notify_message() from public;
drop trigger if exists fc_notify_message_after_insert on public.fc_messages;
create trigger fc_notify_message_after_insert after insert on public.fc_messages for each row execute function public.fc_notify_message();

create or replace function public.fc_notify_profile_visit() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.viewer_id<>new.viewed_id and not public.fc_users_blocked(new.viewer_id,new.viewed_id) then
    insert into public.fc_notifications(user_id,actor_user_id,reference_id,type,title,body,href,dedupe_key)
      values(new.viewed_id,new.viewer_id,new.id,'visitor','Someone viewed your profile',null,'/profile/'||new.viewer_id::text,
        'visitor:'||new.viewer_id::text||':'||new.viewed_id::text||':'||to_char(new.viewed_at at time zone 'utc','YYYY-MM-DD'))
      on conflict(user_id,dedupe_key) where dedupe_key is not null do update set created_at=excluded.created_at,read_at=null;
  end if;
  return new;
end $$;
revoke all on function public.fc_notify_profile_visit() from public;
drop trigger if exists fc_notify_profile_visit_after_insert on public.fc_profile_visits;
create trigger fc_notify_profile_visit_after_insert after insert on public.fc_profile_visits for each row execute function public.fc_notify_profile_visit();

create or replace function public.fc_send_gift(recipient uuid,gift text,gift_message text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid := auth.uid(); price integer; premium_required boolean; is_premium boolean; event_id uuid; gift_name text;
begin
  if uid is null or uid=recipient then raise exception 'invalid recipient'; end if;
  if public.fc_users_blocked(uid,recipient) then raise exception 'recipient unavailable'; end if;
  if not exists(select 1 from public.fc_profiles where id=recipient and profile_visible and onboarding_completed and (suspended_until is null or suspended_until<=now())) then raise exception 'recipient unavailable'; end if;
  select coin_cost,premium_only,name into price,premium_required,gift_name from public.fc_gifts where id=gift and active;
  if price is null then raise exception 'gift unavailable'; end if;
  select premium into is_premium from public.fc_profiles where id=uid;
  if premium_required and not coalesce(is_premium,false) then raise exception 'premium required'; end if;
  update public.fc_coin_wallets set balance=balance-price,updated_at=now() where user_id=uid and balance>=price;
  if not found then raise exception 'insufficient coins'; end if;
  insert into public.fc_gift_events(sender_id,recipient_id,gift_id,coin_cost,message) values(uid,recipient,gift,price,left(gift_message,240)) returning id into event_id;
  insert into public.fc_coin_transactions(user_id,amount,kind,reference_id,description) values(uid,-price,'gift_sent',event_id,'Sent '||gift);
  insert into public.fc_notifications(user_id,actor_user_id,reference_id,type,title,body,href,dedupe_key)
    values(recipient,uid,event_id,'gift','You received a gift',coalesce(gift_name,gift),'/profile/'||uid::text,'gift:'||event_id::text)
    on conflict(user_id,dedupe_key) where dedupe_key is not null do nothing;
  return event_id;
end $$;
revoke all on function public.fc_send_gift(uuid,text,text) from public;
grant execute on function public.fc_send_gift(uuid,text,text) to authenticated;

create or replace function public.fc_swipe_and_match(target uuid,swipe_action public.fc_swipe_action)
returns table(matched boolean,match_id uuid)
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); pair_a uuid; pair_b uuid; found_match uuid; is_premium boolean; prior_action public.fc_swipe_action;
begin
  if actor is null or target is null or actor=target then raise exception 'invalid swipe'; end if;
  if not exists(select 1 from public.fc_profiles where id=target and profile_visible and onboarding_completed and (suspended_until is null or suspended_until<=now())) or public.fc_users_blocked(actor,target) then raise exception 'profile unavailable'; end if;
  select premium into is_premium from public.fc_profiles where id=actor for update;
  select action into prior_action from public.fc_swipes where actor_id=actor and target_id=target;
  if swipe_action='super_like' and prior_action is distinct from 'super_like' and not coalesce(is_premium,false) then
    insert into public.fc_discovery_usage(user_id,usage_date) values(actor,current_date) on conflict do nothing;
    update public.fc_discovery_usage set super_likes_used=super_likes_used+1 where user_id=actor and usage_date=current_date and super_likes_used<1;
    if not found then raise exception using errcode='P0001',message='SUPER_LIKE_LIMIT'; end if;
  end if;
  insert into public.fc_swipes(actor_id,target_id,action) values(actor,target,swipe_action)
    on conflict(actor_id,target_id) do update set action=excluded.action,created_at=now();
  if swipe_action in ('like','super_like') then
    delete from public.fc_notifications
      where user_id=target and type in ('likes','super_like') and dedupe_key in ('swipe:'||actor::text||':'||target::text||':like','swipe:'||actor::text||':'||target::text||':super_like');
    insert into public.fc_notifications(user_id,actor_user_id,reference_id,type,title,body,href,dedupe_key)
      values(target,actor,null,case when swipe_action='super_like' then 'super_like' else 'likes' end,
        case when swipe_action='super_like' then 'You received a Super Like' else 'Someone likes you' end,null,
        '/profile/'||actor::text,'swipe:'||actor::text||':'||target::text)
      on conflict(user_id,dedupe_key) where dedupe_key is not null do update set title=excluded.title,type=excluded.type,created_at=now(),read_at=null;
  end if;
  if swipe_action not in ('like','super_like') or not exists(select 1 from public.fc_swipes where actor_id=target and target_id=actor and action in ('like','super_like')) then return query select false,null::uuid;return;end if;
  pair_a:=least(actor,target);pair_b:=greatest(actor,target);
  insert into public.fc_matches(user_a,user_b) values(pair_a,pair_b) on conflict(user_a,user_b) do update set unmatched_at=null returning id into found_match;
  insert into public.fc_notifications(user_id,actor_user_id,reference_id,type,title,body,href,dedupe_key)
    select recipient,case when recipient=actor then target else actor end,found_match,'match','It''s a match!','You both liked each other.','/matches','match:'||found_match::text||':'||recipient::text
    from unnest(array[actor,target]) recipient
    on conflict(user_id,dedupe_key) where dedupe_key is not null do nothing;
  return query select true,found_match;
end $$;
revoke all on function public.fc_swipe_and_match(uuid,public.fc_swipe_action) from public;
grant execute on function public.fc_swipe_and_match(uuid,public.fc_swipe_action) to authenticated;

commit;
