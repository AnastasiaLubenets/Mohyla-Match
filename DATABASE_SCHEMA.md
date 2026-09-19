# Mohyla Match — Database Schema Design

Status: Phase 1 logical/physical schema proposal  
Implementation: Phase 2 migrations

## 1. Conventions

- Primary user identity comes from `auth.users.id` (UUID).
- Application user IDs reference `auth.users(id)`.
- Timestamps use `timestamptz`.
- Mutable tables use `created_at` / `updated_at` where useful.
- Taxonomies use stable IDs plus unique names/slugs.
- All exposed tables use explicit grants and RLS.
- Hard security invariants also use constraints/triggers/functions, not only UI validation.

## 2. Enums / constrained values

Prefer database enums or check constraints only for small, genuinely stable values.

Candidate stable values:

`profile_status`
- active
- suspended
- deleted

`skill_direction`
- offer
- looking_for

`interaction_action`
- connect
- save
- skip

`match_status`
- active
- blocked
- closed

`report_status`
- open
- reviewing
- resolved
- dismissed

## 3. profiles

Discoverable profile fields only.

Suggested columns:

- `user_id uuid primary key references auth.users(id)`
- `full_name text not null`
- `academic_program text not null`
- `year_of_study smallint not null`
- `bio text null`
- `avatar_path text null`
- `availability text/null-or-controlled-value`
- `profile_status ... not null default active`
- `onboarding_completed_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- sensible length limits;
- year range validated;
- user owns exactly one profile.

### Corporate email note

The canonical product model treats corporate email as profile/contact data. Physically it is stored in `profile_contacts` rather than in discoverable `profiles` so that normal profile reads cannot accidentally disclose it.

## 4. profile_contacts

Private one-to-one contact data.

Columns:

- `user_id uuid primary key references auth.users(id) on delete cascade`
- `corporate_email text not null unique`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Rules:

- email originates from verified Auth identity;
- user does not manually type an arbitrary replacement;
- direct other-user reads are denied;
- contact reveal is performed only through an authorization path that verifies active mutual match.

## 5. skills

Controlled taxonomy.

Columns:

- `id bigint generated ... primary key`
- `category text not null`
- `name text not null`
- `slug text not null unique`
- `is_active boolean not null default true`
- timestamps

Unique constraint should prevent duplicate normalized names/slugs.

## 6. profile_skills

Columns:

- `user_id uuid not null references profiles(user_id) on delete cascade`
- `skill_id ... not null references skills(id)`
- `direction skill_direction not null`
- `created_at timestamptz not null default now()`

Primary/unique key:

`(user_id, skill_id, direction)`

Indexes:

- `(skill_id, direction, user_id)`
- `(user_id, direction)`

## 7. interests

Columns:

- `id ... primary key`
- `name text not null`
- `slug text not null unique`
- `is_active boolean not null default true`
- timestamps

## 8. profile_interests

Columns:

- `user_id uuid not null references profiles(user_id) on delete cascade`
- `interest_id ... not null references interests(id)`
- `created_at timestamptz not null default now()`

Primary key:

`(user_id, interest_id)`

## 9. collaboration_goals

Columns:

- `id ... primary key`
- `name text not null`
- `slug text not null unique`
- `is_active boolean not null default true`
- timestamps

## 10. profile_collaboration_goals

Many-to-many for future flexibility even if UI initially emphasizes a small number of selections.

Columns:

- `user_id uuid not null references profiles(user_id) on delete cascade`
- `goal_id ... not null references collaboration_goals(id)`
- `created_at timestamptz not null default now()`

Primary key:

`(user_id, goal_id)`

## 11. interactions

Represents the current directed action from one user to another.

Columns:

- `source_user_id uuid not null references profiles(user_id) on delete cascade`
- `target_user_id uuid not null references profiles(user_id) on delete cascade`
- `action interaction_action not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- `source_user_id <> target_user_id`
- unique `(source_user_id, target_user_id)`

Indexes:

- `(source_user_id, action)`
- `(target_user_id, action)`

Behavior:

- Save → Connect updates the same pair row.
- Skip → Connect updates the same pair row.
- Contradictory simultaneous rows are impossible.

## 12. matches

Columns:

- `id uuid primary key`
- `user_a uuid not null references profiles(user_id)`
- `user_b uuid not null references profiles(user_id)`
- `status match_status not null default active`
- `created_at timestamptz not null default now()`
- optional `closed_at timestamptz`

Constraints:

- `user_a <> user_b`
- canonical ordering `user_a < user_b`
- unique `(user_a, user_b)`

Creation rule:

Insert only when both directed interactions are `connect`.

Use transaction-safe database logic; duplicate concurrent creation is absorbed by unique constraint.

## 13. blocks

Columns:

- `blocker_user_id uuid not null references profiles(user_id) on delete cascade`
- `blocked_user_id uuid not null references profiles(user_id) on delete cascade`
- `created_at timestamptz not null default now()`

Constraints:

- blocker != blocked
- unique `(blocker_user_id, blocked_user_id)`

All discover/profile/match-contact queries must exclude pairs with a block in either direction according to product policy.

## 14. reports

Columns:

- `id uuid primary key`
- `reporter_user_id uuid not null references profiles(user_id)`
- `reported_user_id uuid not null references profiles(user_id)`
- `reason_code text not null`
- `details text null`
- `status report_status not null default open`
- `created_at timestamptz not null default now()`
- `resolved_at timestamptz null`

Constraints:

- reporter != reported;
- length limits on details.

## 15. user_roles

Protected authorization table.

Columns:

- `user_id uuid not null references auth.users(id) on delete cascade`
- `role text not null`
- `created_at timestamptz not null default now()`

Primary key:

`(user_id, role)`

Initial role:

- admin

Not writable by normal authenticated users.

## 16. admin_actions

Append-only audit log.

Columns:

- `id uuid primary key`
- `admin_user_id uuid not null`
- `action_type text not null`
- `target_user_id uuid null`
- `report_id uuid null`
- `metadata jsonb not null default '{}'`
- `created_at timestamptz not null default now()`

Normal app users have no access.

## 17. matching_config

Stores V1 weights without hardcoding them across application code.

Columns:

- `version integer primary key`
- `is_active boolean not null`
- `my_need_their_offer_weight numeric not null`
- `their_need_my_offer_weight numeric not null`
- `interests_weight numeric not null`
- `goals_weight numeric not null`
- `availability_weight numeric not null`
- `created_at timestamptz not null default now()`

Constraint:

weights total 1.0 (or 100, choose one convention during migration and enforce it).

Initial values:

- 0.35
- 0.25
- 0.15
- 0.15
- 0.10

## 18. product_events

Lightweight append-only measurement table so rates/retention can be computed without corrupting domain state.

Candidate columns:

- `id bigint generated ... primary key`
- `user_id uuid null`
- `event_name text not null`
- `subject_user_id uuid null`
- `match_id uuid null`
- `metadata jsonb not null default '{}'`
- `created_at timestamptz not null default now()`

Initial events may include:

- signup_completed
- onboarding_completed
- discover_action_connect
- discover_action_save
- discover_action_skip
- mutual_match_created
- email_contact_clicked
- report_created

Do not store message content or unnecessary personal data.

## 19. Allowed signup domain configuration

The exact NaUKMA corporate domain remains unconfirmed.

Use a protected configuration mechanism/table for the Auth hook, for example:

`signup_email_domains`

- domain
- rule/active state
- timestamps

Seed with no invented production domain.

## 20. Matching query contract

A reusable matching query/RPC should return a safe projection only:

- candidate_user_id
- public profile fields
- total_score
- component scores
- explanation data

It must not return:

- corporate_email;
- admin data;
- report data;
- private Auth data.

## 21. Contact reveal contract

Input:

- authenticated caller;
- matched user ID.

Checks:

1. caller exists and is active;
2. target exists and is active;
3. caller != target;
4. an active match exists for canonical pair;
5. no disqualifying block state exists.

Output:

- target corporate email only.

This path receives dedicated security tests.

## 22. Delete account

Account deletion must define:

- Auth user deletion;
- profile/contact cascade;
- interaction cleanup;
- block cleanup;
- report retention/anonymization policy;
- admin audit retention policy;
- product analytics minimization.

Exact legal retention policy is finalized before production launch; MVP implementation should avoid storing unnecessary data that complicates deletion.

## 23. Seed data

Phase 2 seed must include:

- skill taxonomy;
- interests;
- collaboration goals;
- matching config.

Test-only seed may include synthetic students.

Never seed a guessed production email domain.
