import Link from "next/link";

import { AppSidebar } from "@/components/matching/app-chrome";
import { DiscoveryTopBar } from "@/components/matching/discovery-top-bar";
import { FacultyDirectoryList } from "@/components/matching/faculty-directory-list";
import { FacultyFilterForm } from "@/components/matching/faculty-filter-form";
import { requireAccountState } from "@/lib/auth/guards";
import { loadFacultyDiscoveryProfiles } from "@/lib/matching/data";
import {
  buildFacultyDiscoveryFilterOptions,
  createFacultyDiscoveryFilters,
  filterFacultyDiscoveryProfiles,
  hasActiveFacultyDiscoveryFilters,
  type FacultyDiscoveryFilterOptions,
  type FacultyDiscoveryFilters,
} from "@/lib/matching/faculty-discovery-filters";
import { loadSafeProfile } from "@/lib/profile/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Faculty",
};

type PageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function paramValues(value: string | string[] | undefined): string[] {
  const rawValues = Array.isArray(value) ? value : value ? [value] : [];

  return [
    ...new Set(
      rawValues.map((item) => item.trim()).filter((item) => item.length > 0),
    ),
  ];
}

function FacultyHiddenFilterInputs({
  filters,
  omit,
}: Readonly<{
  filters: FacultyDiscoveryFilters;
  omit: keyof FacultyDiscoveryFilters;
}>) {
  return (
    <>
      {omit !== "facultyNames"
        ? filters.facultyNames.map((value) => (
            <input
              key={`faculty-${value}`}
              name="faculty"
              type="hidden"
              value={value}
            />
          ))
        : null}
      {omit !== "programNames"
        ? filters.programNames.map((value) => (
            <input
              key={`program-${value}`}
              name="program"
              type="hidden"
              value={value}
            />
          ))
        : null}
      {omit !== "expertiseSlugs"
        ? filters.expertiseSlugs.map((value) => (
            <input
              key={`expertise-${value}`}
              name="expertise"
              type="hidden"
              value={value}
            />
          ))
        : null}
      {omit !== "interestSlugs"
        ? filters.interestSlugs.map((value) => (
            <input
              key={`interest-${value}`}
              name="interest"
              type="hidden"
              value={value}
            />
          ))
        : null}
    </>
  );
}

function FacultyHero() {
  return (
    <header className="mb-6 text-center">
      <h1 className="font-serif text-[clamp(2.5rem,5vw,3.5rem)] font-bold leading-[0.98] text-blue-950">
        Find the right faculty member.
      </h1>
      <p className="mx-auto mt-5 max-w-3xl text-lg leading-7 text-blue-900/75">
        Discover Mohyla faculty by expertise, academic field, and research
        interests.
      </p>
    </header>
  );
}

function FacultyDiscoveryFilterRail({
  filters,
  hasActiveFilters,
  options,
  resultCount,
  totalCount,
}: Readonly<{
  filters: FacultyDiscoveryFilters;
  hasActiveFilters: boolean;
  options: FacultyDiscoveryFilterOptions;
  resultCount: number;
  totalCount: number;
}>) {
  return (
    <aside className="scrollbar-hidden space-y-4 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:pb-6">
      <section className="rounded-lg border border-blue-100 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-3xl font-bold leading-none text-blue-950">
            Faculty filters
          </h2>
          <Link
            className={
              hasActiveFilters
                ? "text-sm font-bold text-blue-700 transition hover:text-blue-950"
                : "text-sm font-bold text-blue-300"
            }
            href="/app/faculty"
          >
            Reset
          </Link>
        </div>

        <p className="sr-only">
          Showing {resultCount} of {totalCount} available faculty profiles.
        </p>

        <FacultyFilterForm filters={filters} options={options} />
      </section>
    </aside>
  );
}

export default async function FacultyDiscoveryPage({ searchParams }: PageProps) {
  const accountState = await requireAccountState("/app/faculty", ["active"]);
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const currentProfileResult = await (accountState.userId
    ? loadSafeProfile(supabase, accountState.userId)
    : Promise.resolve({ data: null, error: false }));
  const currentProfile = currentProfileResult.error
    ? null
    : currentProfileResult.data;

  const filters = createFacultyDiscoveryFilters({
    expertiseSlugs: paramValues(params.expertise),
    facultyNames: paramValues(params.faculty),
    interestSlugs: paramValues(params.interest),
    programNames: paramValues(params.program),
    searchQuery: firstParam(params.q),
  });
  const facultyProfilesResult = await loadFacultyDiscoveryProfiles(supabase);
  const allFacultyProfiles = facultyProfilesResult.error
    ? []
    : (facultyProfilesResult.data ?? []);
  const filteredFacultyProfiles = filterFacultyDiscoveryProfiles(
    allFacultyProfiles,
    filters,
  );
  const activeFilters = hasActiveFacultyDiscoveryFilters(filters);
  const options = buildFacultyDiscoveryFilterOptions(allFacultyProfiles);

  return (
    <main className="min-h-screen bg-[#eef6fb] text-blue-950 xl:h-screen xl:overflow-hidden">
      <div className="grid min-h-screen xl:h-screen xl:min-h-0 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <AppSidebar active="faculty" />
        <div className="flex min-w-0 flex-col xl:h-screen xl:min-h-0 xl:overflow-hidden">
          <DiscoveryTopBar
            action="/app/faculty"
            currentProfile={currentProfile}
            hiddenInputs={
              <FacultyHiddenFilterInputs filters={filters} omit="searchQuery" />
            }
            searchLabel="Search faculty, expertise or research interests"
            searchPlaceholder="Search faculty, expertise or research..."
            searchQuery={filters.searchQuery}
          />
          <div className="grid gap-6 px-4 py-6 sm:px-6 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_22rem] xl:overflow-hidden xl:px-8 2xl:gap-8">
            <section className="scrollbar-hidden min-w-0 xl:min-h-0 xl:overflow-y-auto">
              <FacultyHero />
              <FacultyDirectoryList
                hasActiveFilters={activeFilters}
                loadError={facultyProfilesResult.error}
                profiles={filteredFacultyProfiles}
                totalCount={allFacultyProfiles.length}
              />
            </section>

            <FacultyDiscoveryFilterRail
              filters={filters}
              hasActiveFilters={activeFilters}
              options={options}
              resultCount={filteredFacultyProfiles.length}
              totalCount={allFacultyProfiles.length}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
