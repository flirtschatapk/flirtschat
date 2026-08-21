begin;

alter table public.fc_messages
  drop constraint if exists fc_messages_kind_check;

alter table public.fc_messages
  add constraint fc_messages_kind_check
  check (kind in ('text','image','video','voice','file'));

commit;
