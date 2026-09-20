begin;

select plan(35);

insert into public.faculties (slug, display_name, avatar_theme_key, sort_order)
values
  ('phase5-faculty-a', 'Phase 5 Faculty A', 'phase5-theme-a', 950),
  ('phase5-faculty-b', 'Phase 5 Faculty B', 'phase5-theme-b', 960)
on conflict (slug) do update
set display_name = excluded.display_name,
    avatar_theme_key = excluded.avatar_theme_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.academic_programs (faculty_id, slug, display_name, avatar_variant_key, sort_order)
values
  (
    (select id from public.faculties where slug = 'phase5-faculty-a'),
    'phase5-program-a',
    'Phase 5 Program A',
    'phase5-program-a',
    950
  ),
  (
    (select id from public.faculties where slug = 'phase5-faculty-b'),
    'phase5-program-b',
    'Phase 5 Program B',
    'phase5-program-b',
    960
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
  ('phase5', 'phase5-offer-skill', 'Phase 5 Offer Skill', true, 950),
  ('phase5', 'phase5-looking-skill', 'Phase 5 Looking Skill', true, 960),
  ('phase5', 'phase5-alt-skill', 'Phase 5 Alternative Skill', true, 970),
  ('phase5', 'phase5-inactive-skill', 'Phase 5 Inactive Skill', false, 980)
on conflict (slug) do update
set category = excluded.category,
    name = excluded.name,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
    updated_at = now();

insert into public.interests (slug, name, is_active, sort_order)
values
  ('phase5-interest', 'Phase 5 Interest', true, 950),
  ('phase5-inactive-interest', 'Phase 5 Inactive Interest', false, 960)
on conflict (slug) do update
set name = excluded.name,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
    updated_at = now();

insert into public.collaboration_goals (slug, name, is_active, sort_order)
values
  ('phase5-goal', 'Phase 5 Goal', true, 950),
  ('phase5-inactive-goal', 'Phase 5 Inactive Goal', false, 960)
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
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase5-a@example.test', '', now(), now(), now(), '{}'::jsonb, '{"role":"admin"}'::jsonb),
  ('00000000-0000-4000-8000-000000000502', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase5-b@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000503', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase5-incomplete@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000504', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase5-suspended@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000505', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase5-deleted@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000506', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase5-blocked@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb)
on conflict (id) do update
set email = excluded.email,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_user_meta_data = excluded.raw_user_meta_data,
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
  onboarding_completed_at,
  deleted_at
)
values
  (
    '00000000-0000-4000-8000-000000000501',
    'Phase Five A',
    (select id from public.faculties where slug = 'phase5-faculty-a'),
    (select id from public.academic_programs where slug = 'phase5-program-a'),
    2,
    'Phase 5 bio A',
    'Weekdays',
    'active',
    now(),
    null
  ),
  (
    '00000000-0000-4000-8000-000000000502',
    'Phase Five B',
    (select id from public.faculties where slug = 'phase5-faculty-a'),
    (select id from public.academic_programs where slug = 'phase5-program-a'),
    3,
    'Phase 5 bio B',
    'Weekends',
    'active',
    now(),
    null
  ),
  (
    '00000000-0000-4000-8000-000000000503',
    'Phase Five Incomplete',
    (select id from public.faculties where slug = 'phase5-faculty-a'),
    (select id from public.academic_programs where slug = 'phase5-program-a'),
    1,
    'Incomplete target',
    null,
    'active',
    null,
    null
  ),
  (
    '00000000-0000-4000-8000-000000000504',
    'Phase Five Suspended',
    (select id from public.faculties where slug = 'phase5-faculty-a'),
    (select id from public.academic_programs where slug = 'phase5-program-a'),
    1,
    'Suspended target',
    null,
    'suspended',
    now(),
    null
  ),
  (
    '00000000-0000-4000-8000-000000000505',
    'Phase Five Deleted',
    (select id from public.faculties where slug = 'phase5-faculty-a'),
    (select id from public.academic_programs where slug = 'phase5-program-a'),
    1,
    'Deleted target',
    null,
    'deleted',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000506',
    'Phase Five Blocked',
    (select id from public.faculties where slug = 'phase5-faculty-a'),
    (select id from public.academic_programs where slug = 'phase5-program-a'),
    1,
    'Blocked target',
    null,
    'active',
    now(),
    null
  )
on conflict (user_id) do update
set full_name = excluded.full_name,
    faculty_id = excluded.faculty_id,
    academic_program_id = excluded.academic_program_id,
    year_of_study = excluded.year_of_study,
    bio = excluded.bio,
    availability = excluded.availability,
    profile_status = excluded.profile_status,
    onboarding_completed_at = excluded.onboarding_completed_at,
    deleted_at = excluded.deleted_at,
    updated_at = now();

insert into public.profile_skills (user_id, skill_id, direction)
select user_id, skill_id, direction
from (
  values
    ('00000000-0000-4000-8000-000000000501'::uuid, (select id from public.skills where slug = 'phase5-offer-skill'), 'offer'::public.skill_direction),
    ('00000000-0000-4000-8000-000000000501'::uuid, (select id from public.skills where slug = 'phase5-looking-skill'), 'looking_for'::public.skill_direction),
    ('00000000-0000-4000-8000-000000000502'::uuid, (select id from public.skills where slug = 'phase5-offer-skill'), 'offer'::public.skill_direction),
    ('00000000-0000-4000-8000-000000000502'::uuid, (select id from public.skills where slug = 'phase5-looking-skill'), 'looking_for'::public.skill_direction),
    ('00000000-0000-4000-8000-000000000504'::uuid, (select id from public.skills where slug = 'phase5-offer-skill'), 'offer'::public.skill_direction),
    ('00000000-0000-4000-8000-000000000504'::uuid, (select id from public.skills where slug = 'phase5-looking-skill'), 'looking_for'::public.skill_direction),
    ('00000000-0000-4000-8000-000000000505'::uuid, (select id from public.skills where slug = 'phase5-offer-skill'), 'offer'::public.skill_direction),
    ('00000000-0000-4000-8000-000000000505'::uuid, (select id from public.skills where slug = 'phase5-looking-skill'), 'looking_for'::public.skill_direction),
    ('00000000-0000-4000-8000-000000000506'::uuid, (select id from public.skills where slug = 'phase5-offer-skill'), 'offer'::public.skill_direction),
    ('00000000-0000-4000-8000-000000000506'::uuid, (select id from public.skills where slug = 'phase5-looking-skill'), 'looking_for'::public.skill_direction)
) as rows(user_id, skill_id, direction)
on conflict do nothing;

insert into public.profile_interests (user_id, interest_id)
select user_id, interest_id
from (
  values
    ('00000000-0000-4000-8000-000000000501'::uuid, (select id from public.interests where slug = 'phase5-interest')),
    ('00000000-0000-4000-8000-000000000502'::uuid, (select id from public.interests where slug = 'phase5-interest')),
    ('00000000-0000-4000-8000-000000000504'::uuid, (select id from public.interests where slug = 'phase5-interest')),
    ('00000000-0000-4000-8000-000000000505'::uuid, (select id from public.interests where slug = 'phase5-interest')),
    ('00000000-0000-4000-8000-000000000506'::uuid, (select id from public.interests where slug = 'phase5-interest'))
) as rows(user_id, interest_id)
on conflict do nothing;

insert into public.profile_collaboration_goals (user_id, collaboration_goal_id)
select user_id, collaboration_goal_id
from (
  values
    ('00000000-0000-4000-8000-000000000501'::uuid, (select id from public.collaboration_goals where slug = 'phase5-goal')),
    ('00000000-0000-4000-8000-000000000502'::uuid, (select id from public.collaboration_goals where slug = 'phase5-goal')),
    ('00000000-0000-4000-8000-000000000504'::uuid, (select id from public.collaboration_goals where slug = 'phase5-goal')),
    ('00000000-0000-4000-8000-000000000505'::uuid, (select id from public.collaboration_goals where slug = 'phase5-goal')),
    ('00000000-0000-4000-8000-000000000506'::uuid, (select id from public.collaboration_goals where slug = 'phase5-goal'))
) as rows(user_id, collaboration_goal_id)
on conflict do nothing;

insert into public.product_events (user_id, event_name, metadata)
values (
  '00000000-0000-4000-8000-000000000501',
  'onboarding_completed',
  '{"source":"phase5-test-seed"}'::jsonb
)
on conflict (user_id, event_name)
  where event_name = 'onboarding_completed'
do nothing;

reset role;
set local role anon;

select throws_ok(
  $$ select public.update_my_profile('Anon Edit', 1, 1, 2, null, null, array[1]::bigint[], array[1]::bigint[], array[1]::bigint[], array[1]::bigint[]) $$,
  '42501',
  null,
  'anonymous cannot call profile update RPC'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000501', true);

select is(
  (
    select full_name
    from public.profiles
    where user_id = '00000000-0000-4000-8000-000000000501'
  ),
  'Phase Five A',
  'onboarded user can view own profile'
);

select is(
  (
    select full_name
    from public.profiles
    where user_id = '00000000-0000-4000-8000-000000000502'
  ),
  'Phase Five B',
  'eligible onboarded user can view another eligible profile'
);

select is_empty(
  $$ select user_id from public.profiles where user_id = '00000000-0000-4000-8000-000000000503' $$,
  'incomplete target cannot be viewed'
);

select is_empty(
  $$ select user_id from public.profiles where user_id = '00000000-0000-4000-8000-000000000504' $$,
  'suspended target cannot be viewed'
);

select is_empty(
  $$ select user_id from public.profiles where user_id = '00000000-0000-4000-8000-000000000505' $$,
  'deleted target cannot be viewed'
);

insert into public.blocks (blocker_user_id, blocked_user_id)
values (
  '00000000-0000-4000-8000-000000000501',
  '00000000-0000-4000-8000-000000000506'
);

select is_empty(
  $$ select user_id from public.profiles where user_id = '00000000-0000-4000-8000-000000000506' $$,
  'blocked target cannot be viewed'
);

select is_empty(
  $$ select user_id from public.profiles where user_id = '00000000-0000-4000-8000-000000009999' $$,
  'guessed inaccessible UUID does not expose profile'
);

select hasnt_column(
  'public',
  'profiles',
  'corporate_email',
  'corporate email never appears in profile storage'
);

select is(
  (
    select coalesce(bool_or(row_to_json(profile_row)::text like '%@example.test%'), false)
    from (
      select full_name, faculty_id, academic_program_id, year_of_study, bio, availability, system_avatar_key
      from public.profiles
      where user_id = '00000000-0000-4000-8000-000000000502'
    ) profile_row
  ),
  false,
  'safe profile fields do not contain corporate email'
);

select is_empty(
  $$ update public.profiles
     set full_name = 'Stolen Edit'
     where user_id = '00000000-0000-4000-8000-000000000502'
     returning user_id $$,
  'user cannot edit another user profile'
);

select throws_ok(
  $$ insert into public.profile_skills (user_id, skill_id, direction)
     values (
       '00000000-0000-4000-8000-000000000502',
       (select id from public.skills where slug = 'phase5-alt-skill'),
       'offer'
     ) $$,
  '42501',
  null,
  'user cannot edit another user skills'
);

select throws_ok(
  $$ insert into public.profile_interests (user_id, interest_id)
     values (
       '00000000-0000-4000-8000-000000000502',
       (select id from public.interests where slug = 'technology')
     ) $$,
  '42501',
  null,
  'user cannot edit another user interests'
);

select throws_ok(
  $$ insert into public.profile_collaboration_goals (user_id, collaboration_goal_id)
     values (
       '00000000-0000-4000-8000-000000000502',
       (select id from public.collaboration_goals where slug = 'project-teammate')
     ) $$,
  '42501',
  null,
  'user cannot edit another user collaboration goals'
);

select throws_ok(
  $$ select public.update_my_profile(
       'Cross Faculty',
       (select id from public.faculties where slug = 'phase5-faculty-a'),
       (select id from public.academic_programs where slug = 'phase5-program-b'),
       2,
       null,
       null,
       array[(select id from public.skills where slug = 'phase5-offer-skill')],
       array[(select id from public.skills where slug = 'phase5-looking-skill')],
       array[(select id from public.interests where slug = 'phase5-interest')],
       array[(select id from public.collaboration_goals where slug = 'phase5-goal')]
     ) $$,
  'P0001',
  null,
  'cross-faculty program rejected'
);

select throws_ok(
  $$ select public.update_my_profile(
       'Inactive Skill',
       (select id from public.faculties where slug = 'phase5-faculty-a'),
       (select id from public.academic_programs where slug = 'phase5-program-a'),
       2,
       null,
       null,
       array[(select id from public.skills where slug = 'phase5-inactive-skill')],
       array[(select id from public.skills where slug = 'phase5-looking-skill')],
       array[(select id from public.interests where slug = 'phase5-interest')],
       array[(select id from public.collaboration_goals where slug = 'phase5-goal')]
     ) $$,
  'P0001',
  null,
  'inactive taxonomy rejected'
);

select is(
  (
    select full_name
    from public.profiles
    where user_id = '00000000-0000-4000-8000-000000000501'
  ),
  'Phase Five A',
  'invalid edit leaves profile fields unchanged atomically'
);

select throws_ok(
  $$ select public.update_my_profile(
       'Zero Offer',
       (select id from public.faculties where slug = 'phase5-faculty-a'),
       (select id from public.academic_programs where slug = 'phase5-program-a'),
       2,
       null,
       null,
       '{}'::bigint[],
       array[(select id from public.skills where slug = 'phase5-looking-skill')],
       array[(select id from public.interests where slug = 'phase5-interest')],
       array[(select id from public.collaboration_goals where slug = 'phase5-goal')]
     ) $$,
  'P0001',
  null,
  'zero offer skills rejected'
);

select throws_ok(
  $$ select public.update_my_profile(
       'Zero Looking',
       (select id from public.faculties where slug = 'phase5-faculty-a'),
       (select id from public.academic_programs where slug = 'phase5-program-a'),
       2,
       null,
       null,
       array[(select id from public.skills where slug = 'phase5-offer-skill')],
       '{}'::bigint[],
       array[(select id from public.interests where slug = 'phase5-interest')],
       array[(select id from public.collaboration_goals where slug = 'phase5-goal')]
     ) $$,
  'P0001',
  null,
  'zero looking-for skills rejected'
);

select throws_ok(
  $$ select public.update_my_profile(
       'Zero Interest',
       (select id from public.faculties where slug = 'phase5-faculty-a'),
       (select id from public.academic_programs where slug = 'phase5-program-a'),
       2,
       null,
       null,
       array[(select id from public.skills where slug = 'phase5-offer-skill')],
       array[(select id from public.skills where slug = 'phase5-looking-skill')],
       '{}'::bigint[],
       array[(select id from public.collaboration_goals where slug = 'phase5-goal')]
     ) $$,
  'P0001',
  null,
  'zero interests rejected'
);

select throws_ok(
  $$ select public.update_my_profile(
       'Zero Goal',
       (select id from public.faculties where slug = 'phase5-faculty-a'),
       (select id from public.academic_programs where slug = 'phase5-program-a'),
       2,
       null,
       null,
       array[(select id from public.skills where slug = 'phase5-offer-skill')],
       array[(select id from public.skills where slug = 'phase5-looking-skill')],
       array[(select id from public.interests where slug = 'phase5-interest')],
       '{}'::bigint[]
     ) $$,
  'P0001',
  null,
  'zero collaboration goals rejected'
);

do $$
begin
  perform set_config(
    'phase5.completed_at',
    (
      select onboarding_completed_at::text
      from public.profiles
      where user_id = '00000000-0000-4000-8000-000000000501'
    ),
    true
  );
end $$;

select lives_ok(
  $$ select public.update_my_profile(
       'Phase Five Updated',
       (select id from public.faculties where slug = 'phase5-faculty-b'),
       (select id from public.academic_programs where slug = 'phase5-program-b'),
       4,
       'Updated bio',
       'Updated availability',
       array[(select id from public.skills where slug = 'phase5-alt-skill')],
       array[(select id from public.skills where slug = 'phase5-looking-skill')],
       array[(select id from public.interests where slug = 'phase5-interest')],
       array[(select id from public.collaboration_goals where slug = 'phase5-goal')]
     ) $$,
  'valid edit persists all fields and relations atomically'
);

select results_eq(
  $$ select full_name, year_of_study::integer, bio, availability
     from public.profiles
     where user_id = '00000000-0000-4000-8000-000000000501' $$,
  $$ values ('Phase Five Updated'::text, 4, 'Updated bio'::text, 'Updated availability'::text) $$,
  'valid edit persists scalar profile fields'
);

select results_eq(
  $$ select s.slug, ps.direction::text
     from public.profile_skills ps
     join public.skills s on s.id = ps.skill_id
     where ps.user_id = '00000000-0000-4000-8000-000000000501'
     order by
       case
         when ps.direction = 'offer'::public.skill_direction then 1
         else 2
       end,
       s.slug $$,
  $$ values
       ('phase5-alt-skill'::text, 'offer'::text),
       ('phase5-looking-skill'::text, 'looking_for'::text) $$,
  'valid edit replaces skill relations'
);

select results_eq(
  $$ select i.slug
     from public.profile_interests pi
     join public.interests i on i.id = pi.interest_id
     where pi.user_id = '00000000-0000-4000-8000-000000000501' $$,
  $$ values ('phase5-interest'::text) $$,
  'valid edit replaces interests'
);

select results_eq(
  $$ select cg.slug
     from public.profile_collaboration_goals pcg
     join public.collaboration_goals cg on cg.id = pcg.collaboration_goal_id
     where pcg.user_id = '00000000-0000-4000-8000-000000000501' $$,
  $$ values ('phase5-goal'::text) $$,
  'valid edit replaces collaboration goals'
);

select is(
  (
    select system_avatar_key
    from public.profiles
    where user_id = '00000000-0000-4000-8000-000000000501'
  ),
  'phase5-theme-b--phase5-program-b',
  'system avatar remains DB-derived after faculty/program edit'
);

select throws_ok(
  $$ update public.profiles
     set system_avatar_key = 'client-picked'
     where user_id = '00000000-0000-4000-8000-000000000501' $$,
  '42501',
  null,
  'client cannot choose system avatar key directly'
);

select is(
  (
    select onboarding_completed_at::text
    from public.profiles
    where user_id = '00000000-0000-4000-8000-000000000501'
  ),
  current_setting('phase5.completed_at'),
  'valid edit preserves original onboarding_completed_at'
);

reset role;

select is(
  (
    select count(*)::integer
    from public.product_events
    where user_id = '00000000-0000-4000-8000-000000000501'
      and event_name = 'onboarding_completed'
  ),
  1,
  'valid edit does not duplicate onboarding_completed event'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000501', true);

select ok(
  private.is_active_onboarded('00000000-0000-4000-8000-000000000501'),
  'valid edited profile remains effectively onboarded'
);

select lives_ok(
  $$ delete from public.profile_skills
     where user_id = '00000000-0000-4000-8000-000000000501'
       and direction = 'offer' $$,
  'direct relation removal is allowed but removes effective eligibility'
);

select ok(
  not private.is_active_onboarded('00000000-0000-4000-8000-000000000501'),
  'Phase 4 live completeness still fails closed after required relation removal'
);

select is(
  public.get_current_account_state(),
  'onboarding_incomplete',
  'direct required relation removal changes account state to onboarding_incomplete'
);

reset role;

select is(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.update_my_profile(text,bigint,bigint,integer,text,text,bigint[],bigint[],bigint[],bigint[])'::regprocedure
  ),
  false,
  'profile edit RPC is security invoker, not security definer'
);

select * from finish();
rollback;
