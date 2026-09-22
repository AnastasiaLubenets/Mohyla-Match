begin;

select plan(36);

insert into public.faculties (slug, display_name, avatar_theme_key, sort_order)
values ('phase61-test-faculty', 'Phase 6.1 Test Faculty', 'phase61', 996)
on conflict (slug) do update
set display_name = excluded.display_name,
    avatar_theme_key = excluded.avatar_theme_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.academic_programs (faculty_id, slug, display_name, avatar_variant_key, sort_order)
values (
  (select id from public.faculties where slug = 'phase61-test-faculty'),
  'phase61-test-program',
  'Phase 6.1 Test Program',
  'phase61-program',
  996
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
  ('00000000-0000-4000-8000-000000000901', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase61-a@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000902', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase61-b@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000903', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase61-c@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000904', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase61-d@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb)
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
  (select id from public.faculties where slug = 'phase61-test-faculty'),
  (select id from public.academic_programs where slug = 'phase61-test-program'),
  year_of_study,
  bio,
  availability,
  'active'::public.profile_status,
  now()
from (
  values
    ('00000000-0000-4000-8000-000000000901'::uuid, 'Phase Six One A'::text, 2::smallint, 'Builds product prototypes.'::text, 'Weekdays'::text),
    ('00000000-0000-4000-8000-000000000902'::uuid, 'Phase Six One B'::text, 3::smallint, 'Designs launch plans.'::text, 'Weekends'::text),
    ('00000000-0000-4000-8000-000000000903'::uuid, 'Phase Six One C'::text, 4::smallint, 'Coordinates research.'::text, null::text),
    ('00000000-0000-4000-8000-000000000904'::uuid, 'Phase Six One D'::text, 5::smallint, 'Keeps email private.'::text, null::text)
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
    allow_direct_contact = excluded.allow_direct_contact,
    updated_at = now();

update public.profiles
set allow_direct_contact = false
where user_id = '00000000-0000-4000-8000-000000000904';

insert into public.profile_skills (user_id, skill_id, direction)
values
  ('00000000-0000-4000-8000-000000000901', (select id from public.skills where slug = 'react'), 'offer'),
  ('00000000-0000-4000-8000-000000000901', (select id from public.skills where slug = 'sql'), 'looking_for'),
  ('00000000-0000-4000-8000-000000000902', (select id from public.skills where slug = 'figma'), 'offer'),
  ('00000000-0000-4000-8000-000000000902', (select id from public.skills where slug = 'react'), 'looking_for'),
  ('00000000-0000-4000-8000-000000000903', (select id from public.skills where slug = 'sql'), 'offer'),
  ('00000000-0000-4000-8000-000000000904', (select id from public.skills where slug = 'python'), 'offer')
on conflict do nothing;

insert into public.profile_interests (user_id, interest_id)
values
  ('00000000-0000-4000-8000-000000000901', (select id from public.interests where slug = 'startups')),
  ('00000000-0000-4000-8000-000000000902', (select id from public.interests where slug = 'startups')),
  ('00000000-0000-4000-8000-000000000903', (select id from public.interests where slug = 'research')),
  ('00000000-0000-4000-8000-000000000904', (select id from public.interests where slug = 'technology'))
on conflict do nothing;

insert into public.profile_collaboration_goals (user_id, collaboration_goal_id)
values
  ('00000000-0000-4000-8000-000000000901', (select id from public.collaboration_goals where slug = 'build-app')),
  ('00000000-0000-4000-8000-000000000902', (select id from public.collaboration_goals where slug = 'build-app')),
  ('00000000-0000-4000-8000-000000000903', (select id from public.collaboration_goals where slug = 'research')),
  ('00000000-0000-4000-8000-000000000904', (select id from public.collaboration_goals where slug = 'study-partner'))
on conflict do nothing;

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'allow_direct_contact'
  ),
  'profiles support direct contact opt-in'
);

select is(
  (select allow_direct_contact from public.profiles where user_id = '00000000-0000-4000-8000-000000000901'),
  true,
  'direct contact defaults on for existing profile creation path'
);

select ok(
  has_function_privilege('authenticated', 'public.get_profile_contact_email(uuid)', 'execute')
  and has_function_privilege('authenticated', 'public.set_saved_profile(uuid, boolean)', 'execute')
  and has_function_privilege('authenticated', 'public.get_saved_profiles(integer)', 'execute'),
  'authenticated users can execute phase 6.1 RPCs'
);

select ok(
  not has_function_privilege('anon', 'public.get_profile_contact_email(uuid)', 'execute')
  and not has_function_privilege('anon', 'public.set_saved_profile(uuid, boolean)', 'execute')
  and not has_function_privilege('anon', 'public.get_saved_profiles(integer)', 'execute'),
  'anonymous users cannot execute phase 6.1 RPCs'
);

reset role;
set local role anon;
select throws_ok(
  $$ select * from public.get_profile_contact_email('00000000-0000-4000-8000-000000000902') $$,
  '42501',
  null,
  'anonymous direct contact email call is rejected'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000901', true);

select results_eq(
  $$ select contact_email
     from public.get_profile_contact_email('00000000-0000-4000-8000-000000000902') $$,
  $$ values ('phase61-b@example.test'::text) $$,
  'direct contact RPC reveals opted-in target email to an active authenticated caller'
);

select is_empty(
  $$ select contact_email
     from public.get_profile_contact_email('00000000-0000-4000-8000-000000000901') $$,
  'direct contact RPC never reveals self email'
);

select is_empty(
  $$ select contact_email
     from public.get_profile_contact_email('00000000-0000-4000-8000-000000000904') $$,
  'direct contact RPC respects target opt-out'
);

select is(
  (select public.log_email_contact_clicked('00000000-0000-4000-8000-000000000902')),
  true,
  'direct contact email click can be logged'
);

reset role;
select is(
  (
    select metadata->>'source'
    from public.product_events
    where user_id = '00000000-0000-4000-8000-000000000901'
      and subject_user_id = '00000000-0000-4000-8000-000000000902'
      and event_name = 'email_contact_clicked'
    order by created_at desc
    limit 1
  ),
  'phase_6_1_direct_contact',
  'direct contact email click is logged with the direct-contact source'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000901', true);

select results_eq(
  $$ select saved, action::text
     from public.set_saved_profile('00000000-0000-4000-8000-000000000903', true) $$,
  $$ values (true, 'save'::text) $$,
  'caller can privately save an eligible profile'
);

select results_eq(
  $$ select action::text
     from public.interactions
     where source_user_id = '00000000-0000-4000-8000-000000000901'
       and target_user_id = '00000000-0000-4000-8000-000000000903' $$,
  $$ values ('save'::text) $$,
  'save toggle stores a save interaction'
);

select results_eq(
  $$ select user_id
     from public.get_saved_profiles(10) $$,
  $$ values ('00000000-0000-4000-8000-000000000903'::uuid) $$,
  'saved profiles RPC returns private saved profiles'
);

select is(
  (
    select coalesce(bool_or(row_to_json(saved_row)::text like '%@example.test%'), false)
    from public.get_saved_profiles(10) saved_row
  ),
  false,
  'saved profiles RPC does not leak auth email'
);

select is_empty(
  $$ select user_id
     from public.get_discovery_candidates(10)
     where user_id = '00000000-0000-4000-8000-000000000903' $$,
  'saved profile is excluded from normal discovery'
);

reset role;

select is(
  (
    select count(*)::integer
    from public.matches
    where user_low = '00000000-0000-4000-8000-000000000901'
      and user_high = '00000000-0000-4000-8000-000000000903'
  ),
  0,
  'saving a profile does not create a match'
);

select is(
  (
    select count(*)::integer
    from public.product_events
    where user_id = '00000000-0000-4000-8000-000000000901'
      and subject_user_id = '00000000-0000-4000-8000-000000000903'
      and event_name like '%save%'
  ),
  0,
  'saving through the private toggle does not create a target-addressed save event'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000901', true);

select is(
  (
    select count(*)::integer
    from public.set_saved_profile('00000000-0000-4000-8000-000000000903', true)
  ),
  1,
  'repeating save remains idempotent from the caller perspective'
);

select is(
  (
    select count(*)::integer
    from public.interactions
    where source_user_id = '00000000-0000-4000-8000-000000000901'
      and target_user_id = '00000000-0000-4000-8000-000000000903'
      and action = 'save'::public.interaction_action
  ),
  1,
  'repeating save keeps one save interaction'
);

select results_eq(
  $$ select saved, action::text
     from public.set_saved_profile('00000000-0000-4000-8000-000000000903', false) $$,
  $$ values (false, null::text) $$,
  'caller can remove a saved profile'
);

select is_empty(
  $$ select action
     from public.interactions
     where source_user_id = '00000000-0000-4000-8000-000000000901'
       and target_user_id = '00000000-0000-4000-8000-000000000903' $$,
  'remove deletes only the save interaction'
);

select results_eq(
  $$ select saved, action::text
     from public.set_saved_profile('00000000-0000-4000-8000-000000000902', true) $$,
  $$ values (true, 'save'::text) $$,
  'caller can save a profile before connecting'
);

select results_eq(
  $$ select action::text, matched
     from public.set_discovery_action('00000000-0000-4000-8000-000000000902', 'connect') $$,
  $$ values ('connect'::text, false) $$,
  'connect replaces a prior save without creating an immediate match'
);

select results_eq(
  $$ select action::text
     from public.interactions
     where source_user_id = '00000000-0000-4000-8000-000000000901'
       and target_user_id = '00000000-0000-4000-8000-000000000902' $$,
  $$ values ('connect'::text) $$,
  'save to connect transition stores connect as the outgoing action'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000902', true);

select is(
  (
    select matched
    from public.set_discovery_action('00000000-0000-4000-8000-000000000901', 'connect')
  ),
  true,
  'reciprocal connect still creates a mutual match after a save transition'
);

reset role;
select is(
  (
    select count(*)::integer
    from public.matches
    where user_low = '00000000-0000-4000-8000-000000000901'
      and user_high = '00000000-0000-4000-8000-000000000902'
      and status = 'active'::public.match_status
  ),
  1,
  'save and connect path creates exactly one active match'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000901', true);

select results_eq(
  $$ select user_id, can_direct_contact
     from public.get_my_matches(10)
     where user_id = '00000000-0000-4000-8000-000000000902' $$,
  $$ values ('00000000-0000-4000-8000-000000000902'::uuid, true) $$,
  'matches RPC returns direct-contact availability without email'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000902', true);

select lives_ok(
  $$ select public.update_my_profile(
       'Phase Six One B',
       (select id from public.faculties where slug = 'phase61-test-faculty'),
       (select id from public.academic_programs where slug = 'phase61-test-program'),
       3,
       'Designs launch plans.',
       'Weekends',
       array[(select id from public.skills where slug = 'figma')]::bigint[],
       '{}'::bigint[],
       array[(select id from public.interests where slug = 'startups')]::bigint[],
       array[(select id from public.collaboration_goals where slug = 'build-app')]::bigint[],
       false
     ) $$,
  'profile edit RPC can turn direct contact off while keeping looking-for optional'
);

reset role;
select is(
  (select allow_direct_contact from public.profiles where user_id = '00000000-0000-4000-8000-000000000902'),
  false,
  'profile edit RPC persists direct contact opt-out'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000901', true);

select is_empty(
  $$ select contact_email
     from public.get_profile_contact_email('00000000-0000-4000-8000-000000000902') $$,
  'direct contact RPC hides email after target opts out'
);

select results_eq(
  $$ select corporate_email
     from public.get_matched_contact_email('00000000-0000-4000-8000-000000000902') $$,
  $$ values ('phase61-b@example.test'::text) $$,
  'existing matched contact RPC remains compatible after direct-contact opt-out'
);

select results_eq(
  $$ select is_matched, can_direct_contact
     from public.get_profile_connection_status('00000000-0000-4000-8000-000000000902') $$,
  $$ values (true, false) $$,
  'profile connection status exposes match state and direct-contact availability'
);

select is(
  (select public.log_email_contact_clicked('00000000-0000-4000-8000-000000000902')),
  true,
  'email contact logging remains compatible for existing mutual-match reveal'
);

select results_eq(
  $$ select saved, action::text
     from public.set_saved_profile('00000000-0000-4000-8000-000000000903', true) $$,
  $$ values (true, 'save'::text) $$,
  'caller can save another profile before a later block'
);

reset role;
insert into public.blocks (blocker_user_id, blocked_user_id)
values ('00000000-0000-4000-8000-000000000903', '00000000-0000-4000-8000-000000000901')
on conflict do nothing;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000901', true);

select is_empty(
  $$ select user_id
     from public.get_saved_profiles(10)
     where user_id = '00000000-0000-4000-8000-000000000903' $$,
  'blocked saved targets are excluded from saved profiles'
);

select results_eq(
  $$ select saved, action::text
     from public.set_saved_profile('00000000-0000-4000-8000-000000000903', false) $$,
  $$ values (false, null::text) $$,
  'caller can remove a saved profile even after a block hides it'
);

select * from finish();
rollback;
