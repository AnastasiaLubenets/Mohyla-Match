begin;

select plan(33);

insert into public.faculties (slug, display_name, avatar_theme_key, sort_order)
values ('phase6-test-faculty', 'Phase 6 Test Faculty', 'phase6', 991)
on conflict (slug) do update
set display_name = excluded.display_name,
    avatar_theme_key = excluded.avatar_theme_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.academic_programs (faculty_id, slug, display_name, avatar_variant_key, sort_order)
values (
  (select id from public.faculties where slug = 'phase6-test-faculty'),
  'phase6-test-program',
  'Phase 6 Test Program',
  'phase6-program',
  991
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
  ('00000000-0000-4000-8000-000000000801', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase6-a@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000802', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase6-b@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000803', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase6-c@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb)
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
  (select id from public.faculties where slug = 'phase6-test-faculty'),
  (select id from public.academic_programs where slug = 'phase6-test-program'),
  year_of_study,
  bio,
  availability,
  'active'::public.profile_status,
  now()
from (
  values
    ('00000000-0000-4000-8000-000000000801'::uuid, 'Phase Six A'::text, 2::smallint, 'Builds web apps.'::text, 'Weekdays'::text),
    ('00000000-0000-4000-8000-000000000802'::uuid, 'Phase Six B'::text, 3::smallint, 'Designs and ships MVPs.'::text, 'Weekends'::text),
    ('00000000-0000-4000-8000-000000000803'::uuid, 'Phase Six C'::text, 4::smallint, 'Coordinates teams.'::text, null::text)
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
  ('00000000-0000-4000-8000-000000000801', (select id from public.skills where slug = 'react'), 'offer'),
  ('00000000-0000-4000-8000-000000000801', (select id from public.skills where slug = 'sql'), 'offer'),
  ('00000000-0000-4000-8000-000000000801', (select id from public.skills where slug = 'figma'), 'looking_for'),
  ('00000000-0000-4000-8000-000000000802', (select id from public.skills where slug = 'figma'), 'offer'),
  ('00000000-0000-4000-8000-000000000802', (select id from public.skills where slug = 'python'), 'offer'),
  ('00000000-0000-4000-8000-000000000802', (select id from public.skills where slug = 'react'), 'looking_for'),
  ('00000000-0000-4000-8000-000000000803', (select id from public.skills where slug = 'project-management'), 'offer')
on conflict do nothing;

insert into public.profile_interests (user_id, interest_id)
values
  ('00000000-0000-4000-8000-000000000801', (select id from public.interests where slug = 'startups')),
  ('00000000-0000-4000-8000-000000000801', (select id from public.interests where slug = 'technology')),
  ('00000000-0000-4000-8000-000000000802', (select id from public.interests where slug = 'startups')),
  ('00000000-0000-4000-8000-000000000802', (select id from public.interests where slug = 'artificial-intelligence')),
  ('00000000-0000-4000-8000-000000000803', (select id from public.interests where slug = 'education'))
on conflict do nothing;

insert into public.profile_collaboration_goals (user_id, collaboration_goal_id)
values
  ('00000000-0000-4000-8000-000000000801', (select id from public.collaboration_goals where slug = 'build-app')),
  ('00000000-0000-4000-8000-000000000802', (select id from public.collaboration_goals where slug = 'build-app')),
  ('00000000-0000-4000-8000-000000000803', (select id from public.collaboration_goals where slug = 'study-partner'))
on conflict do nothing;

select is(
  (select count(*)::integer from public.matching_config where is_active),
  1,
  'exactly one active matching config exists'
);

select results_eq(
  $$ select
       my_looking_for_their_offer_weight,
       their_looking_for_my_offer_weight,
       common_interests_weight,
       collaboration_goals_weight,
       availability_weight
     from public.matching_config
     where version = 1 and is_active $$,
  $$ values (40::smallint, 30::smallint, 15::smallint, 15::smallint, 0::smallint) $$,
  'phase 6 matching weights are active'
);

select ok(
  has_function_privilege('authenticated', 'public.get_discovery_candidates(integer)', 'execute')
  and has_function_privilege('authenticated', 'public.set_discovery_action(uuid, public.interaction_action)', 'execute')
  and has_function_privilege('authenticated', 'public.get_my_matches(integer)', 'execute')
  and not has_function_privilege('authenticated', 'public.block_user(uuid)', 'execute')
  and has_function_privilege('authenticated', 'public.report_user(uuid, text, text)', 'execute'),
  'authenticated users can execute active phase 6 RPCs while block RPC is disabled'
);

select ok(
  not has_function_privilege('anon', 'public.get_discovery_candidates(integer)', 'execute')
  and not has_function_privilege('anon', 'public.set_discovery_action(uuid, public.interaction_action)', 'execute')
  and not has_function_privilege('anon', 'public.get_my_matches(integer)', 'execute')
  and not has_function_privilege('anon', 'public.block_user(uuid)', 'execute')
  and not has_function_privilege('anon', 'public.report_user(uuid, text, text)', 'execute'),
  'anonymous users cannot execute phase 6 RPCs'
);

reset role;
set local role anon;
select throws_ok(
  $$ select * from public.get_discovery_candidates(10) $$,
  '42501',
  null,
  'anonymous discovery call is rejected'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000801', true);

select is(
  (
    select count(*)::integer
    from public.get_discovery_candidates(10)
    where user_id in (
      '00000000-0000-4000-8000-000000000802',
      '00000000-0000-4000-8000-000000000803'
    )
  ),
  2,
  'caller sees eligible active discovery candidates'
);

select is(
  (
    select coalesce(bool_or(row_to_json(candidate_row)::text like '%@example.test%'), false)
    from public.get_discovery_candidates(10) candidate_row
  ),
  false,
  'discovery candidates do not leak auth email'
);

select cmp_ok(
  (
    select compatibility_score
    from public.get_discovery_candidates(10)
    where user_id = '00000000-0000-4000-8000-000000000802'
  ),
  '>',
  (
    select compatibility_score
    from public.get_discovery_candidates(10)
    where user_id = '00000000-0000-4000-8000-000000000803'
  ),
  'candidate with reciprocal skill fit ranks higher'
);

select results_eq(
  $$ select item->>'name'
     from public.get_discovery_candidates(10) c,
          jsonb_array_elements(c.matched_they_offer) item
     where c.user_id = '00000000-0000-4000-8000-000000000802' $$,
  $$ values ('Figma'::text) $$,
  'discovery explains skills the candidate offers'
);

select results_eq(
  $$ select item->>'name'
     from public.get_discovery_candidates(10) c,
          jsonb_array_elements(c.matched_i_offer) item
     where c.user_id = '00000000-0000-4000-8000-000000000802' $$,
  $$ values ('React'::text) $$,
  'discovery explains skills the caller offers'
);

select is(
  (
    select jsonb_array_length(looking_for_skills)
    from public.get_discovery_candidates(10)
    where user_id = '00000000-0000-4000-8000-000000000803'
  ),
  0,
  'candidate with zero optional looking-for skills remains eligible'
);

select results_eq(
  $$ select outgoing_action::text, is_matched, match_id
     from public.get_profile_connection_status('00000000-0000-4000-8000-000000000802') $$,
  $$ values (null::text, false, null::uuid) $$,
  'profile connection status starts without outgoing action or match'
);

select is_empty(
  $$ select corporate_email
     from public.get_matched_contact_email('00000000-0000-4000-8000-000000000802') $$,
  'contact email is hidden before mutual match'
);

select results_eq(
  $$ select matched, match_id
     from public.set_discovery_action('00000000-0000-4000-8000-000000000802', 'connect') $$,
  $$ values (false, null::uuid) $$,
  'one-way connect records without creating a match'
);

select is_empty(
  $$ select user_id
     from public.get_discovery_candidates(10)
     where user_id = '00000000-0000-4000-8000-000000000802' $$,
  'own outgoing action removes candidate from discovery'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000802', true);

select results_eq(
  $$ select outgoing_action::text, is_matched, match_id
     from public.get_profile_connection_status('00000000-0000-4000-8000-000000000801') $$,
  $$ values (null::text, false, null::uuid) $$,
  'incoming connect is not exposed in profile status'
);

select is(
  (
    select matched
    from public.set_discovery_action('00000000-0000-4000-8000-000000000801', 'connect')
  ),
  true,
  'reciprocal connect reports a mutual match'
);

select is(
  (
    select count(*)::integer
    from public.matches
    where user_low = '00000000-0000-4000-8000-000000000801'
      and user_high = '00000000-0000-4000-8000-000000000802'
      and status = 'active'::public.match_status
  ),
  1,
  'reciprocal connect creates exactly one active canonical match'
);

select is(
  (
    select count(*)::integer
    from public.set_discovery_action('00000000-0000-4000-8000-000000000801', 'connect')
  ),
  1,
  'repeating connect remains idempotent from the caller perspective'
);

select is(
  (
    select count(*)::integer
    from public.matches
    where user_low = '00000000-0000-4000-8000-000000000801'
      and user_high = '00000000-0000-4000-8000-000000000802'
  ),
  1,
  'duplicate reciprocal connect does not create duplicate matches'
);

select results_eq(
  $$ select user_id
     from public.get_my_matches(10) $$,
  $$ values ('00000000-0000-4000-8000-000000000801'::uuid) $$,
  'matches page RPC returns the other participant'
);

select is(
  (
    select coalesce(bool_or(row_to_json(match_row)::text like '%@example.test%'), false)
    from public.get_my_matches(10) match_row
  ),
  false,
  'matches RPC does not leak auth email'
);

select results_eq(
  $$ select corporate_email
     from public.get_matched_contact_email('00000000-0000-4000-8000-000000000801') $$,
  $$ values ('phase6-a@example.test'::text) $$,
  'existing contact RPC reveals email after mutual match'
);

select is(
  (select public.log_email_contact_clicked('00000000-0000-4000-8000-000000000801')),
  true,
  'contact reveal click can be logged for a mutual match'
);

reset role;
select is(
  (
    select count(*)::integer
    from public.product_events
    where user_id = '00000000-0000-4000-8000-000000000802'
      and subject_user_id = '00000000-0000-4000-8000-000000000801'
      and event_name = 'email_contact_clicked'
  ),
  1,
  'contact reveal product event is recorded'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000801', true);

select results_eq(
  $$ select is_matched
     from public.get_profile_connection_status('00000000-0000-4000-8000-000000000802') $$,
  $$ values (true) $$,
  'matched profile status is visible to the participant'
);

select throws_ok(
  $$ select public.block_user('00000000-0000-4000-8000-000000000802') $$,
  '42501',
  null,
  'authenticated user cannot execute deprecated block RPC'
);

reset role;
select is(
  (
    select status::text
    from public.matches
    where user_low = '00000000-0000-4000-8000-000000000801'
      and user_high = '00000000-0000-4000-8000-000000000802'
  ),
  'active',
  'deprecated block RPC leaves the active match unchanged'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000801', true);

select results_eq(
  $$ select corporate_email
     from public.get_matched_contact_email('00000000-0000-4000-8000-000000000802') $$,
  $$ values ('phase6-b@example.test'::text) $$,
  'deprecated block path does not remove matched contact email'
);

reset role;
insert into public.blocks (blocker_user_id, blocked_user_id)
values (
  '00000000-0000-4000-8000-000000000801',
  '00000000-0000-4000-8000-000000000803'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000801', true);

select results_eq(
  $$ select user_id
     from public.get_discovery_candidates(10)
     where user_id = '00000000-0000-4000-8000-000000000803' $$,
  $$ values ('00000000-0000-4000-8000-000000000803'::uuid) $$,
  'legacy block row does not exclude profile from discovery'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000801', true);

select isnt(
  (select public.report_user('00000000-0000-4000-8000-000000000803', 'spam', 'Phase 6 test report')),
  null::uuid,
  'authenticated user can report another profile'
);

reset role;
select is(
  (
    select count(*)::integer
    from public.product_events
    where user_id = '00000000-0000-4000-8000-000000000801'
      and subject_user_id = '00000000-0000-4000-8000-000000000803'
      and event_name = 'report_created'
  ),
  1,
  'report product event is recorded'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000801', true);

select throws_ok(
  $$ select * from public.set_discovery_action('00000000-0000-4000-8000-000000000801', 'connect') $$,
  'P0001',
  null,
  'caller cannot create a self interaction through the RPC'
);

select * from finish();
rollback;
