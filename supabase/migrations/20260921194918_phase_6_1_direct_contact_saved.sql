begin;

alter table public.profiles
  add column if not exists allow_direct_contact boolean not null default true;

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
    and private.is_active_onboarded(target_user_id)
    and not private.has_block_between(caller_id, target_user_id)
    and exists (
      select 1
      from public.profiles p
      where p.user_id = target_user_id
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

create or replace function public.get_profile_contact_email(target_user_id uuid)
returns table (
  user_id uuid,
  full_name text,
  contact_email text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.user_id, p.full_name, u.email::text as contact_email
  from public.profiles p
  join auth.users u on u.id = p.user_id
  where p.user_id = target_user_id
    and u.email_confirmed_at is not null
    and private.can_reveal_direct_contact(target_user_id);
$$;

create or replace function public.set_saved_profile(
  target_user_id uuid,
  should_save boolean
)
returns table (
  saved boolean,
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
  existing_action public.interaction_action;
  current_match_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication required to save profiles.'
      using errcode = '42501';
  end if;

  if target_user_id is null or target_user_id = caller_id then
    raise exception 'Choose another active profile.'
      using errcode = 'P0001';
  end if;

  if should_save is null then
    raise exception 'Choose whether to save this profile.'
      using errcode = 'P0001';
  end if;

  select i.action
    into existing_action
  from public.interactions i
  where i.source_user_id = caller_id
    and i.target_user_id = target_user_id;

  if should_save then
    if not private.can_interact(target_user_id) then
      raise exception 'This profile is not available to save.'
        using errcode = '42501';
    end if;

    if existing_action is not null
      and existing_action <> 'save'::public.interaction_action
    then
      raise exception 'This profile already has another discovery action.'
        using errcode = 'P0001';
    end if;

    insert into public.interactions (source_user_id, target_user_id, action)
    values (caller_id, target_user_id, 'save'::public.interaction_action)
    on conflict on constraint interactions_pkey do update
    set action = excluded.action,
        updated_at = now();

    return query
    select
      true,
      'save'::public.interaction_action,
      false,
      null::uuid;

    return;
  end if;

  delete from public.interactions i
  where i.source_user_id = caller_id
    and i.target_user_id = target_user_id
    and i.action = 'save'::public.interaction_action;

  current_match_id := private.active_match_id(caller_id, target_user_id);

  return query
  select
    false,
    case
      when existing_action = 'save'::public.interaction_action then null::public.interaction_action
      else existing_action
    end,
    current_match_id is not null,
    current_match_id;
end;
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

  if requested_action <> 'save'::public.interaction_action then
    insert into public.product_events (user_id, subject_user_id, match_id, event_name, metadata)
    values (
      caller_id,
      target_user_id,
      current_match_id,
      ('discover_action_' || requested_action::text),
      jsonb_build_object('source', 'phase_6_discovery')
    );
  end if;

  return query
  select requested_action, current_match_id is not null, current_match_id;
end;
$$;

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
  where private.is_active_onboarded(p.user_id)
    and not private.has_block_between(c.user_id, p.user_id)
  order by i.updated_at desc, p.full_name asc, p.user_id asc
  limit least(greatest(coalesce(saved_limit, 50), 1), 100);
$$;

drop function if exists public.get_my_matches(integer);

create function public.get_my_matches(match_limit integer default 50)
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
    private.can_reveal_direct_contact(p.user_id) as can_direct_contact,
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

drop function if exists public.get_profile_connection_status(uuid);

create function public.get_profile_connection_status(target_user_id uuid)
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
    ) as blocked_by_me,
    private.can_reveal_direct_contact(target_user_id) as can_direct_contact
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

create or replace function public.log_email_contact_clicked(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  current_match_id uuid;
  direct_contact_allowed boolean;
begin
  if caller_id is null then
    raise exception 'Authentication required to reveal contact details.'
      using errcode = '42501';
  end if;

  direct_contact_allowed := private.can_reveal_direct_contact(target_user_id);

  if not direct_contact_allowed and not private.can_reveal_contact(target_user_id) then
    raise exception 'Contact details are not available for this profile.'
      using errcode = '42501';
  end if;

  current_match_id := private.active_match_id(caller_id, target_user_id);

  insert into public.product_events (user_id, subject_user_id, match_id, event_name, metadata)
  values (
    caller_id,
    target_user_id,
    current_match_id,
    'email_contact_clicked',
    jsonb_build_object(
      'source',
      case
        when direct_contact_allowed then 'phase_6_1_direct_contact'
        else 'phase_6_matches'
      end
    )
  );

  return true;
end;
$$;

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
  collaboration_goal_ids bigint[],
  profile_allow_direct_contact boolean default true
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

revoke execute on function private.can_reveal_direct_contact(uuid)
  from public, anon, authenticated;
revoke execute on function public.get_profile_contact_email(uuid)
  from public, anon, authenticated;
revoke execute on function public.set_saved_profile(uuid, boolean)
  from public, anon, authenticated;
revoke execute on function public.set_discovery_action(uuid, public.interaction_action)
  from public, anon, authenticated;
revoke execute on function public.get_saved_profiles(integer)
  from public, anon, authenticated;
revoke execute on function public.get_my_matches(integer)
  from public, anon, authenticated;
revoke execute on function public.get_profile_connection_status(uuid)
  from public, anon, authenticated;
revoke execute on function public.log_email_contact_clicked(uuid)
  from public, anon, authenticated;
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

grant execute on function public.get_profile_contact_email(uuid) to authenticated;
grant execute on function public.set_saved_profile(uuid, boolean) to authenticated;
grant execute on function public.set_discovery_action(uuid, public.interaction_action) to authenticated;
grant execute on function public.get_saved_profiles(integer) to authenticated;
grant execute on function public.get_my_matches(integer) to authenticated;
grant execute on function public.get_profile_connection_status(uuid) to authenticated;
grant execute on function public.log_email_contact_clicked(uuid) to authenticated;
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

comment on column public.profiles.allow_direct_contact is
  'Controls whether active onboarded students can reveal this profile''s auth email through the direct-contact RPC. Supabase Auth users are not affected.';

comment on function private.can_reveal_direct_contact(uuid) is
  'Shared direct-contact eligibility predicate. Requires active onboarded caller and target, no block, no self-contact, target opt-in, and a confirmed target auth email.';

comment on function public.get_profile_contact_email(uuid) is
  'Returns the target profile email only to an authenticated active onboarded caller when the target allows direct contact. Discovery and saved list payloads intentionally exclude email.';

comment on function public.set_saved_profile(uuid, boolean) is
  'Privately toggles the authenticated caller''s saved interaction for another profile. Saving never creates a match or target-visible notification.';

comment on function public.set_discovery_action(uuid, public.interaction_action) is
  'Records the authenticated user discovery action. Connect and skip write product events; save remains private and creates no target-addressed event.';

comment on function public.get_saved_profiles(integer) is
  'Returns safe profile summaries for the authenticated caller''s private saved profiles, excluding emails and blocked or inactive targets.';

comment on function public.get_my_matches(integer) is
  'Returns safe profile summaries for active mutual matches. Contact emails are intentionally excluded; can_direct_contact only controls the direct email button.';

comment on function public.get_profile_connection_status(uuid) is
  'Returns only the caller-visible relationship state for a profile, without exposing incoming connect actions or emails.';

comment on function public.log_email_contact_clicked(uuid) is
  'Logs a contact-email click only when either direct contact is allowed or the existing matched contact email RPC remains allowed.';

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
  'Atomically updates the authenticated user''s completed active profile, direct-contact preference, and profile taxonomy relations. Looking-for skills are optional.';

commit;
