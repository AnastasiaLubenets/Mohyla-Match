# Mohyla Match — Codex Handoff

## Current state

Repository: `Nitomi777/Mohyla-Match`  
Working branch: `phase-0-1-foundation`

Phase 1 specification is complete.

Read before changing code:

1. `PRODUCT_SPEC.md`
2. `ARCHITECTURE.md`
3. `DATABASE_SCHEMA.md`
4. `SECURITY_MODEL.md`
5. `MVP_BOUNDARIES.md`
6. `ROADMAP.md`

Do not reinterpret the product.

Canonical flow:

`Corporate email → Verification → Profile → Discover → Connect → Mutual Match → Corporate email contact`

## Immediate task

Finish Phase 0 development setup and create the first implementation foundation.

### 1. Preserve existing files

Do not overwrite/remove the existing documentation.

### 2. Scaffold the web app in repository root

Use the current stable Next.js App Router release and current supported tooling.

Requirements:

- React;
- TypeScript strict mode;
- App Router;
- `src/` directory;
- ESLint;
- Tailwind CSS;
- import alias `@/*`;
- npm + committed lockfile;
- mobile-first baseline;
- no component library unless genuinely needed.

If create-next-app refuses to scaffold into a non-empty repository, scaffold into a temporary directory and move only the generated application/config files into the repo while preserving all existing docs and Git history.

### 3. Establish source structure

Create the architecture skeleton documented in `ARCHITECTURE.md`:

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
  types/
  styles/
```

Do not implement feature scope beyond the foundation yet.

### 4. Supabase client foundation

Use current official Supabase guidance.

Before coding:

- inspect the current Supabase changelog for relevant breaking changes;
- inspect current official Auth/SSR guidance;
- do not use deprecated auth helper packages;
- pin package versions via lockfile.

Create browser/server client factories with no secrets in browser code.

Do not create a guessed NaUKMA domain.

The authoritative domain allowlist will live in the protected Auth/database configuration during Phase 2.

### 5. Environment

Keep `.env.example` safe.

Expected browser values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Optional server-only privileged key:

- `SUPABASE_SECRET_KEY`

Never expose the privileged key to browser bundles.

### 6. Initial pages

Create only minimal route placeholders needed to prove routing/build structure:

- landing `/`;
- login;
- signup.

Do not spend time on final design yet.

Do not create:

- chat;
- AI matching;
- feed;
- native mobile code;
- payments;
- realtime messaging.

### 7. Quality gates

Add scripts for:

- lint;
- typecheck;
- build;
- test (a minimal useful test setup if justified).

Add GitHub Actions CI that installs from lockfile and runs at least:

- lint;
- typecheck;
- build.

### 8. Supabase project structure

Initialize local Supabase project structure if the current CLI supports it.

Discover CLI commands with `supabase --help`; do not guess flags.

Do not create Phase 2 migrations yet unless needed for a minimal reproducible setup.

Do not link to or modify an unrelated Supabase project.

### 9. Verification

Actually run:

- dependency install;
- lint;
- typecheck;
- build.

Fix failures before reporting success.

### 10. Commit discipline

Remain on `phase-0-1-foundation`.

Commit the verified foundation changes.

Do not merge to `main` until the foundation build/quality checks pass.

## Required report

Return:

**Completed**
- exact files/structure created.

**Tests**
- exact commands run and results.

**Current state**
- what actually runs now.

**Risks / decisions**
- only material issues.

**Next step**
- Phase 2 database schema + grants + RLS + seed + security tests.
