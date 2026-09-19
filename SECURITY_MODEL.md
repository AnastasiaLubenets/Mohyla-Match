# Mohyla Match — Security Model

Status: Canonical MVP security requirements

## 1. Security objective

A normal authenticated student must never be able to obtain another student's corporate email unless an authorized mutual match exists.

This must remain true when bypassing the UI and using:

- browser devtools;
- direct Data API requests;
- direct RPC calls;
- guessed record IDs.

Frontend hiding is not a security control.

## 2. Trust boundaries

Untrusted:

- browser;
- client JavaScript;
- URL/query parameters;
- form payloads;
- user metadata;
- client-provided user IDs.

Trusted only after verification:

- Supabase Auth identity;
- database constraints;
- RLS policies;
- explicit database grants;
- narrowly scoped server-side privileged code;
- audited admin authorization.

## 3. Identity

Use `auth.uid()` / validated server Auth identity for ownership decisions.

Never trust:

- `source_user_id` supplied by a client when it can be derived from Auth;
- editable `user_metadata` for admin/authorization;
- UI state indicating a match exists.

## 4. Signup restriction

The corporate-domain rule is enforced before user creation by an Auth-side/server-side mechanism.

Preferred MVP mechanism:

- Supabase Before User Created hook;
- allowlist/configuration for corporate domain;
- exact production domain left unset until confirmed.

The hook must not be callable by normal `anon` or `authenticated` roles.

Client-side domain checks are UX only.

## 5. Database exposure

For every object reachable through the Data API:

- grant only required operations;
- enable RLS;
- define explicit policies;
- test positive and negative cases.

Do not assume default grants.

Do not expose sensitive tables merely because RLS exists.

## 6. Profile privacy split

`profiles` contains discoverable attributes.

`profile_contacts` contains corporate email.

Normal authenticated users do not receive blanket read access to `profile_contacts`.

The user's own contact may be viewable through an owner-only path.

Another user's contact is available only through the dedicated match-authorization path.

## 7. Contact reveal

The contact reveal operation is a critical security boundary.

It must verify server/database-side:

- authenticated caller;
- active caller profile;
- active target profile;
- active canonical match containing caller + target;
- no disqualifying block;
- requested target is the other participant.

Return only the minimum field required: corporate email.

Never return an entire private row.

## 8. RLS policy matrix

### profiles

Authenticated:

- SELECT: eligible profile rows needed for product flows, excluding blocked/suspended visibility according to query/policy design;
- INSERT: own profile only;
- UPDATE: own profile only;
- DELETE: no arbitrary direct delete unless deletion flow explicitly handles cascades.

Admin behavior should use a separate protected path rather than broad client access.

### profile_contacts

Authenticated:

- SELECT: own row only by default;
- INSERT/UPDATE: system-controlled from verified Auth identity;
- no direct read of other rows.

### profile_skills / profile_interests / profile_collaboration_goals

Authenticated:

- read rows needed to view eligible profiles;
- create/update/delete own relations only.

### interactions

Authenticated:

- source must equal `auth.uid()`;
- may read own outgoing state;
- incoming Connect should not be generally exposed if product wants mutual action to remain implicit before match;
- target cannot be self;
- target must be eligible.

### matches

Authenticated:

- SELECT only matches where caller is one participant;
- clients do not arbitrarily INSERT match rows;
- creation happens via controlled database logic.

### blocks

Authenticated:

- create/delete own outgoing block;
- no ability to impersonate another blocker.

### reports

Authenticated:

- create report as self;
- read own report status only if product chooses;
- cannot read other users' reports.

### admin tables

Normal authenticated:

- no access.

## 9. Explicit grants

Treat grants and RLS as separate gates.

Example principle:

- revoke broad default access;
- grant only `SELECT` where reading is needed;
- grant `INSERT/UPDATE/DELETE` only where corresponding product actions exist;
- then narrow rows with RLS.

Do not use `GRANT ALL` for convenience on user-facing domain tables.

## 10. Views

Views require explicit security review.

If a view is exposed:

- prefer `security_invoker = true`;
- verify underlying RLS applies;
- grant only needed operations;
- do not expose a view that reintroduces private contact columns.

## 11. Privileged database functions

Default: prefer security-invoker behavior.

If a `SECURITY DEFINER` function is genuinely required for a narrow security boundary:

- place it outside the casually exposed surface where possible;
- set a safe `search_path`;
- derive caller from Auth;
- validate every authorization predicate internally;
- revoke execute from `PUBLIC`;
- grant execute only to the exact required role;
- return a minimal projection;
- add negative security tests;
- run database security advisors.

Never add `SECURITY DEFINER` merely to bypass a permission error.

## 12. Admin authorization

Admin rights must not live in editable profile/user metadata.

Use protected role data.

Every admin mutation:

- verifies admin authorization;
- validates target;
- writes `admin_actions`;
- is inaccessible to normal clients.

## 13. Match integrity

Database constraints enforce:

- no self-match;
- canonical pair ordering;
- unique pair;
- match creation only from reciprocal Connect state.

Concurrent reciprocal connects must not create duplicates.

## 14. Block integrity

A block must affect:

- Discover eligibility;
- relevant profile access;
- future interactions;
- contact reveal according to final product policy.

Security tests cover both A-blocks-B and B-blocks-A directions.

## 15. Input validation

Validate at two levels:

Application:

- friendly errors;
- schemas for forms/request bodies;
- length/type limits.

Database:

- NOT NULL;
- CHECK;
- UNIQUE;
- FK;
- enum/check constraints.

Do not rely on TypeScript types for security.

## 16. Secrets

Never commit:

- secret/service-role keys;
- database passwords;
- SMTP secrets;
- signing secrets.

Browser may receive only values explicitly safe for browser use, such as Supabase URL + publishable key.

## 17. Avatars

If Storage is enabled:

- user owns only their avatar path;
- validate MIME/type and maximum size;
- Storage policies restrict write/update/delete to owner;
- upsert policies must account for the privileges required by Supabase Storage behavior;
- no user-controlled arbitrary bucket/path escalation.

## 18. Account deletion

Deletion flow must be authenticated and revalidated.

It must not allow deleting another account by supplying a user ID.

Related private data must be deleted/anonymized according to defined retention rules.

## 19. Security tests — mandatory

At minimum automate/test:

1. unauthenticated user cannot access app-only domain data;
2. User A cannot update User B profile;
3. User A cannot write interactions as User B;
4. User A cannot read User B corporate email before match;
5. User A cannot obtain User B email by `select *`;
6. User A cannot obtain User B email by direct API request;
7. one-way Connect does not reveal contact;
8. reciprocal Connect creates one match;
9. active match reveals only the counterpart's contact;
10. unrelated User C cannot use A-B match to reveal contacts;
11. blocked users do not appear to each other;
12. block prevents contact reveal when required by policy;
13. duplicate match creation fails/idempotently no-ops;
14. normal user cannot access admin tables/routes;
15. suspended user cannot continue normal actions;
16. guessed IDs do not bypass access controls.

## 20. Pre-pilot security gate

Before the 20–100 user pilot:

- run Supabase database/security advisors;
- run RLS tests;
- manually test direct API calls;
- inspect browser network responses for accidental email leakage;
- verify source maps/build output contain no secrets;
- verify production signup restriction;
- verify account deletion;
- verify admin isolation.

No pilot release if the pre-match corporate email test fails.
