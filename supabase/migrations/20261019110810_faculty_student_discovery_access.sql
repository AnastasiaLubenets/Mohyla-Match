begin;

create or replace function private.has_block_between(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.blocks b
      where (b.blocker_user_id = user_a and b.blocked_user_id = user_b)
         or (b.blocker_user_id = user_b and b.blocked_user_id = user_a)
    ),
    false
  );
$$;

comment on function private.has_block_between(uuid, uuid) is
  'Enforces admin- or service-created safety blocks. Blocking remains unavailable as a user-facing action.';

create or replace function private.can_interact(target_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null or caller_id = target_user_id then
    return false;
  end if;

  return private.is_active_onboarded(caller_id)
    and private.is_active_onboarded_student(target_user_id)
    and not private.has_block_between(caller_id, target_user_id);
end;
$$;

comment on function private.can_interact(uuid) is
  'Allows active onboarded Student or Faculty callers to interact with eligible Student profiles.';

create or replace function private.can_reveal_direct_contact(target_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null or target_user_id is null or caller_id = target_user_id then
    return false;
  end if;

  return private.is_active_onboarded(caller_id)
    and private.is_active_onboarded_student(target_user_id)
    and not private.has_block_between(caller_id, target_user_id)
    and exists (
      select 1
      from public.profiles p
      where p.user_id = target_user_id
        and p.account_role = 'student'::public.account_role
        and p.profile_status = 'active'::public.profile_status
        and p.deleted_at is null
        and p.allow_direct_contact
    )
    and exists (
      select 1
      from auth.users u
      where u.id = target_user_id
        and u.email_confirmed_at is not null
    );
end;
$$;

comment on function private.can_reveal_direct_contact(uuid) is
  'Allows active onboarded Student or Faculty callers to reveal an eligible opted-in Student email.';

create or replace function public.get_profile_connection_status(target_user_id uuid)
returns table (
  outgoing_action public.interaction_action,
  is_matched boolean,
  match_id uuid,
  blocked_by_me boolean,
  can_direct_contact boolean
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
  requested_target as (
    select $1 as user_id
  )
  select
    (
      select i.action
      from public.interactions i
      where i.source_user_id = c.user_id
        and i.target_user_id = rt.user_id
    ) as outgoing_action,
    private.active_match_id(c.user_id, rt.user_id) is not null as is_matched,
    private.active_match_id(c.user_id, rt.user_id) as match_id,
    false as blocked_by_me,
    private.can_reveal_direct_contact(rt.user_id) as can_direct_contact
  from caller c
  cross join requested_target rt
  where rt.user_id <> c.user_id
    and private.is_active_onboarded_student(rt.user_id)
    and not private.has_block_between(c.user_id, rt.user_id);
$$;

comment on function public.get_profile_connection_status(uuid) is
  'Returns an active Student or Faculty caller relationship state for an eligible Student profile.';

create or replace function public.get_saved_profiles(saved_limit integer default 50)
returns table (
  saved_at timestamptz,
  user_id uuid,
  full_name text,
  faculty_name text,
  academic_program_name text,
  year_of_study integer,
  bio text,
  availability text,
  system_avatar_key text,
  can_direct_contact boolean,
  offered_skills jsonb,
  looking_for_skills jsonb,
  interests jsonb,
  collaboration_goals jsonb
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
  )
  select
    i.updated_at as saved_at,
    p.user_id,
    p.full_name,
    f.display_name as faculty_name,
    ap.display_name as academic_program_name,
    p.year_of_study::integer as year_of_study,
    p.bio,
    p.availability,
    p.system_avatar_key,
    private.can_reveal_direct_contact(p.user_id) as can_direct_contact,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id', s.id, 'slug', s.slug, 'name', s.name, 'category', s.category)
          order by s.sort_order, s.name
        ),
        '[]'::jsonb
      )
      from public.profile_skills ps
      join public.skills s on s.id = ps.skill_id
      where ps.user_id = p.user_id
        and ps.direction = 'offer'::public.skill_direction
        and s.is_active
    ) as offered_skills,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id', s.id, 'slug', s.slug, 'name', s.name, 'category', s.category)
          order by s.sort_order, s.name
        ),
        '[]'::jsonb
      )
      from public.profile_skills ps
      join public.skills s on s.id = ps.skill_id
      where ps.user_id = p.user_id
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
      where pi.user_id = p.user_id
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
      where pcg.user_id = p.user_id
        and goal.is_active
    ) as collaboration_goals
  from caller c
  join public.interactions i
    on i.source_user_id = c.user_id
    and i.action = 'save'::public.interaction_action
  join public.profiles p on p.user_id = i.target_user_id
  join public.faculties f on f.id = p.faculty_id and f.is_active
  join public.academic_programs ap
    on ap.id = p.academic_program_id
    and ap.faculty_id = p.faculty_id
    and ap.is_active
  where private.is_active_onboarded_student(p.user_id)
    and not private.has_block_between(c.user_id, p.user_id)
  order by i.updated_at desc, p.full_name asc, p.user_id asc
  limit least(greatest(coalesce(saved_limit, 50), 1), 100);
$$;

comment on function public.get_saved_profiles(integer) is
  'Returns eligible Student profiles saved by an active Student or Faculty caller.';

create or replace function public.get_discovery_candidates(candidate_limit integer default 12)
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
    select p.user_id, p.availability
    from public.profiles p
    where p.user_id = auth.uid()
      and private.is_active_onboarded(p.user_id)
  ),
  active_config as (
    select mc.*
    from public.matching_config mc
    where mc.is_active
    order by mc.version desc
    limit 1
  ),
  caller_sets as (
    select
      c.user_id,
      c.availability,
      array(
        select ps.skill_id
        from public.profile_skills ps
        join public.skills s on s.id = ps.skill_id
        where ps.user_id = c.user_id
          and ps.direction = 'offer'::public.skill_direction
          and s.is_active
        order by s.sort_order, s.name
      ) as offer_skill_ids,
      array(
        select ps.skill_id
        from public.profile_skills ps
        join public.skills s on s.id = ps.skill_id
        where ps.user_id = c.user_id
          and ps.direction = 'looking_for'::public.skill_direction
          and s.is_active
        order by s.sort_order, s.name
      ) as looking_for_skill_ids,
      array(
        select pi.interest_id
        from public.profile_interests pi
        join public.interests i on i.id = pi.interest_id
        where pi.user_id = c.user_id
          and i.is_active
        order by i.sort_order, i.name
      ) as interest_ids,
      array(
        select pcg.collaboration_goal_id
        from public.profile_collaboration_goals pcg
        join public.collaboration_goals cg on cg.id = pcg.collaboration_goal_id
        where pcg.user_id = c.user_id
          and cg.is_active
        order by cg.sort_order, cg.name
      ) as collaboration_goal_ids
    from caller c
  ),
  candidate_profiles as (
    select
      p.user_id,
      p.full_name,
      f.display_name as faculty_name,
      ap.display_name as academic_program_name,
      p.year_of_study::integer as year_of_study,
      p.bio,
      p.availability,
      p.system_avatar_key
    from caller_sets cs
    join public.profiles p on p.user_id <> cs.user_id
    join public.faculties f on f.id = p.faculty_id and f.is_active
    join public.academic_programs ap
      on ap.id = p.academic_program_id
      and ap.faculty_id = p.faculty_id
      and ap.is_active
    where p.account_role = 'student'::public.account_role
      and private.is_active_onboarded(p.user_id)
      and not private.has_block_between(cs.user_id, p.user_id)
      and private.active_match_id(cs.user_id, p.user_id) is null
      and not exists (
        select 1
        from public.interactions existing
        where existing.source_user_id = cs.user_id
          and existing.target_user_id = p.user_id
      )
  ),
  candidate_sets as (
    select
      cp.*,
      array(
        select ps.skill_id
        from public.profile_skills ps
        join public.skills s on s.id = ps.skill_id
        where ps.user_id = cp.user_id
          and ps.direction = 'offer'::public.skill_direction
          and s.is_active
        order by s.sort_order, s.name
      ) as offer_skill_ids,
      array(
        select ps.skill_id
        from public.profile_skills ps
        join public.skills s on s.id = ps.skill_id
        where ps.user_id = cp.user_id
          and ps.direction = 'looking_for'::public.skill_direction
          and s.is_active
        order by s.sort_order, s.name
      ) as looking_for_skill_ids,
      array(
        select pi.interest_id
        from public.profile_interests pi
        join public.interests i on i.id = pi.interest_id
        where pi.user_id = cp.user_id
          and i.is_active
        order by i.sort_order, i.name
      ) as interest_ids,
      array(
        select pcg.collaboration_goal_id
        from public.profile_collaboration_goals pcg
        join public.collaboration_goals cg on cg.id = pcg.collaboration_goal_id
        where pcg.user_id = cp.user_id
          and cg.is_active
        order by cg.sort_order, cg.name
      ) as collaboration_goal_ids
    from candidate_profiles cp
  ),
  score_counts as (
    select
      c.*,
      cs.user_id as caller_id,
      cs.availability as caller_availability,
      cs.offer_skill_ids as caller_offer_skill_ids,
      cs.looking_for_skill_ids as caller_looking_for_skill_ids,
      cs.interest_ids as caller_interest_ids,
      cs.collaboration_goal_ids as caller_collaboration_goal_ids,
      ac.version as config_version,
      ac.my_looking_for_their_offer_weight,
      ac.their_looking_for_my_offer_weight,
      ac.common_interests_weight,
      ac.collaboration_goals_weight,
      ac.availability_weight,
      cardinality(cs.looking_for_skill_ids)::numeric as my_looking_for_count,
      cardinality(c.looking_for_skill_ids)::numeric as their_looking_for_count,
      (
        select count(*)::numeric
        from unnest(cs.looking_for_skill_ids) desired(skill_id)
        where desired.skill_id = any(c.offer_skill_ids)
      ) as my_looking_for_matches,
      (
        select count(*)::numeric
        from unnest(c.looking_for_skill_ids) desired(skill_id)
        where desired.skill_id = any(cs.offer_skill_ids)
      ) as their_looking_for_matches,
      (
        select count(*)::numeric
        from unnest(cs.interest_ids) mine(interest_id)
        where mine.interest_id = any(c.interest_ids)
      ) as shared_interest_count,
      (
        select count(*)::numeric
        from (
          select unnest(cs.interest_ids) as interest_id
          union
          select unnest(c.interest_ids) as interest_id
        ) unioned_interests
      ) as interest_union_count,
      (
        select count(*)::numeric
        from unnest(cs.collaboration_goal_ids) mine(collaboration_goal_id)
        where mine.collaboration_goal_id = any(c.collaboration_goal_ids)
      ) as shared_goal_count,
      (
        select count(*)::numeric
        from (
          select unnest(cs.collaboration_goal_ids) as collaboration_goal_id
          union
          select unnest(c.collaboration_goal_ids) as collaboration_goal_id
        ) unioned_goals
      ) as goal_union_count
    from candidate_sets c
    cross join caller_sets cs
    cross join active_config ac
  ),
  scored as (
    select
      sc.*,
      case
        when sc.my_looking_for_count = 0 then null
        else sc.my_looking_for_matches / sc.my_looking_for_count
      end as my_looking_for_ratio,
      case
        when sc.their_looking_for_count = 0 then null
        else sc.their_looking_for_matches / sc.their_looking_for_count
      end as their_looking_for_ratio,
      case
        when sc.interest_union_count = 0 then null
        else sc.shared_interest_count / sc.interest_union_count
      end as shared_interest_ratio,
      case
        when sc.goal_union_count = 0 then null
        else sc.shared_goal_count / sc.goal_union_count
      end as shared_goal_ratio,
      case
        when sc.availability_weight = 0 then null
        when nullif(btrim(coalesce(sc.caller_availability, '')), '') is null
          or nullif(btrim(coalesce(sc.availability, '')), '') is null
        then null
        when lower(btrim(sc.caller_availability)) = lower(btrim(sc.availability)) then 1::numeric
        else 0::numeric
      end as availability_ratio
    from score_counts sc
  ),
  final_scores as (
    select
      s.*,
      (
        case when s.my_looking_for_ratio is null or s.my_looking_for_their_offer_weight = 0 then 0 else s.my_looking_for_their_offer_weight end
        + case when s.their_looking_for_ratio is null or s.their_looking_for_my_offer_weight = 0 then 0 else s.their_looking_for_my_offer_weight end
        + case when s.shared_interest_ratio is null or s.common_interests_weight = 0 then 0 else s.common_interests_weight end
        + case when s.shared_goal_ratio is null or s.collaboration_goals_weight = 0 then 0 else s.collaboration_goals_weight end
        + case when s.availability_ratio is null or s.availability_weight = 0 then 0 else s.availability_weight end
      )::numeric as applicable_weight,
      (
        coalesce(s.my_looking_for_ratio * s.my_looking_for_their_offer_weight, 0)
        + coalesce(s.their_looking_for_ratio * s.their_looking_for_my_offer_weight, 0)
        + coalesce(s.shared_interest_ratio * s.common_interests_weight, 0)
        + coalesce(s.shared_goal_ratio * s.collaboration_goals_weight, 0)
        + coalesce(s.availability_ratio * s.availability_weight, 0)
      )::numeric as weighted_score
    from scored s
  )
  select
    fs.user_id,
    fs.full_name,
    fs.faculty_name,
    fs.academic_program_name,
    fs.year_of_study,
    fs.bio,
    fs.availability,
    fs.system_avatar_key,
    coalesce(round(100 * fs.weighted_score / nullif(fs.applicable_weight, 0))::integer, 0) as compatibility_score,
    jsonb_build_object(
      'configVersion', fs.config_version,
      'weights', jsonb_build_object(
        'myLookingForTheirOffer', fs.my_looking_for_their_offer_weight,
        'theirLookingForMyOffer', fs.their_looking_for_my_offer_weight,
        'commonInterests', fs.common_interests_weight,
        'collaborationGoals', fs.collaboration_goals_weight,
        'availability', fs.availability_weight
      ),
      'counts', jsonb_build_object(
        'myLookingForMatches', fs.my_looking_for_matches,
        'myLookingForTotal', fs.my_looking_for_count,
        'theirLookingForMatches', fs.their_looking_for_matches,
        'theirLookingForTotal', fs.their_looking_for_count,
        'sharedInterests', fs.shared_interest_count,
        'interestUnion', fs.interest_union_count,
        'sharedCollaborationGoals', fs.shared_goal_count,
        'collaborationGoalUnion', fs.goal_union_count
      )
    ) as score_breakdown,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'slug', s.slug, 'name', s.name, 'category', s.category) order by s.sort_order, s.name), '[]'::jsonb)
      from public.profile_skills ps
      join public.skills s on s.id = ps.skill_id
      where ps.user_id = fs.user_id
        and ps.direction = 'offer'::public.skill_direction
        and s.is_active
    ) as offered_skills,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'slug', s.slug, 'name', s.name, 'category', s.category) order by s.sort_order, s.name), '[]'::jsonb)
      from public.profile_skills ps
      join public.skills s on s.id = ps.skill_id
      where ps.user_id = fs.user_id
        and ps.direction = 'looking_for'::public.skill_direction
        and s.is_active
    ) as looking_for_skills,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'slug', i.slug, 'name', i.name) order by i.sort_order, i.name), '[]'::jsonb)
      from public.profile_interests pi
      join public.interests i on i.id = pi.interest_id
      where pi.user_id = fs.user_id
        and i.is_active
    ) as interests,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', cg.id, 'slug', cg.slug, 'name', cg.name) order by cg.sort_order, cg.name), '[]'::jsonb)
      from public.profile_collaboration_goals pcg
      join public.collaboration_goals cg on cg.id = pcg.collaboration_goal_id
      where pcg.user_id = fs.user_id
        and cg.is_active
    ) as collaboration_goals,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'slug', s.slug, 'name', s.name, 'category', s.category) order by s.sort_order, s.name), '[]'::jsonb)
      from public.skills s
      where s.id = any(fs.caller_looking_for_skill_ids)
        and s.id = any(fs.offer_skill_ids)
        and s.is_active
    ) as matched_they_offer,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'slug', s.slug, 'name', s.name, 'category', s.category) order by s.sort_order, s.name), '[]'::jsonb)
      from public.skills s
      where s.id = any(fs.looking_for_skill_ids)
        and s.id = any(fs.caller_offer_skill_ids)
        and s.is_active
    ) as matched_i_offer,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'slug', i.slug, 'name', i.name) order by i.sort_order, i.name), '[]'::jsonb)
      from public.interests i
      where i.id = any(fs.caller_interest_ids)
        and i.id = any(fs.interest_ids)
        and i.is_active
    ) as shared_interests,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', cg.id, 'slug', cg.slug, 'name', cg.name) order by cg.sort_order, cg.name), '[]'::jsonb)
      from public.collaboration_goals cg
      where cg.id = any(fs.caller_collaboration_goal_ids)
        and cg.id = any(fs.collaboration_goal_ids)
        and cg.is_active
    ) as shared_collaboration_goals
  from final_scores fs
  order by compatibility_score desc, full_name asc, user_id asc
  limit least(greatest(coalesce(candidate_limit, 12), 1), 50);
$$;

comment on function public.get_discovery_candidates(integer) is
  'Returns ranked eligible Student profiles for an active Student or Faculty caller.';

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
    where p.account_role = 'student'::public.account_role
      and private.is_active_onboarded(p.user_id)
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
      select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'slug', s.slug, 'name', s.name, 'category', s.category) order by s.sort_order, s.name), '[]'::jsonb)
      from public.profile_skills ps
      join public.skills s on s.id = ps.skill_id
      where ps.user_id = vp.user_id
        and ps.direction = 'offer'::public.skill_direction
        and s.is_active
    ) as offered_skills,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'slug', s.slug, 'name', s.name, 'category', s.category) order by s.sort_order, s.name), '[]'::jsonb)
      from public.profile_skills ps
      join public.skills s on s.id = ps.skill_id
      where ps.user_id = vp.user_id
        and ps.direction = 'looking_for'::public.skill_direction
        and s.is_active
    ) as looking_for_skills,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', interest.id, 'slug', interest.slug, 'name', interest.name) order by interest.sort_order, interest.name), '[]'::jsonb)
      from public.profile_interests pi
      join public.interests interest on interest.id = pi.interest_id
      where pi.user_id = vp.user_id
        and interest.is_active
    ) as interests,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', goal.id, 'slug', goal.slug, 'name', goal.name) order by goal.sort_order, goal.name), '[]'::jsonb)
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

comment on function public.get_all_discovery_profiles(integer) is
  'Returns eligible Student directory profiles for an active Student or Faculty caller.';

commit;
