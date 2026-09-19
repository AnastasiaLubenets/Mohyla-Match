# Mohyla Match — Database Schema

Status: Deferred until Phase 2 migrations

The canonical Phase 1 data model is maintained in `DATA_MODEL.md`.

Do not treat this file as an implemented SQL schema. Final database schema work begins in Phase 2 after the product, architecture, security model, and data model are reviewed for contradictions.

Phase 2 will convert the reviewed model into:

- SQL migrations;
- constraints;
- indexes;
- explicit grants;
- Row Level Security policies;
- seed data;
- database/security tests.

Key Phase 1 decisions that Phase 2 must preserve:

- `corporate_email` is not stored in discoverable `profiles`;
- corporate email is derived from verified Auth identity or a private system-derived contact projection;
- no user-uploaded profile photos in V1;
- faculties and academic programs are normalized data;
- matches use canonical unordered pairs;
- interactions use one current directed row per pair;
- blocks have bilateral access effect;
- admin roles are protected data, not editable metadata;
- no internal messaging tables.
