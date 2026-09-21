create or replace function public.delete_my_profile()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  deleted_count integer;
begin
  if caller_id is null then
    raise exception 'Authentication required to delete profile.'
      using errcode = '42501';
  end if;

  delete from public.profiles
  where user_id = caller_id;

  get diagnostics deleted_count = row_count;
  if deleted_count <> 1 then
    raise exception 'Profile not found.'
      using errcode = 'P0001';
  end if;

  return true;
end;
$$;

revoke execute on function public.delete_my_profile() from public, anon;
grant execute on function public.delete_my_profile() to authenticated;

comment on function public.delete_my_profile() is
  'Deletes only the authenticated caller profile row while preserving auth.users. Existing foreign keys cascade profile_skills, profile_interests, profile_collaboration_goals, interactions, matches, blocks, and reports that reference the deleted profile; product_events and user_roles remain tied to auth.users.';
