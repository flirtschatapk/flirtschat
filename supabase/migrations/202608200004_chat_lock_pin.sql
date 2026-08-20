begin;
select pg_advisory_xact_lock(hashtext('flirtschat:202608200004_chat_lock_pin'));

-- pgcrypto is installed by the initial schema migration in public.
create extension if not exists pgcrypto;

create table if not exists public.fc_chat_lock_credentials (
  conversation_id uuid not null,
  user_id uuid not null,
  pin_hash text not null,
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (conversation_id, user_id),
  constraint fc_chat_lock_credentials_member_fk
    foreign key (conversation_id, user_id)
    references public.fc_conversation_members (conversation_id, user_id)
    on delete cascade
);

create index if not exists fc_chat_lock_credentials_user_idx
  on public.fc_chat_lock_credentials (user_id, conversation_id);

alter table public.fc_chat_lock_credentials enable row level security;
revoke all on table public.fc_chat_lock_credentials from public;
revoke all on table public.fc_chat_lock_credentials from anon;
revoke all on table public.fc_chat_lock_credentials from authenticated;

create or replace function public.fc_chat_lock_verify_internal(requested_conversation uuid, requested_pin text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare credential public.fc_chat_lock_credentials%rowtype;
begin
  if auth.uid() is null or not public.fc_is_conversation_member(requested_conversation)
     or requested_pin is null or requested_pin !~ '^[0-9]{4}$' then
    return false;
  end if;

  select * into credential
  from public.fc_chat_lock_credentials
  where conversation_id = requested_conversation and user_id = auth.uid()
  for update;

  if not found then
    return false;
  end if;
  if credential.locked_until is not null and credential.locked_until > now() then
    return false;
  end if;

  if credential.pin_hash = public.crypt(requested_pin, credential.pin_hash) then
    update public.fc_chat_lock_credentials
    set failed_attempts = 0, locked_until = null, updated_at = now()
    where conversation_id = requested_conversation and user_id = auth.uid();
    return true;
  end if;

  update public.fc_chat_lock_credentials
  set failed_attempts = failed_attempts + 1,
      locked_until = case when failed_attempts + 1 >= 5 then now() + interval '5 minutes' else locked_until end,
      updated_at = now()
  where conversation_id = requested_conversation and user_id = auth.uid();
  return false;
end;
$$;

create or replace function public.fc_set_chat_lock_pin(requested_conversation uuid, requested_pin text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.fc_is_conversation_member(requested_conversation) then
    raise exception 'conversation unavailable';
  end if;
  if requested_pin is null or requested_pin !~ '^[0-9]{4}$' then
    raise exception 'invalid chat pin';
  end if;

  if exists (
    select 1
    from public.fc_chat_lock_credentials
    where conversation_id = requested_conversation and user_id = auth.uid()
  ) then
    raise exception 'chat lock already configured';
  end if;

  begin
    insert into public.fc_chat_lock_credentials (conversation_id, user_id, pin_hash, failed_attempts, locked_until, updated_at)
    values (requested_conversation, auth.uid(), public.crypt(requested_pin, public.gen_salt('bf')), 0, null, now());
  exception when unique_violation then
    raise exception 'chat lock already configured';
  end;

  update public.fc_conversation_members set chat_locked = true
  where conversation_id = requested_conversation and user_id = auth.uid();
end;
$$;

create or replace function public.fc_verify_chat_lock_pin(requested_conversation uuid, requested_pin text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  return public.fc_chat_lock_verify_internal(requested_conversation, requested_pin);
end;
$$;

create or replace function public.fc_change_chat_lock_pin(requested_conversation uuid, current_pin text, requested_pin text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if requested_pin is null or requested_pin !~ '^[0-9]{4}$' then
    raise exception 'invalid chat pin';
  end if;
  if not public.fc_chat_lock_verify_internal(requested_conversation, current_pin) then
    raise exception 'incorrect chat pin';
  end if;

  update public.fc_chat_lock_credentials
  set pin_hash = public.crypt(requested_pin, public.gen_salt('bf')), failed_attempts = 0,
      locked_until = null, updated_at = now()
  where conversation_id = requested_conversation and user_id = auth.uid();
  update public.fc_conversation_members set chat_locked = true
  where conversation_id = requested_conversation and user_id = auth.uid();
end;
$$;

create or replace function public.fc_disable_chat_lock(requested_conversation uuid, current_pin text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.fc_chat_lock_verify_internal(requested_conversation, current_pin) then
    raise exception 'incorrect chat pin';
  end if;
  delete from public.fc_chat_lock_credentials
  where conversation_id = requested_conversation and user_id = auth.uid();
  update public.fc_conversation_members set chat_locked = false
  where conversation_id = requested_conversation and user_id = auth.uid();
end;
$$;

revoke all on function public.fc_chat_lock_verify_internal(uuid, text) from public;
revoke all on function public.fc_chat_lock_verify_internal(uuid, text) from anon;
revoke all on function public.fc_chat_lock_verify_internal(uuid, text) from authenticated;
revoke all on function public.fc_set_chat_lock_pin(uuid, text) from public;
revoke all on function public.fc_set_chat_lock_pin(uuid, text) from anon;
revoke all on function public.fc_set_chat_lock_pin(uuid, text) from authenticated;
revoke all on function public.fc_verify_chat_lock_pin(uuid, text) from public;
revoke all on function public.fc_verify_chat_lock_pin(uuid, text) from anon;
revoke all on function public.fc_verify_chat_lock_pin(uuid, text) from authenticated;
revoke all on function public.fc_change_chat_lock_pin(uuid, text, text) from public;
revoke all on function public.fc_change_chat_lock_pin(uuid, text, text) from anon;
revoke all on function public.fc_change_chat_lock_pin(uuid, text, text) from authenticated;
revoke all on function public.fc_disable_chat_lock(uuid, text) from public;
revoke all on function public.fc_disable_chat_lock(uuid, text) from anon;
revoke all on function public.fc_disable_chat_lock(uuid, text) from authenticated;
grant execute on function public.fc_set_chat_lock_pin(uuid, text) to authenticated;
grant execute on function public.fc_verify_chat_lock_pin(uuid, text) to authenticated;
grant execute on function public.fc_change_chat_lock_pin(uuid, text, text) to authenticated;
grant execute on function public.fc_disable_chat_lock(uuid, text) to authenticated;

commit;
