# Mohyla Match — Roadmap

The roadmap follows the canonical phase order. Do not skip ahead because a later feature is visually attractive.

Current working branch: `phase-5-profiles`.

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

Status: Phase 2 runtime verification PASS in GitHub Actions; local runtime remains unavailable until Docker Desktop or Podman is available.

Deliverables:

- [x] Supabase local project files;
- [x] migrations;
- [x] enums/check constraints;
- [x] tables;
- [x] indexes;
- [x] explicit grants;
- [x] RLS;
- [x] Auth signup-domain hook/config;
- [x] deterministic matching configuration foundation;
- [x] reciprocal-match creation rule;
- [x] seed taxonomy/config;
- [x] database tests authored;
- [x] database CI workflow authored;
- [x] database reset/test execution;
- [x] advisors clean or findings documented.

Exit criteria:

- migrations reproduce schema;
- negative security tests pass;
- email cannot be leaked pre-match.

Current validation note:

- `supabase db reset`, `supabase test db`, and `supabase db advisors --local --type all --level warn --fail-on error` have not executed successfully locally because no supported container runtime is available in the current environment.
- `.github/workflows/database-tests.yml` verifies a clean database in GitHub Actions with `supabase start`, `supabase db reset`, `supabase test db`, and `supabase db advisors --local --type all --level warn --fail-on error`.
- GitHub Actions `Database Tests` passed for `927fe3c57f773f43f70ed6dd5306facfa1e50d27`, including migrations, seed, all 40 pgTAP assertions, and the advisor step with no error-level findings.

## Phase 3 — Authentication

Status: Phase 3 Auth implemented and verified on `phase-3-auth`.

Deliverables:

- [x] sign up;
- [x] login;
- [x] email verification;
- [x] logout;
- [x] session handling;
- [x] allowed-domain enforcement;
- [x] unauthorized/suspended handling;
- [x] SSR confirmation callback using `token_hash`;
- [x] local Supabase Confirm signup template;
- [x] real Mailpit signup email integration test.

Exit criteria:

- production-style Auth flow works end-to-end.

Hosted Supabase requirements:

- Configure the Confirm signup email template with:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

- Configure production Site URL and redirect URLs for the deployed app before signup is opened to real users.
- Keep allowed corporate email domains in `public.signup_email_domains`; do not hardcode a NaUKMA email domain.
- A new Free Supabase project using default SMTP may not permit customized Auth email templates, so production may require custom SMTP or an appropriate paid plan.

Validation:

- Auth unit coverage checks allowed domain, disallowed domain, empty allowlist fail-closed behavior, case-insensitive domain matching, malformed email rejection, normal-user restrictions, protected routes, logout, suspended users, and onboarding-incomplete redirects.
- Auth integration coverage checks the real signup email path by creating a normal signup, reading the confirmation email from local Mailpit, following the email link, asserting SSR cookies are established, and confirming `/account/setup` returns 200.
- Database CI keeps pgTAP and advisor checks green alongside Phase 3.

## Phase 4 — Onboarding

Status: Phase 4 Onboarding implemented on `phase-4-onboarding`.

Deliverables:

- [x] 4-step flow;
- [x] progress;
- [x] required validation;
- [x] taxonomy selection;
- [x] completion state;
- [x] responsive UX;
- [x] resume from first incomplete step;
- [x] server/database-derived system avatar key;
- [x] database-enforced completion RPC;
- [x] pgTAP and real local Supabase integration coverage.

Exit criteria:

- verified user can become Discover-eligible.

Validation:

- `public.complete_onboarding()` checks the authenticated user's own active profile, valid active faculty/program/year, at least one offered skill, at least one looking-for skill, at least one interest, and at least one collaboration goal before setting `onboarding_completed_at`.
- Direct client writes to `system_avatar_key` and `onboarding_completed_at` are revoked for authenticated users.
- The integration flow signs up through Auth, follows the real Mailpit confirmation link, completes all four onboarding steps through HTTP form posts, and verifies access to `/app`.
- Phase 5 profile routes reuse the same live-completeness boundary.

## Phase 5 — Profiles

Status: Phase 5 Profiles implemented on `phase-5-profiles`.

Deliverables:

- [x] My Profile;
- [x] Edit Profile;
- [x] Full Profile;
- [x] generated/system avatar;
- [x] skills/interests/goals/availability;
- [x] safe public profile projection;
- [x] atomic database-controlled profile update path;
- [x] RLS-backed hidden states for incomplete/suspended/deleted/blocked targets;
- [x] pgTAP and real local Supabase integration coverage.

Exit criteria:

- own edit + eligible other-profile view work with RLS.

Validation:

- `/profile` and `/profile/edit` require an active effectively onboarded user.
- `/profiles/[userId]` returns a safe unavailable page for incomplete, suspended, deleted, blocked, guessed, or otherwise inaccessible targets.
- `public.update_my_profile(...)` uses `auth.uid()`, validates active taxonomy and all required profile sections, and replaces profile relations atomically.
- `system_avatar_key` remains database-derived after faculty/program edits.
- Corporate email remains outside `profiles` and is not rendered by profile pages.
- Phase 6 Matching Engine has not started.

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
