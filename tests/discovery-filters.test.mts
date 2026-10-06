import test from "node:test";
import assert from "node:assert/strict";

import type { DiscoveryCandidate } from "../src/lib/matching/data.ts";
import {
  buildDiscoveryFilterOptions,
  buildSupportedYearOptions,
  createDiscoveryFilters,
  filterDiscoveryCandidates,
  hasActiveDiscoveryFilters,
  searchDiscoveryFilterOptions,
} from "../src/lib/matching/discovery-filters.ts";

function candidate(
  overrides: Partial<DiscoveryCandidate>,
): DiscoveryCandidate {
  return {
    academicProgramName: "Computer Science",
    avatarMode: "program",
    availability: "Open to weekend projects",
    bio: "Building products for education.",
    collaborationGoals: [
      { id: 1, name: "Build an MVP", slug: "build-an-mvp" },
    ],
    compatibilityScore: 88,
    customAvatarKey: null,
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
    socialLinks: [],
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
      collaborationGoalSlugs: ["research-together"],
      interestSlugs: ["fintech"],
      programNames: ["Economics"],
      skillSlugs: ["financial-analysis"],
      yearsOfStudy: ["4"],
    }),
  );

  assert.deepEqual(
    results.map((result) => result.fullName),
    ["Oleh P."],
  );
});

test("discover multi-select filters use OR within categories and AND across categories", () => {
  const candidates = [
    candidate({
      fullName: "React Startup Student",
      interests: [{ id: 3, name: "Startups", slug: "startups" }],
      offeredSkills: [
        {
          category: "Software & Web",
          id: 8,
          name: "React",
          slug: "react",
        },
      ],
      yearOfStudy: 3,
    }),
    candidate({
      fullName: "Figma Research Student",
      interests: [{ id: 4, name: "Research", slug: "research" }],
      offeredSkills: [
        {
          category: "Design",
          id: 9,
          name: "Figma",
          slug: "figma",
        },
      ],
      userId: "00000000-0000-4000-8000-000000000009",
      yearOfStudy: 4,
    }),
  ];

  const results = filterDiscoveryCandidates(
    candidates,
    createDiscoveryFilters({
      interestSlugs: ["startups"],
      skillSlugs: ["react", "figma"],
      yearsOfStudy: ["3", "4"],
    }),
  );

  assert.deepEqual(
    results.map((result) => result.fullName),
    ["React Startup Student"],
  );
});

test("discover filters deduplicate repeated query values", () => {
  const filters = createDiscoveryFilters({
    collaborationGoalSlugs: ["build-an-mvp", "build-an-mvp", "  "],
    interestSlugs: ["startups", "startups"],
    programNames: ["Economics", "Economics"],
    skillSlugs: ["react", "react"],
    yearsOfStudy: ["3", "3"],
  });

  assert.deepEqual(filters.collaborationGoalSlugs, ["build-an-mvp"]);
  assert.deepEqual(filters.interestSlugs, ["startups"]);
  assert.deepEqual(filters.programNames, ["Economics"]);
  assert.deepEqual(filters.skillSlugs, ["react"]);
  assert.deepEqual(filters.yearsOfStudy, ["3"]);
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

test("supported year options include the full product year taxonomy", () => {
  assert.deepEqual(buildSupportedYearOptions(), [
    { label: "Year 1", value: "1" },
    { label: "Year 2", value: "2" },
    { label: "Year 3", value: "3" },
    { label: "Year 4", value: "4" },
    { label: "Year 5", value: "5" },
    { label: "Year 6", value: "6" },
  ]);
});

test("discover filter option search supports case-insensitive partial text", () => {
  const options = [
    { label: "Figma", value: "figma" },
    { label: "Behavioral Economics", value: "behavioral-economics" },
    { label: "Research", value: "research" },
  ];

  assert.deepEqual(searchDiscoveryFilterOptions(options, "fig"), [
    { label: "Figma", value: "figma" },
  ]);
  assert.deepEqual(searchDiscoveryFilterOptions(options, "ECO"), [
    { label: "Behavioral Economics", value: "behavioral-economics" },
  ]);
});

test("empty discover filters are treated as inactive", () => {
  const filters = createDiscoveryFilters({});

  assert.equal(hasActiveDiscoveryFilters(filters), false);
  assert.equal(
    filterDiscoveryCandidates([candidate({})], filters).length,
    1,
  );
});
