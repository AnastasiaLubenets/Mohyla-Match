begin;

select plan(13);

delete from public.signup_email_domains;

reset role;

select isnt(
  public.hook_before_user_created(
    jsonb_build_object('user', jsonb_build_object('email', 'student@allowed.test'))
  ) -> 'error',
  null,
  'empty signup email allowlist fails closed'
);

select isnt(
  public.hook_before_user_created(
    jsonb_build_object('user', jsonb_build_object('email', 'not-an-email'))
  ) -> 'error',
  null,
  'malformed email is rejected'
);

select isnt(
  public.hook_before_user_created(jsonb_build_object('user', jsonb_build_object())) -> 'error',
  null,
  'missing email is rejected'
);

reset role;

insert into public.signup_email_domains (domain, is_active)
values
  ('allowed.test', true),
  ('inactive.test', false);

select is(
  public.hook_before_user_created(
    jsonb_build_object('user', jsonb_build_object('email', 'student@allowed.test'))
  ),
  '{}'::jsonb,
  'allowed active domain is accepted'
);

select is(
  public.hook_before_user_created(
    jsonb_build_object('user', jsonb_build_object('email', 'Student@Allowed.Test'))
  ),
  '{}'::jsonb,
  'domain comparison is case-insensitive'
);

select isnt(
  public.hook_before_user_created(
    jsonb_build_object('user', jsonb_build_object('email', 'student@blocked.test'))
  ) -> 'error',
  null,
  'disallowed domain is rejected'
);

select isnt(
  public.hook_before_user_created(
    jsonb_build_object('user', jsonb_build_object('email', 'student@inactive.test'))
  ) -> 'error',
  null,
  'inactive configured domain is rejected'
);

select ok(
  has_function_privilege(
    'supabase_auth_admin',
    'public.hook_before_user_created(jsonb)',
    'execute'
  ),
  'supabase_auth_admin can execute the auth hook'
);

select ok(
  has_table_privilege(
    'supabase_auth_admin',
    'public.signup_email_domains',
    'select'
  ),
  'supabase_auth_admin can read signup email domains'
);

reset role;

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
)
values (
  '00000000-0000-4000-8000-000000000301',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'phase3-normal@example.test',
  '',
  now(),
  now(),
  now(),
  '{}'::jsonb,
  '{}'::jsonb
)
on conflict (id) do update
set email = excluded.email,
    email_confirmed_at = excluded.email_confirmed_at,
    updated_at = now();

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000301', true);

select is_empty(
  $$ select domain from public.signup_email_domains $$,
  'normal authenticated users cannot read signup email domains'
);

select throws_ok(
  $$ insert into public.signup_email_domains (domain)
     values ('normal-user-write.test') $$,
  '42501',
  null,
  'normal authenticated users cannot insert signup email domains'
);

select is_empty(
  $$ update public.signup_email_domains
     set is_active = false
     where domain = 'allowed.test'
     returning domain $$,
  'normal authenticated users cannot update signup email domains'
);

select throws_ok(
  $$ select public.hook_before_user_created(
       jsonb_build_object('user', jsonb_build_object('email', 'student@allowed.test'))
     ) $$,
  '42501',
  null,
  'normal authenticated users cannot invoke auth hook directly'
);

reset role;

select * from finish();
rollback;
