create or replace function private.has_complete_onboarding_data(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles p
      join public.faculties f on f.id = p.faculty_id
      join public.academic_programs ap
        on ap.id = p.academic_program_id
        and ap.faculty_id = p.faculty_id
      where p.user_id = check_user_id
        and p.profile_status = 'active'::public.profile_status
        and p.deleted_at is null
        and f.is_active
        and ap.is_active
        and char_length(p.full_name) between 2 and 120
        and p.year_of_study between 1 and 6
        and (p.bio is null or char_length(p.bio) <= 500)
        and (p.availability is null or char_length(p.availability) <= 160)
        and exists (
          select 1
          from public.profile_skills ps
          join public.skills s on s.id = ps.skill_id
          where ps.user_id = check_user_id
            and ps.direction = 'offer'::public.skill_direction
            and s.is_active
        )
        and exists (
          select 1
          from public.profile_skills ps
          join public.skills s on s.id = ps.skill_id
          where ps.user_id = check_user_id
            and ps.direction = 'looking_for'::public.skill_direction
            and s.is_active
        )
        and exists (
          select 1
          from public.profile_interests pi
          join public.interests i on i.id = pi.interest_id
          where pi.user_id = check_user_id
            and i.is_active
        )
        and exists (
          select 1
          from public.profile_collaboration_goals pcg
          join public.collaboration_goals cg on cg.id = pcg.collaboration_goal_id
          where pcg.user_id = check_user_id
            and cg.is_active
        )
    ),
    false
  );
$$;

create or replace function private.is_active_onboarded(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles p
      where p.user_id = check_user_id
        and p.profile_status = 'active'::public.profile_status
        and p.deleted_at is null
        and p.onboarding_completed_at is not null
        and private.has_complete_onboarding_data(check_user_id)
    ),
    false
  );
$$;

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

  if not private.has_complete_onboarding_data(caller_id) then
    raise exception 'Onboarding requires a complete active profile.'
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

create or replace function public.get_current_account_state()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  profile_record record;
begin
  if caller_id is null then
    raise exception 'Authentication required to read account state.'
      using errcode = '42501';
  end if;

  select p.profile_status, p.deleted_at
    into profile_record
  from public.profiles p
  where p.user_id = caller_id;

  if not found then
    return 'onboarding_incomplete';
  end if;

  if profile_record.profile_status = 'suspended'::public.profile_status then
    return 'suspended';
  end if;

  if profile_record.profile_status = 'deleted'::public.profile_status
    or profile_record.deleted_at is not null
  then
    return 'deleted';
  end if;

  if private.is_active_onboarded(caller_id) then
    return 'active';
  end if;

  return 'onboarding_incomplete';
end;
$$;

revoke execute on function private.has_complete_onboarding_data(uuid)
  from public, anon, authenticated;
revoke execute on function public.get_current_account_state()
  from public, anon;
grant execute on function public.get_current_account_state() to authenticated;

grant select, insert, delete on public.profile_skills
  to service_role;
grant select, insert, delete on public.profile_interests
  to service_role;
grant select, insert, delete on public.profile_collaboration_goals
  to service_role;
grant select on public.product_events
  to service_role;

comment on function private.has_complete_onboarding_data(uuid) is
  'Central onboarding completeness predicate. Checks the current required Phase 4 profile, taxonomy, and relation data without relying on onboarding_completed_at.';

comment on function private.is_active_onboarded(uuid) is
  'Effective onboarded eligibility. Requires active profile status, original completion timestamp, and live complete onboarding data.';

comment on function public.complete_onboarding() is
  'Database-enforced onboarding completion gate. Reuses private.has_complete_onboarding_data before setting onboarding_completed_at idempotently.';

comment on function public.get_current_account_state() is
  'Returns the authenticated user account routing state using database-enforced effective onboarding eligibility.';
