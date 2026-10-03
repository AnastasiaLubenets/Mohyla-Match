import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import type { FacultyDiscoveryProfile } from "../src/lib/matching/data.ts";
import {
  buildFacultyDiscoveryFilterOptions,
  createFacultyDiscoveryFilters,
  filterFacultyDiscoveryProfiles,
  hasActiveFacultyDiscoveryFilters,
} from "../src/lib/matching/faculty-discovery-filters.ts";
import {
  createDiscoveryAudience,
  discoveryAudienceHref,
} from "../src/lib/matching/discovery-view.ts";

const root = process.cwd();
const migration = readFileSync(
  join(
    root,
    "supabase/migrations/20260929225408_faculty_discovery_roles_taxonomy.sql",
  ),
  "utf8",
);

function facultyProfile(
  overrides: Partial<FacultyDiscoveryProfile>,
): FacultyDiscoveryProfile {
  return {
    academicPrograms: [
      {
        facultyName: "Faculty of Informatics",
        id: 1,
        isPrimary: true,
        name: "Computer Science",
        slug: "computer-science",
        specialtyCode: "F3",
        studyLevel: "bachelor",
      },
    ],
    availability: "By appointment",
    bio: "Researches reliable student software systems.",
    expertise: [
      {
        category: "Computer Science",
        id: 10,
        name: "Software Engineering",
        slug: "software-engineering",
      },
    ],
    facultyName: "Faculty of Informatics",
    fullName: "Dr. Olena K.",
    primaryAcademicProgramName: "Computer Science",
    researchInterests: [{ id: 20, name: "Education", slug: "education" }],
    systemAvatarKey: "faculty-avatar",
    userId: "00000000-0000-4000-8000-000000000101",
    verificationStatus: "unverified",
    ...overrides,
  };
}

test("faculty discovery filters by faculty, program, expertise, interest, and search", () => {
  const profiles = [
    facultyProfile({ fullName: "Dr. Olena K." }),
    facultyProfile({
      academicPrograms: [
        {
          facultyName: "Faculty of Economics",
          id: 2,
          isPrimary: true,
          name: "Economics",
          slug: "economics",
          specialtyCode: "C1.01",
          studyLevel: "master",
        },
      ],
      expertise: [
        {
          category: "Economics",
          id: 11,
          name: "Behavioral Economics",
          slug: "behavioral-economics",
        },
      ],
      facultyName: "Faculty of Economics",
      fullName: "Dr. Pavlo M.",
      primaryAcademicProgramName: "Economics",
      researchInterests: [{ id: 21, name: "Markets", slug: "markets" }],
      userId: "00000000-0000-4000-8000-000000000102",
    }),
  ];

  const results = filterFacultyDiscoveryProfiles(
    profiles,
    createFacultyDiscoveryFilters({
      expertiseSlugs: ["behavioral-economics"],
      facultyNames: ["Faculty of Economics"],
      interestSlugs: ["markets"],
      programNames: ["Economics"],
      searchQuery: "behavioral markets",
    }),
  );

  assert.deepEqual(
    results.map((profile) => profile.fullName),
    ["Dr. Pavlo M."],
  );
});

test("faculty filter options are deduplicated and empty filters are inactive", () => {
  const profiles = [
    facultyProfile({ fullName: "Dr. Olena K." }),
    facultyProfile({
      fullName: "Dr. Other Informatics",
      userId: "00000000-0000-4000-8000-000000000103",
    }),
  ];
  const options = buildFacultyDiscoveryFilterOptions(profiles);
  const emptyFilters = createFacultyDiscoveryFilters({});

  assert.equal(hasActiveFacultyDiscoveryFilters(emptyFilters), false);
  assert.deepEqual(options.faculties, [
    { label: "Faculty of Informatics", value: "Faculty of Informatics" },
  ]);
  assert.deepEqual(options.programs, [
    { label: "Computer Science", value: "Computer Science" },
  ]);
  assert.deepEqual(options.expertise, [
    { label: "Software Engineering", value: "software-engineering" },
  ]);
});

test("discovery audience links preserve filters without mixing student view state into faculty", () => {
  const query = {
    goal: "build-an-mvp",
    program: ["Computer Science", "Economics"],
    q: "research",
    view: "all",
  };

  assert.equal(createDiscoveryAudience("faculty"), "faculty");
  assert.equal(createDiscoveryAudience(undefined), "students");
  assert.equal(
    discoveryAudienceHref(query, "faculty"),
    "/app?audience=faculty&goal=build-an-mvp&program=Computer+Science&program=Economics&q=research",
  );
  assert.equal(
    discoveryAudienceHref(query, "students"),
    "/app?audience=students&goal=build-an-mvp&program=Computer+Science&program=Economics&q=research&view=all",
  );
});

test("database migration keeps student and faculty discovery paths role-separated", () => {
  assert.match(migration, /create type public\.account_role as enum \('student', 'faculty'\)/);
  assert.match(migration, /account_role public\.account_role not null default 'student'/);
  assert.match(migration, /p\.account_role = 'student'::public\.account_role/);
  assert.match(migration, /p\.account_role = 'faculty'::public\.account_role/);
  assert.match(migration, /private\.is_active_onboarded_student\(p\.user_id\)/);
  assert.match(migration, /public\.get_faculty_discovery_profiles/);
  assert.match(migration, /faculty_verification_status/);
  assert.match(migration, /profiles_prevent_profile_self_verification/);
  assert.doesNotMatch(migration, /get_faculty_discovery_profiles[\s\S]*email/);
});

test("onboarding source contains role split and faculty-specific steps", () => {
  const page = readFileSync(join(root, "src/app/account/setup/page.tsx"), "utf8");
  const server = readFileSync(join(root, "src/lib/onboarding/server.ts"), "utf8");
  const directProfilePayloads = [
    ...server.matchAll(/const profilePayload = \{([\s\S]*?)\n  \};/g),
  ];

  assert.match(page, /RoleSelection/);
  assert.match(page, /FacultyProgramsForm/);
  assert.match(page, /FacultyResearchStep/);
  assert.match(server, /saveAccountRole/);
  assert.match(server, /saveFacultyProgramsStep/);
  assert.match(server, /saveFacultyExpertiseStep/);
  assert.match(server, /completeFacultyOnboarding/);
  assert.doesNotMatch(server, /faculty_verification_status:\s*"verified"/);
  assert.equal(directProfilePayloads.length, 2);
  directProfilePayloads.forEach(([, payload]) => {
    assert.doesNotMatch(payload, /account_role:/);
  });
});
