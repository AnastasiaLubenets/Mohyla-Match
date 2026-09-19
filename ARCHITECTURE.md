# Mohyla Match — Architecture

Status: Canonical architecture for Web/PWA MVP

## 1. Goals

The architecture must be:

- production-oriented;
- maintainable by a small team;
- low-cost for a ~4,000-student target;
- secure by default;
- compatible with a future native mobile client;
- simple enough for a pilot;
- free of infrastructure that is not needed for the MVP.

## 2. High-level architecture

```text
Browser / installed PWA
        |
        v
React / Next.js web application
        |
        +---- Supabase Auth
        |
        +---- Supabase Data API / RPC
        |
        +---- Server-only application routes for privileged operations
        |
        v
Supabase PostgreSQL
  - relational data
  - RLS
  - constraints
  - DB functions/triggers where appropriate
  - optional Storage for avatars only
```

No internal realtime messaging layer is part of the MVP.

## 3. Frontend

Use a current stable Next.js App Router release with:

- React;
- TypeScript in strict mode;
- responsive/mobile-first UI;
- server/client component boundaries chosen deliberately;
- accessible semantic HTML;
- CSS design tokens;
- Tailwind CSS may be used for implementation speed, but product styling must be owned by Mohyla Match rather than default library appearance.

Package versions must be pinned in the lockfile.

### Recommended source layout

```text
src/
  app/
    (public)/
    (auth)/
    (app)/
    admin/
    api/
  components/
    ui/
    layout/
  features/
    auth/
    onboarding/
    profiles/
    discover/
    interactions/
    matches/
    safety/
    admin/
  lib/
    supabase/
    auth/
    validation/
    config/
  types/
  styles/
```

Keep domain logic in feature/lib modules rather than in page components.

## 4. PWA

PWA is desirable when it does not delay the core pilot.

Minimum later requirements:

- web app manifest;
- installable metadata/icons;
- safe caching strategy;
- no caching of sensitive authenticated API responses.

Offline-first behavior is not an MVP requirement.

## 5. Backend

Supabase provides:

- PostgreSQL;
- Supabase Auth;
- Data API;
- Row Level Security;
- Storage only for avatars if avatars are enabled.

No additional backend service is introduced unless a concrete requirement cannot be implemented safely with this stack.

## 6. Authentication architecture

Production Auth:

- email-based authentication;
- email confirmation enabled;
- anonymous sign-in disabled;
- allowed corporate domain stored as configuration/data;
- exact NaUKMA domain remains unset until confirmed.

The allowed-domain rule must be enforced before account creation using an Auth-side/server-side rule (preferred: Supabase Before User Created hook backed by an allowlist/config value), not only by frontend validation.

Frontend validation exists only for fast feedback.

## 7. Supabase client strategy

Use separate browser and server Supabase client factories.

Rules:

- browser receives only the publishable key;
- secret/service-role keys never enter browser bundles;
- server requests validate the authenticated user rather than trusting client-supplied user IDs;
- authorization never relies on editable `user_metadata`.

If SSR auth helpers are used, follow current Supabase guidance and pin versions because SSR helper APIs may change.

## 8. Data-access strategy

Prefer direct Supabase Data API access from authenticated clients only for operations whose table grants + RLS fully express the authorization rule.

Use server-only routes or narrowly scoped RPC functions for privileged/sensitive operations.

Every exposed table gets:

1. explicit least-privilege `GRANT`;
2. RLS enabled;
3. explicit policies;
4. tests.

Do not assume newly created tables are automatically exposed to the Data API.

## 9. Corporate-email isolation

Product rule: another user's corporate email is unavailable until mutual match.

Logical profile data includes the corporate email, but the physical schema isolates contact data from discoverable profile data.

Recommended physical split:

- `profiles`: discoverable profile attributes;
- `profile_contacts`: corporate email, one row per user, private.

Why:

- RLS is row-level, not field-level;
- keeping sensitive contact data outside the normally discoverable row removes accidental `select *` exposure;
- the reveal operation becomes explicit and testable.

Only an explicitly authorized contact-reveal path may return the other user's email, and only when an active mutual match exists.

This is an implementation/security normalization, not a product-flow change.

## 10. Matching architecture

Matching V1 is deterministic and centralized so web and future mobile clients use the same rules.

Recommended implementation:

- normalized relational input tables;
- one database RPC/query layer that computes candidate compatibility;
- configurable weights stored in a settings table or a single versioned DB configuration;
- result returns:
  - candidate user ID;
  - score;
  - component scores;
  - explanation keys/data.

Do not persist every calculated score unless measurement proves it necessary.

At ~4,000 users, compute-on-read with proper indexes is preferable to premature infrastructure.

## 11. Interaction model

One current interaction state per directed user pair:

`(source_user_id, target_user_id) -> skip | save | connect`

A unique constraint prevents duplicate current-state rows.

Changing an action updates the current state.

If event-level metrics are required, append an immutable product event separately instead of allowing contradictory interaction rows.

## 12. Match creation

A match is created only after reciprocal `connect`.

Database guarantees:

- canonical pair ordering;
- `user_a != user_b`;
- unique pair;
- transaction-safe creation;
- idempotent `ON CONFLICT DO NOTHING` behavior or equivalent.

This rule is enforced in database logic, not only in frontend code.

## 13. Blocking

A block row is directional:

- blocker;
- blocked.

Visibility/effect is bilateral:

- exclude candidates where either direction contains a block;
- block access to relevant user-to-user surfaces;
- do not expose matched contact data after a block if product policy marks the match inaccessible.

## 14. Admin

Admin privileges are not inferred from a client-controlled profile field.

Use a protected role/authorization source and server-side checks.

Admin actions write to an append-only audit log.

## 15. Storage

Storage is used only if avatars are enabled.

Rules:

- user can upload/update only own avatar object;
- validate type and size;
- randomized/canonical path owned by user ID;
- no executable content assumptions;
- public vs signed URL decision must match profile privacy.

For MVP, public avatars are acceptable only if product accepts the avatar itself as non-sensitive. Otherwise use signed access.

## 16. Environment strategy

Never commit secrets.

Expected local variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
ALLOWED_EMAIL_DOMAIN=
SUPABASE_SECRET_KEY=
```

Notes:

- `SUPABASE_SECRET_KEY` is server-only and may not be necessary for most app paths.
- Do not use a secret/service-role key for operations that can be expressed with the user's JWT + RLS.
- Production/staging values are stored in hosting/Supabase environment settings, not Git.

## 17. Environments

Minimum environments:

- local development;
- staging/pilot;
- production.

Before public launch, staging and production must not share real user data.

Schema changes are migration-driven and reproducible.

## 18. Git strategy

Primary branch: `main`.

Working changes:

- short-lived feature/foundation branches;
- pull request into `main`;
- CI required before merge once code exists.

Initial foundation branch:

`phase-0-1-foundation`

## 19. CI quality gates

Once the app is scaffolded, GitHub Actions should run:

- install from lockfile;
- lint;
- TypeScript typecheck;
- unit tests;
- build;
- database/security tests when practical.

Do not call work complete when the build/tests have not been run.

## 20. Hosting

Preferred MVP approach:

- frontend: Vercel free/low-cost tier or an equivalent Next.js-capable host;
- backend: Supabase;
- no always-on custom server.

Deployment choice remains replaceable because business rules and permissions live in reusable backend/database layers.

## 21. Observability

MVP:

- hosting deployment logs;
- Supabase logs/advisors;
- structured app errors where useful.

Do not introduce paid observability until the pilot creates a demonstrated need.

## 22. Future mobile compatibility

Future iOS/Android clients must be able to reuse:

- Supabase Auth;
- relational schema;
- RLS;
- matching RPC/query contract;
- interaction rules;
- match rules;
- contact-reveal authorization.

Do not place canonical matching/security logic exclusively in React UI code.

## 23. Architecture decisions frozen for MVP

- Web/PWA first.
- Next.js + TypeScript frontend.
- Supabase backend.
- No internal chat.
- No AI matching.
- No separate microservice.
- No realtime presence/messaging.
- Matching logic centralized outside presentation components.
- Corporate contact information isolated from discoverable profiles.
- Explicit grants + RLS on exposed database objects.
