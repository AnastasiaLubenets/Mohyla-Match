begin;

drop function if exists public.update_my_profile(
  text,
  bigint,
  bigint,
  integer,
  text,
  text,
  bigint[],
  bigint[],
  bigint[],
  bigint[]
);

drop function if exists public.update_my_profile(
  text,
  bigint,
  bigint,
  integer,
  text,
  text,
  bigint[],
  bigint[],
  bigint[],
  bigint[],
  boolean
);

create or replace function public.update_my_profile(
  profile_full_name text,
  profile_faculty_id bigint,
  profile_academic_program_id bigint,
  profile_year_of_study integer,
  profile_bio text,
  profile_availability text,
  offer_skill_ids bigint[],
  looking_for_skill_ids bigint[],
  interest_ids bigint[],
  collaboration_goal_ids bigint[],
  profile_allow_direct_contact boolean
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_full_name text := nullif(btrim(profile_full_name), '');
  normalized_bio text := nullif(btrim(coalesce(profile_bio, '')), '');
  normalized_availability text := nullif(btrim(coalesce(profile_availability, '')), '');
  normalized_offer_skill_ids bigint[];
  normalized_looking_for_skill_ids bigint[];
  normalized_interest_ids bigint[];
  normalized_goal_ids bigint[];
  existing_completed_at timestamptz;
  active_count integer;
  affected_count integer;
begin
  if caller_id is null then
    raise exception 'Authentication required to update profile.'
      using errcode = '42501';
  end if;

  select coalesce(array_agg(distinct raw_id order by raw_id), '{}'::bigint[])
    into normalized_offer_skill_ids
  from unnest(coalesce(offer_skill_ids, '{}'::bigint[])) as input(raw_id)
  where raw_id > 0;

  select coalesce(array_agg(distinct raw_id order by raw_id), '{}'::bigint[])
    into normalized_looking_for_skill_ids
  from unnest(coalesce(looking_for_skill_ids, '{}'::bigint[])) as input(raw_id)
  where raw_id > 0;

  select coalesce(array_agg(distinct raw_id order by raw_id), '{}'::bigint[])
    into normalized_interest_ids
  from unnest(coalesce(interest_ids, '{}'::bigint[])) as input(raw_id)
  where raw_id > 0;

  select coalesce(array_agg(distinct raw_id order by raw_id), '{}'::bigint[])
    into normalized_goal_ids
  from unnest(coalesce(collaboration_goal_ids, '{}'::bigint[])) as input(raw_id)
  where raw_id > 0;

  if normalized_full_name is null
    or char_length(normalized_full_name) < 2
    or char_length(normalized_full_name) > 120
  then
    raise exception 'Full name must be 2-120 characters.'
      using errcode = 'P0001';
  end if;

  if profile_year_of_study is null
    or profile_year_of_study < 1
    or profile_year_of_study > 6
  then
    raise exception 'Year of study must be between 1 and 6.'
      using errcode = 'P0001';
  end if;

  if normalized_bio is not null and char_length(normalized_bio) > 500 then
    raise exception 'Bio is limited to 500 characters.'
      using errcode = 'P0001';
  end if;

  if normalized_availability is not null and char_length(normalized_availability) > 160 then
    raise exception 'Availability is limited to 160 characters.'
      using errcode = 'P0001';
  end if;

  if cardinality(normalized_offer_skill_ids) < 1 then
    raise exception 'At least one offered skill is required.'
      using errcode = 'P0001';
  end if;

  if cardinality(normalized_interest_ids) < 1 then
    raise exception 'At least one interest is required.'
      using errcode = 'P0001';
  end if;

  if cardinality(normalized_goal_ids) < 1 then
    raise exception 'At least one collaboration goal is required.'
      using errcode = 'P0001';
  end if;

  select p.onboarding_completed_at
    into existing_completed_at
  from public.profiles p
  where p.user_id = caller_id
    and p.profile_status = 'active'::public.profile_status
    and p.deleted_at is null;

  if existing_completed_at is null then
    raise exception 'Only completed active profiles can be edited.'
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.faculties f
    join public.academic_programs ap on ap.faculty_id = f.id
    where f.id = profile_faculty_id
      and ap.id = profile_academic_program_id
      and f.is_active
      and ap.is_active
  ) then
    raise exception 'Choose an active program from the selected faculty.'
      using errcode = 'P0001';
  end if;

  select count(*)::integer
    into active_count
  from public.skills s
  where s.id = any(normalized_offer_skill_ids)
    and s.is_active;

  if active_count <> cardinality(normalized_offer_skill_ids) then
    raise exception 'Offered skills must be active.'
      using errcode = 'P0001';
  end if;

  select count(*)::integer
    into active_count
  from public.skills s
  where s.id = any(normalized_looking_for_skill_ids)
    and s.is_active;

  if active_count <> cardinality(normalized_looking_for_skill_ids) then
    raise exception 'Looking-for skills must be active.'
      using errcode = 'P0001';
  end if;

  select count(*)::integer
    into active_count
  from public.interests i
  where i.id = any(normalized_interest_ids)
    and i.is_active;

  if active_count <> cardinality(normalized_interest_ids) then
    raise exception 'Interests must be active.'
      using errcode = 'P0001';
  end if;

  select count(*)::integer
    into active_count
  from public.collaboration_goals cg
  where cg.id = any(normalized_goal_ids)
    and cg.is_active;

  if active_count <> cardinality(normalized_goal_ids) then
    raise exception 'Collaboration goals must be active.'
      using errcode = 'P0001';
  end if;

  update public.profiles
  set full_name = normalized_full_name,
      faculty_id = profile_faculty_id,
      academic_program_id = profile_academic_program_id,
      year_of_study = profile_year_of_study,
      bio = normalized_bio,
      availability = normalized_availability,
      allow_direct_contact = coalesce(profile_allow_direct_contact, false),
      updated_at = now()
  where user_id = caller_id
    and profile_status = 'active'::public.profile_status
    and deleted_at is null
    and onboarding_completed_at = existing_completed_at;

  get diagnostics affected_count = row_count;
  if affected_count <> 1 then
    raise exception 'Profile update was not authorized.'
      using errcode = '42501';
  end if;

  delete from public.profile_skills
  where user_id = caller_id
    and direction in (
      'offer'::public.skill_direction,
      'looking_for'::public.skill_direction
    );

  insert into public.profile_skills (user_id, skill_id, direction)
  select caller_id, skill_id, 'offer'::public.skill_direction
  from unnest(normalized_offer_skill_ids) as offered(skill_id);

  insert into public.profile_skills (user_id, skill_id, direction)
  select caller_id, skill_id, 'looking_for'::public.skill_direction
  from unnest(normalized_looking_for_skill_ids) as wanted(skill_id);

  delete from public.profile_interests
  where user_id = caller_id;

  insert into public.profile_interests (user_id, interest_id)
  select caller_id, interest_id
  from unnest(normalized_interest_ids) as selected_interests(interest_id);

  delete from public.profile_collaboration_goals
  where user_id = caller_id;

  insert into public.profile_collaboration_goals (user_id, collaboration_goal_id)
  select caller_id, collaboration_goal_id
  from unnest(normalized_goal_ids) as selected_goals(collaboration_goal_id);
end;
$$;

revoke execute on function public.update_my_profile(
  text,
  bigint,
  bigint,
  integer,
  text,
  text,
  bigint[],
  bigint[],
  bigint[],
  bigint[],
  boolean
) from public, anon;

grant execute on function public.update_my_profile(
  text,
  bigint,
  bigint,
  integer,
  text,
  text,
  bigint[],
  bigint[],
  bigint[],
  bigint[],
  boolean
) to authenticated;

comment on function public.update_my_profile(
  text,
  bigint,
  bigint,
  integer,
  text,
  text,
  bigint[],
  bigint[],
  bigint[],
  bigint[],
  boolean
) is
  'Atomically updates the authenticated user''s completed active profile, direct-contact preference, and profile taxonomy relations. Looking-for skills are optional; the explicit direct-contact argument avoids overload ambiguity with the legacy compatibility wrapper.';

create function public.update_my_profile(
  profile_full_name text,
  profile_faculty_id bigint,
  profile_academic_program_id bigint,
  profile_year_of_study integer,
  profile_bio text,
  profile_availability text,
  offer_skill_ids bigint[],
  looking_for_skill_ids bigint[],
  interest_ids bigint[],
  collaboration_goal_ids bigint[]
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select public.update_my_profile(
    profile_full_name,
    profile_faculty_id,
    profile_academic_program_id,
    profile_year_of_study,
    profile_bio,
    profile_availability,
    offer_skill_ids,
    looking_for_skill_ids,
    interest_ids,
    collaboration_goal_ids,
    true
  );
$$;

revoke execute on function public.update_my_profile(
  text,
  bigint,
  bigint,
  integer,
  text,
  text,
  bigint[],
  bigint[],
  bigint[],
  bigint[]
) from public, anon;

grant execute on function public.update_my_profile(
  text,
  bigint,
  bigint,
  integer,
  text,
  text,
  bigint[],
  bigint[],
  bigint[],
  bigint[]
) to authenticated;

comment on function public.update_my_profile(
  text,
  bigint,
  bigint,
  integer,
  text,
  text,
  bigint[],
  bigint[],
  bigint[],
  bigint[]
) is
  'Backward-compatible profile edit RPC signature. Delegates to the direct-contact-aware profile update and keeps the default direct-contact preference enabled.';

commit;
