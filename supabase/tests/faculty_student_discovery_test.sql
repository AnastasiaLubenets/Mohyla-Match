begin;

select plan(24);

insert into public.faculties (slug, display_name, avatar_theme_key, sort_order)
values ('faculty-student-discovery-test', 'Faculty Student Discovery Test', 'faculty-student-discovery', 998)
on conflict (slug) do update
set display_name = excluded.display_name,
    avatar_theme_key = excluded.avatar_theme_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.academic_programs (faculty_id, slug, display_name, avatar_variant_key, sort_order)
values (
  (select id from public.faculties where slug = 'faculty-student-discovery-test'),
  'faculty-student-discovery-program',
  'Faculty Student Discovery Program',
  'faculty-student-discovery-program',
  998
)
on conflict (slug) do update
set faculty_id = excluded.faculty_id,
    display_name = excluded.display_name,
    avatar_variant_key = excluded.avatar_variant_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.expertise_categories (slug, name, sort_order)
values ('faculty-student-discovery-test', 'Faculty Student Discovery Test', 998)
on conflict (slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.expertise (category_id, slug, name, sort_order)
values (
  (select id from public.expertise_categories where slug = 'faculty-student-discovery-test'),
  'faculty-student-discovery-expertise',
  'Faculty Student Discovery Expertise',
  998
)
on conflict (slug) do update
set category_id = excluded.category_id,
    name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

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
values
  ('00000000-0000-4000-8000-000000008701', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'faculty-discovery-student-viewer@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000008702', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'faculty-discovery-faculty-viewer@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000008703', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'faculty-discovery-visible-student@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000008704', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'faculty-discovery-visible-faculty@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000008705', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'faculty-discovery-suspended@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000008706', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'faculty-discovery-deleted@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000008707', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'faculty-discovery-incomplete@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000008708', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'faculty-discovery-blocked@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000008709', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'faculty-discovery-unverified@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb)
on conflict (id) do update
set email = excluded.email,
    email_confirmed_at = excluded.email_confirmed_at,
    updated_at = now();

insert into public.account_roles (user_id, account_role, faculty_verification_status)
values
  ('00000000-0000-4000-8000-000000008701', 'student', 'unverified'),
  ('00000000-0000-4000-8000-000000008702', 'faculty', 'unverified'),
  ('00000000-0000-4000-8000-000000008703', 'student', 'unverified'),
  ('00000000-0000-4000-8000-000000008704', 'faculty', 'unverified'),
  ('00000000-0000-4000-8000-000000008705', 'student', 'unverified'),
  ('00000000-0000-4000-8000-000000008706', 'student', 'unverified'),
  ('00000000-0000-4000-8000-000000008707', 'student', 'unverified'),
  ('00000000-0000-4000-8000-000000008708', 'student', 'unverified'),
  ('00000000-0000-4000-8000-000000008709', 'faculty', 'unverified')
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
  bio,
  availability,
  profile_status,
  onboarding_completed_at,
  deleted_at,
  allow_direct_contact
)
select
  input.user_id,
  input.full_name,
  (select id from public.faculties where slug = 'faculty-student-discovery-test'),
  (select id from public.academic_programs where slug = 'faculty-student-discovery-program'),
  input.year_of_study,
  input.account_role,
  'unverified'::public.faculty_verification_status,
  input.bio,
  'Weekdays',
  input.profile_status,
  input.onboarding_completed_at,
  input.deleted_at,
  true
from (
  values
    ('00000000-0000-4000-8000-000000008701'::uuid, 'Student Viewer'::text, 2::smallint, 'student'::public.account_role, 'Active student viewer.'::text, 'active'::public.profile_status, now(), null::timestamptz),
    ('00000000-0000-4000-8000-000000008702'::uuid, 'Faculty Viewer'::text, null::smallint, 'faculty'::public.account_role, 'Active Faculty viewer.'::text, 'active'::public.profile_status, now(), null::timestamptz),
    ('00000000-0000-4000-8000-000000008703'::uuid, 'Visible Student'::text, 3::smallint, 'student'::public.account_role, 'Visible student profile.'::text, 'active'::public.profile_status, now(), null::timestamptz),
    ('00000000-0000-4000-8000-000000008704'::uuid, 'Visible Faculty'::text, null::smallint, 'faculty'::public.account_role, 'Visible Faculty profile.'::text, 'active'::public.profile_status, now(), null::timestamptz),
    ('00000000-0000-4000-8000-000000008705'::uuid, 'Suspended Student'::text, 4::smallint, 'student'::public.account_role, 'Suspended student profile.'::text, 'suspended'::public.profile_status, now(), null::timestamptz),
    ('00000000-0000-4000-8000-000000008706'::uuid, 'Deleted Student'::text, 4::smallint, 'student'::public.account_role, 'Deleted student profile.'::text, 'deleted'::public.profile_status, now(), now()),
    ('00000000-0000-4000-8000-000000008707'::uuid, 'Incomplete Student'::text, 4::smallint, 'student'::public.account_role, 'Incomplete student profile.'::text, 'active'::public.profile_status, null::timestamptz, null::timestamptz),
    ('00000000-0000-4000-8000-000000008708'::uuid, 'Blocked Student'::text, 4::smallint, 'student'::public.account_role, 'Blocked student profile.'::text, 'active'::public.profile_status, now(), null::timestamptz),
    ('00000000-0000-4000-8000-000000008709'::uuid, 'Unverified Faculty'::text, null::smallint, 'faculty'::public.account_role, 'Unverified Faculty profile.'::text, 'active'::public.profile_status, now(), null::timestamptz)
) as input(user_id, full_name, year_of_study, account_role, bio, profile_status, onboarding_completed_at, deleted_at)
on conflict (user_id) do update
set full_name = excluded.full_name,
    faculty_id = excluded.faculty_id,
    academic_program_id = excluded.academic_program_id,
    year_of_study = excluded.year_of_study,
    account_role = excluded.account_role,
    faculty_verification_status = excluded.faculty_verification_status,
    bio = excluded.bio,
    availability = excluded.availability,
    profile_status = excluded.profile_status,
    onboarding_completed_at = excluded.onboarding_completed_at,
    deleted_at = excluded.deleted_at,
    allow_direct_contact = excluded.allow_direct_contact,
    updated_at = now();

insert into public.profile_skills (user_id, skill_id, direction)
values
  ('00000000-0000-4000-8000-000000008701', (select id from public.skills where slug = 'react'), 'offer'),
  ('00000000-0000-4000-8000-000000008701', (select id from public.skills where slug = 'python'), 'looking_for'),
  ('00000000-0000-4000-8000-000000008703', (select id from public.skills where slug = 'python'), 'offer'),
  ('00000000-0000-4000-8000-000000008703', (select id from public.skills where slug = 'react'), 'looking_for'),
  ('00000000-0000-4000-8000-000000008705', (select id from public.skills where slug = 'python'), 'offer'),
  ('00000000-0000-4000-8000-000000008706', (select id from public.skills where slug = 'python'), 'offer'),
  ('00000000-0000-4000-8000-000000008708', (select id from public.skills where slug = 'python'), 'offer')
on conflict do nothing;

insert into public.profile_interests (user_id, interest_id)
values
  ('00000000-0000-4000-8000-000000008701', (select id from public.interests where slug = 'technology')),
  ('00000000-0000-4000-8000-000000008702', (select id from public.interests where slug = 'technology')),
  ('00000000-0000-4000-8000-000000008703', (select id from public.interests where slug = 'technology'))
on conflict do nothing;

insert into public.profile_collaboration_goals (user_id, collaboration_goal_id)
values
  ('00000000-0000-4000-8000-000000008701', (select id from public.collaboration_goals where slug = 'build-app')),
  ('00000000-0000-4000-8000-000000008702', (select id from public.collaboration_goals where slug = 'build-app')),
  ('00000000-0000-4000-8000-000000008703', (select id from public.collaboration_goals where slug = 'build-app'))
on conflict do nothing;

insert into public.profile_academic_programs (user_id, academic_program_id, is_primary)
select
  user_id,
  (select id from public.academic_programs where slug = 'faculty-student-discovery-program'),
  true
from unnest(array[
  '00000000-0000-4000-8000-000000008702'::uuid,
  '00000000-0000-4000-8000-000000008704'::uuid,
  '00000000-0000-4000-8000-000000008709'::uuid
]) as faculty_users(user_id)
on conflict (user_id, academic_program_id) do update
set is_primary = true;

insert into public.faculty_expertise (user_id, expertise_id)
select
  user_id,
  (select id from public.expertise where slug = 'faculty-student-discovery-expertise')
from unnest(array[
  '00000000-0000-4000-8000-000000008702'::uuid,
  '00000000-0000-4000-8000-000000008704'::uuid,
  '00000000-0000-4000-8000-000000008709'::uuid
]) as faculty_users(user_id)
on conflict do nothing;

set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claim.sub', '', true);

update public.account_roles
set faculty_verification_status = 'verified'
where user_id in (
  '00000000-0000-4000-8000-000000008702',
  '00000000-0000-4000-8000-000000008704'
);

update public.profiles
set faculty_verification_status = 'verified'
where user_id in (
  '00000000-0000-4000-8000-000000008702',
  '00000000-0000-4000-8000-000000008704'
);

reset role;
select set_config('request.jwt.claim.role', '', true);
select set_config('request.jwt.claim.sub', '', true);

insert into public.blocks (blocker_user_id, blocked_user_id)
values ('00000000-0000-4000-8000-000000008708', '00000000-0000-4000-8000-000000008702')
on conflict do nothing;

select ok(
  has_function_privilege('authenticated', 'public.get_discovery_candidates(integer)', 'execute')
  and has_function_privilege('authenticated', 'public.get_all_discovery_profiles(integer)', 'execute')
  and has_function_privilege('authenticated', 'public.get_saved_profiles(integer)', 'execute'),
  'authenticated callers retain the existing Student discovery RPC grants'
);

select ok(
  not has_function_privilege('anon', 'public.get_discovery_candidates(integer)', 'execute')
  and not has_function_privilege('anon', 'public.get_all_discovery_profiles(integer)', 'execute')
  and not has_function_privilege('anon', 'public.get_saved_profiles(integer)', 'execute'),
  'anonymous callers receive no new Student discovery RPC access'
);

select ok(
  not has_table_privilege('authenticated', 'public.blocks', 'insert'),
  'restoring block visibility does not restore user-facing block writes'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000008701', true);

select results_eq(
  $$ select user_id from public.get_discovery_candidates(50) where user_id = '00000000-0000-4000-8000-000000008703' $$,
  $$ values ('00000000-0000-4000-8000-000000008703'::uuid) $$,
  'Student callers continue to see eligible Students in Recommended'
);

select results_eq(
  $$ select user_id from public.get_all_discovery_profiles(500) where user_id = '00000000-0000-4000-8000-000000008703' $$,
  $$ values ('00000000-0000-4000-8000-000000008703'::uuid) $$,
  'Student callers continue to see eligible Students in All students'
);

select is_empty(
  $$ select user_id from public.get_all_discovery_profiles(500) where user_id = '00000000-0000-4000-8000-000000008701' $$,
  'Student Discovery excludes the caller profile'
);

select results_eq(
  $$ select user_id from public.get_faculty_discovery_profiles(500) where user_id = '00000000-0000-4000-8000-000000008704' $$,
  $$ values ('00000000-0000-4000-8000-000000008704'::uuid) $$,
  'Student callers continue to see Faculty Discovery'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000008702', true);

select results_eq(
  $$ select user_id from public.get_discovery_candidates(50) where user_id = '00000000-0000-4000-8000-000000008703' $$,
  $$ values ('00000000-0000-4000-8000-000000008703'::uuid) $$,
  'Faculty callers see eligible Students in Recommended'
);

select results_eq(
  $$ select user_id from public.get_all_discovery_profiles(500) where user_id = '00000000-0000-4000-8000-000000008703' $$,
  $$ values ('00000000-0000-4000-8000-000000008703'::uuid) $$,
  'Faculty callers see eligible Students in All students'
);

select results_eq(
  $$ select interests->0->>'slug' from public.get_discovery_candidates(50) where user_id = '00000000-0000-4000-8000-000000008703' $$,
  $$ values ('technology'::text) $$,
  'Faculty receives the same Student filter metadata as Student callers'
);

select results_eq(
  $$ select user_id from public.profiles where user_id = '00000000-0000-4000-8000-000000008703' $$,
  $$ values ('00000000-0000-4000-8000-000000008703'::uuid) $$,
  'Faculty can open the full eligible Student profile through existing RLS'
);

select results_eq(
  $$ select contact_email from public.get_profile_contact_email('00000000-0000-4000-8000-000000008703') $$,
  $$ values ('faculty-discovery-visible-student@example.test'::text) $$,
  'Faculty can use the existing permitted Student contact action'
);

select results_eq(
  $$ select saved, action::text from public.set_saved_profile('00000000-0000-4000-8000-000000008703', true) $$,
  $$ values (true, 'save'::text) $$,
  'Faculty can save an eligible Student profile'
);

select results_eq(
  $$ select user_id from public.get_saved_profiles(50) where user_id = '00000000-0000-4000-8000-000000008703' $$,
  $$ values ('00000000-0000-4000-8000-000000008703'::uuid) $$,
  'Faculty Saved returns the saved Student profile'
);

select results_eq(
  $$ select saved, action::text from public.set_saved_profile('00000000-0000-4000-8000-000000008703', false) $$,
  $$ values (false, null::text) $$,
  'Faculty can remove the saved Student profile'
);

select results_eq(
  $$ select can_direct_contact from public.get_profile_connection_status('00000000-0000-4000-8000-000000008703') $$,
  $$ values (true) $$,
  'Faculty receives the Student profile action state'
);

select results_eq(
  $$ select user_id from public.get_faculty_discovery_profiles(500) where user_id = '00000000-0000-4000-8000-000000008704' $$,
  $$ values ('00000000-0000-4000-8000-000000008704'::uuid) $$,
  'Faculty callers continue to see Faculty Discovery'
);

select is_empty(
  $$ select user_id from public.get_faculty_discovery_profiles(500) where user_id = '00000000-0000-4000-8000-000000008702' $$,
  'Faculty Discovery excludes the caller profile'
);

select is_empty(
  $$ select user_id from public.get_discovery_candidates(50) where user_id in (
       '00000000-0000-4000-8000-000000008705',
       '00000000-0000-4000-8000-000000008706',
       '00000000-0000-4000-8000-000000008707',
       '00000000-0000-4000-8000-000000008708'
     ) $$,
  'Recommended excludes suspended, deleted, incomplete, and blocked Students'
);

select is_empty(
  $$ select user_id from public.get_all_discovery_profiles(500) where user_id in (
       '00000000-0000-4000-8000-000000008705',
       '00000000-0000-4000-8000-000000008706',
       '00000000-0000-4000-8000-000000008707',
       '00000000-0000-4000-8000-000000008708'
     ) $$,
  'All students excludes suspended, deleted, incomplete, and blocked Students'
);

select is_empty(
  $$ select user_id from public.profiles where user_id = '00000000-0000-4000-8000-000000008708' $$,
  'Faculty cannot open a blocked Student profile through RLS'
);

select is_empty(
  $$ select contact_email from public.get_profile_contact_email('00000000-0000-4000-8000-000000008708') $$,
  'Faculty cannot reveal contact information for a blocked Student'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000008709', true);

select is_empty(
  $$ select user_id from public.get_discovery_candidates(50) $$,
  'unverified Faculty cannot use Student Discovery'
);

select is_empty(
  $$ select user_id from public.get_all_discovery_profiles(500) $$,
  'unverified Faculty cannot use All students'
);

select * from finish();
rollback;
