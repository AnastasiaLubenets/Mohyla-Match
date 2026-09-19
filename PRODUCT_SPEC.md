# Mohyla Match — Product Specification

Status: Canonical MVP specification  
Target: Web/PWA pilot for NaUKMA students  
Primary scale target: ~4,000 students

## 1. Product definition

Mohyla Match is a closed digital platform for NaUKMA students to find other students for:

- projects;
- startups;
- studying;
- research;
- volunteering;
- events;
- creative initiatives;
- collaboration based on complementary skills.

Core principle:

> Find people. Build something together.

Mohyla Match is not a dating app, social network, or messenger.

## 2. Canonical user flow

`Corporate email → Verification → Profile → Discover → Connect → Mutual Match → Corporate email contact`

Rules:

1. A student registers using an allowed corporate email domain.
2. The email is verified.
3. The student completes onboarding.
4. Discover shows relevant student profiles.
5. The user can `Connect`, `Save`, or `Skip`.
6. A Match exists only after reciprocal `Connect`.
7. Corporate email is revealed only after mutual match.
8. `Write an email` opens the user's default mail client with `mailto:`.
9. There is no internal chat.

## 3. MVP users

### Student

Can:

- sign up and verify a corporate email;
- create and edit own profile;
- manage offered skills and wanted skills;
- manage interests, collaboration goals, availability;
- discover eligible students;
- Connect / Save / Skip;
- view saved profiles;
- view matches;
- reveal matched user's corporate email only after mutual match;
- block and report users;
- delete own account.

Cannot:

- read another user's corporate email before mutual match;
- edit another profile;
- access admin functionality;
- bypass blocks through API calls.

### Admin

Can:

- view user administration data;
- suspend / restore users;
- view reports;
- manage skill taxonomy;
- manage interests;
- manage collaboration goals;
- view basic product metrics;
- create auditable admin actions.

Admin access must be server/database enforced.

## 4. Authentication

Production registration is restricted to a configurable corporate email domain.

The exact NaUKMA domain is not hardcoded until confirmed.

Required flow:

`Corporate email → verification → authenticated session → onboarding`

Production requirements:

- email confirmation enabled;
- anonymous sign-in disabled;
- normal personal email registration rejected;
- allowed domain enforced server-side / Auth-side, not only in client UI.

## 5. Onboarding

Keep onboarding short and progressive.

### Step 1/4 — Basic profile

Required:

- Name
- Academic program
- Year of study

Optional:

- Avatar
- Bio
- Availability

Corporate email comes from the verified Auth account and is not re-entered.

### Step 2/4 — What can you offer?

Controlled skill taxonomy. Multi-select.

### Step 3/4 — What are you looking for?

Same controlled taxonomy, separate relation.

### Step 4/4 — What do you want to build?

Required:

- interests;
- collaboration goal(s).

Show onboarding progress.

## 6. Skill taxonomy

Skills are normalized, not free-form in MVP.

Initial categories:

- Development: React, Python, Java, SQL, AI/Data
- Design: Figma, UI/UX, Graphic Design
- Finance: Excel, Financial Analysis, Accounting, Investments
- Marketing: SMM, Branding, Advertising, Copywriting
- Research: Statistics, Data Analysis, Academic Research
- Media: Photography, Video, Editing
- Management: Project Management, Event Management

The taxonomy must be admin-manageable.

Each profile skill relation has one of two directions:

- `offer`
- `looking_for`

No duplicate skill rows per profile/direction.

## 7. Interests

Initial controlled interests:

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

Many-to-many with profiles.

## 8. Collaboration goals

Initial controlled goals:

- Project teammate
- Startup / Co-founder
- Study partner
- Research
- Volunteering
- Event
- Creative project
- Mentor / Mentee

## 9. Matching Engine V1

No AI.

The score is deterministic, explainable, and configurable.

Initial weights:

| Component | Weight |
|---|---:|
| My Looking for ↔ their Can offer | 35% |
| Their Looking for ↔ my Can offer | 25% |
| Common interests | 15% |
| Common / compatible collaboration goals | 15% |
| Availability / additional compatibility | 10% |

Total: 100%.

Requirements:

- weights are configuration/data, not scattered magic numbers;
- score generation returns explanation items;
- low-data profiles must not present misleading precision;
- blocked, suspended, self, and ineligible profiles are excluded;
- matching logic must be reusable by future mobile clients.

Example explanation:

- Maria offers React — you are looking for React.
- You offer Finance — Maria is looking for Finance.
- You both selected Startups.

## 10. Discover

Discover is the primary product screen.

A card contains:

- name;
- academic program;
- year;
- match score;
- offered skills;
- wanted skills;
- interests;
- short "Why you match" explanation.

Actions:

- Skip
- Save
- Connect

After an action, advance to the next eligible profile.

Full profile view is available.

## 11. Mutual Match

A match is created only when both users currently have `connect` toward each other.

No duplicate A-B / B-A matches.

Match screen:

- `It's a Match`
- both users' names;
- explanation that both want to connect;
- corporate email;
- `Write an email` button.

Default subject:

`Mohyla Match — Let's connect`

No messages are stored or sent inside Mohyla Match.

## 12. Screens

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
10. My profile
11. Edit profile
12. Settings
13. Block/report flow
14. Basic admin panel
15. Privacy Policy
16. Terms

Mobile-first primary navigation:

- Discover
- Saved
- Matches
- Profile

## 13. Design requirements

Direction:

- contemporary university product;
- premium but youthful;
- clean;
- mobile-first;
- responsive;
- not corporate-bank;
- not childish;
- not generic AI purple-gradient SaaS;
- subtle Mohyla/Ukrainian identity is allowed;
- do not copy official NaUKMA branding without permission.

Design system includes:

- typography;
- spacing;
- radii;
- buttons;
- inputs;
- chips;
- cards;
- badges;
- navigation;
- empty/loading/error states.

Skills and interests use compact tags/chips.

Emoji are not primary UI icons.

## 14. Privacy

Collect minimum necessary data.

Do not collect for MVP:

- date of birth;
- home address;
- phone;
- personal Gmail;
- Instagram;
- Telegram.

Corporate email is sensitive contact information.

It is not exposed to another user before mutual match.

Required:

- edit profile;
- delete account;
- block user;
- report user;
- Privacy Policy;
- Terms.

## 15. Safety

Blocking is directional as an action, but its visibility effect is bilateral: if A blocks B, neither should discover or access the other's normal profile surfaces.

Reports must include a reason and moderation status.

Suspended users must not appear in Discover and must be prevented from normal product actions.

## 16. Product metrics

Architecture must support:

- registrations;
- onboarding completion;
- active users;
- Connect rate;
- Save rate;
- Skip rate;
- Mutual Match rate;
- matches per user;
- email-contact click rate;
- 7-day retention;
- report rate.

Primary product KPI:

> Successful connections created through Mohyla Match.

## 17. MVP acceptance criteria

The MVP is pilot-ready only when all of the following are true:

- only allowed corporate-domain users can create production accounts;
- verified users can complete onboarding;
- Discover uses real database data;
- deterministic matching returns score + explanations;
- Connect / Save / Skip persist correctly;
- reciprocal Connect creates exactly one match;
- no user can obtain another user's corporate email before mutual match through UI, Data API, browser devtools, or direct requests;
- matched users can obtain the counterpart corporate email;
- `mailto:` works;
- block/report work;
- account deletion works;
- admin endpoints are protected;
- RLS/privilege tests pass;
- mobile and desktop responsive flows pass;
- empty/error/loading states exist for critical flows.

## 18. Canonical non-goals

Explicitly excluded from MVP:

- internal chat;
- AI matching;
- social feed;
- posts/comments/followers;
- video calls;
- marketplace;
- payments/subscriptions/premium;
- public ratings;
- gamification/achievements;
- complex notifications;
- alumni network;
- other universities;
- native iOS/Android apps.

These require a separate product decision.
