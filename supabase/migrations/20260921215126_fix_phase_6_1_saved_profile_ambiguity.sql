begin;

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
      and existing_action <> 'save'::public.interaction_action
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
    and i.action = 'save'::public.interaction_action;

  current_match_id := private.active_match_id(caller_id, requested_target_user_id);

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

revoke execute on function public.set_saved_profile(uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.set_saved_profile(uuid, boolean)
  to authenticated;

comment on function public.set_saved_profile(uuid, boolean) is
  'Privately toggles the authenticated caller''s saved interaction for another profile. Saving never creates a match or target-visible notification.';

commit;
