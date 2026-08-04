begin;

do $$ begin
  create policy "users create own profile"
  on public.fc_profiles for insert to authenticated
  with check (id=(select auth.uid()) and onboarding_completed=false);
exception when duplicate_object then null;
end $$;

commit;
