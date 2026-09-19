# Mohyla Match — Data Model

Status: Canonical Phase 1 data model
Purpose: Define entities and relationships before Phase 2 SQL migrations
Important: This is not a migration file.

## 1. Modeling Principles

- Primary user identity is Supabase Auth user ID.
- Discoverable profile data is separated from sensitive contact identity.
- Corporate email is not stored in `profiles`.
- Normalized taxonomy is used for faculties, programs, skills, interests, and goals.
- Directed interactions and unordered matches are separate concepts.
- Blocks are stored directionally but enforced bilaterally.
- Admin authorization is protected data, not user-editable metadata.
- Phase 2 must implement explicit grants, RLS, constraints, indexes, and tests.

## 2. Identity And Corporate Email

Canonical Phase 1 decision:

- verified corporate email is the source identity/contact mechanism in Supabase Auth;
- `profiles` does not contain `corporate_email`;
- ordinary profile reads can never reveal corporate email;
- contact reveal derives the target email securely from verified Auth identity or a private system-derived contact projection;
- if a private contact projection is introduced in Phase 2, it is not discoverable and is populated only from verified Auth data.

Allowed signup domains:

- configurable;
- protected;
- not hardcoded to any guessed NaUKMA domain;
- enforced server/Auth-side before account creation.

## 3. Entity Overview

Core entities:

- `profiles`
- `faculties`
- `academic_programs`
- `skills`
- `profile_skills`
- `interests`
- `profile_interests`
- `collaboration_goals`
- `profile_collaboration_goals`
- `interactions`
- `matches`
- `blocks`
- `reports`
- `admin_actions`

Supporting entities likely needed in Phase 2:

- `user_roles`
- `matching_config`
- `product_events`
- `signup_email_domains`

No entity for internal messages, conversations, chat rooms, typing indicators, or message attachments exists in the MVP.

## 4. `profiles`

Purpose:

- discoverable student profile data;
- onboarding completion state;
- moderation/deletion state.

Identity:

- one profile per Auth user;
- primary key is `user_id`.

Candidate fields:

- `user_id`
- `full_name`
- `faculty_id`
- `academic_program_id`
- `year_of_study`
- `bio`
- `availability`
- `profile_status`
- `system_avatar_key`
- `onboarding_completed_at`
- `created_at`
- `updated_at`
- `deleted_at`

Rules:

- no `corporate_email`;
- no uploaded avatar path in V1;
- `faculty_id` references `faculties`;
- `academic_program_id` references `academic_programs`;
- selected academic program must belong to selected faculty;
- active/onboarded profiles are eligible for Discover unless excluded by block/suspension/deletion.

Relationships:

- one profile belongs to one faculty;
- one profile belongs to one academic program;
- one profile has many profile skills;
- one profile has many profile interests;
- one profile has many profile collaboration goals;
- one profile has many outgoing interactions;
- one profile may be in many matches;
- one profile may create blocks/reports.

## 5. `faculties`

Purpose:

- normalized faculty taxonomy;
- profile classification;
- generated/system avatar identity source.

Candidate fields:

- `id`
- `name`
- `slug`
- `avatar_theme_key`
- `is_active`
- `sort_order`
- `created_at`
- `updated_at`

Rules:

- names/slugs are unique;
- inactive faculties are not selectable for new onboarding;
- referenced faculties should be deactivated rather than deleted.

Relationships:

- one faculty has many academic programs;
- one faculty has many profiles.

## 6. `academic_programs`

Purpose:

- normalized academic program taxonomy;
- profile classification;
- generated/system avatar identity source.

Candidate fields:

- `id`
- `faculty_id`
- `name`
- `slug`
- `avatar_variant_key`
- `is_active`
- `sort_order`
- `created_at`
- `updated_at`

Rules:

- `faculty_id` references `faculties`;
- program slug is unique globally or unique within faculty, decided in migration;
- inactive programs are not selectable for new onboarding;
- referenced programs should be deactivated rather than deleted.

Relationships:

- one academic program belongs to one faculty;
- one academic program has many profiles.

## 7. `skills`

Purpose:

- controlled skill taxonomy.

Candidate fields:

- `id`
- `category`
- `name`
- `slug`
- `is_active`
- `sort_order`
- `created_at`
- `updated_at`

Rules:

- free-form user skills are out of scope;
- names/slugs are unique;
- inactive skills remain readable for historical profiles but are not selectable for new edits.

## 8. `profile_skills`

Purpose:

- connect profiles to skills with direction.

Candidate fields:

- `user_id`
- `skill_id`
- `direction`
- `created_at`

Allowed direction values:

- `offer`
- `looking_for`

Rules:

- unique `(user_id, skill_id, direction)`;
- `user_id` references `profiles`;
- `skill_id` references `skills`;
- no duplicate skill in the same direction for one user;
- same skill can appear once as `offer` and once as `looking_for` if product allows it.

Matching use:

- my `looking_for` compared with their `offer`;
- their `looking_for` compared with my `offer`.

## 9. `interests`

Purpose:

- controlled interest taxonomy.

Candidate fields:

- `id`
- `name`
- `slug`
- `is_active`
- `sort_order`
- `created_at`
- `updated_at`

Rules:

- names/slugs are unique;
- inactive interests are not selectable for new edits.

## 10. `profile_interests`

Purpose:

- many-to-many profile interests.

Candidate fields:

- `user_id`
- `interest_id`
- `created_at`

Rules:

- primary/unique key `(user_id, interest_id)`;
- `user_id` references `profiles`;
- `interest_id` references `interests`.

Matching use:

- common interests contribute 15% of score.

## 11. `collaboration_goals`

Purpose:

- controlled collaboration goal taxonomy.

Candidate fields:

- `id`
- `name`
- `slug`
- `is_active`
- `sort_order`
- `compatibility_group`
- `created_at`
- `updated_at`

Rules:

- names/slugs are unique;
- inactive goals are not selectable for new edits;
- `compatibility_group` may support compatible-not-identical goals in Matching V1.

## 12. `profile_collaboration_goals`

Purpose:

- many-to-many profile collaboration goals.

Candidate fields:

- `user_id`
- `goal_id`
- `created_at`

Rules:

- primary/unique key `(user_id, goal_id)`;
- `user_id` references `profiles`;
- `goal_id` references `collaboration_goals`.

Matching use:

- common/compatible goals contribute 15% of score.

## 13. `interactions`

Purpose:

- current directed action from one user to another.

Candidate fields:

- `source_user_id`
- `target_user_id`
- `action`
- `created_at`
- `updated_at`

Allowed action values:

- `save`
- `skip`
- `connect`

Rules:

- `source_user_id` references `profiles`;
- `target_user_id` references `profiles`;
- `source_user_id <> target_user_id`;
- unique `(source_user_id, target_user_id)`;
- updates replace the current action;
- no contradictory simultaneous rows for the same directed pair;
- source is derived from authenticated identity;
- target must be active/onboarded and not blocked.

Update semantics:

- Save -> Connect updates existing row;
- Skip -> Save updates existing row;
- Skip -> Connect updates existing row;
- withdrawal behavior is a product decision before implementation.

Analytics:

- event history belongs in `product_events`, not duplicate interaction rows.

## 14. `matches`

Purpose:

- active or historical unordered mutual match pair.

Candidate fields:

- `id`
- `user_low`
- `user_high`
- `status`
- `created_at`
- `closed_at`

Canonical unordered pair:

- `user_low` is lower UUID;
- `user_high` is higher UUID;
- require `user_low < user_high`;
- unique `(user_low, user_high)`.

Rules:

- no self-match;
- match only created from reciprocal current `connect`;
- clients cannot directly insert matches;
- duplicate concurrent creation must be idempotent;
- status may be `active`, `blocked`, or `closed`.

Contact reveal:

- active match is necessary but not sufficient;
- reveal also requires no block and both users active/onboarded.

## 15. `blocks`

Purpose:

- store directional block action.

Candidate fields:

- `blocker_user_id`
- `blocked_user_id`
- `created_at`

Rules:

- `blocker_user_id` references `profiles`;
- `blocked_user_id` references `profiles`;
- blocker cannot equal blocked;
- unique `(blocker_user_id, blocked_user_id)`;
- blocker is authenticated caller.

Access effect:

- bilateral for Discover;
- bilateral for full profile access;
- bilateral for contact reveal;
- blocks new interactions;
- precedence over match and saved state.

## 16. `reports`

Purpose:

- safety/moderation reports.

Candidate fields:

- `id`
- `reporter_user_id`
- `reported_user_id`
- `reason_code`
- `details`
- `status`
- `created_at`
- `updated_at`
- `resolved_at`

Rules:

- reporter references `profiles`;
- reported user references `profiles`;
- reporter cannot equal reported;
- details have length limits;
- normal users cannot read other users' reports;
- admin updates status through protected path.

Potential statuses:

- `open`
- `reviewing`
- `resolved`
- `dismissed`

## 17. `admin_actions`

Purpose:

- append-only audit log for admin mutations.

Candidate fields:

- `id`
- `admin_user_id`
- `action_type`
- `target_user_id`
- `report_id`
- `metadata`
- `created_at`

Rules:

- admin user must have protected admin role;
- normal users have no access;
- records are append-only;
- sensitive metadata must be minimized.

Examples:

- suspend user;
- restore user;
- update report status;
- create taxonomy item;
- deactivate taxonomy item.

## 18. Supporting `user_roles`

Purpose:

- protected authorization source.

Candidate fields:

- `user_id`
- `role`
- `created_at`

Rules:

- primary/unique key `(user_id, role)`;
- initial role: `admin`;
- not writable by normal users;
- not derived from user-editable metadata.

## 19. Supporting `matching_config`

Purpose:

- configurable Matching V1 weights.

Candidate fields:

- `version`
- `is_active`
- `my_looking_for_their_offer_weight`
- `their_looking_for_my_offer_weight`
- `common_interests_weight`
- `collaboration_goals_weight`
- `availability_weight`
- `created_at`

Canonical V1 values:

- 0.35
- 0.25
- 0.15
- 0.15
- 0.10

Rules:

- exactly one active config version;
- weights sum to 1.0;
- matching uses active config, not frontend constants.

## 20. Supporting `product_events`

Purpose:

- append-only analytics without corrupting domain state.

Candidate fields:

- `id`
- `user_id`
- `event_name`
- `subject_user_id`
- `match_id`
- `metadata`
- `created_at`

Initial events:

- signup_completed;
- email_verified;
- onboarding_completed;
- discover_action_save;
- discover_action_skip;
- discover_action_connect;
- mutual_match_created;
- email_contact_clicked;
- report_created;
- account_deleted.

Rules:

- no message content;
- minimize personal data;
- user deletion/anonymisation policy applies.

## 21. Supporting `signup_email_domains`

Purpose:

- protected domain allowlist for Auth-side signup enforcement.

Candidate fields:

- `id`
- `domain`
- `is_active`
- `created_at`
- `updated_at`

Rules:

- no guessed production domain seeded;
- normal users cannot read/write if unnecessary;
- no client env duplication as source of truth;
- Auth hook or equivalent protected server-side path consults it.

## 22. Matching V1 Data Contract

Matching result should return:

- `candidate_user_id`;
- safe candidate profile fields;
- total score;
- component scores;
- explanation items.

It must not return:

- corporate email;
- private Auth data;
- report data;
- admin data;
- blocked users;
- suspended/deleted users.

Scoring:

- 35% my looking-for <-> their offer;
- 25% their looking-for <-> my offer;
- 15% common interests;
- 15% collaboration-goal compatibility;
- 10% availability/additional compatibility.

## 23. Account Deletion And Anonymisation

Canonical MVP strategy:

- user requests deletion as self;
- server validates authenticated identity;
- profile status becomes `deleted`;
- discoverable personal fields are cleared or anonymized;
- contact reveal becomes impossible;
- profile skills/interests/goals are removed;
- outgoing interactions are removed or anonymized;
- matches are closed/made inaccessible;
- blocks are removed where safe;
- reports/admin actions retain minimized safety history;
- Auth deletion or disablement is performed after app cleanup through server-only privileged path.

Phase 2 must define exact FK `on delete` behavior to preserve audit/report needs without retaining unnecessary personal data.

## 24. Index And Constraint Notes For Phase 2

Phase 2 migrations should include:

- indexes for all foreign key columns used in joins/cascades;
- composite indexes for matching lookup paths;
- unique constraints for taxonomy slugs;
- unique constraints for profile relation tables;
- unique directed interaction pair;
- unique canonical match pair;
- check constraints for no self-interaction/block/report/match;
- RLS enabled on exposed tables before grants;
- explicit least-privilege grants.

Do not write final SQL migrations until this model is reviewed for contradictions.
