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
- Supabase CLI for local backend work in later phases

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

Current working branch:

`phase-0-1-foundation`

Next implementation step:

1. Review Phase 1 documents.
2. Begin Phase 2 migrations, grants, RLS, seed data, and security tests after approval.
