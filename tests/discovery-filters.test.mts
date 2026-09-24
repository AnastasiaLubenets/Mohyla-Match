import test from "node:test";
import assert from "node:assert/strict";

import type { DiscoveryCandidate } from "../src/lib/matching/data.ts";
import {
  buildDiscoveryFilterOptions,
  createDiscoveryFilters,
  filterDiscoveryCandidates,
  hasActiveDiscoveryFilters,
} from "../src/lib/matching/discovery-filters.ts";

function candidate(
  overrides: Partial<DiscoveryCandidate>,
): DiscoveryCandidate {
  return {
    academicProgramName: "Computer Science",
    availability: "Open to weekend projects",
    bio: "Building products for education.",
    collaborationGoals: [
      { id: 1, name: "Build an MVP", slug: "build-an-mvp" },
    ],
    compatibilityScore: 88,
    facultyName: "Faculty of Informatics",
    fullName: "Maria K.",
    interests: [{ id: 1, name: "Education", slug: "education" }],
    lookingForSkills: [
      {
        category: "Product & Project",
        id: 2,
        name: "Project Management",
        slug: "project-management",
      },
    ],
    matchedIOffer: [],
    matchedTheyOffer: [],
    offeredSkills: [
      {
        category: "Software & Web",
        id: 1,
        name: "React",
        slug: "react",
      },
    ],
    scoreBreakdown: {},
    sharedCollaborationGoals: [],
    sharedInterests: [],
    systemAvatarKey: "avatar-1",
    userId: "00000000-0000-4000-8000-000000000001",
    yearOfStudy: 2,
    ...overrides,
  };
}

test("discover search matches profile text and taxonomy case-insensitively", () => {
  const candidates = [
    candidate({ fullName: "Maria K." }),
    candidate({
      academicProgramName: "History",
      bio: "Interested in archive research.",
      fullName: "Danylo S.",
      offeredSkills: [
        {
          category: "Research & Academia",
          id: 3,
          name: "Academic Research",
          slug: "academic-research",
        },
      ],
      userId: "00000000-0000-4000-8000-000000000002",
    }),
  ];

  const results = filterDiscoveryCandidates(
    candidates,
    createDiscoveryFilters({ searchQuery: "RESEARCH academia" }),
  );

  assert.deepEqual(
    results.map((result) => result.fullName),
    ["Danylo S."],
  );
});

test("discover filters by program, year, skill, interest, and goal", () => {
  const candidates = [
    candidate({ fullName: "Maria K." }),
    candidate({
      academicProgramName: "Economics",
      collaborationGoals: [
        { id: 2, name: "Research together", slug: "research-together" },
      ],
      fullName: "Oleh P.",
      interests: [{ id: 2, name: "FinTech", slug: "fintech" }],
      offeredSkills: [
        {
          category: "Finance & Economics",
          id: 4,
          name: "Financial Analysis",
          slug: "financial-analysis",
        },
      ],
      userId: "00000000-0000-4000-8000-000000000003",
      yearOfStudy: 4,
    }),
  ];

  const results = filterDiscoveryCandidates(
    candidates,
    createDiscoveryFilters({
      collaborationGoalSlug: "research-together",
      interestSlug: "fintech",
      programName: "Economics",
      skillSlug: "financial-analysis",
      yearOfStudy: "4",
    }),
  );

  assert.deepEqual(
    results.map((result) => result.fullName),
    ["Oleh P."],
  );
});

test("discover filters work for recommended and all-students candidate sets", () => {
  const recommendedCandidates = [
    candidate({
      fullName: "Recommended Python Student",
      offeredSkills: [
        {
          category: "Software & Web",
          id: 5,
          name: "Python",
          slug: "python",
        },
      ],
    }),
  ];
  const allStudentsCandidates = [
    ...recommendedCandidates,
    candidate({
      fullName: "All Students Design Peer",
      interests: [{ id: 7, name: "Design", slug: "design" }],
      offeredSkills: [
        {
          category: "Design",
          id: 6,
          name: "Figma",
          slug: "figma",
        },
      ],
      userId: "00000000-0000-4000-8000-000000000006",
    }),
  ];
  const filters = createDiscoveryFilters({ searchQuery: "python" });

  assert.deepEqual(
    filterDiscoveryCandidates(recommendedCandidates, filters).map(
      (result) => result.fullName,
    ),
    ["Recommended Python Student"],
  );
  assert.deepEqual(
    filterDiscoveryCandidates(allStudentsCandidates, filters).map(
      (result) => result.fullName,
    ),
    ["Recommended Python Student"],
  );
});

test("discover filter options are deduplicated and sorted", () => {
  const options = buildDiscoveryFilterOptions([
    candidate({ fullName: "Maria K." }),
    candidate({
      fullName: "Another React Student",
      userId: "00000000-0000-4000-8000-000000000004",
    }),
  ]);

  assert.deepEqual(options.programs, [
    { label: "Computer Science", value: "Computer Science" },
  ]);
  assert.deepEqual(options.skills, [
    { label: "Project Management", value: "project-management" },
    { label: "React", value: "react" },
  ]);
  assert.deepEqual(options.years, [{ label: "Year 2", value: "2" }]);
});

test("empty discover filters are treated as inactive", () => {
  const filters = createDiscoveryFilters({});

  assert.equal(hasActiveDiscoveryFilters(filters), false);
  assert.equal(
    filterDiscoveryCandidates([candidate({})], filters).length,
    1,
  );
});
