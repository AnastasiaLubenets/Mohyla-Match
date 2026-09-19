# Mohyla Match — Security Model

Status: Canonical Phase 1 security model
Primary objective: corporate email is never readable before authorized mutual match

## 1. Security Objective

A user must never be able to obtain another student's corporate email unless an active mutual match exists and no block/suspension/deletion disqualifies the pair.

This must remain true through:

- UI usage;
- browser devtools;
- direct Supabase Data API requests;
- direct RPC calls;
- guessed UUIDs;
- `select *` attempts;
- manipulated request payloads.

Frontend hiding is not a security control.

## 2. Trust Boundaries

Untrusted:

- browser;
- client JavaScript;
- form payloads;
- URL parameters;
- request body user IDs;
- editable user metadata;
- UI state;
- local storage;
- source maps.

Trusted only after verification:

- Supabase Auth session;
- `auth.uid()` / validated server identity;
- database constraints;
- explicit grants;
- Row Level Security;
- narrowly scoped database functions;
- server-only privileged code;
- protected admin role storage.

## 3. Role And State Definitions

### Anonymous

No verified session.

### Authenticated

Has a valid Supabase Auth session, but may not have completed onboarding.

### Onboarded Student

Authenticated user with active profile and required onboarding complete.

### Matched Student

Onboarded student who is one side of an active match with another active onboarded student.

### Blocked User

A user in a pair where either side has an active block against the other. Blocking is stored directionally but access effect is bilateral.

### Suspended User

Profile/account moderation state is `suspended`.

### Deleted User

Profile/account state is `deleted`; profile is no longer discoverable or actionable.

### Admin

Authenticated user with protected admin role stored outside editable metadata.

## 4. Global Rules

- Every exposed table must use explicit grants plus RLS.
- RLS must not rely on editable `user_metadata`.
- Client-provided user IDs are never trusted for ownership.
- Normal users cannot read private admin/report/contact data.
- All ownership decisions use verified identity.
- All state-changing operations validate active/suspended/deleted/block state.
- `corporate_email` is not in `profiles`.
- Contact reveal returns only the counterpart email, never a private row.
- Privileged functions must be narrow, audited, and unavailable to `PUBLIC` unless intentionally granted.

## 5. Anonymous Permissions

Anonymous may:

- SELECT public landing/terms/privacy content served by the app;
- INSERT Auth signup/login requests through Supabase Auth only.

Anonymous may not:

- SELECT product tables;
- INSERT profiles/interactions/reports/blocks;
- UPDATE or DELETE product data;
- call contact reveal;
- access admin routes;
- access corporate email.

Database posture:

- no broad `anon` grants on product tables;
- public static content should not require product-table access.

## 6. Authenticated But Not Onboarded Permissions

Authenticated users may:

- SELECT own Auth/session state through supported Auth APIs;
- INSERT own profile during onboarding;
- UPDATE own incomplete profile fields;
- SELECT active taxonomy data needed for onboarding:
  - faculties;
  - academic programs;
  - skills;
  - interests;
  - collaboration goals.

Authenticated users may not:

- SELECT Discover candidates;
- SELECT other profiles except minimal data required by onboarding if any;
- INSERT interactions;
- INSERT matches;
- SELECT matches;
- reveal contacts;
- access reports except creating a report only after target access exists;
- access admin data.

## 7. Onboarded Student Permissions

### Profiles

May SELECT:

- own profile;
- safe eligible profile projections for Discover/full-profile flows;
- profiles where access is not blocked, suspended, deleted, or otherwise ineligible.

May INSERT:

- own profile only, if not already present.

May UPDATE:

- own editable profile fields only.

May DELETE:

- no direct arbitrary row delete;
- account deletion must go through the authenticated deletion flow.

### Faculty / Academic Program / Taxonomy Tables

May SELECT:

- active faculties;
- active academic programs;
- active skills;
- active interests;
- active collaboration goals.

May not INSERT/UPDATE/DELETE taxonomy records.

### Profile Skill/Interest/Goal Relations

May SELECT:

- own relations;
- safe relations needed to render eligible profiles.

May INSERT/UPDATE/DELETE:

- own relations only;
- only active taxonomy references;
- no relations for another user.

### Interactions

May SELECT:

- own outgoing interactions;
- own saved list;
- match-relevant state only through safe projections.

May INSERT/UPDATE:

- current directed interaction as self;
- source must be derived from `auth.uid()`;
- target must be eligible, active, not self, and not blocked.

May DELETE:

- own outgoing interaction only if the product exposes remove/withdraw behavior;
- otherwise action changes are UPDATE semantics.

### Matches

May SELECT:

- active matches where caller is `user_low` or `user_high`;
- safe match summary projections.

May not INSERT/UPDATE/DELETE matches directly.

Match creation is controlled by database/server logic after reciprocal Connect.

### Blocks

May SELECT:

- own outgoing block list;
- block effects through safe eligibility projections.

May INSERT:

- own outgoing block only;
- blocker must be `auth.uid()`;
- blocked user cannot be self.

May DELETE:

- own outgoing block if unblock is supported.

May not UPDATE block ownership.

### Reports

May INSERT:

- report as self against another eligible/reachable user;
- reason is required;
- details are optional with length limits.

May SELECT:

- own submitted report status only if product exposes it.

May not UPDATE/DELETE reports.

## 8. Matched Student Permissions

Matched students inherit onboarded-student permissions.

Additional permitted SELECT:

- authorized counterpart corporate email through contact reveal path only;
- only if match is active;
- only if both users are active/onboarded;
- only if neither side has blocked the other.

Matched students may not:

- SELECT arbitrary contact rows;
- SELECT corporate emails for unrelated users;
- use one match to reveal a third user;
- receive contact data in ordinary profile queries.

## 9. Blocked User Effects

When either A blocks B or B blocks A:

- neither sees the other in Discover;
- neither can open normal full profile access for the other;
- neither can create or update interactions with the other;
- neither can reveal corporate email for the other;
- existing match contact actions are disabled;
- report/admin history may still retain necessary safety data.

Blocked state has precedence over match state.

## 10. Suspended User Effects

Suspended users:

- may authenticate only to see account status if implemented;
- may not appear in Discover;
- may not be selected as interaction targets;
- may not create/update interactions;
- may not reveal contacts;
- may not edit profile;
- may not submit normal product actions;
- may not access admin unless separately granted and still active by admin policy.

Other users:

- do not see suspended users in Discover/Saved/Matches as actionable profiles;
- cannot reveal suspended users' corporate emails.

Admin:

- may SELECT suspended user admin records;
- may UPDATE suspension state through protected path;
- must write admin audit log.

## 11. Deleted User Effects

Deleted users:

- are not discoverable;
- cannot perform product actions;
- cannot be contact-revealed;
- appear only as minimized/anonymized historical references where needed for audit/report retention.

Deletion flow:

- authenticated self-service only;
- server-side identity revalidation;
- no client-supplied target user ID;
- app data cleanup/anonymization before or alongside Auth deletion/disablement;
- report/admin audit retention minimized and policy-driven.

## 12. Admin Permissions

Admin rights are stored in protected role data, such as `user_roles`.

Admin may SELECT:

- user administration views;
- reports;
- taxonomy records;
- admin action logs;
- basic metrics.

Admin may INSERT:

- taxonomy records;
- admin action records through the admin action path;
- moderation notes if implemented.

Admin may UPDATE:

- user suspension/restoration state;
- report status;
- taxonomy active/name/slug/category fields;
- academic program/faculty active fields.

Admin may DELETE:

- generally no hard deletes in MVP;
- taxonomy records should be deactivated, not deleted, once referenced;
- destructive admin operations require a separate decision and audit trail.

Admin may not:

- rely on editable metadata for authorization;
- use broad service-role endpoints from browser;
- bypass email privacy without an explicit audited privileged path.

## 13. Entity Permission Summary

| Entity | Anonymous | Authenticated not onboarded | Onboarded student | Matched student | Admin |
|---|---|---|---|---|---|
| `profiles` | none | insert/update own onboarding profile | select eligible, insert/update own | same | admin view/update moderation state |
| `faculties` | none | select active | select active | select active | manage |
| `academic_programs` | none | select active | select active | select active | manage |
| `skills` | none | select active | select active | select active | manage |
| `profile_skills` | none | manage own onboarding rows | manage own, select eligible projections | same | admin inspect |
| `interests` | none | select active | select active | select active | manage |
| `profile_interests` | none | manage own onboarding rows | manage own, select eligible projections | same | admin inspect |
| `collaboration_goals` | none | select active | select active | select active | manage |
| `profile_collaboration_goals` | none | manage own onboarding rows | manage own, select eligible projections | same | admin inspect |
| `interactions` | none | none | manage own outgoing only | same | inspect/moderate through protected path |
| `matches` | none | none | select own only | select own and reveal counterpart via path | inspect/moderate through protected path |
| `blocks` | none | none | manage own outgoing only | same | inspect for safety |
| `reports` | none | none | insert own; optional select own status | same | triage/update status |
| `admin_actions` | none | none | none | none | select/insert through admin path |
| contact email | none | own Auth only | own only | counterpart through reveal path | only via explicit audited need |

## 14. Corporate Email Security

Corporate email must never be readable from:

- `profiles`;
- normal Discover projections;
- full profile projections;
- saved profile projections;
- match list summaries before reveal action;
- taxonomy tables;
- generic `select *`;
- browser bundle;
- public env vars.

Authorized reveal path must verify:

1. caller is authenticated;
2. caller is active and onboarded;
3. target is active and onboarded;
4. caller and target are distinct;
5. active canonical match exists for the unordered pair;
6. no block exists in either direction;
7. returned email belongs to target only.

The reveal output is:

- corporate email;
- optional display name for UI context.

It is not:

- full Auth row;
- full contact row;
- list of all matched contacts;
- report/admin/private data.

## 15. Match Integrity

Database/server logic must enforce:

- `user_low < user_high`;
- unique `(user_low, user_high)`;
- no self-match;
- match only from reciprocal current `connect`;
- duplicate concurrent creation is harmless/idempotent.

Clients must not directly INSERT matches.

## 16. Interaction Integrity

Database/server logic must enforce:

- `source_user_id <> target_user_id`;
- unique `(source_user_id, target_user_id)`;
- source equals authenticated user;
- target is active/onboarded and not blocked;
- action is one of `save`, `skip`, `connect`;
- updates replace current state rather than creating contradictory rows.

## 17. Block Integrity

Database/server logic must enforce:

- blocker equals authenticated user;
- blocked user is not self;
- unique `(blocker_user_id, blocked_user_id)`;
- block affects both directions for visibility/contact;
- block checks are included in Discover, profile, interaction, match, and contact-reveal paths.

## 18. Signup Domain Security

The allowed corporate domain rule must be enforced server/Auth-side before account creation.

Rules:

- no hardcoded guessed NaUKMA domain;
- no client-only enforcement;
- protected allowlist/configuration;
- no normal user write access to domain configuration;
- Phase 2 database foundation stores the protected allowlist table;
- Auth hook or equivalent server-side enforcement is wired in the auth integration phase.

## 19. Data Validation

Application validation provides user-friendly errors.

Database validation enforces security invariants:

- NOT NULL;
- CHECK constraints;
- UNIQUE constraints;
- foreign keys;
- length limits;
- enum/check-constrained statuses;
- canonical pair ordering.

TypeScript types do not replace database constraints.

## 20. Security Tests Required Before Pilot

Phase 2+ must include tests proving:

1. anonymous user cannot read product tables;
2. authenticated non-onboarded user cannot access Discover;
3. user cannot update another user's profile;
4. user cannot write interactions as another user;
5. one-way Connect does not reveal contact;
6. reciprocal Connect creates one match;
7. duplicate A/B and B/A match cannot exist;
8. user cannot read another email through profiles;
9. user cannot read another email through direct Data API calls;
10. user cannot read another email through guessed UUIDs;
11. matched user can reveal only counterpart email;
12. unrelated third user cannot use another pair's match;
13. block prevents Discover/profile/contact access both directions;
14. suspended user cannot perform normal product actions;
15. deleted user is not discoverable/contactable;
16. normal user cannot access admin tables/routes;
17. admin actions write audit records;
18. signup domain enforcement rejects disallowed domains.

No pilot release if the pre-match corporate email test fails.
