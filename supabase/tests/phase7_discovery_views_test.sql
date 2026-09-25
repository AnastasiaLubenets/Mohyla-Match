begin;

select plan(17);

insert into public.faculties (slug, display_name, avatar_theme_key, sort_order)
values ('phase7-discovery-faculty', 'Phase 7 Discovery Faculty', 'phase7', 997)
on conflict (slug) do update
set display_name = excluded.display_name,
    avatar_theme_key = excluded.avatar_theme_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.academic_programs (faculty_id, slug, display_name, avatar_variant_key, sort_order)
values (
  (select id from public.faculties where slug = 'phase7-discovery-faculty'),
  'phase7-discovery-program',
  'Phase 7 Discovery Program',
  'phase7-program',
  997
)
on conflict (slug) do update
set faculty_id = excluded.faculty_id,
    display_name = excluded.display_name,
    avatar_variant_key = excluded.avatar_variant_key,
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
  ('00000000-0000-4000-8000-000000001201', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase7-viewer@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000001202', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase7-skipped@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000001203', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase7-blocked-by-viewer@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000001204', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase7-blocked-viewer@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000001205', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase7-saved@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb)
on conflict (id) do update
set email = excluded.email,
    email_confirmed_at = excluded.email_confirmed_at,
    updated_at = now();

insert into public.profiles (
  user_id,
  full_name,
  faculty_id,
  academic_program_id,
  year_of_study,
  bio,
  availability,
  profile_status,
  onboarding_completed_at
)
select
  user_id,
  full_name,
  (select id from public.faculties where slug = 'phase7-discovery-faculty'),
  (select id from public.academic_programs where slug = 'phase7-discovery-program'),
  year_of_study,
  bio,
  availability,
  'active'::public.profile_status,
  now()
from (
  values
    ('00000000-0000-4000-8000-000000001201'::uuid, 'Phase Seven Viewer'::text, 2::smallint, 'Viewer profile.'::text, 'Weekdays'::text),
    ('00000000-0000-4000-8000-000000001202'::uuid, 'Phase Seven Skipped'::text, 3::smallint, 'Skipped but still directory-visible.'::text, 'Weekends'::text),
    ('00000000-0000-4000-8000-000000001203'::uuid, 'Phase Seven Blocked By Viewer'::text, 4::smallint, 'Blocked target.'::text, 'Weekends'::text),
    ('00000000-0000-4000-8000-000000001204'::uuid, 'Phase Seven Blocked Viewer'::text, 1::smallint, 'Blocks the viewer.'::text, 'Evenings'::text),
    ('00000000-0000-4000-8000-000000001205'::uuid, 'Phase Seven Saved'::text, 5::smallint, 'Saved but still directory-visible.'::text, 'Evenings'::text)
) as input(user_id, full_name, year_of_study, bio, availability)
on conflict (user_id) do update
set full_name = excluded.full_name,
    faculty_id = excluded.faculty_id,
    academic_program_id = excluded.academic_program_id,
    year_of_study = excluded.year_of_study,
    bio = excluded.bio,
    availability = excluded.availability,
    profile_status = excluded.profile_status,
    onboarding_completed_at = excluded.onboarding_completed_at,
    deleted_at = null,
    updated_at = now();

insert into public.profile_skills (user_id, skill_id, direction)
values
  ('00000000-0000-4000-8000-000000001201', (select id from public.skills where slug = 'react'), 'offer'),
  ('00000000-0000-4000-8000-000000001201', (select id from public.skills where slug = 'python'), 'looking_for'),
  ('00000000-0000-4000-8000-000000001202', (select id from public.skills where slug = 'python'), 'offer'),
  ('00000000-0000-4000-8000-000000001202', (select id from public.skills where slug = 'react'), 'looking_for'),
  ('00000000-0000-4000-8000-000000001203', (select id from public.skills where slug = 'python'), 'offer'),
  ('00000000-0000-4000-8000-000000001204', (select id from public.skills where slug = 'python'), 'offer'),
  ('00000000-0000-4000-8000-000000001205', (select id from public.skills where slug = 'figma'), 'offer')
on conflict do nothing;

insert into public.profile_interests (user_id, interest_id)
values
  ('00000000-0000-4000-8000-000000001201', (select id from public.interests where slug = 'technology')),
  ('00000000-0000-4000-8000-000000001202', (select id from public.interests where slug = 'technology')),
  ('00000000-0000-4000-8000-000000001205', (select id from public.interests where slug = 'education'))
on conflict do nothing;

insert into public.profile_collaboration_goals (user_id, collaboration_goal_id)
values
  ('00000000-0000-4000-8000-000000001201', (select id from public.collaboration_goals where slug = 'build-app')),
  ('00000000-0000-4000-8000-000000001202', (select id from public.collaboration_goals where slug = 'build-app')),
  ('00000000-0000-4000-8000-000000001205', (select id from public.collaboration_goals where slug = 'study-partner'))
on conflict do nothing;

insert into public.blocks (blocker_user_id, blocked_user_id)
values
  ('00000000-0000-4000-8000-000000001201', '00000000-0000-4000-8000-000000001203'),
  ('00000000-0000-4000-8000-000000001204', '00000000-0000-4000-8000-000000001201')
on conflict (blocker_user_id, blocked_user_id) do nothing;

select ok(
  has_function_privilege('authenticated', 'public.get_all_discovery_profiles(integer)', 'execute'),
  'authenticated users can execute all students discovery RPC'
);

select ok(
  not has_function_privilege('anon', 'public.get_all_discovery_profiles(integer)', 'execute'),
  'anonymous users cannot execute all students discovery RPC'
);

reset role;
set local role anon;
select throws_ok(
  $$ select * from public.get_all_discovery_profiles(10) $$,
  '42501',
  null,
  'anonymous all students call is rejected'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000001201', true);

select results_eq(
  $$ select user_id
     from public.get_discovery_candidates(20)
     where user_id = '00000000-0000-4000-8000-000000001202' $$,
  $$ values ('00000000-0000-4000-8000-000000001202'::uuid) $$,
  'recommended candidate appears in recommended discovery before actions'
);

select results_eq(
  $$ select user_id
     from public.get_all_discovery_profiles(500)
     where user_id = '00000000-0000-4000-8000-000000001202' $$,
  $$ values ('00000000-0000-4000-8000-000000001202'::uuid) $$,
  'recommended candidate also appears in all students before actions'
);

select is_empty(
  $$ select user_id
     from public.get_discovery_candidates(20)
     except
     select user_id
     from public.get_all_discovery_profiles(500) $$,
  'recommended discovery ids are a subset of all students ids'
);

select results_eq(
  $$ select saved, action::text
     from public.set_saved_profile('00000000-0000-4000-8000-000000001202', true) $$,
  $$ values (true, 'save'::text) $$,
  'viewer can save a recommended profile'
);

select results_eq(
  $$ select user_id
     from public.get_all_discovery_profiles(500)
     where user_id = '00000000-0000-4000-8000-000000001202' $$,
  $$ values ('00000000-0000-4000-8000-000000001202'::uuid) $$,
  'saved recommended profile remains visible in all students'
);

select results_eq(
  $$ select action::text
     from public.set_discovery_action('00000000-0000-4000-8000-000000001202', 'skip') $$,
  $$ values ('skip'::text) $$,
  'viewer can skip the same recommended profile'
);

select is_empty(
  $$ select user_id
     from public.get_discovery_candidates(20)
     where user_id = '00000000-0000-4000-8000-000000001202' $$,
  'skipped profile disappears from recommended discovery'
);

select results_eq(
  $$ select user_id
     from public.get_all_discovery_profiles(500)
     where user_id = '00000000-0000-4000-8000-000000001202' $$,
  $$ values ('00000000-0000-4000-8000-000000001202'::uuid) $$,
  'skipped profile remains visible in all students'
);

select results_eq(
  $$ select public.block_user('00000000-0000-4000-8000-000000001202') $$,
  $$ values (true) $$,
  'viewer can block the same skipped profile'
);

select is_empty(
  $$ select user_id
     from public.get_all_discovery_profiles(500)
     where user_id = '00000000-0000-4000-8000-000000001202' $$,
  'blocked profile disappears from all students'
);

select is_empty(
  $$ select user_id
     from public.get_all_discovery_profiles(500)
     where user_id in (
       '00000000-0000-4000-8000-000000001203',
       '00000000-0000-4000-8000-000000001204'
     ) $$,
  'blocked profiles are excluded from all students in both directions'
);

select is_empty(
  $$ select user_id
     from public.get_discovery_candidates(20)
     where user_id in (
       '00000000-0000-4000-8000-000000001203',
       '00000000-0000-4000-8000-000000001204'
     ) $$,
  'blocked profiles are excluded from recommended discovery in both directions'
);

select is_empty(
  $$ select user_id
     from public.get_all_discovery_profiles(500)
     where user_id = '00000000-0000-4000-8000-000000001201' $$,
  'current user never appears in all students'
);

select is(
  (
    select coalesce(bool_or(row_to_json(profile_row)::text like '%@example.test%'), false)
    from public.get_all_discovery_profiles(500) profile_row
  ),
  false,
  'all students RPC does not leak auth email'
);

select * from finish();
rollback;
