begin;

-- Skip is now a temporary client-side dismissal for the current
-- Recommended feed only. Existing persisted skip rows are obsolete and
-- must not keep profiles out of future recommendations.
delete from public.interactions
where action = 'skip'::public.interaction_action;

-- Block is no longer a user-facing product action. Existing rows are
-- removed, future normal authenticated inserts are denied, and visibility
-- predicates ignore any legacy/admin-created rows that may remain.
delete from public.blocks;

drop policy if exists blocks_insert_own on public.blocks;
revoke insert on public.blocks from public, anon, authenticated;

create or replace function private.has_block_between(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select false;
$$;

comment on function private.has_block_between(uuid, uuid) is
  'Block is no longer a Mohyla Match product action. Legacy block rows are ignored so they do not hide profiles.';

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
  requested_target_user_id uuid := target_user_id;
  existing_action public.interaction_action;
  current_match_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication required to save profiles.'
      using errcode = '42501';
  end if;

  if requested_target_user_id is null or requested_target_user_id = caller_id then
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
    and i.target_user_id = requested_target_user_id;

  if should_save then
    if not private.can_interact(requested_target_user_id) then
      raise exception 'This profile is not available to save.'
        using errcode = '42501';
    end if;

    if existing_action is not null
      and existing_action not in (
        'save'::public.interaction_action,
        'skip'::public.interaction_action
      )
    then
      raise exception 'This profile already has another discovery action.'
        using errcode = 'P0001';
    end if;

    insert into public.interactions (source_user_id, target_user_id, action)
    values (caller_id, requested_target_user_id, 'save'::public.interaction_action)
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
    and i.target_user_id = requested_target_user_id
    and i.action in (
      'save'::public.interaction_action,
      'skip'::public.interaction_action
    );

  current_match_id := private.active_match_id(caller_id, requested_target_user_id);

  return query
  select
    false,
    case
      when existing_action in (
        'save'::public.interaction_action,
        'skip'::public.interaction_action
      )
      then null::public.interaction_action
      else existing_action
    end,
    current_match_id is not null,
    current_match_id;
end;
$$;

revoke execute on function public.set_saved_profile(uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.set_saved_profile(uuid, boolean)
  to authenticated;

comment on function public.set_saved_profile(uuid, boolean) is
  'Privately toggles the authenticated caller''s saved interaction for another profile. Legacy skip rows may be replaced by save; saving never creates a match or target-visible notification.';

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
  requested_target_user_id uuid := target_user_id;
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

  if requested_target_user_id is null or requested_target_user_id = caller_id then
    raise exception 'Choose another active profile.'
      using errcode = 'P0001';
  end if;

  if requested_action = 'skip'::public.interaction_action then
    delete from public.interactions i
    where i.source_user_id = caller_id
      and i.target_user_id = requested_target_user_id
      and i.action = 'skip'::public.interaction_action;

    return query
    select 'skip'::public.interaction_action, false, null::uuid;

    return;
  end if;

  if not private.can_interact(requested_target_user_id) then
    raise exception 'This profile is not available for discovery.'
      using errcode = '42501';
  end if;

  insert into public.interactions (source_user_id, target_user_id, action)
  values (caller_id, requested_target_user_id, requested_action)
  on conflict on constraint interactions_pkey do update
  set action = excluded.action,
      updated_at = now();

  current_match_id := private.active_match_id(caller_id, requested_target_user_id);

  if requested_action = 'connect'::public.interaction_action then
    insert into public.product_events (user_id, subject_user_id, match_id, event_name, metadata)
    values (
      caller_id,
      requested_target_user_id,
      current_match_id,
      'discover_action_connect',
      jsonb_build_object('source', 'phase_6_discovery')
    );
  end if;

  return query
  select requested_action, current_match_id is not null, current_match_id;
end;
$$;

revoke execute on function public.set_discovery_action(uuid, public.interaction_action)
  from public, anon, authenticated;
grant execute on function public.set_discovery_action(uuid, public.interaction_action)
  to authenticated;

comment on function public.set_discovery_action(uuid, public.interaction_action) is
  'Records legacy discovery actions. Skip is a temporary UI dismissal and is intentionally not persisted.';

create or replace function public.block_user(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'Block is no longer supported.'
    using errcode = '42501';
end;
$$;

revoke execute on function public.block_user(uuid)
  from public, anon, authenticated;

comment on function public.block_user(uuid) is
  'Deprecated. Blocking is no longer user-facing and normal authenticated users cannot execute this function.';

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
    and exists (
      select 1
      from public.profiles p
      where p.user_id = rt.user_id
        and p.profile_status = 'active'::public.profile_status
        and p.deleted_at is null
    );
$$;

revoke execute on function public.get_profile_connection_status(uuid)
  from public, anon, authenticated;
grant execute on function public.get_profile_connection_status(uuid)
  to authenticated;

comment on function public.get_profile_connection_status(uuid) is
  'Returns the authenticated caller''s profile relationship state. Block status is always false because blocking is no longer user-facing.';

comment on function public.get_all_discovery_profiles(integer) is
  'Returns safe directory profile summaries for authenticated active users. Results exclude emails, the caller, and inactive or incomplete profiles, but intentionally include skipped, saved, and legacy blocked profiles.';

commit;
