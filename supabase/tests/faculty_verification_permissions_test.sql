begin;

select plan(10);

select ok(
  has_table_privilege('service_role', 'public.account_roles', 'select'),
  'service role can read Faculty role state'
);

select ok(
  has_table_privilege('service_role', 'public.account_roles', 'insert'),
  'service role can create Faculty role state'
);

select ok(
  has_table_privilege('service_role', 'public.account_roles', 'update'),
  'service role can update Faculty role state'
);

select ok(
  has_column_privilege(
    'service_role',
    'public.profiles',
    'faculty_verification_status',
    'update'
  ),
  'service role can update only the Faculty verification profile field'
);

select ok(
  not has_table_privilege('anon', 'public.account_roles', 'insert'),
  'anonymous callers cannot create account role state'
);

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
  '00000000-0000-4000-8000-000000008501',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'faculty-verification-permissions@example.test',
  '',
  now(),
  now(),
  now(),
  '{}'::jsonb,
  '{}'::jsonb
)
on conflict (id) do nothing;

insert into public.account_roles (
  user_id,
  account_role,
  faculty_verification_status
)
values (
  '00000000-0000-4000-8000-000000008501',
  'faculty',
  'unverified'
)
on conflict (user_id) do update
set account_role = excluded.account_role,
    faculty_verification_status = excluded.faculty_verification_status,
    updated_at = now();

insert into public.profiles (
  user_id,
  full_name,
  faculty_id,
  academic_program_id,
  year_of_study,
  account_role,
  faculty_verification_status,
  profile_status
)
select
  '00000000-0000-4000-8000-000000008501',
  'Faculty Verification Permissions',
  f.id,
  ap.id,
  null,
  'faculty',
  'unverified',
  'active'
from public.academic_programs ap
join public.faculties f on f.id = ap.faculty_id
where ap.is_active
  and f.is_active
order by ap.id
limit 1;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000008501',
  true
);

select throws_ok(
  $$
    update public.account_roles
    set faculty_verification_status = 'verified'
    where user_id = '00000000-0000-4000-8000-000000008501'
  $$,
  '42501',
  null,
  'authenticated users cannot verify their own Faculty role'
);

reset role;
set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claim.sub', '', true);

select lives_ok(
  $$
    insert into public.account_roles (
      user_id,
      account_role,
      faculty_verification_status
    )
    values (
      '00000000-0000-4000-8000-000000008501',
      'faculty',
      'verified'
    )
    on conflict (user_id) do update
    set account_role = excluded.account_role,
        faculty_verification_status = excluded.faculty_verification_status,
        updated_at = now()
  $$,
  'service role can mark the pre-profile Faculty role as verified'
);

select lives_ok(
  $$
    update public.profiles
    set faculty_verification_status = 'verified'
    where user_id = '00000000-0000-4000-8000-000000008501'
      and account_role = 'faculty'
  $$,
  'service role can synchronize an existing Faculty profile'
);

reset role;

select is(
  (
    select faculty_verification_status::text
    from public.account_roles
    where user_id = '00000000-0000-4000-8000-000000008501'
  ),
  'verified',
  'Faculty role state is verified after the server path completes'
);

select is(
  (
    select faculty_verification_status::text
    from public.profiles
    where user_id = '00000000-0000-4000-8000-000000008501'
  ),
  'verified',
  'existing Faculty profile state is synchronized after verification'
);

select * from finish();
rollback;
