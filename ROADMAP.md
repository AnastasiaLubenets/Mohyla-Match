# Mohyla Match — Roadmap

The roadmap follows the canonical phase order. Do not skip ahead because a later feature is visually attractive.

## Phase 0 — Repository & Architecture

Deliverables:

- [x] GitHub repository exists
- [x] `main` is primary branch
- [x] foundation work isolated in `phase-0-1-foundation`
- [x] canonical architecture documented
- [x] environment strategy documented
- [x] Git strategy documented
- [x] README initialized
- [x] application scaffold created
- [x] CI pipeline active
- [x] lint/typecheck/build verified

Exit criteria:

- repository has reproducible documented structure;
- no secrets committed;
- framework/backend choices fixed for MVP.

## Phase 1 — Product Specification

Deliverables:

- [x] `PRODUCT_SPEC.md`
- [x] `ARCHITECTURE.md`
- [x] `DATA_MODEL.md`
- [x] `DATABASE_SCHEMA.md`
- [x] `SECURITY_MODEL.md`
- [x] `MVP_BOUNDARIES.md`
- [x] screens documented
- [x] user flow documented
- [x] entities documented
- [x] permissions documented
- [x] matching rules documented
- [x] avatar policy documented
- [x] corporate email storage/reveal decision documented
- [x] contradictions reviewed

Exit criteria:

- implementation can begin without redesigning the product.

## Phase 2 — Database

Status: implementation complete; local runtime verification blocked until Docker Desktop or Podman is available; GitHub Actions database verification added and pending result.

Deliverables:

- [x] Supabase local project files;
- [x] migrations;
- [x] enums/check constraints;
- [x] tables;
- [x] indexes;
- [x] explicit grants;
- [x] RLS;
- [ ] Auth signup-domain hook/config;
- [x] deterministic matching configuration foundation;
- [x] reciprocal-match creation rule;
- [x] seed taxonomy/config;
- [x] database tests authored;
- [x] database CI workflow authored;
- [ ] database reset/test execution;
- [ ] advisors clean or findings documented.

Exit criteria:

- migrations reproduce schema;
- negative security tests pass;
- email cannot be leaked pre-match.

Current validation note:

- `supabase db reset` and `supabase test db` have not executed successfully locally because no supported container runtime is available in the current environment.
- `.github/workflows/database-tests.yml` verifies a clean database in GitHub Actions with `supabase start`, `supabase db reset`, and `supabase test db`.
- Phase 2 must not be marked PASS until migrations, seed, and pgTAP tests execute successfully against a clean database in CI or another independent runtime environment.

## Phase 3 — Authentication

Deliverables:

- sign up;
- login;
- email verification;
- logout;
- session handling;
- allowed-domain enforcement;
- unauthorized/suspended handling.

Exit criteria:

- production-style Auth flow works end-to-end.

## Phase 4 — Onboarding

Deliverables:

- 4-step flow;
- progress;
- required validation;
- taxonomy selection;
- completion state;
- responsive UX.

Exit criteria:

- verified user can become Discover-eligible.

## Phase 5 — Profiles

Deliverables:

- My Profile;
- Edit Profile;
- Full Profile;
- generated/system avatar;
- skills/interests/goals/availability;
- safe public profile projection.

Exit criteria:

- own edit + eligible other-profile view work with RLS.

## Phase 6 — Matching Engine

Deliverables:

- V1 35/25/15/15/10 scoring;
- explanation output;
- configurable weights;
- unit/database tests.

Exit criteria:

- deterministic fixture tests produce expected ranking/explanations.

## Phase 7 — Discover

Deliverables:

- real DB candidates;
- match card;
- full profile;
- Connect;
- Save;
- Skip;
- next candidate;
- loading/empty/error states.

Exit criteria:

- complete Discover loop works on mobile and desktop.

## Phase 8 — Mutual Match

Deliverables:

- reciprocal Connect creates unique match;
- Match UI;
- matched contact reveal;
- `mailto:` flow;
- email-contact click event.

Exit criteria:

- pre-match email attack tests fail closed;
- post-match authorized reveal succeeds.

## Phase 9 — Safety

Deliverables:

- Block;
- Report;
- Account deletion;
- blocked visibility enforcement;
- suspension behavior;
- privacy regression tests.

## Phase 10 — Admin

Deliverables:

- protected admin route;
- users;
- suspend/restore;
- reports;
- taxonomy management;
- basic metrics;
- admin audit log.

## Phase 11 — QA

Test:

- mobile;
- desktop;
- Auth;
- RLS/grants;
- email privacy;
- direct API abuse;
- duplicate matches;
- blocks;
- responsive UI;
- loading/error/empty states;
- basic accessibility;
- build/deployment.

## Phase 12 — Pilot-ready

Deliverables:

- staging deployed;
- synthetic seed/test environment;
- 20-user test plan;
- then 100-user expansion;
- monitoring checklist;
- rollback/fix workflow.

Only after a successful web pilot:

- evaluate native mobile app.
