create or replace function private.derive_system_avatar_key(
  check_faculty_id bigint,
  check_program_id bigint
)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select concat(f.avatar_theme_key, '--', ap.avatar_variant_key)
  from public.faculties f
  join public.academic_programs ap on ap.faculty_id = f.id
  where f.id = check_faculty_id
    and ap.id = check_program_id;
$$;

create or replace function private.set_profile_system_avatar_key()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.system_avatar_key := private.derive_system_avatar_key(
    new.faculty_id,
    new.academic_program_id
  );

  if new.system_avatar_key is null then
    raise exception 'Profile requires a valid faculty/program avatar source.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function private.derive_system_avatar_key(bigint, bigint)
  from public, anon, authenticated;

revoke execute on function private.set_profile_system_avatar_key()
  from public, anon, authenticated;

drop trigger if exists profiles_set_system_avatar_key on public.profiles;

create trigger profiles_set_system_avatar_key
  before insert or update of faculty_id, academic_program_id, system_avatar_key
  on public.profiles
  for each row execute function private.set_profile_system_avatar_key();

update public.profiles p
set system_avatar_key = private.derive_system_avatar_key(
  p.faculty_id,
  p.academic_program_id
)
where private.derive_system_avatar_key(p.faculty_id, p.academic_program_id) is not null;

revoke insert (system_avatar_key, onboarding_completed_at)
  on public.profiles
  from authenticated;

revoke update (system_avatar_key, onboarding_completed_at)
  on public.profiles
  from authenticated;

create unique index if not exists product_events_onboarding_completed_once_idx
  on public.product_events (user_id, event_name)
  where event_name = 'onboarding_completed';

create or replace function public.complete_onboarding()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  completed_at timestamptz;
begin
  if caller_id is null then
    raise exception 'Authentication required to complete onboarding.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.profiles p
    join public.faculties f on f.id = p.faculty_id
    join public.academic_programs ap
      on ap.id = p.academic_program_id
      and ap.faculty_id = p.faculty_id
    where p.user_id = caller_id
      and p.profile_status = 'active'::public.profile_status
      and p.deleted_at is null
      and f.is_active
      and ap.is_active
      and char_length(p.full_name) between 2 and 120
      and p.year_of_study between 1 and 6
      and (p.bio is null or char_length(p.bio) <= 500)
      and (p.availability is null or char_length(p.availability) <= 160)
  ) then
    raise exception 'Onboarding requires a complete active profile.'
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.profile_skills ps
    join public.skills s on s.id = ps.skill_id
    where ps.user_id = caller_id
      and ps.direction = 'offer'::public.skill_direction
      and s.is_active
  ) then
    raise exception 'Onboarding requires at least one offered skill.'
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.profile_skills ps
    join public.skills s on s.id = ps.skill_id
    where ps.user_id = caller_id
      and ps.direction = 'looking_for'::public.skill_direction
      and s.is_active
  ) then
    raise exception 'Onboarding requires at least one looking-for skill.'
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.profile_interests pi
    join public.interests i on i.id = pi.interest_id
    where pi.user_id = caller_id
      and i.is_active
  ) then
    raise exception 'Onboarding requires at least one interest.'
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.profile_collaboration_goals pcg
    join public.collaboration_goals cg on cg.id = pcg.collaboration_goal_id
    where pcg.user_id = caller_id
      and cg.is_active
  ) then
    raise exception 'Onboarding requires at least one collaboration goal.'
      using errcode = 'P0001';
  end if;

  update public.profiles
  set onboarding_completed_at = coalesce(onboarding_completed_at, now())
  where user_id = caller_id
    and profile_status = 'active'::public.profile_status
  returning onboarding_completed_at into completed_at;

  if completed_at is null then
    raise exception 'Onboarding profile could not be completed.'
      using errcode = 'P0001';
  end if;

  insert into public.product_events (user_id, event_name, metadata)
  values (
    caller_id,
    'onboarding_completed',
    jsonb_build_object('source', 'complete_onboarding_rpc')
  )
  on conflict (user_id, event_name)
    where event_name = 'onboarding_completed'
  do nothing;

  return completed_at;
end;
$$;

revoke execute on function public.complete_onboarding() from public, anon;
grant execute on function public.complete_onboarding() to authenticated;

grant select on public.skills, public.interests, public.collaboration_goals
  to service_role;

comment on function public.complete_onboarding() is
  'Database-enforced onboarding completion gate. Checks the current authenticated user has all required Phase 4 data before setting onboarding_completed_at idempotently.';

comment on function private.derive_system_avatar_key(bigint, bigint) is
  'Derives the system avatar key from faculty/program taxonomy fields so clients cannot choose arbitrary avatar keys.';
