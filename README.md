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
- `/auth/confirm`
- `/account/setup`
- `/account/suspended`
- `/app`
- `/profile`
- `/profile/edit`
- `/profiles/[userId]`

Current development branch:

`phase-5-profiles`

Phase 3 Auth is implemented and verified on this branch. It includes signup, login, logout, SSR email confirmation, authenticated route protection, onboarding-incomplete redirects, suspended-account redirects, and corporate-domain enforcement through the database-backed allowlist.

Phase 4 Onboarding is implemented. It includes the canonical 4-step onboarding flow, taxonomy-driven selections from Supabase, resume-from-first-incomplete-step behavior, server-side system avatar derivation, and a database-enforced completion RPC.

Phase 5 Profiles is implemented on this branch. It includes My Profile, Edit Profile, safe eligible-student Full Profile pages, reusable generated/system avatars, and an atomic database-controlled `public.update_my_profile(...)` RPC.

Allowed signup domains are stored in `public.signup_email_domains`. Do not hardcode a NaUKMA email domain in the app, configuration, or tests; add allowed corporate domains as data.

## Supabase Auth email configuration

Local Supabase uses a committed Confirm signup email template:

- `supabase/templates/confirm_signup.html`

The confirmation link must keep the Supabase SSR token-hash pattern:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

Hosted Supabase projects must configure the same Confirm signup template in the Auth email template settings. Production Site URL and redirect URLs must also include the deployed application origin and its Auth callback route before real users sign up.

A new Free Supabase project using default SMTP may not permit customized Auth email templates. Production may require custom SMTP or an appropriate paid Supabase plan.

## Quality commands

```bash
npm run lint
npm run typecheck
npm run test:auth
npm run build
```

## Database commands

```bash
npx supabase db reset
npx supabase test db
npx supabase db advisors --local --type all --level warn --fail-on error
```

The database foundation lives in:

- `supabase/migrations/20260919120909_database_foundation.sql`
- `supabase/migrations/20260919215757_phase4_onboarding_completion.sql`
- `supabase/migrations/20260919230655_phase5_profiles.sql`
- `supabase/seed.sql`
- `supabase/tests/phase2_security_test.sql`
- `supabase/tests/phase4_onboarding_test.sql`
- `supabase/tests/phase5_profiles_test.sql`

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

Phase 3:
- Supabase SSR Auth client/server wiring, email confirmation, login/logout, protected-route state handling, and Before User Created corporate-domain enforcement are implemented;
- local Confirm signup email template is configured with the token-hash SSR callback URL;
- auth unit tests and GitHub Actions integration coverage verify allowed/disallowed/empty/case-insensitive/malformed domain behavior, normal-user restrictions, protected routes, logout, suspended users, onboarding-incomplete redirects, and the real Mailpit signup email confirmation path.

Phase 4:
- canonical 4-step onboarding is implemented at `/account/setup`;
- faculties, programs, skills, interests, and collaboration goals load from active Supabase taxonomy rows;
- `system_avatar_key` is derived server/database-side from faculty/program taxonomy fields;
- `onboarding_completed_at` is set only by the database-controlled `public.complete_onboarding()` RPC after all required profile, skill, interest, and goal data exists;
- completed active users can access `/app`; incomplete users resume onboarding.

Phase 5:
- My Profile, Edit Profile, and safe Full Profile views are implemented;
- profile pages render system avatar, full name, faculty/program/year, bio, availability, offered skills, wanted skills, interests, and collaboration goals;
- profile editing uses active Supabase taxonomy rows and saves through `public.update_my_profile(...)`;
- the profile update RPC validates all required fields and relations before replacing data atomically;
- corporate email remains outside `profiles` and is not rendered on profile pages;
- Full Profile access depends on database/RLS eligibility: both users must be effectively active/onboarded and unblocked.

Current working branch:

`phase-5-profiles`

Next implementation step:

1. Wait for Phase 5 acceptance.
2. Begin Phase 6 Matching Engine only after Phase 5 is accepted.
