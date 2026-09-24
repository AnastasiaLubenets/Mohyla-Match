create or replace function public.get_all_discovery_profiles(profile_limit integer default null)
returns table (
  user_id uuid,
  full_name text,
  faculty_name text,
  academic_program_name text,
  year_of_study integer,
  bio text,
  availability text,
  system_avatar_key text,
  compatibility_score integer,
  score_breakdown jsonb,
  offered_skills jsonb,
  looking_for_skills jsonb,
  interests jsonb,
  collaboration_goals jsonb,
  matched_they_offer jsonb,
  matched_i_offer jsonb,
  shared_interests jsonb,
  shared_collaboration_goals jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with caller as (
    select p.user_id
    from public.profiles p
    where p.user_id = auth.uid()
      and private.is_active_onboarded(p.user_id)
  ),
  visible_profiles as (
    select
      p.user_id,
      p.full_name,
      f.display_name as faculty_name,
      ap.display_name as academic_program_name,
      p.year_of_study::integer as year_of_study,
      p.bio,
      p.availability,
      p.system_avatar_key
    from caller c
    join public.profiles p on p.user_id <> c.user_id
    join public.faculties f on f.id = p.faculty_id and f.is_active
    join public.academic_programs ap
      on ap.id = p.academic_program_id
      and ap.faculty_id = p.faculty_id
      and ap.is_active
    where private.is_active_onboarded(p.user_id)
      and not private.has_block_between(c.user_id, p.user_id)
  )
  select
    vp.user_id,
    vp.full_name,
    vp.faculty_name,
    vp.academic_program_name,
    vp.year_of_study,
    vp.bio,
    vp.availability,
    vp.system_avatar_key,
    0 as compatibility_score,
    jsonb_build_object('source', 'all_students') as score_breakdown,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'slug', s.slug,
            'name', s.name,
            'category', s.category
          )
          order by s.sort_order, s.name
        ),
        '[]'::jsonb
      )
      from public.profile_skills ps
      join public.skills s on s.id = ps.skill_id
      where ps.user_id = vp.user_id
        and ps.direction = 'offer'::public.skill_direction
        and s.is_active
    ) as offered_skills,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'slug', s.slug,
            'name', s.name,
            'category', s.category
          )
          order by s.sort_order, s.name
        ),
        '[]'::jsonb
      )
      from public.profile_skills ps
      join public.skills s on s.id = ps.skill_id
      where ps.user_id = vp.user_id
        and ps.direction = 'looking_for'::public.skill_direction
        and s.is_active
    ) as looking_for_skills,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id', interest.id, 'slug', interest.slug, 'name', interest.name)
          order by interest.sort_order, interest.name
        ),
        '[]'::jsonb
      )
      from public.profile_interests pi
      join public.interests interest on interest.id = pi.interest_id
      where pi.user_id = vp.user_id
        and interest.is_active
    ) as interests,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id', goal.id, 'slug', goal.slug, 'name', goal.name)
          order by goal.sort_order, goal.name
        ),
        '[]'::jsonb
      )
      from public.profile_collaboration_goals pcg
      join public.collaboration_goals goal on goal.id = pcg.collaboration_goal_id
      where pcg.user_id = vp.user_id
        and goal.is_active
    ) as collaboration_goals,
    '[]'::jsonb as matched_they_offer,
    '[]'::jsonb as matched_i_offer,
    '[]'::jsonb as shared_interests,
    '[]'::jsonb as shared_collaboration_goals
  from visible_profiles vp
  order by vp.full_name asc, vp.user_id asc
  limit case
    when profile_limit is null then null
    else least(greatest(profile_limit, 1), 500)
  end;
$$;

revoke execute on function public.get_all_discovery_profiles(integer)
  from public;
revoke execute on function public.get_all_discovery_profiles(integer)
  from anon;
grant execute on function public.get_all_discovery_profiles(integer)
  to authenticated;

comment on function public.get_all_discovery_profiles(integer) is
  'Returns safe directory profile summaries for authenticated active users. Results exclude emails, the caller, blocked relationships, and inactive or incomplete profiles, but intentionally include skipped and saved profiles.';
