# Mohyla Match

**Find people. Build something together.**

Mohyla Match is a closed web platform for NaUKMA students to discover other students for projects, startups, study, research, volunteering, events, and creative initiatives based on complementary skills, interests, and collaboration goals.

## Canonical MVP flow

`Corporate email → Verification → Profile → Discover → Connect → Mutual Match → Corporate email contact`

## MVP constraints

- Web/PWA first; native mobile later.
- No internal chat.
- No AI matching in V1.
- Corporate email is private until mutual match.
- Supabase is the backend platform.
- Security rules are enforced server/database-side, not only in the UI.
- Architecture is optimized for a staged pilot up to roughly 4,000 students without unnecessary infrastructure.

## Project documents

Foundation documents are maintained in the repository:

- `PRODUCT_SPEC.md`
- `ARCHITECTURE.md`
- `DATABASE_SCHEMA.md`
- `SECURITY_MODEL.md`
- `MVP_BOUNDARIES.md`
- `ROADMAP.md`

## Current status

Phase 0 foundation:
- repository initialized;
- architecture/env/Git strategy documented;
- application scaffold and CI are the next implementation step.

Phase 1:
- product specification complete;
- screens, entities, permissions, match rules, security model, and MVP boundaries documented;
- canonical scope reviewed for contradictions.

Current working branch:

`phase-0-1-foundation`

Next implementation step:

1. Scaffold the Next.js + TypeScript application.
2. Add CI quality gates.
3. Initialize Supabase local/project structure.
4. Begin Phase 2 migrations, grants, RLS, seed data, and security tests.
