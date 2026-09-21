begin;

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

revoke execute on function public.set_discovery_action(uuid, public.interaction_action)
  from public, anon, authenticated;
grant execute on function public.set_discovery_action(uuid, public.interaction_action)
  to authenticated;

comment on function public.set_discovery_action(uuid, public.interaction_action) is
  'Records the authenticated user discovery action. Reciprocal connect relies on the existing interactions_create_match trigger.';

commit;
