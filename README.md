# Mohyla Match

**Find people. Build something together.**

Mohyla Match is a closed web platform for NaUKMA students to discover other students for projects, startups, study, research, volunteering, events, and creative initiatives based on complementary skills, interests, and collaboration goals.

## Canonical MVP flow

`Corporate email → Verification → Profile → Discover → Connect → Mutual Match → Corporate email contact`

## MVP constraints

- Web/PWA first; native mobile later.
- No internal chat.
- No AI matching in V1.
- No user-uploaded profile photos in V1.
- Corporate email is private until mutual match.
- Supabase is the backend platform.
- Security rules are enforced server/database-side, not only in the UI.
- Architecture is optimized for a staged pilot up to roughly 4,000 students without unnecessary infrastructure.

## Project documents

Foundation documents are maintained in the repository:

- `PRODUCT_SPEC.md`
- `ARCHITECTURE.md`
- `DATA_MODEL.md`
- `DATABASE_SCHEMA.md`
- `SECURITY_MODEL.md`
- `MVP_BOUNDARIES.md`
- `ROADMAP.md`

## Local setup

Requirements:

- Node.js 24+
- npm
- Supabase CLI
- Docker Desktop or Podman for the local Supabase database stack

Install dependencies:

```bash
npm ci
```

Create local environment values when needed:

```bash
cp .env.example .env.local
```

Do not commit `.env.local` or secrets.

## Development

```bash
npm run dev
```

The initial web routes are:

- `/`
- `/login`
- `/signup`

## Quality commands

```bash
npm run lint
npm run typecheck
npm run build
```

## Database commands

```bash
npx supabase db reset
npx supabase test db
```

The database foundation lives in:

- `supabase/migrations/20260919120909_database_foundation.sql`
- `supabase/seed.sql`
- `supabase/tests/phase2_security_test.sql`

## Repository structure

```text
src/
  app/
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
  styles/
  types/
```

## Current status

Phase 0 foundation:
- repository initialized;
- architecture/env/Git strategy documented;
- Next.js web application scaffolded;
- Supabase client factories added;
- CI quality gates added.

Phase 1:
- product specification complete;
- screens, entities, permissions, match rules, avatar policy, security model, and MVP boundaries documented;
- canonical scope reviewed for contradictions.

Phase 2:
- PostgreSQL schema, constraints, indexes, grants, RLS, seed data, and database security tests added;
- `profiles` deliberately excludes `corporate_email`;
- mutual matches are database-created from reciprocal Connect interactions;
- internal chat, AI/vector tables, and user-uploaded profile photo storage remain out of scope.

Current working branch:

`phase-0-1-foundation`

Next implementation step:

1. Run the Phase 2 database reset/tests in a local Supabase stack.
2. Begin Phase 3 UI/auth/onboarding integration after Phase 2 acceptance.
