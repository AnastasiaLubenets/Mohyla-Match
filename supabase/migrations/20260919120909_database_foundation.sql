-- Phase 2: database foundation for Mohyla Match.
-- This migration intentionally contains schema, constraints, RLS, grants, and
-- database-enforced match creation only. UI/auth/onboarding flows are Phase 3.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.profile_status as enum ('active', 'suspended', 'deleted');
create type public.skill_direction as enum ('offer', 'looking_for');
create type public.interaction_action as enum ('connect', 'save', 'skip');
create type public.match_status as enum ('active', 'blocked', 'closed');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
create type public.user_role as enum ('admin');

create table public.faculties (
  id bigint generated always as identity primary key,
  slug text not null unique,
  display_name text not null,
  avatar_theme_key text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint faculties_slug_format check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint faculties_display_name_length check (char_length(display_name) between 2 and 120),
  constraint faculties_avatar_theme_key_length check (char_length(avatar_theme_key) between 2 and 80)
);

create table public.academic_programs (
  id bigint generated always as identity primary key,
  faculty_id bigint not null references public.faculties(id) on delete restrict,
  slug text not null unique,
  display_name text not null,
  avatar_variant_key text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_programs_faculty_id_id_unique unique (id, faculty_id),
  constraint academic_programs_slug_format check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint academic_programs_display_name_length check (char_length(display_name) between 2 and 160),
  constraint academic_programs_avatar_variant_key_length check (char_length(avatar_variant_key) between 2 and 80)
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  faculty_id bigint not null references public.faculties(id) on delete restrict,
  academic_program_id bigint not null,
  year_of_study smallint not null,
  bio text,
  availability text,
  system_avatar_key text not null default 'default',
  profile_status public.profile_status not null default 'active',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint profiles_program_belongs_to_faculty foreign key (academic_program_id, faculty_id)
    references public.academic_programs(id, faculty_id) on delete restrict,
  constraint profiles_full_name_length check (char_length(full_name) between 2 and 120),
  constraint profiles_year_of_study_range check (year_of_study between 1 and 6),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 500),
  constraint profiles_availability_length check (availability is null or char_length(availability) <= 160),
  constraint profiles_system_avatar_key_length check (char_length(system_avatar_key) between 2 and 100),
  constraint profiles_deleted_timestamp check (
    (profile_status = 'deleted' and deleted_at is not null)
    or (profile_status <> 'deleted' and deleted_at is null)
  )
);

create table public.skills (
  id bigint generated always as identity primary key,
  category text not null,
  slug text not null unique,
  name text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skills_category_name_unique unique (category, name),
  constraint skills_slug_format check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint skills_category_length check (char_length(category) between 2 and 80),
  constraint skills_name_length check (char_length(name) between 2 and 120)
);

create table public.profile_skills (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  skill_id bigint not null references public.skills(id) on delete restrict,
  direction public.skill_direction not null,
  created_at timestamptz not null default now(),
  primary key (user_id, skill_id, direction)
);

create table public.interests (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interests_slug_format check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint interests_name_length check (char_length(name) between 2 and 120)
);

create table public.profile_interests (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  interest_id bigint not null references public.interests(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, interest_id)
);

create table public.collaboration_goals (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collaboration_goals_slug_format check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint collaboration_goals_name_length check (char_length(name) between 2 and 120)
);

create table public.profile_collaboration_goals (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  collaboration_goal_id bigint not null references public.collaboration_goals(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, collaboration_goal_id)
);

create table public.interactions (
  source_user_id uuid not null references public.profiles(user_id) on delete cascade,
  target_user_id uuid not null references public.profiles(user_id) on delete cascade,
  action public.interaction_action not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (source_user_id, target_user_id),
  constraint interactions_no_self check (source_user_id <> target_user_id)
);

create table public.matches (
  id uuid primary key default extensions.gen_random_uuid(),
  user_low uuid not null references public.profiles(user_id) on delete cascade,
  user_high uuid not null references public.profiles(user_id) on delete cascade,
  status public.match_status not null default 'active',
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  constraint matches_canonical_pair check (user_low < user_high),
  constraint matches_pair_unique unique (user_low, user_high),
  constraint matches_closed_at_consistent check (
    (status = 'active' and closed_at is null)
    or (status <> 'active' and closed_at is not null)
  )
);

create table public.blocks (
  blocker_user_id uuid not null references public.profiles(user_id) on delete cascade,
  blocked_user_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_user_id, blocked_user_id),
  constraint blocks_no_self check (blocker_user_id <> blocked_user_id)
);

create table public.reports (
  id uuid primary key default extensions.gen_random_uuid(),
  reporter_user_id uuid not null references public.profiles(user_id) on delete cascade,
  reported_user_id uuid not null references public.profiles(user_id) on delete cascade,
  reason_code text not null,
  details text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint reports_no_self check (reporter_user_id <> reported_user_id),
  constraint reports_reason_code_format check (reason_code = lower(reason_code) and reason_code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint reports_details_length check (details is null or char_length(details) <= 2000),
  constraint reports_resolution_consistent check (
    (status in ('open', 'reviewing') and resolved_at is null)
    or (status in ('resolved', 'dismissed') and resolved_at is not null)
  )
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.admin_actions (
  id uuid primary key default extensions.gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete restrict,
  action_type text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  report_id uuid references public.reports(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint admin_actions_action_type_format check (action_type = lower(action_type) and action_type ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint admin_actions_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.matching_config (
  version integer primary key,
  is_active boolean not null default false,
  my_looking_for_their_offer_weight smallint not null,
  their_looking_for_my_offer_weight smallint not null,
  common_interests_weight smallint not null,
  collaboration_goals_weight smallint not null,
  availability_weight smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matching_config_positive_version check (version > 0),
  constraint matching_config_weights_non_negative check (
    my_looking_for_their_offer_weight >= 0
    and their_looking_for_my_offer_weight >= 0
    and common_interests_weight >= 0
    and collaboration_goals_weight >= 0
    and availability_weight >= 0
  ),
  constraint matching_config_weights_total check (
    my_looking_for_their_offer_weight
    + their_looking_for_my_offer_weight
    + common_interests_weight
    + collaboration_goals_weight
    + availability_weight = 100
  )
);

create table public.product_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  subject_user_id uuid references auth.users(id) on delete set null,
  match_id uuid references public.matches(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint product_events_event_name check (
    event_name in (
      'signup_completed',
      'email_verified',
      'onboarding_completed',
      'discover_action_save',
      'discover_action_skip',
      'discover_action_connect',
      'mutual_match_created',
      'email_contact_clicked',
      'report_created',
      'account_deleted'
    )
  ),
  constraint product_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.signup_email_domains (
  id bigint generated always as identity primary key,
  domain text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint signup_email_domains_domain_format check (domain = lower(domain) and domain ~ '^[a-z0-9.-]+$')
);

create unique index matching_config_one_active_idx
  on public.matching_config ((is_active))
  where is_active;

create index academic_programs_faculty_active_sort_idx
  on public.academic_programs (faculty_id, is_active, sort_order);
create index profiles_faculty_program_status_idx
  on public.profiles (faculty_id, academic_program_id, profile_status)
  where profile_status = 'active';
create index profiles_onboarded_active_idx
  on public.profiles (onboarding_completed_at)
  where profile_status = 'active' and onboarding_completed_at is not null;
create index profile_skills_skill_direction_user_idx
  on public.profile_skills (skill_id, direction, user_id);
create index profile_skills_user_direction_idx
  on public.profile_skills (user_id, direction);
create index profile_interests_interest_user_idx
  on public.profile_interests (interest_id, user_id);
create index profile_collaboration_goals_goal_user_idx
  on public.profile_collaboration_goals (collaboration_goal_id, user_id);
create index interactions_target_action_idx
  on public.interactions (target_user_id, action);
create index interactions_source_action_idx
  on public.interactions (source_user_id, action);
create index matches_user_high_idx
  on public.matches (user_high);
create index matches_active_pair_idx
  on public.matches (user_low, user_high)
  where status = 'active';
create index blocks_blocked_user_idx
  on public.blocks (blocked_user_id);
create index reports_reported_status_idx
  on public.reports (reported_user_id, status);
create index reports_reporter_idx
  on public.reports (reporter_user_id);
create index admin_actions_admin_idx
  on public.admin_actions (admin_user_id);
create index admin_actions_target_idx
  on public.admin_actions (target_user_id);
create index product_events_user_created_idx
  on public.product_events (user_id, created_at desc);
create index product_events_name_created_idx
  on public.product_events (event_name, created_at desc);
create index skills_active_category_sort_idx
  on public.skills (is_active, category, sort_order);
create index interests_active_sort_idx
  on public.interests (is_active, sort_order);
create index collaboration_goals_active_sort_idx
  on public.collaboration_goals (is_active, sort_order);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger faculties_set_updated_at
  before update on public.faculties
  for each row execute function private.set_updated_at();
create trigger academic_programs_set_updated_at
  before update on public.academic_programs
  for each row execute function private.set_updated_at();
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger skills_set_updated_at
  before update on public.skills
  for each row execute function private.set_updated_at();
create trigger interests_set_updated_at
  before update on public.interests
  for each row execute function private.set_updated_at();
create trigger collaboration_goals_set_updated_at
  before update on public.collaboration_goals
  for each row execute function private.set_updated_at();
create trigger interactions_set_updated_at
  before update on public.interactions
  for each row execute function private.set_updated_at();
create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function private.set_updated_at();
create trigger matching_config_set_updated_at
  before update on public.matching_config
  for each row execute function private.set_updated_at();
create trigger signup_email_domains_set_updated_at
  before update on public.signup_email_domains
  for each row execute function private.set_updated_at();

create or replace function private.is_admin(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.user_roles ur
      where ur.user_id = check_user_id
        and ur.role = 'admin'::public.user_role
    ),
    false
  );
$$;

create or replace function private.is_active_onboarded(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles p
      where p.user_id = check_user_id
        and p.profile_status = 'active'::public.profile_status
        and p.onboarding_completed_at is not null
    ),
    false
  );
$$;

create or replace function private.is_active_profile(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles p
      where p.user_id = check_user_id
        and p.profile_status = 'active'::public.profile_status
    ),
    false
  );
$$;

create or replace function private.is_program_active(check_faculty_id bigint, check_program_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.faculties f
      join public.academic_programs ap on ap.faculty_id = f.id
      where f.id = check_faculty_id
        and ap.id = check_program_id
        and f.is_active
        and ap.is_active
    ),
    false
  );
$$;

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

create or replace function private.can_view_profile(target_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    return false;
  end if;

  if caller_id = target_user_id then
    return true;
  end if;

  return private.is_active_onboarded(caller_id)
    and private.is_active_onboarded(target_user_id)
    and not private.has_block_between(caller_id, target_user_id);
end;
$$;

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
    and private.is_active_onboarded(target_user_id)
    and not private.has_block_between(caller_id, target_user_id);
end;
$$;

create or replace function private.can_reveal_contact(target_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  low_id uuid;
  high_id uuid;
begin
  if caller_id is null or caller_id = target_user_id then
    return false;
  end if;

  if not private.is_active_onboarded(caller_id)
    or not private.is_active_onboarded(target_user_id)
    or private.has_block_between(caller_id, target_user_id)
  then
    return false;
  end if;

  if caller_id < target_user_id then
    low_id := caller_id;
    high_id := target_user_id;
  else
    low_id := target_user_id;
    high_id := caller_id;
  end if;

  return exists (
    select 1
    from public.matches m
    where m.user_low = low_id
      and m.user_high = high_id
      and m.status = 'active'::public.match_status
  );
end;
$$;

create or replace function public.get_matched_contact_email(target_user_id uuid)
returns table (
  user_id uuid,
  full_name text,
  corporate_email text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.user_id, p.full_name, u.email::text as corporate_email
  from public.profiles p
  join auth.users u on u.id = p.user_id
  where p.user_id = target_user_id
    and u.email_confirmed_at is not null
    and private.can_reveal_contact(target_user_id);
$$;

create or replace function private.create_match_from_interaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  low_id uuid;
  high_id uuid;
  created_match_id uuid;
begin
  if new.action <> 'connect'::public.interaction_action then
    return new;
  end if;

  if not private.is_active_onboarded(new.source_user_id)
    or not private.is_active_onboarded(new.target_user_id)
    or private.has_block_between(new.source_user_id, new.target_user_id)
  then
    return new;
  end if;

  if not exists (
    select 1
    from public.interactions reciprocal
    where reciprocal.source_user_id = new.target_user_id
      and reciprocal.target_user_id = new.source_user_id
      and reciprocal.action = 'connect'::public.interaction_action
  ) then
    return new;
  end if;

  if new.source_user_id < new.target_user_id then
    low_id := new.source_user_id;
    high_id := new.target_user_id;
  else
    low_id := new.target_user_id;
    high_id := new.source_user_id;
  end if;

  insert into public.matches (user_low, user_high)
  values (low_id, high_id)
  on conflict (user_low, user_high) do nothing
  returning id into created_match_id;

  if created_match_id is not null then
    insert into public.product_events (user_id, subject_user_id, match_id, event_name)
    values (new.source_user_id, new.target_user_id, created_match_id, 'mutual_match_created');
  end if;

  return new;
end;
$$;

create trigger interactions_create_match
  after insert or update of action on public.interactions
  for each row execute function private.create_match_from_interaction();

create or replace function private.close_match_on_block()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  low_id uuid;
  high_id uuid;
begin
  if new.blocker_user_id < new.blocked_user_id then
    low_id := new.blocker_user_id;
    high_id := new.blocked_user_id;
  else
    low_id := new.blocked_user_id;
    high_id := new.blocker_user_id;
  end if;

  update public.matches
  set status = 'blocked'::public.match_status,
      closed_at = coalesce(closed_at, now())
  where user_low = low_id
    and user_high = high_id
    and status = 'active'::public.match_status;

  return new;
end;
$$;

create trigger blocks_close_match
  after insert on public.blocks
  for each row execute function private.close_match_on_block();

alter table public.faculties enable row level security;
alter table public.academic_programs enable row level security;
alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.profile_skills enable row level security;
alter table public.interests enable row level security;
alter table public.profile_interests enable row level security;
alter table public.collaboration_goals enable row level security;
alter table public.profile_collaboration_goals enable row level security;
alter table public.interactions enable row level security;
alter table public.matches enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.user_roles enable row level security;
alter table public.admin_actions enable row level security;
alter table public.matching_config enable row level security;
alter table public.product_events enable row level security;
alter table public.signup_email_domains enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema private from public;
revoke all on function public.get_matched_contact_email(uuid) from public;

grant usage on schema public to authenticated;

grant select, insert, update on public.faculties to authenticated;
grant select, insert, update on public.academic_programs to authenticated;
grant select, insert, update on public.skills to authenticated;
grant select, insert, update on public.interests to authenticated;
grant select, insert, update on public.collaboration_goals to authenticated;
grant select, insert, update on public.matching_config to authenticated;
grant select, insert, update on public.signup_email_domains to authenticated;

grant select on public.profiles to authenticated;
grant insert (
  user_id,
  full_name,
  faculty_id,
  academic_program_id,
  year_of_study,
  bio,
  availability,
  system_avatar_key,
  onboarding_completed_at
) on public.profiles to authenticated;
grant update (
  full_name,
  faculty_id,
  academic_program_id,
  year_of_study,
  bio,
  availability,
  system_avatar_key,
  onboarding_completed_at,
  updated_at
) on public.profiles to authenticated;

grant select, insert, delete on public.profile_skills to authenticated;
grant select, insert, delete on public.profile_interests to authenticated;
grant select, insert, delete on public.profile_collaboration_goals to authenticated;

grant select, insert, delete on public.interactions to authenticated;
grant update (action, updated_at) on public.interactions to authenticated;
grant select on public.matches to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant select, insert on public.reports to authenticated;
grant update (status, resolved_at, updated_at) on public.reports to authenticated;
grant select, insert on public.admin_actions to authenticated;
grant insert on public.product_events to authenticated;

grant usage, select on sequence public.faculties_id_seq to authenticated;
grant usage, select on sequence public.academic_programs_id_seq to authenticated;
grant usage, select on sequence public.skills_id_seq to authenticated;
grant usage, select on sequence public.interests_id_seq to authenticated;
grant usage, select on sequence public.collaboration_goals_id_seq to authenticated;
grant usage, select on sequence public.signup_email_domains_id_seq to authenticated;
grant usage on sequence public.product_events_id_seq to authenticated;

grant execute on function private.is_admin(uuid) to authenticated;
grant execute on function private.is_active_onboarded(uuid) to authenticated;
grant execute on function private.is_active_profile(uuid) to authenticated;
grant execute on function private.is_program_active(bigint, bigint) to authenticated;
grant execute on function private.has_block_between(uuid, uuid) to authenticated;
grant execute on function private.can_view_profile(uuid) to authenticated;
grant execute on function private.can_interact(uuid) to authenticated;
grant execute on function private.can_reveal_contact(uuid) to authenticated;
grant execute on function public.get_matched_contact_email(uuid) to authenticated;

create policy faculties_select_active_or_admin
  on public.faculties
  for select to authenticated
  using (is_active or private.is_admin(auth.uid()));

create policy faculties_insert_admin
  on public.faculties
  for insert to authenticated
  with check (private.is_admin(auth.uid()));

create policy faculties_update_admin
  on public.faculties
  for update to authenticated
  using (private.is_admin(auth.uid()))
  with check (private.is_admin(auth.uid()));

create policy academic_programs_select_active_or_admin
  on public.academic_programs
  for select to authenticated
  using (is_active or private.is_admin(auth.uid()));

create policy academic_programs_insert_admin
  on public.academic_programs
  for insert to authenticated
  with check (private.is_admin(auth.uid()));

create policy academic_programs_update_admin
  on public.academic_programs
  for update to authenticated
  using (private.is_admin(auth.uid()))
  with check (private.is_admin(auth.uid()));

create policy skills_select_active_or_admin
  on public.skills
  for select to authenticated
  using (is_active or private.is_admin(auth.uid()));

create policy skills_insert_admin
  on public.skills
  for insert to authenticated
  with check (private.is_admin(auth.uid()));

create policy skills_update_admin
  on public.skills
  for update to authenticated
  using (private.is_admin(auth.uid()))
  with check (private.is_admin(auth.uid()));

create policy interests_select_active_or_admin
  on public.interests
  for select to authenticated
  using (is_active or private.is_admin(auth.uid()));

create policy interests_insert_admin
  on public.interests
  for insert to authenticated
  with check (private.is_admin(auth.uid()));

create policy interests_update_admin
  on public.interests
  for update to authenticated
  using (private.is_admin(auth.uid()))
  with check (private.is_admin(auth.uid()));

create policy collaboration_goals_select_active_or_admin
  on public.collaboration_goals
  for select to authenticated
  using (is_active or private.is_admin(auth.uid()));

create policy collaboration_goals_insert_admin
  on public.collaboration_goals
  for insert to authenticated
  with check (private.is_admin(auth.uid()));

create policy collaboration_goals_update_admin
  on public.collaboration_goals
  for update to authenticated
  using (private.is_admin(auth.uid()))
  with check (private.is_admin(auth.uid()));

create policy profiles_select_allowed
  on public.profiles
  for select to authenticated
  using (private.can_view_profile(user_id) or private.is_admin(auth.uid()));

create policy profiles_insert_own
  on public.profiles
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and profile_status = 'active'::public.profile_status
    and private.is_program_active(faculty_id, academic_program_id)
  );

create policy profiles_update_own_active
  on public.profiles
  for update to authenticated
  using (user_id = auth.uid() and profile_status = 'active'::public.profile_status)
  with check (
    user_id = auth.uid()
    and profile_status = 'active'::public.profile_status
    and private.is_program_active(faculty_id, academic_program_id)
  );

create policy profile_skills_select_allowed_profile
  on public.profile_skills
  for select to authenticated
  using (private.can_view_profile(user_id) or private.is_admin(auth.uid()));

create policy profile_skills_insert_own_active
  on public.profile_skills
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and private.is_active_profile(user_id)
    and exists (
      select 1 from public.skills s
      where s.id = skill_id
        and s.is_active
    )
  );

create policy profile_skills_delete_own
  on public.profile_skills
  for delete to authenticated
  using (user_id = auth.uid());

create policy profile_interests_select_allowed_profile
  on public.profile_interests
  for select to authenticated
  using (private.can_view_profile(user_id) or private.is_admin(auth.uid()));

create policy profile_interests_insert_own_active
  on public.profile_interests
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and private.is_active_profile(user_id)
    and exists (
      select 1 from public.interests i
      where i.id = interest_id
        and i.is_active
    )
  );

create policy profile_interests_delete_own
  on public.profile_interests
  for delete to authenticated
  using (user_id = auth.uid());

create policy profile_collaboration_goals_select_allowed_profile
  on public.profile_collaboration_goals
  for select to authenticated
  using (private.can_view_profile(user_id) or private.is_admin(auth.uid()));

create policy profile_collaboration_goals_insert_own_active
  on public.profile_collaboration_goals
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and private.is_active_profile(user_id)
    and exists (
      select 1 from public.collaboration_goals cg
      where cg.id = collaboration_goal_id
        and cg.is_active
    )
  );

create policy profile_collaboration_goals_delete_own
  on public.profile_collaboration_goals
  for delete to authenticated
  using (user_id = auth.uid());

create policy interactions_select_source_or_admin
  on public.interactions
  for select to authenticated
  using (
    source_user_id = auth.uid()
    or private.is_admin(auth.uid())
  );

create policy interactions_insert_own_allowed
  on public.interactions
  for insert to authenticated
  with check (
    source_user_id = auth.uid()
    and private.can_interact(target_user_id)
  );

create policy interactions_update_own_allowed
  on public.interactions
  for update to authenticated
  using (source_user_id = auth.uid())
  with check (
    source_user_id = auth.uid()
    and private.can_interact(target_user_id)
  );

create policy interactions_delete_own
  on public.interactions
  for delete to authenticated
  using (source_user_id = auth.uid());

create policy matches_select_participant_active_unblocked
  on public.matches
  for select to authenticated
  using (
    (
      status = 'active'::public.match_status
      and (user_low = auth.uid() or user_high = auth.uid())
      and not private.has_block_between(user_low, user_high)
    )
    or private.is_admin(auth.uid())
  );

create policy blocks_select_own_or_admin
  on public.blocks
  for select to authenticated
  using (
    blocker_user_id = auth.uid()
    or private.is_admin(auth.uid())
  );

create policy blocks_insert_own
  on public.blocks
  for insert to authenticated
  with check (
    blocker_user_id = auth.uid()
    and blocker_user_id <> blocked_user_id
    and private.is_active_onboarded(blocker_user_id)
  );

create policy blocks_delete_own
  on public.blocks
  for delete to authenticated
  using (blocker_user_id = auth.uid());

create policy reports_select_own_or_admin
  on public.reports
  for select to authenticated
  using (
    reporter_user_id = auth.uid()
    or private.is_admin(auth.uid())
  );

create policy reports_insert_own
  on public.reports
  for insert to authenticated
  with check (
    reporter_user_id = auth.uid()
    and reporter_user_id <> reported_user_id
    and private.is_active_onboarded(reporter_user_id)
  );

create policy reports_update_admin
  on public.reports
  for update to authenticated
  using (private.is_admin(auth.uid()))
  with check (private.is_admin(auth.uid()));

create policy admin_actions_select_admin
  on public.admin_actions
  for select to authenticated
  using (private.is_admin(auth.uid()));

create policy admin_actions_insert_admin
  on public.admin_actions
  for insert to authenticated
  with check (
    admin_user_id = auth.uid()
    and private.is_admin(auth.uid())
  );

create policy matching_config_select_active_or_admin
  on public.matching_config
  for select to authenticated
  using (is_active or private.is_admin(auth.uid()));

create policy matching_config_insert_admin
  on public.matching_config
  for insert to authenticated
  with check (private.is_admin(auth.uid()));

create policy matching_config_update_admin
  on public.matching_config
  for update to authenticated
  using (private.is_admin(auth.uid()))
  with check (private.is_admin(auth.uid()));

create policy product_events_insert_own_minimal
  on public.product_events
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and event_name <> 'mutual_match_created'
  );

create policy signup_email_domains_select_admin
  on public.signup_email_domains
  for select to authenticated
  using (private.is_admin(auth.uid()));

create policy signup_email_domains_insert_admin
  on public.signup_email_domains
  for insert to authenticated
  with check (private.is_admin(auth.uid()));

create policy signup_email_domains_update_admin
  on public.signup_email_domains
  for update to authenticated
  using (private.is_admin(auth.uid()))
  with check (private.is_admin(auth.uid()));

comment on table public.profiles is
  'Student product profiles. Corporate email is intentionally not stored here; contact email is derived from auth.users only after a mutual match.';
comment on function public.get_matched_contact_email(uuid) is
  'Secure contact projection. Returns verified Auth email only for an active mutual match without blocks or suspensions.';
comment on table public.matches is
  'Canonical unordered match pairs. user_low/user_high enforce one row for A/B and B/A.';
comment on table public.matching_config is
  'Data-driven deterministic V1 matching weights. MVP has no AI scoring engine.';
