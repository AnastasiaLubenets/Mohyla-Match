begin;

select plan(9);

select has_column(
  'public',
  'profiles',
  'avatar_mode',
  'profiles store avatar selection mode'
);

select has_column(
  'public',
  'profiles',
  'custom_avatar_key',
  'profiles store selected custom avatar key'
);

select col_not_null(
  'public',
  'profiles',
  'avatar_mode',
  'avatar mode is always present'
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
values
  ('00000000-0000-4000-8000-000000000801', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'avatar-a@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb)
on conflict (id) do update
set email = excluded.email,
    email_confirmed_at = excluded.email_confirmed_at,
    updated_at = now();

insert into public.faculties (slug, display_name, avatar_theme_key, sort_order)
values
  ('avatar-preferences-faculty', 'Avatar Preferences Faculty', 'avatar-preferences-theme', 980)
on conflict (slug) do update
set display_name = excluded.display_name,
    avatar_theme_key = excluded.avatar_theme_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.academic_programs (faculty_id, slug, display_name, avatar_variant_key, sort_order)
values (
  (select id from public.faculties where slug = 'avatar-preferences-faculty'),
  'avatar-preferences-program',
  'Avatar Preferences Program',
  'program-computer-science',
  980
)
on conflict (slug) do update
set faculty_id = excluded.faculty_id,
    display_name = excluded.display_name,
    avatar_variant_key = excluded.avatar_variant_key,
    sort_order = excluded.sort_order,
    is_active = true,
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
values (
  '00000000-0000-4000-8000-000000000801',
  'Avatar Preferences User',
  (select id from public.faculties where slug = 'avatar-preferences-faculty'),
  (select id from public.academic_programs where slug = 'avatar-preferences-program'),
  2,
  'active',
  now(),
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
    avatar_mode = 'program',
    custom_avatar_key = null,
    updated_at = now();

select results_eq(
  $$ select avatar_mode::text, custom_avatar_key
     from public.profiles
     where user_id = '00000000-0000-4000-8000-000000000801' $$,
  $$ values ('program'::text, null::text) $$,
  'existing and default profiles resolve to program avatar mode'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000801', true);

select lives_ok(
  $$ update public.profiles
     set avatar_mode = 'custom', custom_avatar_key = 'avatar-01'
     where user_id = '00000000-0000-4000-8000-000000000801' $$,
  'owner can choose a supplied custom avatar'
);

select results_eq(
  $$ select avatar_mode::text, custom_avatar_key
     from public.profiles
     where user_id = '00000000-0000-4000-8000-000000000801' $$,
  $$ values ('custom'::text, 'avatar-01'::text) $$,
  'custom avatar preference is stored as a stable key'
);

select throws_ok(
  $$ update public.profiles
     set avatar_mode = 'custom', custom_avatar_key = 'avatar-not-supplied'
     where user_id = '00000000-0000-4000-8000-000000000801' $$,
  '23514',
  null,
  'unsupported custom avatar keys are rejected'
);

select throws_ok(
  $$ update public.profiles
     set avatar_mode = 'program', custom_avatar_key = 'avatar-01'
     where user_id = '00000000-0000-4000-8000-000000000801' $$,
  '23514',
  null,
  'non-custom avatar modes cannot keep a custom avatar key'
);

select lives_ok(
  $$ update public.profiles
     set avatar_mode = 'default', custom_avatar_key = null
     where user_id = '00000000-0000-4000-8000-000000000801' $$,
  'owner can choose the generated default avatar'
);

select * from finish();
rollback;
