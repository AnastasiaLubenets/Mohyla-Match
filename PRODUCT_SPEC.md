# Mohyla Match — Product Specification

Status: Canonical Phase 1 product specification
Target: Responsive Web/PWA MVP for NaUKMA students
Primary scale target: approximately 4,000 students

## 1. Product Purpose

Mohyla Match is a closed digital platform for NaUKMA students to find other students for:

- shared projects;
- startups;
- study groups;
- research;
- volunteering;
- events;
- creative initiatives;
- collaboration based on complementary skills and goals.

Core principle:

> Find people. Build something together.

Mohyla Match is not a dating app, social network, public directory, or messenger. It exists to help students discover relevant collaborators and then continue communication through verified corporate email after a mutual match.

## 2. Target Users

### Student

A current student with a verified allowed corporate email address.

Student goals:

- create a concise collaboration profile;
- state what they can offer;
- state what they are looking for;
- discover compatible students;
- save interesting profiles;
- express interest with Connect;
- receive contact access only after mutual interest;
- block, report, or delete their account.

### Admin

A trusted operator for the pilot and MVP.

Admin goals:

- keep the taxonomy useful;
- review reports;
- suspend and restore accounts;
- see basic product health metrics;
- leave an auditable trail for sensitive actions.

Admin privileges must be stored in protected authorization data, not editable user metadata.

## 3. Canonical User Flow

The core flow is frozen for the MVP:

`Corporate email -> Verification -> Profile -> Discover -> Connect -> Mutual Match -> Corporate email contact`

Detailed flow:

1. A student signs up with an allowed corporate email address.
2. The email address is verified through Supabase Auth.
3. The student completes onboarding.
4. The student becomes eligible for Discover only after required profile data is complete.
5. Discover shows relevant, eligible, non-blocked, non-suspended students.
6. The student can `Skip`, `Save`, or `Connect`.
7. `Connect` is directed: A can connect to B without B knowing the action directly.
8. A mutual match is created only when A connects to B and B connects to A.
9. Only after mutual match can each matched student access the other student's verified corporate email.
10. `Write an email` opens the user's default email client with a `mailto:` URL.
11. All communication after contact handoff happens outside Mohyla Match.

There is no internal chat, no message storage, and no real-time messaging in the MVP.

## 4. MVP Screens

Required MVP screens:

1. Landing
2. Sign up
3. Login
4. Email verification
5. Onboarding
6. Discover
7. Full profile
8. Saved profiles
9. Matches
10. Match detail / contact reveal
11. My profile
12. Edit profile
13. Settings
14. Block flow
15. Report flow
16. Delete account flow
17. Basic admin panel
18. Privacy Policy
19. Terms

Mobile primary navigation:

- Discover
- Saved
- Matches
- Profile

## 5. Authentication And Corporate Email

Verified corporate email is both the identity mechanism and the post-match contact mechanism.

Rules:

- production signup is restricted to allowed corporate email domains;
- the exact NaUKMA domain is not hardcoded until confirmed;
- allowed domain configuration is protected and configurable server/Auth-side;
- client-side domain validation is allowed only as UX feedback;
- the email is never a public profile field;
- a user does not re-enter or manually edit corporate email inside onboarding;
- no screen may render another student's corporate email before mutual match;
- no API/RPC may return another student's corporate email before mutual match;
- after mutual match, each matched student can access only the counterpart's corporate email;
- contact handoff uses `mailto:`;
- no `messages`, `conversations`, or internal messaging tables exist in the MVP.

Canonical Phase 1 decision:

- `corporate_email` does not belong in `profiles`;
- the canonical source is the verified Supabase Auth identity;
- Phase 2 may add a private derived contact table only if needed for authorization/performance, but it must not become discoverable profile data;
- any reveal path must return the minimum contact projection and must verify mutual match, active status, and no block.

## 6. Onboarding

Onboarding has four steps and shows progress.

### Step 1/4 — Basic Profile

Required:

- full name;
- faculty;
- academic program;
- year of study.

Optional:

- short bio;
- availability.

Not collected:

- corporate email, because it comes from verified Auth identity;
- personal email;
- phone number;
- Telegram;
- Instagram;
- date of birth;
- home address.

### Step 2/4 — What Can You Offer?

Required:

- at least one offered skill from controlled taxonomy.

Skill direction:

- `offer`

### Step 3/4 — What Are You Looking For?

Required:

- at least one wanted skill from the same controlled taxonomy.

Skill direction:

- `looking_for`

### Step 4/4 — What Do You Want To Build?

Required:

- interests;
- collaboration goal or goals.

Optional:

- availability refinement.

## 7. Taxonomies

Taxonomies are stored as data and are admin-manageable. They must not exist only as UI constants.

### Faculties

Faculties are normalized records used for:

- profile classification;
- filtering and matching context;
- generated/system avatar identity.

The exact faculty list is seed data reviewed before pilot.

### Academic Programs

Academic programs belong to faculties and are normalized records used for:

- onboarding;
- profile display;
- compatibility context;
- generated/system avatar identity.

The exact program list is seed data reviewed before pilot.

### Skills

Initial skill taxonomy:

- Development: React, Python, Java, SQL, AI/Data
- Design: Figma, UI/UX, Graphic Design
- Finance: Excel, Financial Analysis, Accounting, Investments
- Marketing: SMM, Branding, Advertising, Copywriting
- Research: Statistics, Data Analysis, Academic Research
- Media: Photography, Video, Editing
- Management: Project Management, Event Management

Skills are normalized. Free-form skills are out of scope for MVP.

### Interests

Initial interests:

- Startups
- Education
- Technology
- Finance
- Culture
- Volunteering
- Research
- Social Impact
- Media
- Entrepreneurship

### Collaboration Goals

Initial collaboration goals:

- Project teammate
- Startup / Co-founder
- Study partner
- Research
- Volunteering
- Event
- Creative project
- Mentor / Mentee

## 8. Avatar Policy

There are no user-uploaded profile photos in V1.

Default visual identity:

- generated/system avatar;
- based on faculty/program;
- deterministic enough to keep identity stable across sessions;
- not editable into arbitrary uploaded media by the user.

Implications:

- user photo uploads are out of scope for MVP;
- Supabase Storage is not required for profile photos in V1;
- faculty/program taxonomy must be stored as data because avatar identity depends on it;
- design assets for avatar themes can be added later without changing the core database architecture;
- future uploaded avatars require a separate product and security decision.

## 9. Discover

Discover is the primary product screen.

Candidate eligibility excludes:

- current user;
- users without completed onboarding;
- suspended users;
- deleted users;
- blocked pairs in either direction;
- users already skipped if product policy treats skip as exclusion;
- users already matched if product policy sends them to Matches instead.

Discover card includes:

- generated/system avatar;
- full name;
- faculty;
- academic program;
- year of study;
- match score;
- offered skills;
- wanted skills;
- interests;
- short "Why you match" explanations.

Available actions:

- `Skip`;
- `Save`;
- `Connect`.

After an action:

- the current directed interaction is upserted;
- the interface advances to the next eligible profile;
- the user can still view saved profiles and matches from their relevant screens.

## 10. Save, Skip, And Connect

Interactions are directed from `source_user_id` to `target_user_id`.

There is exactly one current interaction per directed pair.

Actions:

- `save`: keep the profile in Saved without expressing mutual contact intent;
- `skip`: hide or deprioritize the profile according to product policy;
- `connect`: express interest in mutual contact.

Update semantics:

- Save -> Connect updates the same row;
- Skip -> Save updates the same row;
- Skip -> Connect updates the same row;
- Connect -> Save or Skip is allowed only if the product explicitly supports withdrawing interest before mutual match;
- contradictory simultaneous interaction rows are impossible.

Analytics events are append-only and separate from current interaction state.

## 11. Mutual Match

A match exists only after reciprocal current `connect` interactions:

- A -> Connect -> B
- B -> Connect -> A

Match creation is not a frontend-only rule.

Database/server logic must guarantee:

- no self-match;
- unordered pair canonicalization;
- no duplicate A/B and B/A records;
- transaction safety;
- idempotent handling of concurrent reciprocal connects.

Canonical pair representation:

- store the lower UUID as `user_low`;
- store the higher UUID as `user_high`;
- require `user_low < user_high`;
- enforce unique `(user_low, user_high)`.

## 12. Contact Reveal And Email Handoff

Matched users can access each other's corporate email only after all checks pass:

1. caller is authenticated;
2. caller profile is active and onboarded;
3. target profile is active and onboarded;
4. caller and target are the two users in an active match;
5. there is no block in either direction;
6. the returned contact is the target's verified corporate email only.

Email handoff:

- `mailto:` link;
- default subject: `Mohyla Match - Let's connect`;
- email contact click is tracked as a product event;
- Mohyla Match does not send, store, or sync the message.

## 13. Matching V1

Matching V1 is deterministic, explainable, cheap, and configurable.

No AI, embeddings, vector matching, or opaque recommendations are part of the MVP.

Weights:

| Component | Weight |
|---|---:|
| My looking-for <-> their offer | 35% |
| Their looking-for <-> my offer | 25% |
| Common interests | 15% |
| Collaboration-goal compatibility | 15% |
| Availability / additional compatibility | 10% |

Requirements:

- weights are stored as configuration/data in Phase 2;
- no magic numbers scattered through frontend components;
- the result returns total score, component scores, and explanation items;
- low-data profiles must not show fake precision;
- blocked, suspended, deleted, self, and ineligible profiles are excluded before scoring;
- the matching contract must be reusable by future mobile clients.

Example explanations:

- Maria offers React; you are looking for React.
- You offer Finance; Maria is looking for Finance.
- You both selected Startups.
- You both want a project teammate.

## 14. Full Profile

Full profile shows a safe projection only:

- generated/system avatar;
- full name;
- faculty;
- academic program;
- year of study;
- bio;
- availability;
- offered skills;
- wanted skills;
- interests;
- collaboration goals;
- matching explanations;
- available action state.

Full profile never includes corporate email unless reached through an authorized matched-contact surface.

## 15. Saved Profiles

Saved profiles show profiles where the current directed interaction is `save`.

Saved profiles:

- still respect blocks;
- still exclude suspended/deleted users;
- do not reveal email;
- allow Connect, Skip, or remove from Saved according to interaction update rules.

## 16. Matches

Matches show active matches involving the current user.

Each match includes:

- counterpart's safe profile summary;
- match creation date;
- match explanation;
- `Write an email` action if no block and both users are active.

If either user blocks the other:

- contact reveal is disabled;
- normal profile access is disabled;
- the match may remain internally for audit/metrics but is not actionable.

## 17. Block Flow

Blocking is directional as a stored action:

- A blocks B.

Its visibility and access effect is bilateral:

- A does not see B;
- B does not see A;
- neither can access normal profile surfaces for the other;
- neither can reveal contact through a match while the block exists;
- Discover excludes both directions;
- future interaction attempts are denied.

Block precedence:

1. block;
2. suspension/deletion;
3. match;
4. saved/connect state;
5. discover eligibility.

## 18. Report Flow

Users can report another user from profile/match contexts.

Report fields:

- reporter;
- reported user;
- reason code;
- optional details;
- status;
- timestamps.

Reports are not public.

Normal users:

- can create a report as themselves;
- may optionally see status of their own report if implemented;
- cannot see other users' reports.

Admins:

- can view and triage reports;
- can suspend/restore accounts from report review;
- must produce audit log entries for moderation actions.

## 19. Delete Account Flow

MVP account deletion must remove the user from the product experience and minimize retained personal data.

Canonical strategy for Phase 2:

- authenticated self-service request only;
- server-side revalidation of the caller;
- profile marked `deleted`;
- discoverable fields anonymized or cleared;
- verified contact data no longer revealable;
- skill/interest/goal relations removed;
- saved/connect/skip interactions removed where safe;
- matches closed or made inaccessible;
- blocks removed where safe;
- reports and admin audit records retained only as needed for safety/legal review, with personal profile fields minimized;
- Auth account deletion or disablement is performed by a server-only privileged path after app data cleanup.

Deleted users:

- cannot log in as active users;
- do not appear in Discover;
- do not appear in Saved or Matches as actionable profiles;
- cannot reveal or be revealed as contact.

## 20. Suspended Account Behavior

Suspension is an admin moderation state.

Suspended users:

- cannot appear in Discover;
- cannot be saved, skipped, connected to, matched with, or contacted;
- cannot reveal matched contacts;
- cannot edit profile or perform normal product actions while suspended;
- may see an account status screen if they log in;
- retain data for admin review unless deleted later.

Restored users:

- regain access only after admin action;
- remain subject to normal onboarding and eligibility checks.

## 21. Admin Capabilities

Basic admin panel capabilities:

- list users with moderation state;
- view safe user administration details;
- suspend accounts;
- restore accounts;
- view reports;
- change report status;
- manage skills;
- manage interests;
- manage collaboration goals;
- manage faculties;
- manage academic programs;
- view basic product metrics;
- inspect admin action history.

Admin actions that mutate moderation, taxonomy, or user state must write `admin_actions`.

Admin cannot bypass the product privacy model casually; privileged contact access must be intentionally implemented, audited, and justified.

## 22. Product Metrics

MVP architecture must support:

- registrations;
- email verification completion;
- onboarding completion;
- active users;
- Connect rate;
- Save rate;
- Skip rate;
- mutual match rate;
- matches per user;
- email-contact click rate;
- 7-day retention;
- report rate.

Primary KPI:

> Successful connections created through Mohyla Match.

Metrics must not require storing message content or unnecessary personal data.

## 23. Explicit Out Of Scope

Do not implement in MVP:

- internal chat;
- messages;
- conversations;
- realtime messaging;
- typing indicators;
- online presence;
- message attachments;
- AI matching;
- embeddings;
- vector matching;
- social feed;
- posts;
- comments;
- followers;
- video calls;
- marketplace;
- payments;
- subscriptions;
- premium tiers;
- public student ratings;
- gamification;
- achievements;
- complex notifications;
- alumni network;
- other universities;
- native Android;
- native iOS;
- user-uploaded profile photos;
- Telegram integration;
- Instagram integration;
- microservices;
- paid infrastructure without demonstrated need.

Any scope change requires a separate product decision.

## 24. MVP Acceptance Criteria

The MVP is pilot-ready only when:

- only allowed corporate-domain users can create production accounts;
- verified users can complete onboarding;
- Discover uses real database data;
- deterministic matching returns score and explanations;
- Save/Skip/Connect persist as directed current interaction state;
- reciprocal Connect creates exactly one active match;
- pre-match corporate email cannot be obtained through UI, browser devtools, direct Data API calls, RPC calls, or guessed IDs;
- matched users can access only the counterpart's verified corporate email;
- `mailto:` works;
- block/report/delete-account flows work;
- suspended users are excluded from normal product flows;
- admin routes and actions are protected;
- RLS/grant/security tests pass;
- mobile and desktop responsive flows pass;
- critical loading, empty, and error states exist.
