begin;

select plan(36);

insert into public.faculties (slug, display_name, avatar_theme_key, sort_order)
values ('phase2-test-faculty', 'Phase 2 Test Faculty', 'faculty-test', 900)
on conflict (slug) do update
set display_name = excluded.display_name,
    avatar_theme_key = excluded.avatar_theme_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.academic_programs (faculty_id, slug, display_name, avatar_variant_key, sort_order)
values (
  (select id from public.faculties where slug = 'phase2-test-faculty'),
  'phase2-test-program',
  'Phase 2 Test Program',
  'program-test',
  900
)
on conflict (slug) do update
set faculty_id = excluded.faculty_id,
    display_name = excluded.display_name,
    avatar_variant_key = excluded.avatar_variant_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.skills (category, slug, name, sort_order)
values ('phase2', 'phase2-test-skill', 'Phase 2 Test Skill', 900)
on conflict (slug) do update
set category = excluded.category,
    name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.interests (slug, name, sort_order)
values ('phase2-test-interest', 'Phase 2 Test Interest', 900)
on conflict (slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.collaboration_goals (slug, name, sort_order)
values ('phase2-test-goal', 'Phase 2 Test Goal', 900)
on conflict (slug) do update
set name = excluded.name,
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
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase2-a@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase2-b@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase2-c@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase2-d@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb)
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
  system_avatar_key,
  onboarding_completed_at
)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'Phase Two A',
    (select id from public.faculties where slug = 'phase2-test-faculty'),
    (select id from public.academic_programs where slug = 'phase2-test-program'),
    2,
    'Builder',
    'Weekdays',
    'phase2-a',
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'Phase Two B',
    (select id from public.faculties where slug = 'phase2-test-faculty'),
    (select id from public.academic_programs where slug = 'phase2-test-program'),
    3,
    'Designer',
    'Weekends',
    'phase2-b',
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'Phase Two C',
    (select id from public.faculties where slug = 'phase2-test-faculty'),
    (select id from public.academic_programs where slug = 'phase2-test-program'),
    1,
    'Researcher',
    'Evenings',
    'phase2-c',
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'Phase Two D',
    (select id from public.faculties where slug = 'phase2-test-faculty'),
    (select id from public.academic_programs where slug = 'phase2-test-program'),
    1,
    'Still onboarding',
    null,
    'phase2-d',
    null
  )
on conflict (user_id) do update
set full_name = excluded.full_name,
    faculty_id = excluded.faculty_id,
    academic_program_id = excluded.academic_program_id,
    year_of_study = excluded.year_of_study,
    bio = excluded.bio,
    availability = excluded.availability,
    system_avatar_key = excluded.system_avatar_key,
    profile_status = 'active'::public.profile_status,
    onboarding_completed_at = excluded.onboarding_completed_at,
    deleted_at = null,
    updated_at = now();

select hasnt_column('public', 'profiles', 'corporate_email', 'profiles do not duplicate corporate email');

reset role;
set local role anon;
select throws_ok(
  $$ select count(*) from public.profiles $$,
  '42501',
  'anonymous cannot read private profile data'
);

reset role;
set local role anon;
select throws_ok(
  $$ select * from public.get_matched_contact_email('00000000-0000-4000-8000-000000000002') $$,
  '42501',
  'anonymous cannot call contact projection'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

select is_empty(
  $$ update public.profiles
     set bio = 'edited by somebody else'
     where user_id = '00000000-0000-4000-8000-000000000002'
     returning user_id $$,
  'authenticated users cannot edit another profile'
);

select throws_ok(
  $$ insert into public.user_roles (user_id, role)
     values ('00000000-0000-4000-8000-000000000001', 'admin') $$,
  '42501',
  'authenticated users cannot self-assign admin role'
);

select is_empty(
  $$ select corporate_email
     from public.get_matched_contact_email('00000000-0000-4000-8000-000000000002') $$,
  'corporate email is denied before mutual match'
);

select is(
  (
    select coalesce(bool_or(row_to_json(profile_row)::text like '%@example.test%'), false)
    from (
      select *
      from public.profiles
      where user_id = '00000000-0000-4000-8000-000000000002'
    ) profile_row
  ),
  false,
  'select * from profiles does not leak corporate email'
);

select throws_ok(
  $$ select count(*) from public.user_roles $$,
  '42501',
  'normal users cannot read protected role storage'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000004', true);

select lives_ok(
  $$ insert into public.profile_skills (user_id, skill_id, direction)
     values (
       '00000000-0000-4000-8000-000000000004',
       (select id from public.skills where slug = 'phase2-test-skill'),
       'looking_for'
     ) $$,
  'authenticated active users can write onboarding relation rows before onboarding completion'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

insert into public.interactions (source_user_id, target_user_id, action)
values (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  'connect'
);

select is_empty(
  $$ select corporate_email
     from public.get_matched_contact_email('00000000-0000-4000-8000-000000000002') $$,
  'one-way Connect does not reveal corporate email'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);

select is_empty(
  $$ select action
     from public.interactions
     where source_user_id = '00000000-0000-4000-8000-000000000001'
       and target_user_id = '00000000-0000-4000-8000-000000000002' $$,
  'incoming directed Connect is not visible before mutual match'
);

reset role;
select is(
  (
    select count(*)::integer
    from public.matches
    where user_low = '00000000-0000-4000-8000-000000000001'
      and user_high = '00000000-0000-4000-8000-000000000002'
  ),
  0,
  'one-way connect does not create a match'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);

insert into public.interactions (source_user_id, target_user_id, action)
values (
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'connect'
);

reset role;
select is(
  (
    select count(*)::integer
    from public.matches
    where user_low = '00000000-0000-4000-8000-000000000001'
      and user_high = '00000000-0000-4000-8000-000000000002'
  ),
  1,
  'reciprocal connect creates exactly one canonical match'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

select results_eq(
  $$ select corporate_email
     from public.get_matched_contact_email('00000000-0000-4000-8000-000000000002') $$,
  $$ values ('phase2-b@example.test'::text) $$,
  'corporate email is available after mutual match'
);

select throws_ok(
  $$ insert into public.interactions (source_user_id, target_user_id, action)
     values (
       '00000000-0000-4000-8000-000000000001',
       '00000000-0000-4000-8000-000000000002',
       'save'
     ) $$,
  '23505',
  'duplicate directed interaction rows are impossible'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', true);

select is_empty(
  $$ select corporate_email
     from public.get_matched_contact_email('00000000-0000-4000-8000-000000000002') $$,
  'unrelated user cannot use another pair match to reveal email'
);

reset role;
select throws_ok(
  $$ insert into public.matches (user_low, user_high)
     values ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002') $$,
  '23505',
  'duplicate canonical match is impossible'
);

select throws_ok(
  $$ insert into public.matches (user_low, user_high)
     values ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001') $$,
  '23514',
  'reversed match pair is rejected'
);

select throws_ok(
  $$ insert into public.matches (user_low, user_high)
     values ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001') $$,
  '23514',
  'self-match is impossible'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

insert into public.profile_skills (user_id, skill_id, direction)
values (
  '00000000-0000-4000-8000-000000000001',
  (select id from public.skills where slug = 'phase2-test-skill'),
  'offer'
);

select throws_ok(
  $$ insert into public.profile_skills (user_id, skill_id, direction)
     values (
       '00000000-0000-4000-8000-000000000002',
       (select id from public.skills where slug = 'phase2-test-skill'),
       'looking_for'
     ) $$,
  '42501',
  'profile relation ownership is enforced'
);

select throws_ok(
  $$ insert into public.profile_skills (user_id, skill_id, direction)
     values (
       '00000000-0000-4000-8000-000000000001',
       (select id from public.skills where slug = 'phase2-test-skill'),
       'offer'
     ) $$,
  '23505',
  'duplicate skill and direction assignment is impossible'
);

select throws_ok(
  $$ insert into public.profile_skills (user_id, skill_id, direction)
     values (
       '00000000-0000-4000-8000-000000000001',
       (select id from public.skills where slug = 'phase2-test-skill'),
       'mentor'
     ) $$,
  '22P02',
  'invalid skill direction is impossible'
);

select throws_ok(
  $$ insert into public.interactions (source_user_id, target_user_id, action)
     values (
       '00000000-0000-4000-8000-000000000002',
       '00000000-0000-4000-8000-000000000003',
       'save'
     ) $$,
  '42501',
  'users cannot create interactions for another source user'
);

insert into public.blocks (blocker_user_id, blocked_user_id)
values (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002'
);

select is_empty(
  $$ select corporate_email
     from public.get_matched_contact_email('00000000-0000-4000-8000-000000000002') $$,
  'block removes matched contact visibility'
);

reset role;
select is(
  (
    select status::text
    from public.matches
    where user_low = '00000000-0000-4000-8000-000000000001'
      and user_high = '00000000-0000-4000-8000-000000000002'
  ),
  'blocked',
  'block closes existing match as blocked'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);

select is_empty(
  $$ select blocker_user_id
     from public.blocks
     where blocker_user_id = '00000000-0000-4000-8000-000000000001'
       and blocked_user_id = '00000000-0000-4000-8000-000000000002' $$,
  'incoming block row is not directly visible to the blocked user'
);

select is_empty(
  $$ select user_id
     from public.profiles
     where user_id = '00000000-0000-4000-8000-000000000001' $$,
  'block removes profile visibility in both directions'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$ insert into public.reports (reporter_user_id, reported_user_id, reason_code, details)
     values (
       '00000000-0000-4000-8000-000000000001',
       '00000000-0000-4000-8000-000000000003',
       'spam',
       'Phase 2 test report'
     ) $$,
  'onboarded users can create reports'
);

select is_empty(
  $$ update public.reports
     set status = 'resolved', resolved_at = now()
     where reporter_user_id = '00000000-0000-4000-8000-000000000001'
       and reported_user_id = '00000000-0000-4000-8000-000000000003'
     returning id $$,
  'reporter cannot mutate moderation fields'
);

reset role;
select is(
  (
    select status::text
    from public.reports
    where reporter_user_id = '00000000-0000-4000-8000-000000000001'
      and reported_user_id = '00000000-0000-4000-8000-000000000003'
    order by created_at desc
    limit 1
  ),
  'open',
  'report moderation status remains protected'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$ insert into public.admin_actions (admin_user_id, action_type)
     values ('00000000-0000-4000-8000-000000000001', 'suspend-user') $$,
  '42501',
  'non-admin users cannot write admin actions'
);

reset role;
update public.profiles
set profile_status = 'suspended'
where user_id = '00000000-0000-4000-8000-000000000003';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', true);

select throws_ok(
  $$ insert into public.interactions (source_user_id, target_user_id, action)
     values (
       '00000000-0000-4000-8000-000000000003',
       '00000000-0000-4000-8000-000000000001',
       'save'
     ) $$,
  '42501',
  'suspended users cannot create normal interactions'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

select is_empty(
  $$ select user_id
     from public.profiles
     where user_id = '00000000-0000-4000-8000-000000000003' $$,
  'suspended profiles are hidden from other students'
);

reset role;
select results_eq(
  $$ select
       my_looking_for_their_offer_weight,
       their_looking_for_my_offer_weight,
       common_interests_weight,
       collaboration_goals_weight,
       availability_weight
     from public.matching_config
     where version = 1 and is_active $$,
  $$ values (35::smallint, 25::smallint, 15::smallint, 15::smallint, 10::smallint) $$,
  'matching V1 weights are seeded exactly'
);

select is(
  (select count(*)::integer from public.signup_email_domains),
  0,
  'no unconfirmed production signup email domains are seeded'
);

select is(
  (
    select count(*)::integer
    from public.product_events
    where event_name = 'mutual_match_created'
      and match_id is not null
  ),
  1,
  'mutual match creation records one minimal product event'
);

select * from finish();
rollback;
