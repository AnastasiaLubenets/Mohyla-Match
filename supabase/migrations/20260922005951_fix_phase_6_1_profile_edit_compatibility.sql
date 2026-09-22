begin;

grant update (allow_direct_contact) on public.profiles to authenticated;

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
