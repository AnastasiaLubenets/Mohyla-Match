# Mohyla Match — Architecture

Status: Canonical Phase 1 architecture
Scope: Responsive Web/PWA MVP with reusable Supabase backend

## 1. Architecture Goals

The MVP architecture must be:

- secure by default;
- maintainable by a small team;
- low-cost for an approximately 4,000-student pilot;
- simple enough to ship without unnecessary infrastructure;
- compatible with a future native mobile client;
- explicit about privacy boundaries;
- free of internal chat/messaging architecture.

## 2. High-Level System

```text
Browser / installed PWA
        |
        v
Next.js App Router web application
        |
        +-- Supabase Auth
        +-- Supabase Data API / RPC
        +-- Server-only route handlers / server actions when needed
        |
        v
Supabase PostgreSQL
  - relational product data
  - explicit grants
  - Row Level Security
  - constraints and indexes
  - database functions/triggers for invariants where appropriate
```

Supabase Storage is not required for V1 profile photos because user-uploaded profile photos are out of scope. Storage may be used later for approved design assets or future avatar work only after a separate decision.

No internal chat, realtime messaging, typing indicators, online presence, or message storage exists in the architecture.

## 3. Frontend Architecture

Frontend stack:

- Next.js App Router;
- React;
- TypeScript strict mode;
- Tailwind CSS for implementation speed;
- mobile-first responsive UI;
- route groups as needed for public/authenticated/admin sections.

The frontend owns:

- rendering screens;
- form UX and client-side validation feedback;
- calling safe Supabase clients, RPCs, and server routes;
- navigation between Discover, Saved, Matches, and Profile;
- opening `mailto:` links after authorized contact reveal.

The frontend must not own:

- authorization decisions;
- corporate email reveal logic;
- match creation invariants;
- admin authorization;
- signup-domain enforcement;
- trust in client-provided user IDs.

Domain logic should live in feature/lib modules or backend/database contracts, not directly inside page components.

## 4. Next.js App Router Boundaries

Use Server Components by default for static or server-rendered UI.

Use Client Components only for:

- interactive form state;
- local UI transitions;
- client-side Supabase operations that are fully protected by RLS;
- browser-only actions such as `mailto:`.

Use server-only route handlers or server actions for:

- privileged administrative operations;
- account deletion orchestration;
- contact reveal when the implementation needs a server-side boundary;
- operations requiring secret keys;
- operations where client-supplied IDs must be re-derived from verified identity.

Default runtime:

- Node.js runtime unless a specific Edge requirement is proven.

## 5. Supabase Backend Responsibilities

Supabase provides:

- PostgreSQL;
- Supabase Auth;
- Data API;
- RPC functions where needed;
- Row Level Security;
- explicit grants;
- local development configuration.

Supabase Auth is responsible for:

- verified email identity;
- session issuance;
- email confirmation;
- rejecting unconfirmed or disallowed signup paths when the Auth hook/server signup integration is implemented.

PostgreSQL is responsible for:

- relational state;
- constraints;
- unique directed interaction rows;
- canonical unordered match pairs;
- block precedence checks;
- RLS enforcement;
- admin role storage;
- audit log storage;
- deterministic matching inputs and configuration.

## 6. Browser Supabase Client

The browser client:

- uses only `NEXT_PUBLIC_SUPABASE_URL`;
- uses only `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`;
- never receives a secret/service-role key;
- can call exposed tables/RPCs only when explicit grants and RLS make the operation safe;
- may read safe profile projections;
- may manage the current user's own profile and own interaction state through RLS-protected paths.

The browser client must not:

- read `auth.users`;
- read another user's corporate email;
- decide admin status;
- supply trusted `source_user_id` values;
- bypass server/database validation.

## 7. Server Supabase Client

The server client:

- uses cookie-based SSR/session handling;
- validates user identity server-side for protected routes;
- may use a server-only privileged key only when the operation cannot be expressed safely with user JWT + RLS;
- keeps privileged keys outside browser bundles;
- derives caller identity from verified session, not request payload.

Server-only code is required for:

- account deletion/cleanup;
- admin mutations;
- contact reveal if implemented outside a narrowly scoped database RPC;
- any operation that touches protected Auth/admin/contact data.

## 8. Authorization Boundaries

Authorization must be enforced in database/server rules.

Frontend hiding is not a security boundary.

Required enforcement layers:

- explicit database grants;
- RLS on all exposed tables;
- constraints for invariants;
- transaction-safe match creation;
- protected admin role storage;
- server-only privileged code where unavoidable;
- negative security tests.

Use direct Data API access only when table grants plus RLS fully express the rule.

Use RPC/server routes for:

- match creation side effects;
- contact reveal;
- admin actions;
- account deletion;
- any sensitive projection that must not expose whole rows.

## 9. Data API Exposure

New user-facing tables must not rely on automatic exposure.

Phase 2 should:

- grant schema/table access intentionally;
- enable RLS before granting client roles access;
- prefer narrow projections/RPCs for sensitive flows;
- never grant broad `ALL` access for convenience;
- never expose private contact, report, or admin tables to normal users.

## 10. Corporate Email Architecture

Corporate email is sensitive contact data.

Canonical source:

- verified Supabase Auth identity.

Discoverable profile data:

- never contains corporate email.

Reveal path:

- accepts authenticated caller and target user;
- verifies active mutual match;
- verifies no block in either direction;
- verifies both accounts are active/onboarded;
- returns only the target corporate email;
- never returns arbitrary Auth/private rows.

If Phase 2 introduces a private derived contact table for implementation convenience, it must be system-populated from verified Auth state, inaccessible to normal list/read queries, and treated as sensitive contact data.

## 11. Matching Architecture

Matching V1 is deterministic and centralized.

Inputs:

- profile skills with direction `offer`;
- profile skills with direction `looking_for`;
- interests;
- collaboration goals;
- availability;
- profile eligibility state;
- blocks and suspensions.

Weights:

- 35% my looking-for <-> their offer;
- 25% their looking-for <-> my offer;
- 15% common interests;
- 15% collaboration-goal compatibility;
- 10% availability/additional compatibility.

Rules:

- no AI;
- no embeddings;
- no vector search;
- weights are stored in configuration/data;
- score output includes component scores and explanation items;
- matching code must be reusable by future mobile clients;
- at MVP scale, compute-on-read with indexes is preferred over a separate recommendation service.

## 12. Interaction Architecture

Interactions represent current directed state:

`source_user_id -> target_user_id`

Allowed actions:

- `save`;
- `skip`;
- `connect`.

Persistence rule:

- one row per directed pair;
- unique `(source_user_id, target_user_id)`;
- action changes update the row;
- analytics use separate append-only events.

The database/server must derive or verify `source_user_id` from authenticated identity.

## 13. Match Architecture

Matches represent unordered pairs.

Canonical representation:

- `user_low` stores the lower UUID;
- `user_high` stores the higher UUID;
- check `user_low < user_high`;
- unique `(user_low, user_high)`;
- no self-match.

Creation:

- only after reciprocal current `connect`;
- transaction-safe;
- idempotent for concurrent requests;
- enforced in database/server logic, not only in UI.

## 14. Blocking Architecture

Block row:

- directional storage: blocker -> blocked.

Access effect:

- bilateral visibility exclusion;
- blocks Discover in both directions;
- blocks full profile access in both directions;
- blocks contact reveal in both directions;
- blocks new interactions in both directions.

Block precedence is higher than match/contact state.

## 15. Account States

Profile/account states:

- active;
- suspended;
- deleted.

Suspended accounts:

- retained for admin review;
- excluded from Discover and contact reveal;
- blocked from normal product mutations.

Deleted accounts:

- removed from product experience;
- profile fields minimized/anonymized;
- contact data no longer revealable;
- relationships cleaned or made inaccessible;
- retained moderation/audit data minimized according to policy.

## 16. Admin Architecture

Admin role storage:

- protected database table such as `user_roles`;
- not editable by users;
- not inferred from `user_metadata`;
- not trusted from client-supplied data.

Admin operations:

- performed through server/database-protected paths;
- revalidate admin role server-side;
- write append-only `admin_actions`;
- avoid broad privileged endpoints.

## 17. Avatar Architecture

V1 has no user-uploaded profile photos.

Generated/system avatars:

- derived from faculty and academic program data;
- use deterministic visual variants;
- use data-backed faculty/program taxonomy;
- can be rendered by the frontend without storing uploaded files.

Future design assets:

- can be static app assets or controlled storage assets;
- do not require changing the core user/profile/contact schema.

## 18. Configuration And Environment Strategy

Local/browser-safe variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Optional server-only variable:

```env
SUPABASE_SECRET_KEY=
```

Rules:

- do not commit secrets;
- do not expose privileged keys in browser bundles;
- do not duplicate the corporate domain in client env and database/Auth config;
- allowed signup domains are protected configuration/data;
- staging and production values live in hosting/Supabase configuration.

## 19. Deployment Boundaries

Frontend:

- Vercel or equivalent Next.js hosting;
- no always-on custom server unless a concrete need appears.

Backend:

- Supabase project per environment;
- migrations in Git once Phase 2 begins;
- RLS/grants/security tests required before pilot.

Environments:

- local development;
- staging/pilot;
- production.

Staging and production must not share real user data before public launch.

## 20. Observability

MVP observability:

- hosting build/runtime logs;
- Supabase logs/advisors;
- lightweight product events;
- basic admin metrics.

Do not introduce paid observability infrastructure until pilot usage proves a need.

## 21. Future Mobile Reuse

Future native clients must reuse:

- Supabase Auth;
- canonical relational schema;
- RLS policies;
- matching query/RPC contract;
- interaction rules;
- match creation rules;
- block/report/delete rules;
- contact reveal authorization.

Do not place canonical product/security logic exclusively in React components.

## 22. Explicit Non-Architecture

The MVP architecture does not include:

- internal chat service;
- messages/conversations tables;
- realtime messaging;
- presence;
- push notifications for chat;
- AI recommendation service;
- vector database/search for matching;
- microservices;
- native mobile code;
- user-uploaded profile photo pipeline.

These require separate product and architecture decisions.
