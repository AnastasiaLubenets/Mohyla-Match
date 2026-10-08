begin;

alter table public.account_roles
  add column if not exists faculty_verification_status public.faculty_verification_status not null default 'unverified';

update public.account_roles ar
set faculty_verification_status = p.faculty_verification_status,
    updated_at = now()
from public.profiles p
where p.user_id = ar.user_id
  and ar.account_role = 'faculty'::public.account_role
  and p.account_role = 'faculty'::public.account_role
  and p.faculty_verification_status = 'verified'::public.faculty_verification_status
  and ar.faculty_verification_status <> 'verified'::public.faculty_verification_status;

update public.account_roles
set faculty_verification_status = 'unverified'::public.faculty_verification_status,
    updated_at = now()
where account_role = 'student'::public.account_role
  and faculty_verification_status <> 'unverified'::public.faculty_verification_status;

create table if not exists public.faculty_verification_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  ip_hash text,
  succeeded boolean not null default false,
  created_at timestamptz not null default now(),
  constraint faculty_verification_attempts_ip_hash_length
    check (ip_hash is null or char_length(ip_hash) = 64)
);

alter table public.faculty_verification_attempts enable row level security;

revoke all on public.faculty_verification_attempts from public, anon, authenticated;
grant select, insert, delete on public.faculty_verification_attempts to service_role;
grant usage on sequence public.faculty_verification_attempts_id_seq to service_role;

create index if not exists faculty_verification_attempts_user_recent_idx
  on public.faculty_verification_attempts (user_id, created_at desc)
  where not succeeded;

create index if not exists faculty_verification_attempts_ip_recent_idx
  on public.faculty_verification_attempts (ip_hash, created_at desc)
  where ip_hash is not null and not succeeded;

create or replace function private.is_service_role_request()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role';
$$;

create or replace function private.prevent_account_role_self_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.account_role = 'student'::public.account_role then
    new.faculty_verification_status := 'unverified'::public.faculty_verification_status;
  end if;

  if tg_op = 'INSERT' then
    if new.faculty_verification_status <> 'unverified'::public.faculty_verification_status
      and not private.is_admin(auth.uid())
      and not private.is_service_role_request()
    then
      raise exception 'Faculty verification can only be changed by an administrator.'
        using errcode = '42501';
    end if;

    return new;
  end if;

  if old.faculty_verification_status <> new.faculty_verification_status
    and not private.is_admin(auth.uid())
    and not private.is_service_role_request()
  then
    raise exception 'Faculty verification can only be changed by an administrator.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists account_roles_prevent_self_verification on public.account_roles;
create trigger account_roles_prevent_self_verification
  before insert or update on public.account_roles
  for each row execute function private.prevent_account_role_self_verification();

create or replace function private.prevent_profile_self_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_account_role public.account_role;
  selected_faculty_verification_status public.faculty_verification_status;
  caller_can_verify boolean;
begin
  select ar.account_role, ar.faculty_verification_status
    into selected_account_role, selected_faculty_verification_status
  from public.account_roles ar
  where ar.user_id = new.user_id;

  if tg_op = 'INSERT' then
    new.account_role := coalesce(
      selected_account_role,
      new.account_role,
      'student'::public.account_role
    );
  elsif old.onboarding_completed_at is null and selected_account_role is not null then
    new.account_role := selected_account_role;
  end if;

  if new.account_role = 'student'::public.account_role then
    new.faculty_verification_status := 'unverified'::public.faculty_verification_status;
  elsif selected_faculty_verification_status = 'verified'::public.faculty_verification_status then
    new.faculty_verification_status := 'verified'::public.faculty_verification_status;
  end if;

  caller_can_verify :=
    private.is_admin(auth.uid())
    or private.is_service_role_request()
    or (
      new.account_role = 'faculty'::public.account_role
      and selected_faculty_verification_status = 'verified'::public.faculty_verification_status
    );

  if tg_op = 'INSERT' then
    if new.faculty_verification_status <> 'unverified'::public.faculty_verification_status
      and not caller_can_verify
    then
      raise exception 'Faculty verification can only be changed by an administrator.'
        using errcode = '42501';
    end if;

    return new;
  end if;

  if old.account_role <> new.account_role
    and old.onboarding_completed_at is not null
    and not private.is_admin(auth.uid())
  then
    raise exception 'Completed account roles cannot be changed.'
      using errcode = '42501';
  end if;

  if old.faculty_verification_status <> new.faculty_verification_status
    and not caller_can_verify
  then
    raise exception 'Faculty verification can only be changed by an administrator.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop policy if exists account_roles_insert_own_unfinished on public.account_roles;
create policy account_roles_insert_own_unfinished
  on public.account_roles
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and faculty_verification_status = 'unverified'::public.faculty_verification_status
    and not exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.onboarding_completed_at is not null
    )
  );

drop policy if exists account_roles_update_own_unfinished on public.account_roles;
create policy account_roles_update_own_unfinished
  on public.account_roles
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and faculty_verification_status = 'unverified'::public.faculty_verification_status
    and not exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.onboarding_completed_at is not null
    )
  );

create or replace function public.save_account_role(selected_role public.account_role)
returns public.account_role
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  existing_faculty_verification_status public.faculty_verification_status;
begin
  if caller_id is null then
    raise exception 'Authentication required to choose account role.'
      using errcode = '42501';
  end if;

  if selected_role not in ('student'::public.account_role, 'faculty'::public.account_role) then
    raise exception 'Choose a valid account role.'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.profiles p
    where p.user_id = caller_id
      and p.onboarding_completed_at is not null
  ) then
    raise exception 'Completed account roles cannot be changed.'
      using errcode = '42501';
  end if;

  select ar.faculty_verification_status
    into existing_faculty_verification_status
  from public.account_roles ar
  where ar.user_id = caller_id;

  if selected_role = 'faculty'::public.account_role
    and coalesce(
      existing_faculty_verification_status,
      'unverified'::public.faculty_verification_status
    ) <> 'verified'::public.faculty_verification_status
  then
    raise exception 'Faculty verification is required before choosing Faculty.'
      using errcode = '42501';
  end if;

  insert into public.account_roles (
    user_id,
    account_role,
    faculty_verification_status
  )
  values (
    caller_id,
    selected_role,
    case
      when selected_role = 'faculty'::public.account_role
        then 'verified'::public.faculty_verification_status
      else 'unverified'::public.faculty_verification_status
    end
  )
  on conflict (user_id) do update
  set account_role = excluded.account_role,
      faculty_verification_status = excluded.faculty_verification_status,
      updated_at = now();

  return selected_role;
end;
$$;

create or replace function private.has_complete_onboarding_data(check_user_id uuid)
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
      join public.faculties f on f.id = p.faculty_id
      join public.academic_programs ap
        on ap.id = p.academic_program_id
        and ap.faculty_id = p.faculty_id
      where p.user_id = check_user_id
        and p.profile_status = 'active'::public.profile_status
        and p.deleted_at is null
        and f.is_active
        and ap.is_active
        and char_length(p.full_name) between 2 and 120
        and (
          (
            p.account_role = 'student'::public.account_role
            and p.year_of_study between 1 and 6
            and (p.bio is null or char_length(p.bio) <= 500)
            and (p.availability is null or char_length(p.availability) <= 160)
            and exists (
              select 1
              from public.profile_skills ps
              join public.skills s on s.id = ps.skill_id
              where ps.user_id = check_user_id
                and ps.direction = 'offer'::public.skill_direction
                and s.is_active
            )
          )
          or (
            p.account_role = 'faculty'::public.account_role
            and p.faculty_verification_status = 'verified'::public.faculty_verification_status
            and p.year_of_study is null
            and (p.bio is null or char_length(p.bio) <= 500)
            and (p.availability is null or char_length(p.availability) <= 160)
            and exists (
              select 1
              from public.profile_academic_programs pap
              join public.academic_programs extra_ap
                on extra_ap.id = pap.academic_program_id
                and extra_ap.is_active
              where pap.user_id = check_user_id
                and pap.is_primary
            )
            and exists (
              select 1
              from public.faculty_expertise fe
              join public.expertise e on e.id = fe.expertise_id
              where fe.user_id = check_user_id
                and e.is_active
            )
          )
        )
    ),
    false
  );
$$;

revoke execute on function private.is_service_role_request()
  from public, anon, authenticated;
revoke execute on function private.prevent_account_role_self_verification()
  from public, anon, authenticated;
revoke execute on function private.prevent_profile_self_verification()
  from public, anon, authenticated;
revoke execute on function private.has_complete_onboarding_data(uuid)
  from public, anon, authenticated;
revoke execute on function public.save_account_role(public.account_role)
  from public, anon, authenticated;
grant execute on function public.save_account_role(public.account_role)
  to authenticated;

comment on column public.account_roles.faculty_verification_status is
  'Pre-profile Faculty verification state. Set to verified only after server-side shared-code validation or explicit admin action.';
comment on table public.faculty_verification_attempts is
  'Server-only audit and rate-limit records for shared Faculty verification attempts. Submitted codes are never stored.';
comment on function public.save_account_role(public.account_role) is
  'Stores Student role selection directly. Faculty role selection requires prior server-side Faculty verification and cannot be set by the browser alone.';
comment on function private.has_complete_onboarding_data(uuid) is
  'Central onboarding completeness predicate. Faculty onboarding can complete only after internal Faculty verification is verified.';

commit;
