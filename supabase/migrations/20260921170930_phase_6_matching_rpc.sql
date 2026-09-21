begin;

update public.matching_config
set is_active = false,
    updated_at = now()
where version <> 1
  and is_active;

insert into public.matching_config (
  version,
  is_active,
  my_looking_for_their_offer_weight,
  their_looking_for_my_offer_weight,
  common_interests_weight,
  collaboration_goals_weight,
  availability_weight
)
values (1, true, 40, 30, 15, 15, 0)
on conflict (version) do update
set is_active = excluded.is_active,
    my_looking_for_their_offer_weight = excluded.my_looking_for_their_offer_weight,
    their_looking_for_my_offer_weight = excluded.their_looking_for_my_offer_weight,
    common_interests_weight = excluded.common_interests_weight,
    collaboration_goals_weight = excluded.collaboration_goals_weight,
    availability_weight = excluded.availability_weight,
    updated_at = now();

create or replace function private.active_match_id(user_a uuid, user_b uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.id
  from public.matches m
  where m.user_low = least(user_a, user_b)
    and m.user_high = greatest(user_a, user_b)
    and m.status = 'active'::public.match_status
  limit 1;
$$;

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
    where private.is_active_onboarded(p.user_id)
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
      where ps.user_id = fs.user_id
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
      where ps.user_id = fs.user_id
        and ps.direction = 'looking_for'::public.skill_direction
        and s.is_active
    ) as looking_for_skills,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id', i.id, 'slug', i.slug, 'name', i.name)
          order by i.sort_order, i.name
        ),
        '[]'::jsonb
      )
      from public.profile_interests pi
      join public.interests i on i.id = pi.interest_id
      where pi.user_id = fs.user_id
        and i.is_active
    ) as interests,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id', cg.id, 'slug', cg.slug, 'name', cg.name)
          order by cg.sort_order, cg.name
        ),
        '[]'::jsonb
      )
      from public.profile_collaboration_goals pcg
      join public.collaboration_goals cg on cg.id = pcg.collaboration_goal_id
      where pcg.user_id = fs.user_id
        and cg.is_active
    ) as collaboration_goals,
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
      from public.skills s
      where s.id = any(fs.caller_looking_for_skill_ids)
        and s.id = any(fs.offer_skill_ids)
        and s.is_active
    ) as matched_they_offer,
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
      from public.skills s
      where s.id = any(fs.looking_for_skill_ids)
        and s.id = any(fs.caller_offer_skill_ids)
        and s.is_active
    ) as matched_i_offer,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id', i.id, 'slug', i.slug, 'name', i.name)
          order by i.sort_order, i.name
        ),
        '[]'::jsonb
      )
      from public.interests i
      where i.id = any(fs.caller_interest_ids)
        and i.id = any(fs.interest_ids)
        and i.is_active
    ) as shared_interests,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id', cg.id, 'slug', cg.slug, 'name', cg.name)
          order by cg.sort_order, cg.name
        ),
        '[]'::jsonb
      )
      from public.collaboration_goals cg
      where cg.id = any(fs.caller_collaboration_goal_ids)
        and cg.id = any(fs.collaboration_goal_ids)
        and cg.is_active
    ) as shared_collaboration_goals
  from final_scores fs
  order by compatibility_score desc, full_name asc, user_id asc
  limit least(greatest(coalesce(candidate_limit, 12), 1), 50);
$$;

create or replace function public.set_discovery_action(
  target_user_id uuid,
  requested_action public.interaction_action
)
returns table (
  action public.interaction_action,
  matched boolean,
  match_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  current_match_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication required to use discovery.'
      using errcode = '42501';
  end if;

  if requested_action not in (
    'connect'::public.interaction_action,
    'save'::public.interaction_action,
    'skip'::public.interaction_action
  ) then
    raise exception 'Unsupported discovery action.'
      using errcode = 'P0001';
  end if;

  if target_user_id is null or target_user_id = caller_id then
    raise exception 'Choose another active profile.'
      using errcode = 'P0001';
  end if;

  if not private.can_interact(target_user_id) then
    raise exception 'This profile is not available for discovery.'
      using errcode = '42501';
  end if;

  insert into public.interactions (source_user_id, target_user_id, action)
  values (caller_id, target_user_id, requested_action)
  on conflict on constraint interactions_pkey do update
  set action = excluded.action,
      updated_at = now();

  current_match_id := private.active_match_id(caller_id, target_user_id);

  insert into public.product_events (user_id, subject_user_id, match_id, event_name, metadata)
  values (
    caller_id,
    target_user_id,
    current_match_id,
    ('discover_action_' || requested_action::text),
    jsonb_build_object('source', 'phase_6_discovery')
  );

  return query
  select requested_action, current_match_id is not null, current_match_id;
end;
$$;

create or replace function public.get_my_matches(match_limit integer default 50)
returns table (
  match_id uuid,
  matched_at timestamptz,
  user_id uuid,
  full_name text,
  faculty_name text,
  academic_program_name text,
  year_of_study integer,
  bio text,
  availability text,
  system_avatar_key text,
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
  ),
  visible_matches as (
    select
      m.id as match_id,
      m.created_at as matched_at,
      case when m.user_low = c.user_id then m.user_high else m.user_low end as other_user_id
    from caller c
    join public.matches m
      on (m.user_low = c.user_id or m.user_high = c.user_id)
      and m.status = 'active'::public.match_status
    where not private.has_block_between(m.user_low, m.user_high)
  )
  select
    vm.match_id,
    vm.matched_at,
    p.user_id,
    p.full_name,
    f.display_name as faculty_name,
    ap.display_name as academic_program_name,
    p.year_of_study::integer as year_of_study,
    p.bio,
    p.availability,
    p.system_avatar_key,
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
      where ps.user_id = p.user_id
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
      where ps.user_id = p.user_id
        and ps.direction = 'looking_for'::public.skill_direction
        and s.is_active
    ) as looking_for_skills,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id', i.id, 'slug', i.slug, 'name', i.name)
          order by i.sort_order, i.name
        ),
        '[]'::jsonb
      )
      from public.profile_interests pi
      join public.interests i on i.id = pi.interest_id
      where pi.user_id = p.user_id
        and i.is_active
    ) as interests,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id', cg.id, 'slug', cg.slug, 'name', cg.name)
          order by cg.sort_order, cg.name
        ),
        '[]'::jsonb
      )
      from public.profile_collaboration_goals pcg
      join public.collaboration_goals cg on cg.id = pcg.collaboration_goal_id
      where pcg.user_id = p.user_id
        and cg.is_active
    ) as collaboration_goals
  from visible_matches vm
  join public.profiles p on p.user_id = vm.other_user_id
  join public.faculties f on f.id = p.faculty_id and f.is_active
  join public.academic_programs ap
    on ap.id = p.academic_program_id
    and ap.faculty_id = p.faculty_id
    and ap.is_active
  where private.is_active_onboarded(p.user_id)
  order by vm.matched_at desc, p.full_name asc, p.user_id asc
  limit least(greatest(coalesce(match_limit, 50), 1), 100);
$$;

create or replace function public.get_profile_connection_status(target_user_id uuid)
returns table (
  outgoing_action public.interaction_action,
  is_matched boolean,
  match_id uuid,
  blocked_by_me boolean
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
    (
      select i.action
      from public.interactions i
      where i.source_user_id = c.user_id
        and i.target_user_id = target_user_id
    ) as outgoing_action,
    private.active_match_id(c.user_id, target_user_id) is not null as is_matched,
    private.active_match_id(c.user_id, target_user_id) as match_id,
    exists (
      select 1
      from public.blocks b
      where b.blocker_user_id = c.user_id
        and b.blocked_user_id = target_user_id
    ) as blocked_by_me
  from caller c
  where target_user_id <> c.user_id
    and exists (
      select 1
      from public.profiles p
      where p.user_id = target_user_id
        and p.profile_status = 'active'::public.profile_status
        and p.deleted_at is null
    );
$$;

create or replace function public.block_user(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'Authentication required to block a profile.'
      using errcode = '42501';
  end if;

  if target_user_id is null or target_user_id = caller_id then
    raise exception 'Choose another profile to block.'
      using errcode = 'P0001';
  end if;

  if not private.is_active_onboarded(caller_id) then
    raise exception 'Only active profiles can block profiles.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.user_id = target_user_id
      and p.profile_status = 'active'::public.profile_status
      and p.deleted_at is null
  ) then
    raise exception 'This profile is not available.'
      using errcode = 'P0001';
  end if;

  insert into public.blocks (blocker_user_id, blocked_user_id)
  values (caller_id, target_user_id)
  on conflict (blocker_user_id, blocked_user_id) do nothing;

  return true;
end;
$$;

create or replace function public.report_user(
  target_user_id uuid,
  reason_code text,
  details text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_reason text := lower(btrim(coalesce(reason_code, '')));
  normalized_details text := nullif(btrim(coalesce(details, '')), '');
  created_report_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication required to report a profile.'
      using errcode = '42501';
  end if;

  if target_user_id is null or target_user_id = caller_id then
    raise exception 'Choose another profile to report.'
      using errcode = 'P0001';
  end if;

  if not private.is_active_onboarded(caller_id) then
    raise exception 'Only active profiles can report profiles.'
      using errcode = '42501';
  end if;

  if normalized_reason not in (
    'spam',
    'harassment',
    'inappropriate-content',
    'fake-profile',
    'safety',
    'other'
  ) then
    raise exception 'Choose a valid report reason.'
      using errcode = 'P0001';
  end if;

  if normalized_details is not null and char_length(normalized_details) > 2000 then
    raise exception 'Report details are too long.'
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.user_id = target_user_id
      and p.profile_status = 'active'::public.profile_status
      and p.deleted_at is null
  ) then
    raise exception 'This profile is not available.'
      using errcode = 'P0001';
  end if;

  insert into public.reports (reporter_user_id, reported_user_id, reason_code, details)
  values (caller_id, target_user_id, normalized_reason, normalized_details)
  returning id into created_report_id;

  insert into public.product_events (user_id, subject_user_id, event_name, metadata)
  values (
    caller_id,
    target_user_id,
    'report_created',
    jsonb_build_object(
      'report_id', created_report_id,
      'reason_code', normalized_reason,
      'source', 'phase_6_profile'
    )
  );

  return created_report_id;
end;
$$;

create or replace function public.log_email_contact_clicked(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  current_match_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication required to reveal contact details.'
      using errcode = '42501';
  end if;

  if not private.can_reveal_contact(target_user_id) then
    raise exception 'Contact details are only available for active mutual matches.'
      using errcode = '42501';
  end if;

  current_match_id := private.active_match_id(caller_id, target_user_id);

  insert into public.product_events (user_id, subject_user_id, match_id, event_name, metadata)
  values (
    caller_id,
    target_user_id,
    current_match_id,
    'email_contact_clicked',
    jsonb_build_object('source', 'phase_6_matches')
  );

  return true;
end;
$$;

revoke execute on function private.active_match_id(uuid, uuid)
  from public, anon, authenticated;

revoke execute on function public.get_discovery_candidates(integer)
  from public, anon, authenticated;
revoke execute on function public.set_discovery_action(uuid, public.interaction_action)
  from public, anon, authenticated;
revoke execute on function public.get_my_matches(integer)
  from public, anon, authenticated;
revoke execute on function public.get_profile_connection_status(uuid)
  from public, anon, authenticated;
revoke execute on function public.block_user(uuid)
  from public, anon, authenticated;
revoke execute on function public.report_user(uuid, text, text)
  from public, anon, authenticated;
revoke execute on function public.log_email_contact_clicked(uuid)
  from public, anon, authenticated;

grant execute on function public.get_discovery_candidates(integer) to authenticated;
grant execute on function public.set_discovery_action(uuid, public.interaction_action) to authenticated;
grant execute on function public.get_my_matches(integer) to authenticated;
grant execute on function public.get_profile_connection_status(uuid) to authenticated;
grant execute on function public.block_user(uuid) to authenticated;
grant execute on function public.report_user(uuid, text, text) to authenticated;
grant execute on function public.log_email_contact_clicked(uuid) to authenticated;

comment on function public.get_discovery_candidates(integer) is
  'Returns deterministic Phase 6 discovery candidates for the authenticated active profile. Results exclude emails, blocks, existing outgoing actions, and active matches.';

comment on function public.set_discovery_action(uuid, public.interaction_action) is
  'Records the authenticated user discovery action. Reciprocal connect relies on the existing interactions_create_match trigger.';

comment on function public.get_my_matches(integer) is
  'Returns safe profile summaries for active mutual matches. Contact emails are intentionally excluded.';

comment on function public.get_profile_connection_status(uuid) is
  'Returns only the caller-visible relationship state for a profile, without exposing incoming connect actions.';

comment on function public.block_user(uuid) is
  'Blocks another profile for the authenticated active user and relies on blocks_close_match to close active matches.';

comment on function public.report_user(uuid, text, text) is
  'Creates an open report from the authenticated active user for another active profile.';

comment on function public.log_email_contact_clicked(uuid) is
  'Logs a contact-email reveal click only when the existing matched contact email RPC is allowed.';

commit;
