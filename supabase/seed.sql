-- Phase 2 seed/reference data for local development.
-- Production faculty/program and onboarding taxonomy are tracked in migrations,
-- not seeded here.
-- Do not seed guessed corporate email domains here.

begin;

insert into public.matching_config (
  version,
  is_active,
  my_looking_for_their_offer_weight,
  their_looking_for_my_offer_weight,
  common_interests_weight,
  collaboration_goals_weight,
  availability_weight
)
values (1, true, 35, 25, 15, 15, 10)
on conflict (version) do update
set is_active = excluded.is_active,
    my_looking_for_their_offer_weight = excluded.my_looking_for_their_offer_weight,
    their_looking_for_my_offer_weight = excluded.their_looking_for_my_offer_weight,
    common_interests_weight = excluded.common_interests_weight,
    collaboration_goals_weight = excluded.collaboration_goals_weight,
    availability_weight = excluded.availability_weight,
    updated_at = now();

commit;
