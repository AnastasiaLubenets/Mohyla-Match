begin;

create or replace function private.is_service_role_request()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.role(), '') = 'service_role';
$$;

comment on function private.is_service_role_request() is
  'Detects trusted Supabase service_role requests through auth.role(), which supports current Supabase API key claim formats.';

commit;
