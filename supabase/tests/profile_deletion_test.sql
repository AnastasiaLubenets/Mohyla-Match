begin;

select plan(28);

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

insert into public.expertise_categories (slug, name, sort_order)
values ('profile-delete-expertise-category', 'Profile Delete Expertise', 990)
on conflict (slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.expertise (category_id, slug, name, is_active, sort_order)
values (
  (select id from public.expertise_categories where slug = 'profile-delete-expertise-category'),
  'profile-delete-expertise',
  'Profile Delete Expertise',
  true,
  990
)
on conflict (slug) do update
set category_id = excluded.category_id,
    name = excluded.name,
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
  ('00000000-0000-4000-8000-000000000703', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'profile-delete-c@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000704', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin-delete@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb)
on conflict (id) do update
set email = excluded.email,
    email_confirmed_at = excluded.email_confirmed_at,
    updated_at = now();

insert into public.user_roles (user_id, role)
values
  ('00000000-0000-4000-8000-000000000701', 'admin'),
  ('00000000-0000-4000-8000-000000000704', 'admin')
on conflict (user_id, role) do nothing;

insert into public.account_roles (user_id, account_role)
values
  ('00000000-0000-4000-8000-000000000701', 'faculty'),
  ('00000000-0000-4000-8000-000000000702', 'student'),
  ('00000000-0000-4000-8000-000000000703', 'student')
on conflict (user_id) do update
set account_role = excluded.account_role,
    updated_at = now();

insert into public.profiles (
  user_id,
  account_role,
  full_name,
  faculty_id,
  academic_program_id,
  year_of_study,
  profile_status,
  onboarding_completed_at,
  avatar_mode,
  custom_avatar_key,
  allow_direct_contact
)
select
  user_id,
  account_role,
  full_name,
  (select id from public.faculties where slug = 'profile-delete-faculty'),
  (select id from public.academic_programs where slug = 'profile-delete-program'),
  year_of_study,
  'active'::public.profile_status,
  now(),
  avatar_mode,
  custom_avatar_key,
  true
from (
  values
    ('00000000-0000-4000-8000-000000000701'::uuid, 'faculty'::public.account_role, 'Profile Delete A'::text, null::smallint, 'custom'::public.profile_avatar_mode, 'avatar-01'::text),
    ('00000000-0000-4000-8000-000000000702'::uuid, 'student'::public.account_role, 'Profile Delete B'::text, 2::smallint, 'program'::public.profile_avatar_mode, null::text),
    ('00000000-0000-4000-8000-000000000703'::uuid, 'student'::public.account_role, 'Profile Delete C'::text, 3::smallint, 'program'::public.profile_avatar_mode, null::text)
) as input(user_id, account_role, full_name, year_of_study, avatar_mode, custom_avatar_key)
on conflict (user_id) do update
set account_role = excluded.account_role,
    full_name = excluded.full_name,
    faculty_id = excluded.faculty_id,
    academic_program_id = excluded.academic_program_id,
    year_of_study = excluded.year_of_study,
    profile_status = excluded.profile_status,
    onboarding_completed_at = excluded.onboarding_completed_at,
    deleted_at = null,
    avatar_mode = excluded.avatar_mode,
    custom_avatar_key = excluded.custom_avatar_key,
    allow_direct_contact = excluded.allow_direct_contact,
    updated_at = now();

insert into public.profile_academic_programs (user_id, academic_program_id, is_primary)
values (
  '00000000-0000-4000-8000-000000000701',
  (select id from public.academic_programs where slug = 'profile-delete-program'),
  true
)
on conflict (user_id, academic_program_id) do update
set is_primary = excluded.is_primary;

insert into public.faculty_expertise (user_id, expertise_id)
values (
  '00000000-0000-4000-8000-000000000701',
  (select id from public.expertise where slug = 'profile-delete-expertise')
)
on conflict (user_id, expertise_id) do nothing;

insert into public.profile_social_links (user_id, platform, url, sort_order)
values (
  '00000000-0000-4000-8000-000000000701',
  'linkedin',
  'https://linkedin.com/in/profile-delete-a',
  1
)
on conflict (user_id, platform) do update
set url = excluded.url,
    sort_order = excluded.sort_order,
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
values
  (
    '00000000-0000-4000-8000-000000000704',
    'profile-delete-review',
    '00000000-0000-4000-8000-000000000701',
    '00000000-0000-4000-8000-000000007101',
    '{"source":"profile_delete_test_target"}'::jsonb
  ),
  (
    '00000000-0000-4000-8000-000000000701',
    'profile-delete-self-admin',
    '00000000-0000-4000-8000-000000000702',
    '00000000-0000-4000-8000-000000007102',
    '{"source":"profile_delete_test_admin"}'::jsonb
  );

select ok(
  to_regprocedure('public.delete_my_profile()') is null,
  'profile-only delete RPC is removed'
);

reset role;
set local role anon;

select throws_ok(
  $$select public.delete_my_profile()$$,
  '42883',
  null,
  'anonymous callers have no account deletion RPC to execute'
);

reset role;

delete from auth.users
where id = '00000000-0000-4000-8000-000000000701';

select is(
  (select count(*)::integer from auth.users where id = '00000000-0000-4000-8000-000000000701'),
  0,
  'account deletion removes the auth.users row'
);

select is(
  (select count(*)::integer from auth.users where id = '00000000-0000-4000-8000-000000000702'),
  1,
  'another auth user is not deleted'
);

select is(
  (select count(*)::integer from public.profiles where user_id = '00000000-0000-4000-8000-000000000701'),
  0,
  'profile row is deleted by auth user cascade'
);

select is(
  (select count(*)::integer from public.profiles where user_id = '00000000-0000-4000-8000-000000000702'),
  1,
  'another user profile is not deleted'
);

select is(
  (select count(*)::integer from public.account_roles where user_id = '00000000-0000-4000-8000-000000000701'),
  0,
  'selected Student or Faculty role is deleted'
);

select is(
  (select count(*)::integer from public.user_roles where user_id = '00000000-0000-4000-8000-000000000701'),
  0,
  'authorization role rows are deleted'
);

select is(
  (select count(*)::integer from public.profile_skills where user_id = '00000000-0000-4000-8000-000000000701'),
  0,
  'profile_skills cascade for deleted account'
);

select is(
  (select count(*)::integer from public.profile_interests where user_id = '00000000-0000-4000-8000-000000000701'),
  0,
  'profile_interests cascade for deleted account'
);

select is(
  (select count(*)::integer from public.profile_collaboration_goals where user_id = '00000000-0000-4000-8000-000000000701'),
  0,
  'profile_collaboration_goals cascade for deleted account'
);

select is(
  (select count(*)::integer from public.profile_academic_programs where user_id = '00000000-0000-4000-8000-000000000701'),
  0,
  'faculty academic program rows cascade for deleted account'
);

select is(
  (select count(*)::integer from public.faculty_expertise where user_id = '00000000-0000-4000-8000-000000000701'),
  0,
  'faculty expertise rows cascade for deleted account'
);

select is(
  (select count(*)::integer from public.profile_social_links where user_id = '00000000-0000-4000-8000-000000000701'),
  0,
  'profile social links cascade for deleted account'
);

select is(
  (
    select count(*)::integer
    from public.interactions
    where source_user_id = '00000000-0000-4000-8000-000000000701'
       or target_user_id = '00000000-0000-4000-8000-000000000701'
  ),
  0,
  'saved/skipped interactions involving deleted account cascade'
);

select is(
  (
    select count(*)::integer
    from public.matches
    where user_low = '00000000-0000-4000-8000-000000000701'
       or user_high = '00000000-0000-4000-8000-000000000701'
  ),
  0,
  'matches involving deleted account cascade'
);

select is(
  (
    select count(*)::integer
    from public.blocks
    where blocker_user_id = '00000000-0000-4000-8000-000000000701'
       or blocked_user_id = '00000000-0000-4000-8000-000000000701'
  ),
  0,
  'blocks involving deleted account cascade'
);

select is(
  (
    select count(*)::integer
    from public.reports
    where reporter_user_id = '00000000-0000-4000-8000-000000000701'
       or reported_user_id = '00000000-0000-4000-8000-000000000701'
  ),
  0,
  'reports involving deleted account cascade'
);

select is(
  (
    select count(*)::integer
    from public.product_events
    where user_id = '00000000-0000-4000-8000-000000000701'
       or subject_user_id = '00000000-0000-4000-8000-000000000701'
       or match_id = '00000000-0000-4000-8000-000000007001'
  ),
  0,
  'product event rows keep no deleted-account references'
);

select is(
  (
    select count(*)::integer
    from public.admin_actions
    where admin_user_id = '00000000-0000-4000-8000-000000000701'
       or target_user_id = '00000000-0000-4000-8000-000000000701'
       or report_id = '00000000-0000-4000-8000-000000007101'
  ),
  0,
  'admin action rows keep no deleted-account references'
);

select is(
  (
    select count(*)::integer
    from public.admin_actions
    where admin_user_id is null
      and metadata->>'source' = 'profile_delete_test_admin'
  ),
  1,
  'deleted admin user no longer blocks account deletion'
);

select is(
  (
    select count(*)::integer
    from public.product_events
    where user_id is null
      and match_id is null
      and metadata->>'source' = 'profile_delete_test'
  ),
  1,
  'audit product event remains only with deleted references nulled'
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
  '00000000-0000-4000-8000-000000000705',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'profile-delete-a@example.test',
  '',
  now(),
  now(),
  now(),
  '{}'::jsonb,
  '{}'::jsonb
);

select isnt(
  '00000000-0000-4000-8000-000000000705'::uuid,
  '00000000-0000-4000-8000-000000000701'::uuid,
  'same email can re-register as a new auth UUID'
);

select is(
  (
    select count(*)::integer
    from public.account_roles
    where user_id = '00000000-0000-4000-8000-000000000705'
  ),
  0,
  're-registered email has no remembered account role'
);

select is(
  (
    select count(*)::integer
    from public.profiles
    where user_id = '00000000-0000-4000-8000-000000000705'
  ),
  0,
  're-registered email has no inherited profile or onboarding state'
);

select is(
  (
    select count(*)::integer
    from public.profile_social_links
    where user_id = '00000000-0000-4000-8000-000000000705'
  ),
  0,
  're-registered email has no inherited social links'
);

select is(
  (
    select count(*)::integer
    from public.interactions
    where source_user_id = '00000000-0000-4000-8000-000000000705'
       or target_user_id = '00000000-0000-4000-8000-000000000705'
  ),
  0,
  're-registered email has no inherited saved or skipped profiles'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000705', true);

select is(
  public.get_current_account_state(),
  'onboarding_incomplete',
  're-registered account starts from onboarding'
);

select * from finish();

rollback;
