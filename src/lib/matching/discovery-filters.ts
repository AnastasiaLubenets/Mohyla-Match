import type { DiscoveryCandidate, MatchingItem, MatchingSkill } from "./data";

export type DiscoveryFilters = Readonly<{
  collaborationGoalSlug: string;
  interestSlug: string;
  programName: string;
  searchQuery: string;
  skillSlug: string;
  yearOfStudy: string;
}>;

export type DiscoveryFilterOptions = Readonly<{
  collaborationGoals: FilterOption[];
  interests: FilterOption[];
  programs: FilterOption[];
  skills: FilterOption[];
  years: FilterOption[];
}>;

type FilterOption = Readonly<{
  label: string;
  value: string;
}>;

const emptyFilters: DiscoveryFilters = {
  collaborationGoalSlug: "",
  interestSlug: "",
  programName: "",
  searchQuery: "",
  skillSlug: "",
  yearOfStudy: "",
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

function skillMatchesSlug(skills: readonly MatchingSkill[], slug: string) {
  return skills.some((skill) => skill.slug === slug);
}

function itemMatchesSlug(items: readonly MatchingItem[], slug: string) {
  return items.some((item) => item.slug === slug);
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
    collaborationGoalSlug:
      filters.collaborationGoalSlug?.trim() ?? emptyFilters.collaborationGoalSlug,
    interestSlug: filters.interestSlug?.trim() ?? emptyFilters.interestSlug,
    programName: filters.programName?.trim() ?? emptyFilters.programName,
    searchQuery: filters.searchQuery?.trim() ?? emptyFilters.searchQuery,
    skillSlug: filters.skillSlug?.trim() ?? emptyFilters.skillSlug,
    yearOfStudy: filters.yearOfStudy?.trim() ?? emptyFilters.yearOfStudy,
  };
}

export function hasActiveDiscoveryFilters(filters: DiscoveryFilters) {
  return Object.values(filters).some((value) => value.length > 0);
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
      filters.programName &&
      candidate.academicProgramName !== filters.programName
    ) {
      return false;
    }

    if (
      filters.yearOfStudy &&
      candidate.yearOfStudy.toString() !== filters.yearOfStudy
    ) {
      return false;
    }

    if (
      filters.skillSlug &&
      !skillMatchesSlug(candidate.offeredSkills, filters.skillSlug) &&
      !skillMatchesSlug(candidate.lookingForSkills, filters.skillSlug)
    ) {
      return false;
    }

    if (
      filters.interestSlug &&
      !itemMatchesSlug(candidate.interests, filters.interestSlug)
    ) {
      return false;
    }

    if (
      filters.collaborationGoalSlug &&
      !itemMatchesSlug(
        candidate.collaborationGoals,
        filters.collaborationGoalSlug,
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
