import type { DiscoveryCandidate, MatchingItem, MatchingSkill } from "./data";

export type DiscoveryFilters = Readonly<{
  collaborationGoalSlugs: readonly string[];
  interestSlugs: readonly string[];
  programNames: readonly string[];
  searchQuery: string;
  skillSlugs: readonly string[];
  yearsOfStudy: readonly string[];
}>;

export type DiscoveryFilterOptions = Readonly<{
  collaborationGoals: FilterOption[];
  interests: FilterOption[];
  programs: FilterOption[];
  skills: FilterOption[];
  years: FilterOption[];
}>;

export type FilterOption = Readonly<{
  label: string;
  value: string;
}>;

const emptyFilters: DiscoveryFilters = {
  collaborationGoalSlugs: [],
  interestSlugs: [],
  programNames: [],
  searchQuery: "",
  skillSlugs: [],
  yearsOfStudy: [],
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

function uniqueByValue(options: FilterOption[]) {
  return [...new Map(options.map((option) => [option.value, option])).values()];
}

function sortByLabel(options: FilterOption[]) {
  return [...options].sort((first, second) =>
    first.label.localeCompare(second.label, "en", { sensitivity: "base" }),
  );
}

function uniqueValues(values: readonly string[] | string | undefined) {
  const rawValues = Array.isArray(values) ? values : values ? [values] : [];

  return [
    ...new Set(
      rawValues.map((value) => value.trim()).filter((value) => value.length > 0),
    ),
  ];
}

function anySkillMatchesSlug(
  skills: readonly MatchingSkill[],
  slugs: readonly string[],
) {
  return skills.some((skill) => slugs.includes(skill.slug));
}

function anyItemMatchesSlug(
  items: readonly MatchingItem[],
  slugs: readonly string[],
) {
  return items.some((item) => slugs.includes(item.slug));
}

function searchableText(candidate: DiscoveryCandidate) {
  return [
    candidate.academicProgramName,
    candidate.availability,
    candidate.bio,
    candidate.facultyName,
    candidate.fullName,
    candidate.yearOfStudy.toString(),
    ...candidate.offeredSkills.flatMap((skill) => [
      skill.category,
      skill.name,
      skill.slug,
    ]),
    ...candidate.lookingForSkills.flatMap((skill) => [
      skill.category,
      skill.name,
      skill.slug,
    ]),
    ...candidate.interests.flatMap((interest) => [interest.name, interest.slug]),
    ...candidate.collaborationGoals.flatMap((goal) => [goal.name, goal.slug]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}

export function createDiscoveryFilters(
  filters: Partial<DiscoveryFilters>,
): DiscoveryFilters {
  return {
    collaborationGoalSlugs: uniqueValues(filters.collaborationGoalSlugs),
    interestSlugs: uniqueValues(filters.interestSlugs),
    programNames: uniqueValues(filters.programNames),
    searchQuery: filters.searchQuery?.trim() ?? emptyFilters.searchQuery,
    skillSlugs: uniqueValues(filters.skillSlugs),
    yearsOfStudy: uniqueValues(filters.yearsOfStudy),
  };
}

export function hasActiveDiscoveryFilters(filters: DiscoveryFilters) {
  return (
    filters.searchQuery.length > 0 ||
    filters.collaborationGoalSlugs.length > 0 ||
    filters.interestSlugs.length > 0 ||
    filters.programNames.length > 0 ||
    filters.skillSlugs.length > 0 ||
    filters.yearsOfStudy.length > 0
  );
}

export function filterDiscoveryCandidates(
  candidates: readonly DiscoveryCandidate[],
  filters: DiscoveryFilters,
) {
  const normalizedQuery = normalize(filters.searchQuery);
  const queryParts = normalizedQuery
    .split(/\s+/)
    .filter((part) => part.length > 0);

  return candidates.filter((candidate) => {
    if (
      filters.programNames.length > 0 &&
      !filters.programNames.includes(candidate.academicProgramName)
    ) {
      return false;
    }

    if (
      filters.yearsOfStudy.length > 0 &&
      !filters.yearsOfStudy.includes(candidate.yearOfStudy.toString())
    ) {
      return false;
    }

    if (
      filters.skillSlugs.length > 0 &&
      !anySkillMatchesSlug(candidate.offeredSkills, filters.skillSlugs) &&
      !anySkillMatchesSlug(candidate.lookingForSkills, filters.skillSlugs)
    ) {
      return false;
    }

    if (
      filters.interestSlugs.length > 0 &&
      !anyItemMatchesSlug(candidate.interests, filters.interestSlugs)
    ) {
      return false;
    }

    if (
      filters.collaborationGoalSlugs.length > 0 &&
      !anyItemMatchesSlug(
        candidate.collaborationGoals,
        filters.collaborationGoalSlugs,
      )
    ) {
      return false;
    }

    if (queryParts.length === 0) {
      return true;
    }

    const text = searchableText(candidate);
    return queryParts.every((part) => text.includes(part));
  });
}

export function buildDiscoveryFilterOptions(
  candidates: readonly DiscoveryCandidate[],
): DiscoveryFilterOptions {
  const programs = uniqueByValue(
    candidates.map((candidate) => ({
      label: candidate.academicProgramName,
      value: candidate.academicProgramName,
    })),
  );
  const years = uniqueByValue(
    candidates.map((candidate) => ({
      label: `Year ${candidate.yearOfStudy}`,
      value: candidate.yearOfStudy.toString(),
    })),
  ).sort((first, second) => Number(first.value) - Number(second.value));
  const skills = sortByLabel(
    uniqueByValue(
      candidates.flatMap((candidate) =>
        [...candidate.offeredSkills, ...candidate.lookingForSkills].map(
          (skill) => ({
            label: skill.name,
            value: skill.slug,
          }),
        ),
      ),
    ),
  );
  const interests = sortByLabel(
    uniqueByValue(
      candidates.flatMap((candidate) =>
        candidate.interests.map((interest) => ({
          label: interest.name,
          value: interest.slug,
        })),
      ),
    ),
  );
  const collaborationGoals = sortByLabel(
    uniqueByValue(
      candidates.flatMap((candidate) =>
        candidate.collaborationGoals.map((goal) => ({
          label: goal.name,
          value: goal.slug,
        })),
      ),
    ),
  );

  return {
    collaborationGoals,
    interests,
    programs: sortByLabel(programs),
    skills,
    years,
  };
}

export function buildSupportedYearOptions(): FilterOption[] {
  return [1, 2, 3, 4, 5, 6].map((year) => ({
    label: `Year ${year}`,
    value: year.toString(),
  }));
}

export function searchDiscoveryFilterOptions(
  options: readonly FilterOption[],
  query: string,
) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return [...options];
  }

  return options.filter((option) =>
    `${option.label} ${option.value}`.toLocaleLowerCase().includes(
      normalizedQuery,
    ),
  );
}
