begin;

select plan(13);

insert into public.faculties (slug, display_name, avatar_theme_key, sort_order)
values
  ('social-links-faculty', 'Social Links Faculty', 'social-links-theme', 970)
on conflict (slug) do update
set display_name = excluded.display_name,
    avatar_theme_key = excluded.avatar_theme_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.academic_programs (faculty_id, slug, display_name, avatar_variant_key, sort_order)
values (
  (select id from public.faculties where slug = 'social-links-faculty'),
  'social-links-program',
  'Social Links Program',
  'social-links-program',
  970
)
on conflict (slug) do update
set faculty_id = excluded.faculty_id,
    display_name = excluded.display_name,
    avatar_variant_key = excluded.avatar_variant_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.skills (category, slug, name, is_active, sort_order)
values ('social-links', 'social-links-offer', 'Social Links Offer', true, 970)
on conflict (slug) do update
set category = excluded.category,
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
  ('00000000-0000-4000-8000-000000000701', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'social-a@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000702', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'social-b@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000703', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'social-incomplete@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb)
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
  onboarding_completed_at,
  deleted_at
)
values
  (
    '00000000-0000-4000-8000-000000000701',
    'Social Links A',
    (select id from public.faculties where slug = 'social-links-faculty'),
    (select id from public.academic_programs where slug = 'social-links-program'),
    2,
    'active',
    now(),
    null
  ),
  (
    '00000000-0000-4000-8000-000000000702',
    'Social Links B',
    (select id from public.faculties where slug = 'social-links-faculty'),
    (select id from public.academic_programs where slug = 'social-links-program'),
    3,
    'active',
    now(),
    null
  ),
  (
    '00000000-0000-4000-8000-000000000703',
    'Social Links Incomplete',
    (select id from public.faculties where slug = 'social-links-faculty'),
    (select id from public.academic_programs where slug = 'social-links-program'),
    1,
    'active',
    null,
    null
  )
on conflict (user_id) do update
set full_name = excluded.full_name,
    faculty_id = excluded.faculty_id,
    academic_program_id = excluded.academic_program_id,
    year_of_study = excluded.year_of_study,
    profile_status = excluded.profile_status,
    onboarding_completed_at = excluded.onboarding_completed_at,
    deleted_at = excluded.deleted_at,
    updated_at = now();

insert into public.profile_skills (user_id, skill_id, direction)
select user_id, skill_id, 'offer'::public.skill_direction
from (
  values
    ('00000000-0000-4000-8000-000000000701'::uuid, (select id from public.skills where slug = 'social-links-offer')),
    ('00000000-0000-4000-8000-000000000702'::uuid, (select id from public.skills where slug = 'social-links-offer'))
) as rows(user_id, skill_id)
on conflict do nothing;

select has_table(
  'public',
  'profile_social_links',
  'structured profile social links table exists'
);

reset role;
set local role anon;

select throws_ok(
  $$ insert into public.profile_social_links (user_id, platform, url)
     values ('00000000-0000-4000-8000-000000000701', 'github', 'https://github.com/mohyla-match') $$,
  '42501',
  null,
  'anonymous cannot insert social links'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000701', true);

select lives_ok(
  $$ insert into public.profile_social_links (user_id, platform, url, sort_order)
     values ('00000000-0000-4000-8000-000000000701', 'github', 'https://github.com/mohyla-match', 0) $$,
  'owner can add own social link'
);

select throws_ok(
  $$ insert into public.profile_social_links (user_id, platform, url)
     values ('00000000-0000-4000-8000-000000000701', 'github', 'https://github.com/duplicate') $$,
  '23505',
  null,
  'duplicate platform per profile is rejected'
);

select throws_ok(
  $$ insert into public.profile_social_links (user_id, platform, url)
     values ('00000000-0000-4000-8000-000000000701', 'myspace', 'https://example.test/profile') $$,
  '23514',
  null,
  'unsupported platform values are rejected'
);

select throws_ok(
  $$ insert into public.profile_social_links (user_id, platform, url)
     values ('00000000-0000-4000-8000-000000000701', 'linkedin', 'javascript:alert(1)') $$,
  '23514',
  null,
  'unsafe protocols are rejected'
);

select throws_ok(
  $$ insert into public.profile_social_links (user_id, platform, url)
     values ('00000000-0000-4000-8000-000000000702', 'linkedin', 'https://linkedin.com/in/social-b') $$,
  '42501',
  null,
  'user cannot insert links for another profile'
);

reset role;
insert into public.profile_social_links (user_id, platform, url, sort_order)
values (
  '00000000-0000-4000-8000-000000000702',
  'linkedin',
  'https://linkedin.com/in/social-b',
  0
)
on conflict (user_id, platform) do update
set url = excluded.url,
    sort_order = excluded.sort_order,
    updated_at = now();

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000701', true);

select results_eq(
  $$ select platform, url
     from public.profile_social_links
     where user_id = '00000000-0000-4000-8000-000000000702' $$,
  $$ values ('linkedin'::text, 'https://linkedin.com/in/social-b'::text) $$,
  'eligible users can read links for visible profiles'
);

select is_empty(
  $$ update public.profile_social_links
     set url = 'https://linkedin.com/in/stolen'
     where user_id = '00000000-0000-4000-8000-000000000702'
     returning id $$,
  'user cannot update another profile social link'
);

select is_empty(
  $$ delete from public.profile_social_links
     where user_id = '00000000-0000-4000-8000-000000000702'
     returning id $$,
  'user cannot delete another profile social link'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000703', true);

select is_empty(
  $$ select id
     from public.profile_social_links
     where user_id = '00000000-0000-4000-8000-000000000702' $$,
  'incomplete profile cannot read another profile social links'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000701', true);

select lives_ok(
  $$ update public.profile_social_links
     set url = 'https://github.com/mohyla-match-updated'
     where user_id = '00000000-0000-4000-8000-000000000701'
       and platform = 'github' $$,
  'owner can update own social link'
);

select lives_ok(
  $$ delete from public.profile_social_links
     where user_id = '00000000-0000-4000-8000-000000000701'
       and platform = 'github' $$,
  'owner can delete own social link'
);

select * from finish();
rollback;
