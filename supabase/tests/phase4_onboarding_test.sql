begin;

select plan(17);

insert into public.faculties (slug, display_name, avatar_theme_key, sort_order)
values
  ('phase4-faculty-a', 'Phase 4 Faculty A', 'phase4-theme-a', 910),
  ('phase4-faculty-b', 'Phase 4 Faculty B', 'phase4-theme-b', 920)
on conflict (slug) do update
set display_name = excluded.display_name,
    avatar_theme_key = excluded.avatar_theme_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.academic_programs (faculty_id, slug, display_name, avatar_variant_key, sort_order)
values
  (
    (select id from public.faculties where slug = 'phase4-faculty-a'),
    'phase4-program-a',
    'Phase 4 Program A',
    'phase4-program-a',
    910
  ),
  (
    (select id from public.faculties where slug = 'phase4-faculty-b'),
    'phase4-program-b',
    'Phase 4 Program B',
    'phase4-program-b',
    920
  )
on conflict (slug) do update
set faculty_id = excluded.faculty_id,
    display_name = excluded.display_name,
    avatar_variant_key = excluded.avatar_variant_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.skills (category, slug, name, is_active, sort_order)
values
  ('phase4', 'phase4-offer-skill', 'Phase 4 Offer Skill', true, 910),
  ('phase4', 'phase4-looking-skill', 'Phase 4 Looking Skill', true, 920),
  ('phase4', 'phase4-inactive-skill', 'Phase 4 Inactive Skill', false, 930)
on conflict (slug) do update
set category = excluded.category,
    name = excluded.name,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
    updated_at = now();

insert into public.interests (slug, name, is_active, sort_order)
values ('phase4-interest', 'Phase 4 Interest', true, 910)
on conflict (slug) do update
set name = excluded.name,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
    updated_at = now();

insert into public.collaboration_goals (slug, name, is_active, sort_order)
values ('phase4-goal', 'Phase 4 Goal', true, 910)
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
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase4-a@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase4-b@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000403', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase4-suspended@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000404', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase4-mismatch@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb)
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
  profile_status
)
values
  (
    '00000000-0000-4000-8000-000000000402',
    'Phase Four B',
    (select id from public.faculties where slug = 'phase4-faculty-a'),
    (select id from public.academic_programs where slug = 'phase4-program-a'),
    2,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000403',
    'Phase Four Suspended',
    (select id from public.faculties where slug = 'phase4-faculty-a'),
    (select id from public.academic_programs where slug = 'phase4-program-a'),
    2,
    'suspended'
  )
on conflict (user_id) do update
set full_name = excluded.full_name,
    faculty_id = excluded.faculty_id,
    academic_program_id = excluded.academic_program_id,
    year_of_study = excluded.year_of_study,
    profile_status = excluded.profile_status,
    onboarding_completed_at = null,
    deleted_at = null,
    updated_at = now();

reset role;
set local role anon;

select throws_ok(
  $$ insert into public.profiles (user_id, full_name, faculty_id, academic_program_id, year_of_study)
     values (
       '00000000-0000-4000-8000-000000000401',
       'Anonymous Attempt',
       (select id from public.faculties where slug = 'phase4-faculty-a'),
       (select id from public.academic_programs where slug = 'phase4-program-a'),
       2
     ) $$,
  '42501',
  null,
  'anonymous cannot onboard'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000401', true);

select lives_ok(
  $$ insert into public.profiles (user_id, full_name, faculty_id, academic_program_id, year_of_study, bio, availability)
     values (
       '00000000-0000-4000-8000-000000000401',
       'Phase Four A',
       (select id from public.faculties where slug = 'phase4-faculty-a'),
       (select id from public.academic_programs where slug = 'phase4-program-a'),
       2,
       'Phase 4 bio',
       'Weekdays'
     ) $$,
  'valid Step 1 persists'
);

select is(
  (
    select system_avatar_key
    from public.profiles
    where user_id = '00000000-0000-4000-8000-000000000401'
  ),
  'phase4-theme-a--phase4-program-a',
  'system avatar key is derived from faculty/program taxonomy'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000404', true);

select throws_ok(
  $$ insert into public.profiles (user_id, full_name, faculty_id, academic_program_id, year_of_study)
     values (
       '00000000-0000-4000-8000-000000000404',
       'Phase Four Mismatch',
       (select id from public.faculties where slug = 'phase4-faculty-a'),
       (select id from public.academic_programs where slug = 'phase4-program-b'),
       2
     ) $$,
  '42501',
  null,
  'program from another faculty is rejected'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000401', true);

select throws_ok(
  $$ insert into public.profile_skills (user_id, skill_id, direction)
     values (
       '00000000-0000-4000-8000-000000000401',
       (select id from public.skills where slug = 'phase4-inactive-skill'),
       'offer'
     ) $$,
  '42501',
  null,
  'inactive taxonomy item is rejected'
);

select throws_ok(
  $$ select public.complete_onboarding() $$,
  'P0001',
  null,
  'Step 2 cannot complete with zero offer skills'
);

select throws_ok(
  $$ update public.profiles
     set onboarding_completed_at = now()
     where user_id = '00000000-0000-4000-8000-000000000401' $$,
  '42501',
  null,
  'onboarding_completed_at cannot be set directly before requirements exist'
);

insert into public.profile_skills (user_id, skill_id, direction)
values (
  '00000000-0000-4000-8000-000000000401',
  (select id from public.skills where slug = 'phase4-offer-skill'),
  'offer'
);

select throws_ok(
  $$ select public.complete_onboarding() $$,
  'P0001',
  null,
  'Step 3 cannot complete with zero looking-for skills'
);

select throws_ok(
  $$ insert into public.profile_skills (user_id, skill_id, direction)
     values (
       '00000000-0000-4000-8000-000000000402',
       (select id from public.skills where slug = 'phase4-looking-skill'),
       'looking_for'
     ) $$,
  '42501',
  null,
  'another user''s onboarding data cannot be changed'
);

insert into public.profile_skills (user_id, skill_id, direction)
values (
  '00000000-0000-4000-8000-000000000401',
  (select id from public.skills where slug = 'phase4-looking-skill'),
  'looking_for'
);

select throws_ok(
  $$ select public.complete_onboarding() $$,
  'P0001',
  null,
  'Step 4 requires at least one interest and one collaboration goal'
);

insert into public.profile_interests (user_id, interest_id)
values (
  '00000000-0000-4000-8000-000000000401',
  (select id from public.interests where slug = 'phase4-interest')
);

select throws_ok(
  $$ select public.complete_onboarding() $$,
  'P0001',
  null,
  'Step 4 still requires a collaboration goal after interest selection'
);

insert into public.profile_collaboration_goals (user_id, collaboration_goal_id)
values (
  '00000000-0000-4000-8000-000000000401',
  (select id from public.collaboration_goals where slug = 'phase4-goal')
);

select isnt(
  (select public.complete_onboarding()),
  null,
  'successful 4-step flow sets onboarding completion'
);

select isnt(
  (
    select onboarding_completed_at
    from public.profiles
    where user_id = '00000000-0000-4000-8000-000000000401'
  ),
  null,
  'profile stores the database-controlled completion timestamp'
);

select is(
  (select public.complete_onboarding()),
  (
    select onboarding_completed_at
    from public.profiles
    where user_id = '00000000-0000-4000-8000-000000000401'
  ),
  'completion is idempotent'
);

select is(
  (
    select count(*)::integer
    from public.product_events
    where user_id = '00000000-0000-4000-8000-000000000401'
      and event_name = 'onboarding_completed'
  ),
  1,
  'trusted onboarding_completed product event is recorded once'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000403', true);

select throws_ok(
  $$ select public.complete_onboarding() $$,
  'P0001',
  null,
  'suspended user cannot onboard'
);

reset role;

select hasnt_column(
  'public',
  'profiles',
  'corporate_email',
  'corporate email never enters profiles'
);

select * from finish();
rollback;
