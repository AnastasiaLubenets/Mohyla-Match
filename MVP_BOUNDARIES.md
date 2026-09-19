# Mohyla Match — MVP Boundaries

This file prevents scope drift.

## In scope

- responsive web product;
- optional installable PWA when low-complexity;
- corporate-email signup and verification;
- configurable corporate-domain restriction;
- student profile;
- controlled skill taxonomy;
- offer vs looking-for skills;
- interests;
- collaboration goals;
- availability;
- deterministic matching V1;
- explainable match score;
- Discover;
- Connect / Save / Skip;
- full profile;
- mutual matches;
- corporate-email reveal after mutual match;
- `mailto:` handoff;
- Saved;
- Matches;
- My Profile / Edit Profile;
- Settings;
- block;
- report;
- account deletion;
- basic admin;
- basic product metrics;
- avatars only if straightforward;
- staging deployment;
- seed/test users;
- security/RLS tests.

## Explicitly out of scope

Do not implement unless a new decision explicitly changes scope:

- internal chat;
- messages/conversations tables;
- realtime messaging;
- typing indicators;
- online presence;
- attachments/messages media;
- Telegram integration;
- Instagram integration;
- AI matching;
- embeddings/vector matching;
- social feed;
- posts;
- comments;
- followers;
- video calls;
- marketplace;
- payments;
- subscriptions;
- premium plans;
- public student ratings;
- gamification;
- achievements;
- complex notifications;
- alumni network;
- other universities;
- native Android;
- native iOS;
- microservices;
- paid infrastructure without demonstrated need.

## Scope-change rule

Any proposed addition must answer:

1. Is it required for the canonical user flow?
2. Is it required for privacy/security?
3. Is it required to pilot with 20–100 users?
4. Does it materially reduce implementation risk?

If all answers are no, defer it.

Canonical flow remains:

`Corporate email → Verification → Profile → Discover → Connect → Mutual Match → Corporate email contact`
