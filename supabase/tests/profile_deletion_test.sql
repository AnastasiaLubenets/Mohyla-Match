begin;

select plan(24);

insert into public.faculties (slug, display_name, avatar_theme_key, sort_order)
values ('profile-delete-faculty', 'Profile Delete Faculty', 'profile-delete', 990)
on conflict (slug) do update
set display_name = excluded.display_name,
    avatar_theme_key = excluded.avatar_theme_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.academic_programs (faculty_id, slug, display_name, avatar_variant_key, sort_order)
values (
  (select id from public.faculties where slug = 'profile-delete-faculty'),
  'profile-delete-program',
  'Profile Delete Program',
  'profile-delete-program',
  990
)
on conflict (slug) do update
set faculty_id = excluded.faculty_id,
    display_name = excluded.display_name,
    avatar_variant_key = excluded.avatar_variant_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.skills (category, slug, name, is_active, sort_order)
values ('profile-delete', 'profile-delete-skill', 'Profile Delete Skill', true, 990)
on conflict (slug) do update
set category = excluded.category,
    name = excluded.name,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
    updated_at = now();

insert into public.interests (slug, name, is_active, sort_order)
values ('profile-delete-interest', 'Profile Delete Interest', true, 990)
on conflict (slug) do update
set name = excluded.name,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
    updated_at = now();

insert into public.collaboration_goals (slug, name, is_active, sort_order)
values ('profile-delete-goal', 'Profile Delete Goal', true, 990)
on conflict (slug) do update
set name = excluded.name,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
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
  ('00000000-0000-4000-8000-000000000701', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'profile-delete-a@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000702', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'profile-delete-b@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000703', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'profile-delete-c@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb)
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
  profile_status,
  onboarding_completed_at
)
select
  user_id,
  full_name,
  (select id from public.faculties where slug = 'profile-delete-faculty'),
  (select id from public.academic_programs where slug = 'profile-delete-program'),
  2,
  'active'::public.profile_status,
  now()
from (
  values
    ('00000000-0000-4000-8000-000000000701'::uuid, 'Profile Delete A'::text),
    ('00000000-0000-4000-8000-000000000702'::uuid, 'Profile Delete B'::text),
    ('00000000-0000-4000-8000-000000000703'::uuid, 'Profile Delete C'::text)
) as input(user_id, full_name)
on conflict (user_id) do update
set full_name = excluded.full_name,
    faculty_id = excluded.faculty_id,
    academic_program_id = excluded.academic_program_id,
    year_of_study = excluded.year_of_study,
    profile_status = excluded.profile_status,
    onboarding_completed_at = excluded.onboarding_completed_at,
    deleted_at = null,
    updated_at = now();

insert into public.profile_skills (user_id, skill_id, direction)
select user_id, (select id from public.skills where slug = 'profile-delete-skill'), direction
from (
  values
    ('00000000-0000-4000-8000-000000000701'::uuid, 'offer'::public.skill_direction),
    ('00000000-0000-4000-8000-000000000702'::uuid, 'offer'::public.skill_direction),
    ('00000000-0000-4000-8000-000000000703'::uuid, 'offer'::public.skill_direction)
) as input(user_id, direction)
on conflict (user_id, skill_id, direction) do nothing;

insert into public.profile_interests (user_id, interest_id)
select user_id, (select id from public.interests where slug = 'profile-delete-interest')
from (
  values
    ('00000000-0000-4000-8000-000000000701'::uuid),
    ('00000000-0000-4000-8000-000000000702'::uuid),
    ('00000000-0000-4000-8000-000000000703'::uuid)
) as input(user_id)
on conflict (user_id, interest_id) do nothing;

insert into public.profile_collaboration_goals (user_id, collaboration_goal_id)
select user_id, (select id from public.collaboration_goals where slug = 'profile-delete-goal')
from (
  values
    ('00000000-0000-4000-8000-000000000701'::uuid),
    ('00000000-0000-4000-8000-000000000702'::uuid),
    ('00000000-0000-4000-8000-000000000703'::uuid)
) as input(user_id)
on conflict (user_id, collaboration_goal_id) do nothing;

insert into public.interactions (source_user_id, target_user_id, action)
values
  ('00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000702', 'save'),
  ('00000000-0000-4000-8000-000000000702', '00000000-0000-4000-8000-000000000701', 'skip'),
  ('00000000-0000-4000-8000-000000000702', '00000000-0000-4000-8000-000000000703', 'save')
on conflict (source_user_id, target_user_id) do update
set action = excluded.action,
    updated_at = now();

insert into public.matches (id, user_low, user_high)
values
  ('00000000-0000-4000-8000-000000007001', '00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000702'),
  ('00000000-0000-4000-8000-000000007002', '00000000-0000-4000-8000-000000000702', '00000000-0000-4000-8000-000000000703')
on conflict (user_low, user_high) do update
set status = 'active'::public.match_status,
    closed_at = null;

insert into public.blocks (blocker_user_id, blocked_user_id)
values
  ('00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000703'),
  ('00000000-0000-4000-8000-000000000703', '00000000-0000-4000-8000-000000000701')
on conflict (blocker_user_id, blocked_user_id) do nothing;

insert into public.reports (id, reporter_user_id, reported_user_id, reason_code, details)
values
  ('00000000-0000-4000-8000-000000007101', '00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000702', 'profile-delete', 'Caller report'),
  ('00000000-0000-4000-8000-000000007102', '00000000-0000-4000-8000-000000000702', '00000000-0000-4000-8000-000000000701', 'profile-delete', 'Target report')
on conflict (id) do update
set reporter_user_id = excluded.reporter_user_id,
    reported_user_id = excluded.reported_user_id,
    reason_code = excluded.reason_code,
    details = excluded.details,
    status = 'open'::public.report_status,
    resolved_at = null,
    updated_at = now();

insert into public.product_events (user_id, subject_user_id, match_id, event_name, metadata)
values (
  '00000000-0000-4000-8000-000000000701',
  '00000000-0000-4000-8000-000000000702',
  '00000000-0000-4000-8000-000000007001',
  'mutual_match_created',
  '{"source":"profile_delete_test"}'::jsonb
);

insert into public.admin_actions (admin_user_id, action_type, target_user_id, report_id, metadata)
values (
  '00000000-0000-4000-8000-000000000702',
  'profile-delete-review',
  '00000000-0000-4000-8000-000000000701',
  '00000000-0000-4000-8000-000000007101',
  '{"source":"profile_delete_test"}'::jsonb
);

select ok(
  has_function_privilege('authenticated', 'public.delete_my_profile()', 'execute'),
  'authenticated users can execute delete_my_profile'
);

select ok(
  not has_function_privilege('anon', 'public.delete_my_profile()', 'execute'),
  'anonymous users cannot execute delete_my_profile'
);

select throws_ok(
  $$ select public.delete_my_profile('00000000-0000-4000-8000-000000000702'::uuid) $$,
  '42883',
  null,
  'caller cannot specify another user profile for deletion'
);

reset role;
set local role anon;

select throws_ok(
  $$ select public.delete_my_profile() $$,
  '42501',
  null,
  'unauthenticated caller cannot execute profile deletion'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000701', true);

select is(
  public.delete_my_profile(),
  true,
  'authenticated user can delete their own profile'
);

reset role;

select is(
  (select count(*)::integer from auth.users where id = '00000000-0000-4000-8000-000000000701'),
  1,
  'auth.users account remains after profile deletion'
);

select is(
  (select email from auth.users where id = '00000000-0000-4000-8000-000000000701'),
  'profile-delete-a@example.test',
  'login email remains registered after profile deletion'
);

select is(
  (select count(*)::integer from public.profiles where user_id = '00000000-0000-4000-8000-000000000701'),
  0,
  'caller profile row is deleted'
);

select is(
  (select count(*)::integer from public.profiles where user_id = '00000000-0000-4000-8000-000000000702'),
  1,
  'another user profile is not deleted'
);

select is(
  (select count(*)::integer from public.profile_skills where user_id = '00000000-0000-4000-8000-000000000701'),
  0,
  'profile_skills cascade for deleted profile'
);

select is(
  (select count(*)::integer from public.profile_interests where user_id = '00000000-0000-4000-8000-000000000701'),
  0,
  'profile_interests cascade for deleted profile'
);

select is(
  (select count(*)::integer from public.profile_collaboration_goals where user_id = '00000000-0000-4000-8000-000000000701'),
  0,
  'profile_collaboration_goals cascade for deleted profile'
);

select is(
  (
    select count(*)::integer
    from public.interactions
    where source_user_id = '00000000-0000-4000-8000-000000000701'
       or target_user_id = '00000000-0000-4000-8000-000000000701'
  ),
  0,
  'interactions involving deleted profile cascade'
);

select is(
  (
    select count(*)::integer
    from public.matches
    where user_low = '00000000-0000-4000-8000-000000000701'
       or user_high = '00000000-0000-4000-8000-000000000701'
  ),
  0,
  'matches involving deleted profile cascade'
);

select is(
  (
    select count(*)::integer
    from public.blocks
    where blocker_user_id = '00000000-0000-4000-8000-000000000701'
       or blocked_user_id = '00000000-0000-4000-8000-000000000701'
  ),
  0,
  'blocks involving deleted profile cascade'
);

select is(
  (
    select count(*)::integer
    from public.reports
    where reporter_user_id = '00000000-0000-4000-8000-000000000701'
       or reported_user_id = '00000000-0000-4000-8000-000000000701'
  ),
  0,
  'reports involving deleted profile cascade'
);

select is(
  (
    select count(*)::integer
    from public.admin_actions
    where target_user_id = '00000000-0000-4000-8000-000000000701'
      and report_id is null
      and metadata->>'source' = 'profile_delete_test'
  ),
  1,
  'admin action remains and deleted report reference is nulled'
);

select is(
  (
    select count(*)::integer
    from public.product_events
    where user_id = '00000000-0000-4000-8000-000000000701'
      and subject_user_id = '00000000-0000-4000-8000-000000000702'
      and match_id is null
      and metadata->>'source' = 'profile_delete_test'
  ),
  1,
  'product event remains and deleted match reference is nulled'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000701', true);

select is(
  public.get_current_account_state(),
  'onboarding_incomplete',
  'account state becomes onboarding_incomplete after profile deletion'
);

select lives_ok(
  $$ insert into public.profiles (
       user_id,
       full_name,
       faculty_id,
       academic_program_id,
       year_of_study
     )
     values (
       '00000000-0000-4000-8000-000000000701',
       'Profile Delete Recreated',
       (select id from public.faculties where slug = 'profile-delete-faculty'),
       (select id from public.academic_programs where slug = 'profile-delete-program'),
       2
     ) $$,
  'same authenticated account can create a fresh profile again'
);

select is(
  (
    select count(*)::integer
    from public.profiles
    where user_id = '00000000-0000-4000-8000-000000000701'
  ),
  1,
  'fresh profile row exists for the same auth account'
);

select lives_ok(
  $$ insert into public.profile_skills (user_id, skill_id, direction)
       values (
         '00000000-0000-4000-8000-000000000701',
         (select id from public.skills where slug = 'profile-delete-skill'),
         'offer'
       );
     insert into public.profile_interests (user_id, interest_id)
       values (
         '00000000-0000-4000-8000-000000000701',
         (select id from public.interests where slug = 'profile-delete-interest')
       );
     insert into public.profile_collaboration_goals (user_id, collaboration_goal_id)
       values (
         '00000000-0000-4000-8000-000000000701',
         (select id from public.collaboration_goals where slug = 'profile-delete-goal')
       ) $$,
  'fresh profile can reuse onboarding taxonomy relations'
);

select isnt(
  public.complete_onboarding(),
  null,
  'fresh profile can complete onboarding with same auth account'
);

select is(
  public.get_current_account_state(),
  'active',
  'same authenticated account is active after recreating profile'
);

select * from finish();

rollback;
