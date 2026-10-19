begin;

grant select, insert, update on public.account_roles to service_role;
grant update (faculty_verification_status) on public.profiles to service_role;

commit;
