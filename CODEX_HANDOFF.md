# Mohyla Match — Codex Handoff

## Current State

Repository: `Nitomi777/Mohyla-Match`  
Working branch: `phase-0-1-foundation`

Phase 0 foundation commit:

`a519e20 feat: scaffold Mohyla Match web foundation`

Phase 1 canonical product/specification documents are now the source of truth:

1. `PRODUCT_SPEC.md`
2. `ARCHITECTURE.md`
3. `SECURITY_MODEL.md`
4. `DATA_MODEL.md`
5. `MVP_BOUNDARIES.md`
6. `DATABASE_SCHEMA.md`
7. `ROADMAP.md`

Do not reinterpret the product before Phase 2.

Canonical flow:

`Corporate email -> Verification -> Profile -> Discover -> Connect -> Mutual Match -> Corporate email contact`

## Frozen MVP Decisions

- Web/PWA first.
- Next.js App Router frontend.
- Supabase PostgreSQL/Auth backend.
- No internal chat or messaging tables.
- No AI, embeddings, or vector matching in MVP.
- No user-uploaded profile photos in V1.
- Default avatar identity is generated/system avatar based on faculty/program.
- Faculty/program taxonomy is stored as data.
- Corporate email is not in discoverable `profiles`.
- Corporate email is derived securely from verified Auth identity or a private system-derived contact projection.
- Corporate email reveal is allowed only after active mutual match and no block.
- Contact uses `mailto:`.
- Interactions are unique directed current state rows.
- Matches use canonical unordered pair representation with `user_low` and `user_high`.
- Blocks are stored directionally but enforced bilaterally.
- Admin role storage is protected data, not editable metadata.

## Next Phase

Do not start Phase 2 until the Phase 1 documents are accepted.

Phase 2 should implement:

- Supabase migrations;
- constraints;
- indexes;
- explicit grants;
- Row Level Security;
- seed data;
- matching configuration;
- contact reveal authorization;
- security tests.

Phase 2 must preserve every privacy/security invariant in `SECURITY_MODEL.md` and every entity decision in `DATA_MODEL.md`.
