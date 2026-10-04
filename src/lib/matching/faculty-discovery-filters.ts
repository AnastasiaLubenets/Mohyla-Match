import type {
  FacultyDiscoveryProfile,
  FacultyExpertiseItem,
  FacultyProgramItem,
  MatchingItem,
} from "@/lib/matching/data";
import type { FilterOption } from "@/lib/matching/discovery-filters";

export type FacultyDiscoveryFilters = Readonly<{
  expertiseSlugs: readonly string[];
  facultyNames: readonly string[];
  interestSlugs: readonly string[];
  programNames: readonly string[];
  searchQuery: string;
}>;

export type FacultyDiscoveryFilterOptions = Readonly<{
  expertise: FilterOption[];
  faculties: FilterOption[];
  interests: FilterOption[];
  programs: FilterOption[];
}>;

const emptyFilters: FacultyDiscoveryFilters = {
  expertiseSlugs: [],
  facultyNames: [],
  interestSlugs: [],
  programNames: [],
  searchQuery: "",
};

function uniqueValues(values: readonly string[] | string | undefined) {
  const rawValues = Array.isArray(values) ? values : values ? [values] : [];

  return [
    ...new Set(
      rawValues.map((value) => value.trim()).filter((value) => value.length > 0),
    ),
  ];
}

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

function anyProgramMatches(
  programs: readonly FacultyProgramItem[],
  values: readonly string[],
) {
  return programs.some((program) => values.includes(program.name));
}

function anyExpertiseMatches(
  expertise: readonly FacultyExpertiseItem[],
  values: readonly string[],
) {
  return expertise.some((item) => values.includes(item.slug));
}

function anyInterestMatches(
  interests: readonly MatchingItem[],
  values: readonly string[],
) {
  return interests.some((item) => values.includes(item.slug));
}

function searchableText(profile: FacultyDiscoveryProfile) {
  return [
    profile.availability,
    profile.bio,
    profile.facultyName,
    profile.fullName,
    profile.primaryAcademicProgramName,
    profile.verificationStatus,
    ...profile.academicPrograms.flatMap((program) => [
      program.facultyName,
      program.name,
      program.slug,
    ]),
    ...profile.expertise.flatMap((expertise) => [
      expertise.category,
      expertise.name,
      expertise.slug,
    ]),
    ...profile.researchInterests.flatMap((interest) => [
      interest.name,
      interest.slug,
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}

export function createFacultyDiscoveryFilters(
  filters: Partial<FacultyDiscoveryFilters>,
): FacultyDiscoveryFilters {
  return {
    expertiseSlugs: uniqueValues(filters.expertiseSlugs),
    facultyNames: uniqueValues(filters.facultyNames),
    interestSlugs: uniqueValues(filters.interestSlugs),
    programNames: uniqueValues(filters.programNames),
    searchQuery: filters.searchQuery?.trim() ?? emptyFilters.searchQuery,
  };
}

export function hasActiveFacultyDiscoveryFilters(
  filters: FacultyDiscoveryFilters,
) {
  return (
    filters.searchQuery.length > 0 ||
    filters.expertiseSlugs.length > 0 ||
    filters.facultyNames.length > 0 ||
    filters.interestSlugs.length > 0 ||
    filters.programNames.length > 0
  );
}

export function filterFacultyDiscoveryProfiles(
  profiles: readonly FacultyDiscoveryProfile[],
  filters: FacultyDiscoveryFilters,
) {
  const queryParts = normalize(filters.searchQuery)
    .split(/\s+/)
    .filter((part) => part.length > 0);

  return profiles.filter((profile) => {
    if (
      filters.facultyNames.length > 0 &&
      !filters.facultyNames.includes(profile.facultyName)
    ) {
      return false;
    }

    if (
      filters.programNames.length > 0 &&
      !anyProgramMatches(profile.academicPrograms, filters.programNames)
    ) {
      return false;
    }

    if (
      filters.expertiseSlugs.length > 0 &&
      !anyExpertiseMatches(profile.expertise, filters.expertiseSlugs)
    ) {
      return false;
    }

    if (
      filters.interestSlugs.length > 0 &&
      !anyInterestMatches(profile.researchInterests, filters.interestSlugs)
    ) {
      return false;
    }

    if (queryParts.length === 0) {
      return true;
    }

    const text = searchableText(profile);
    return queryParts.every((part) => text.includes(part));
  });
}

export function buildFacultyDiscoveryFilterOptions(
  profiles: readonly FacultyDiscoveryProfile[],
): FacultyDiscoveryFilterOptions {
  return {
    expertise: sortByLabel(
      uniqueByValue(
        profiles.flatMap((profile) =>
          profile.expertise.map((expertise) => ({
            label: expertise.name,
            value: expertise.slug,
          })),
        ),
      ),
    ),
    faculties: sortByLabel(
      uniqueByValue(
        profiles.map((profile) => ({
          label: profile.facultyName,
          value: profile.facultyName,
        })),
      ),
    ),
    interests: sortByLabel(
      uniqueByValue(
        profiles.flatMap((profile) =>
          profile.researchInterests.map((interest) => ({
            label: interest.name,
            value: interest.slug,
          })),
        ),
      ),
    ),
    programs: sortByLabel(
      uniqueByValue(
        profiles.flatMap((profile) =>
          profile.academicPrograms.map((program) => ({
            label: program.name,
            value: program.name,
          })),
        ),
      ),
    ),
  };
}
